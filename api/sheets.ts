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

                // Determine if this entire spreadsheet belongs to one teacher
                const globalWords = ['os it', 'track', 'finance system', 'copy of', 'sheet', 'management'];
                const titleIsGlobal = globalWords.some(w => spreadsheetTitle.toLowerCase().includes(w));
                const spreadsheetTeacherName = titleIsGlobal ? null : spreadsheetTitle;

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

                // Process Fines
                if (hasFinesSheet) {
                    const finesData = valueRanges[0]?.values;
                    if (finesData) {
                        const spreadsheetFines = finesData.map(row => {
                            let tName = (row[0] || '').trim();

                            const invalidLabels = ['fio', 'teacher', 'name', 'total', 'fines', 'salary', 'answer', 'empty'];
                            const colAIsInvalid = !tName || invalidLabels.includes(tName.toLowerCase());

                            let finalTeacherName = '';
                            if (!colAIsInvalid) {
                                finalTeacherName = tName;
                            } else if (spreadsheetTeacherName) {
                                finalTeacherName = spreadsheetTeacherName;
                            } else {
                                finalTeacherName = 'Unassigned';
                            }

                            if (tName.toLowerCase() === 'total' || tName.toLowerCase() === 'grand total') return null;

                            return {
                                teacherName: finalTeacherName,
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
                    const sheetTitle = monthsToProcess[i - rangeOffset];

                    if (rows && rows.length > 0) {
                        const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
                        const isMonthSheet = monthNames.includes(sheetTitle.toLowerCase());

                        const monthSalaries = rows.map(row => {
                            if (!row || row.length === 0) return null;

                            const colA = (row[0] || '').trim();
                            const income = row[1] || '0';

                            const invalidLabels = [...monthNames, 'month', 'total', 'fio', 'answer', 'score', 'empty'];
                            const colAIsInvalid = !colA || invalidLabels.includes(colA.toLowerCase());

                            if (colA.toLowerCase() === 'total' || colA.toLowerCase().includes('total volume')) return null;

                            let finalTeacherName = '';
                            let month = '';

                            if (isMonthSheet) {
                                if (!colAIsInvalid) {
                                    finalTeacherName = colA;
                                } else if (spreadsheetTeacherName) {
                                    finalTeacherName = spreadsheetTeacherName;
                                } else {
                                    finalTeacherName = 'Unassigned';
                                }
                                month = sheetTitle;
                            } else {
                                if (spreadsheetTeacherName) {
                                    finalTeacherName = spreadsheetTeacherName;
                                } else if (!monthNames.includes(sheetTitle.toLowerCase())) {
                                    finalTeacherName = sheetTitle;
                                } else {
                                    finalTeacherName = 'Unassigned';
                                }
                                month = colA || 'Unknown';
                                if (colAIsInvalid && !monthNames.includes(colA.toLowerCase())) return null;
                            }

                            return {
                                teacherName: finalTeacherName,
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
