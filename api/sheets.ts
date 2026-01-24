import { google } from 'googleapis';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Scopes required for reading Google Sheets
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

export default async function handler(request: VercelRequest, response: VercelResponse) {
    try {
        // Load credentials from environment variables
        const { email, privateKey } = {
            email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            privateKey: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        };

        if (!email || !privateKey) {
            return response.status(500).json({ error: 'Missing configuration' });
        }

        // Initialize Google Auth
        const auth = new google.auth.JWT({
            email,
            key: privateKey,
            scopes: SCOPES,
        });

        const sheets = google.sheets({ version: 'v4', auth });

        // 1. Get all Spreadsheet IDs
        const sheetIds = (process.env.GOOGLE_SHEET_ID || '').split(',').map(id => id.trim()).filter(Boolean);

        if (sheetIds.length === 0) {
            return response.status(500).json({ error: 'No Google Sheet IDs configured' });
        }

        let allFines: any[] = [];
        let allSalaries: any[] = [];
        let allDebugSheets: any[] = [];
        let rawSnippet: any[][] = [];

        // 2. Loop through each Spreadsheet
        for (const currentSheetId of sheetIds) {
            try {
                // Fetch Spreadsheet Metadata
                const metadataResponse = await sheets.spreadsheets.get({
                    spreadsheetId: currentSheetId,
                });

                const spreadsheetTitle = (metadataResponse.data.properties?.title || 'Unknown').trim();

                // Determine if this is a Master/Global sheet
                const masterSheetWords = ['os it', 'track', 'finance', 'salary', 'master', 'fines', 'fio', 'management', 'payment', 'copy of'];
                const isMasterSpreadsheet = masterSheetWords.some(w => spreadsheetTitle.toLowerCase().includes(w));
                const spreadsheetTeacherNameFallback = isMasterSpreadsheet ? null : spreadsheetTitle;

                const sheetTitles = (metadataResponse.data.sheets || [])
                    .map(s => s.properties?.title || '')
                    .filter(title => title && !title.startsWith('Pivot Table'));

                // Efficiently Batch Fetch All Ranges
                const hasFinesSheet = sheetTitles.includes('Fines');
                const monthsToProcess = sheetTitles.filter(t => t !== 'Fines');

                const ranges = [
                    ...(hasFinesSheet ? [`'Fines'!A2:E`] : []),
                    ...monthsToProcess.map(title => `'${(title || '').replace(/'/g, "''")}'!A2:F`)
                ];

                const batchResponse = await sheets.spreadsheets.values.batchGet({
                    spreadsheetId: currentSheetId,
                    ranges: ranges,
                });

                const valueRanges = batchResponse.data.valueRanges || [];
                let rangeOffset = 0;

                const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
                const universalInvalidLabels = [...monthNames, 'month', 'total', 'fio', 'grand total', 'subtotal', 'income', 'salary', 'fines', 'answer', 'score', 'empty', 'unknown', 'name', 'teacher', 'instructor'];

                // Process Fines
                if (hasFinesSheet) {
                    const finesData = valueRanges[0]?.values;
                    if (finesData) {
                        const spreadsheetFines = finesData.map(row => {
                            if (!row || row.length === 0) return null;
                            const colA = (row[0] || '').trim();

                            const isInvalidColA = !colA || colA.length < 2 || universalInvalidLabels.includes(colA.toLowerCase());

                            // Determine the real Teacher Name for this row
                            let teacherName = '';
                            if (!isInvalidColA) {
                                teacherName = colA; // Priority 1: Name in the row
                            } else if (spreadsheetTeacherNameFallback) {
                                teacherName = spreadsheetTeacherNameFallback; // Priority 2: Fallback from Spreadsheet Title
                            } else {
                                return null; // Trash: Skip rows with no identifiable teacher
                            }

                            if (teacherName.toLowerCase() === 'total' || teacherName.toLowerCase() === 'grand total') return null;

                            return {
                                teacherName: teacherName,
                                reason: row[1] || '',
                                month: row[2] || '',
                                date: row[3] || '',
                                amount: row[4] || '0',
                            };
                        }).filter(Boolean);
                        allFines = allFines.concat(spreadsheetFines);
                    }
                    rangeOffset = 1;
                }

                // Process Salaries
                for (let i = rangeOffset; i < valueRanges.length; i++) {
                    const rangeData = valueRanges[i];
                    const rows = rangeData.values;
                    const tabTitle = monthsToProcess[i - rangeOffset];

                    if (rows && rows.length > 0) {
                        const monthSalaries = rows.map(row => {
                            if (!row || row.length < 2) return null;

                            const colA = (row[0] || '').trim();
                            const income = (row[1] || '0').trim();

                            // Skip header rows or empty rows
                            if (!income || income.toLowerCase() === 'income' || colA.toLowerCase() === 'month') return null;
                            if (income === '0.00' && (row[5] || '0') === '0.00') return null;

                            return {
                                teacherName: spreadsheetTitle,
                                month: tabTitle,
                                income: income,
                                bonus: row[2] || '0',
                                fine: row[3] || '0',
                                recount: row[4] || '0',
                                total: row[5] || '0'
                            };
                        }).filter(Boolean);

                        allSalaries = allSalaries.concat(monthSalaries);
                    }
                }

                allDebugSheets.push({ id: currentSheetId, title: spreadsheetTitle });
                if (rawSnippet.length === 0) rawSnippet = valueRanges[rangeOffset]?.values?.slice(0, 5) || [];

            } catch (err: any) {
                console.error(`Error processing sheet ${currentSheetId}:`, err.message);
            }
        }

        // Add Cache Header
        response.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
        return response.status(200).json({
            fines: allFines,
            salaries: allSalaries,
            debug: {
                sheets: allDebugSheets.map(s => s.title),
                rawRows: rawSnippet,
                processedIds: sheetIds
            }
        });
    } catch (error: any) {
        console.error('Sheet Error:', error);
        return response.status(500).json({ error: error.message });
    }
}
