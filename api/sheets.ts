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

                const spreadsheetTitle = metadataResponse.data.properties?.title || 'Unknown Spreadsheet';
                const sheetTitles = (metadataResponse.data.sheets || [])
                    .map(s => s.properties?.title || '')
                    .filter(title => title && !title.startsWith('Pivot Table'));

                // Efficiently Batch Fetch All Ranges for THIS spreadsheet
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

                // Process Fines
                if (hasFinesSheet) {
                    const finesData = valueRanges[0]?.values;
                    if (finesData) {
                        const spreadsheetFines = finesData.map(row => {
                            let tName = (row[0] || '').trim();

                            // Fallback for Fines as well
                            const genericSheetWords = ['salary', 'finance', 'os it', 'track', 'copy of'];
                            const titleIsGeneric = genericSheetWords.some(w => spreadsheetTitle.toLowerCase().includes(w));

                            if ((!tName || tName.toLowerCase() === 'fio' || tName.toLowerCase() === 'teacher') && !titleIsGeneric) {
                                tName = spreadsheetTitle;
                            }

                            return {
                                teacherName: tName,
                                reason: row[1] || '',
                                month: row[2] || '',
                                date: row[3] || '',
                                amount: row[4] || '0',
                            };
                        });
                        allFines = allFines.concat(spreadsheetFines);
                    }
                    rangeOffset = 1;
                }

                // Process Salaries
                for (let i = rangeOffset; i < valueRanges.length; i++) {
                    const rangeData = valueRanges[i];
                    const rows = rangeData.values;
                    const sheetTitle = monthsToProcess[i - rangeOffset];

                    if (rows && rows.length > 0) {
                        const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
                        const isMonthSheet = monthNames.includes(sheetTitle.toLowerCase());

                        const monthSalaries = rows.map(row => {
                            if (!row || row.length === 0) return null;

                            const colA = (row[0] || '').trim();
                            const income = row[1] || '0';
                            const invalidLabels = [...monthNames, 'month', 'total', 'fio', 'answer'];
                            const isNotTeacherInColA = !colA || invalidLabels.includes(colA.toLowerCase());

                            let teacherName = '';
                            let month = '';

                            if (isMonthSheet) {
                                teacherName = isNotTeacherInColA ? `Unassigned (${sheetTitle})` : colA;
                                month = sheetTitle;
                            } else {
                                teacherName = sheetTitle;
                                month = colA || 'Unknown';
                                if (invalidLabels.includes(colA.toLowerCase()) && !monthNames.includes(colA.toLowerCase())) {
                                    return null;
                                }
                            }

                            // Smart Fallback: If it's still unassigned, and the spreadsheet title doesn't look generic,
                            // use the Spreadsheet Title as the teacher name.
                            const genericSheetWords = ['salary', 'finance', 'os it', 'track', 'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december', 'copy of'];
                            const titleIsGeneric = genericSheetWords.some(w => spreadsheetTitle.toLowerCase().includes(w));

                            if (teacherName.startsWith('Unassigned') && !titleIsGeneric) {
                                teacherName = spreadsheetTitle;
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

                        allSalaries = allSalaries.concat(monthSalaries);
                    }
                }

                allDebugSheets.push({ id: currentSheetId, titles: sheetTitles });
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
                sheets: allDebugSheets.flatMap(s => s.titles),
                rawRows: rawSnippet,
                processedIds: sheetIds
            }
        });
    } catch (error: any) {
        console.error('Sheet Error:', error);
        return response.status(500).json({ error: error.message });
    }
}
