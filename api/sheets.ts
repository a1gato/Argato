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
        const envIds = (process.env.GOOGLE_SHEET_ID || '').split(',').map(id => id.trim()).filter(Boolean);
        const registryIds = [
            "1ozJmAzAVf-ISwa6pvtSrwQSkkKpxE5sUpJVTKH_Xw-k", // Salohiddinov Muslimbek
            "1_GwFosb5GihN6DFNLQtY2P9vNiBruRm7LO85_WQ-Y8k"  // New Teacher
        ];

        const sheetIds = Array.from(new Set([...envIds, ...registryIds]));

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

                // PER USER: Name = Spreadsheet Title
                const spreadsheetTitle = (metadataResponse.data.properties?.title || 'Unknown Staff').trim();

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
                            if (!row || row.length < 5) return null;
                            const amount = (row[4] || '').trim();

                            if (!amount || amount === '0' || amount === '0.00' || isNaN(parseFloat(amount.replace(/[$,\s]/g, '')))) return null;

                            return {
                                teacherName: spreadsheetTitle.trim(),
                                reason: row[1] || 'Fine',
                                month: row[2] || 'Unspecified',
                                date: row[3] || '',
                                amount: amount,
                            };
                        }).filter(Boolean);
                        allFines = allFines.concat(spreadsheetFines);
                    }
                    rangeOffset = 1;
                }

                // Process Salaries
                let sheetSalariesCount = 0;
                for (let i = rangeOffset; i < valueRanges.length; i++) {
                    const rangeData = valueRanges[i];
                    const rows = rangeData.values;
                    const tabTitle = monthsToProcess[i - rangeOffset];

                    if (rows && rows.length > 0) {
                        const monthSalaries = rows.map(row => {
                            if (!row || row.length < 2) return null;

                            const colA = (row[0] || '').trim().toLowerCase();
                            const income = (row[1] || '').trim();

                            // 1. Skip rows that are clearly "Total" or "Subtotal" rows from the spreadsheet
                            // This prevents "doubling" (Counting rows + then counting the spreadsheet's own total row)
                            if (colA.includes('total') || colA.includes('subtotal') || colA.includes('itogo') || colA === '---') return null;

                            // 2. Skip header rows or empty rows
                            // PER USER: Ignore caves (cells) for month/name, use tab/title
                            if (!income || income.toLowerCase() === 'income' || isNaN(parseFloat(income.replace(/[$,\s]/g, '')))) return null;
                            if (income === '0' || income === '0.00') {
                                const hasValue = row.slice(2, 6).some(v => v && v !== '0' && v !== '0.00');
                                if (!hasValue) return null;
                            }

                            return {
                                teacherName: spreadsheetTitle.trim(),
                                month: tabTitle,
                                income: income,
                                bonus: row[2] || '0',
                                fine: row[3] || '0',
                                recount: row[4] || '0',
                                total: row[5] || '0'
                            };
                        }).filter(Boolean);

                        allSalaries = allSalaries.concat(monthSalaries);
                        sheetSalariesCount += monthSalaries.length;
                    }
                }

                allDebugSheets.push({
                    id: currentSheetId,
                    title: spreadsheetTitle,
                    salariesCount: sheetSalariesCount,
                    tabCount: monthsToProcess.length
                });
                if (rawSnippet.length === 0) rawSnippet = valueRanges[rangeOffset]?.values?.slice(0, 5) || [];

            } catch (err: any) {
                console.error(`Error processing sheet ${currentSheetId}:`, err.message);
                allDebugSheets.push({ id: currentSheetId, error: err.message });
            }
        }

        // Add Cache Header - DISABLE FOR DEBUGGING
        response.setHeader('Cache-Control', 'no-store, max-age=0');
        return response.status(200).json({
            fines: allFines,
            salaries: allSalaries,
            debug: {
                sheets: allDebugSheets,
                rawRows: rawSnippet,
                processedIds: sheetIds
            }
        });
    } catch (error: any) {
        console.error('Sheet Error:', error);
        return response.status(500).json({ error: error.message });
    }
}
