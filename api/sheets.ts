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
            .map(s => s.properties.title)
            .filter(title => title !== 'Fines'); // All salary months

        // 2. Efficiently Batch Fetch All Ranges
        // Range 0 is Fines, Ranges 1..N are Salary Months
        const ranges = [
            "'Fines'!A2:E",
            ...sheetTitles.map(title => `'${title}'!A2:F`)
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
                teacherName: row[0] || '',
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
            const monthName = sheetTitles[i - 1]; // Corresponding month name

            if (rows && rows.length > 0) {
                const monthSalaries = rows.map(row => ({
                    teacherName: row[0] || '',
                    month: monthName,
                    income: row[1] || '0',
                    bonus: row[2] || '0',
                    fine: row[3] || '0',
                    recount: row[4] || '0',
                    total: row[5] || '0'
                }));
                salaries = salaries.concat(monthSalaries);
            }
        }

        // Add Cache Header (Vercel Serverless Cache)
        response.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
        return response.status(200).json({ fines, salaries });
    } catch (error) {
        console.error('Sheet Error:', error);
        return response.status(500).json({ error: error.message });
    }
}
