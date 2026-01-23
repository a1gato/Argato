const { google } = require('googleapis');

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
            .filter(title => title !== 'Fines'); // Exclude the Fines tab

        // 2. Fetch Fines (Static Tab)
        let fines = [];
        try {
            const finesResponse = await sheets.spreadsheets.values.get({
                spreadsheetId: sheetId,
                range: "'Fines'!A2:E",
            });
            fines = (finesResponse.data.values || []).map(row => ({
                teacherName: row[0] || '',
                reason: row[1] || '',
                month: row[2] || '',
                date: row[3] || '',
                amount: row[4] || '0',
            }));
        } catch (error) {
            console.warn("Error fetching fines:", error);
        }

        // 3. Fetch Salaries from ALL other tabs (Months)
        // We run these in parallel for performance
        let salaries = [];
        const salaryPromises = sheetTitles.map(async (title) => {
            try {
                // Assuming standard columns: Month, Income, Bonus, Fine, Recount, Total
                // If the sheet name itself IS the month, we might want to inject it, 
                // but the previous code expected column A to be "Month".
                // We'll read A2:F.
                const res = await sheets.spreadsheets.values.get({
                    spreadsheetId: sheetId,
                    range: `'${title}'!A2:F`,
                });

                const validRows = (res.data.values || []).filter(row => row.length > 0);

                return validRows.map(row => ({
                    // If column A is missing, use the Sheet Title as the month
                    month: row[0] || title,
                    income: row[1] || '0',
                    bonus: row[2] || '0',
                    fine: row[3] || '0',
                    recount: row[4] || '0',
                    total: row[5] || '0'
                }));
            } catch (err) {
                console.warn(`Error fetching tab ${title}:`, err);
                return [];
            }
        });

        const results = await Promise.all(salaryPromises);
        salaries = results.flat();

        return response.status(200).json({ fines, salaries });
    } catch (error) {
        console.error('Sheet Error:', error);
        return response.status(500).json({ error: error.message });
    }
}
