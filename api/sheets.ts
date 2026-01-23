import type { VercelRequest, VercelResponse } from '@vercel/node';
import partition from 'lodash/partition';
import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

export default async function handler(request: VercelRequest, response: VercelResponse) {
    try {
        const { email, privateKey, sheetId } = {
            email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            privateKey: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            sheetId: process.env.GOOGLE_SHEET_ID,
        };

        if (!email || !privateKey || !sheetId) {
            return response.status(500).json({ error: 'Missing configuration' });
        }

        const auth = new google.auth.JWT({
            email,
            key: privateKey,
            scopes: SCOPES,
        });

        const sheets = google.sheets({ version: 'v4', auth });

        // 1. Fetch Fines
        // Assumes columns: A=FIO, B=Reason, C=Month, D=Date, E=Amount
        const finesResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            range: "'Fines'!A2:E", // Skip header
        });

        const fines = (finesResponse.data.values || []).map(row => ({
            teacherName: row[0] || '',
            reason: row[1] || '',
            month: row[2] || '',
            date: row[3] || '',
            amount: row[4] || '0',
        }));

        // 2. Fetch Salaries (from Salary_2 tab as seen in screenshot, roughly)
        // Note: Implicitly assuming a Name column exists or we fetch all.
        // Given the ambiguity, we'll fetch the raw data and let the frontend filter if possible,
        // OR we will update this once we know more. For now, fetching same range structure.
        // If Salary_2 has no names, this might return untethered data.
        let salaries = [];
        try {
            const salaryResponse = await sheets.spreadsheets.values.get({
                spreadsheetId: sheetId,
                range: "'Salary_2'!A2:F", // Month, Income, Bonus, Fine, Recount, Total
            });
            // WE DON'T HAVE A CONFIRMED NAME COLUMN IN SALARY CUSOTMER SCREENSHOT.
            // Returning it raw for now.
            salaries = (salaryResponse.data.values || []).map(row => ({
                month: row[0],
                income: row[1],
                bonus: row[2],
                fine: row[3],
                recount: row[4],
                total: row[5]
            }));
        } catch (e) {
            console.warn("Could not fetch salaries", e);
        }

        return response.status(200).json({ fines, salaries });
    } catch (error: any) {
        console.error('Sheet Error:', error);
        return response.status(500).json({ error: error.message });
    }
}
