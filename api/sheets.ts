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
            .map(s => s.properties?.title)
            .filter(title => title !== 'Fines' && !title.startsWith('Pivot Table')); // Exclude Fines and Pivot Tables

        // 2. Efficiently Batch Fetch All Ranges
        // Range 0 is Fines, Ranges 1..N are Salary Months
        const ranges = [
            "'Fines'!A2:E",
            ...sheetTitles.map(title => `'${title.replace(/'/g, "''")}'!A2:F`)
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
            const monthName = sheetTitles[i - 1]; // Corresponding month name

            if (rows && rows.length > 0) {
                const monthSalaries = rows.map(row => {
                    const income = row[1] || '0';

                    // Improved Validation:
                    // Relaxed validation to debug missing data
                    // const letterCount = (income.match(/[a-zA-Z]/g) || []).length;
                    // if (letterCount > 4) return null;

                    // 2. Must contain at least one digit or be a valid entry
                    // const hasDigit = /\d/.test(income);
                    // if (!hasDigit && income !== '0' && income !== '') return null;

                    return {
                        teacherName: (row[0] || '').trim(),
                        month: monthName,
                        income: income,
                        bonus: row[2] || '0',
                        fine: row[3] || '0',
                        recount: row[4] || '0',
                        total: row[5] || '0'
                    };
                }).filter(Boolean); // Remove nulls (invalid rows)

                salaries = salaries.concat(monthSalaries);
            }
        }

        // Add Cache Header (Vercel Serverless Cache)
        response.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
        return response.status(200).json({ fines, salaries, debug: { sheets: sheetTitles } });
    } catch (error) {
        console.error('Sheet Error:', error);
        return response.status(500).json({ error: error.message });
    }
}
