import { google } from 'googleapis';

// Scopes required for reading Google Sheets
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

export default async function handler(request, response) {
    try {
        // Load credentials from environment variables
        const { email, privateKey, sheetId } = {
            email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            privateKey: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            sheetId: process.env.GOOGLE_SHEET_ID,
        };

        if (!email || !privateKey || !sheetId) {
            return response.status(500).json({ error: 'Missing configuration' });
        }

        // Initialize Google Auth
        const auth = new google.auth.JWT({
            email,
            key: privateKey,
            scopes: SCOPES,
        });

        const sheets = google.sheets({ version: 'v4', auth });

        // 1. Fetch Spreadsheet Metadata to get all Tab Names
        const metadataResponse = await sheets.spreadsheets.get({
            spreadsheetId: sheetId,
        });

        const sheetTitles = (metadataResponse.data.sheets || [])
            .map(s => s.properties?.title || '') // Handle undefined titles
            .filter(title => title && title !== 'Fines' && !title.startsWith('Pivot Table')); // Exclude Fines, Pivot Tables, and empty titles

        // 2. Efficiently Batch Fetch All Ranges
        // Range 0 is Fines, Ranges 1..N are Salary Months
        const ranges = [
            "'Fines'!A2:E",
            ...sheetTitles.map(title => `'${(title || '').replace(/'/g, "''")}'!A2:F`)
        ];

        const batchResponse = await sheets.spreadsheets.values.batchGet({
            spreadsheetId: sheetId,
            ranges: ranges,
        });

        const valueRanges = batchResponse.data.valueRanges || [];

        // 3. Process Fines (First Range)
        let fines = [];
        const finesData = valueRanges[0]?.values;
        if (finesData) {
            fines = finesData.map(row => ({
                teacherName: (row[0] || '').trim(),
                reason: row[1] || '',
                month: row[2] || '',
                date: row[3] || '',
                amount: row[4] || '0',
            }));
        }

        // 4. Process Salaries (Remaining Ranges)
        let salaries = [];
        // valueRanges indices 1 to length-1 correspond to sheetTitles indices 0 to length-1
        for (let i = 1; i < valueRanges.length; i++) {
            const rangeData = valueRanges[i];
            const rows = rangeData.values;
            const sheetTitle = sheetTitles[i - 1]; // Corresponding tab name

            if (rows && rows.length > 0) {
                // Determine if this is a Month sheet or a Teacher sheet
                const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
                const isMonthSheet = monthNames.includes(sheetTitle.toLowerCase());

                const monthSalaries = rows.map(row => {
                    if (!row || row.length === 0) return null;

                    const colA = (row[0] || '').trim();
                    const income = row[1] || '0';

                    // Heuristic: If colA matches standard non-teacher labels
                    const invalidLabels = [...monthNames, 'month', 'total', 'fio', 'answer'];
                    const isNotTeacherInColA = !colA || invalidLabels.includes(colA.toLowerCase());

                    let teacherName = '';
                    let month = '';

                    if (isMonthSheet) {
                        // In Month sheets: Tab = Month, Col A = Teacher
                        teacherName = isNotTeacherInColA ? `Unassigned (${sheetTitle})` : colA;
                        month = sheetTitle;
                    } else {
                        // In Teacher sheets: Tab = Teacher Name, Col A = Month
                        teacherName = sheetTitle;
                        month = colA || 'Unknown';

                        // If Col A is "Month" or "Total", it's a header/footer row
                        if (invalidLabels.includes(colA.toLowerCase()) && colA.toLowerCase() !== 'january' && colA.toLowerCase() !== 'february' && colA.toLowerCase() !== 'march' && colA.toLowerCase() !== 'april' && colA.toLowerCase() !== 'may' && colA.toLowerCase() !== 'june' && colA.toLowerCase() !== 'july' && colA.toLowerCase() !== 'august' && colA.toLowerCase() !== 'september' && colA.toLowerCase() !== 'october' && colA.toLowerCase() !== 'november' && colA.toLowerCase() !== 'december') {
                            return null;
                        }
                    }

                    return {
                        teacherName: teacherName,
                        month: month,
                        income: income,
                        bonus: row[2] || '0',
                        fine: row[3] || '0',
                        recount: row[4] || '0',
                        total: row[5] || '0'
                    };
                }).filter(Boolean);

                salaries = salaries.concat(monthSalaries);
            }
        }

        // Debug: Capture first 5 raw rows from the first salary sheet (index 1)
        const firstSalarySheetRows = valueRanges[1]?.values?.slice(0, 5) || [];

        // Add Cache Header (Vercel Serverless Cache)
        response.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
        return response.status(200).json({ fines, salaries, debug: { sheets: sheetTitles, rawRows: firstSalarySheetRows } });
    } catch (error) {
        console.error('Sheet Error:', error);
        return response.status(500).json({ error: error.message });
    }
}
