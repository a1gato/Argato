import { google } from 'googleapis';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

// Scopes required for reading and writing Google Sheets
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

// PRIMARY EDUCATIONAL SHEET
const PRIMARY_SHEET_ID = "1ozJmAzAVf-ISwa6pvtSrwQSkkKpxE5sUpJVTKH_Xw-k";

export default async function handler(request: VercelRequest, response: VercelResponse) {
    const { method } = request;

    try {
        const { email, privateKey } = {
            email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            privateKey: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        };

        if (!email || !privateKey) {
            return response.status(500).json({ error: 'Missing configuration' });
        }

        const auth = new google.auth.JWT({ email, key: privateKey, scopes: SCOPES });
        const sheets = google.sheets({ version: 'v4', auth });

        const envIds = (process.env.GOOGLE_SHEET_ID || '').split(',').map(id => id.trim()).filter(Boolean);
        const configIds = [
            "1ozJmAzAVf-ISwa6pvtSrwQSkkKpxE5sUpJVTKH_Xw-k",
            "1_GwFosb5GihN6DFNLQtY2P9vNiBruRm7LO85_WQ-Y8k"
        ];
        const allSheetIds = Array.from(new Set([...envIds, ...configIds]));

        async function getSpreadsheetId() {
            for (const id of allSheetIds) {
                try {
                    const meta = await sheets.spreadsheets.get({ spreadsheetId: id });
                    const title = meta.data.properties?.title || '';
                    const hasDataTabs = meta.data.sheets?.some(s => ['Users', 'Students', 'Groups', 'TimeSlots'].includes(s.properties?.title || ''));
                    if (title.toUpperCase().includes('REG') || hasDataTabs) return id;
                } catch (e) { continue; }
            }
            return allSheetIds[0];
        }

        const spreadsheetId = await getSpreadsheetId();
        const sheetIds = [spreadsheetId];
        // LOG FOR DEBUGGING
        console.log('Target Spreadsheet:', PRIMARY_SHEET_ID);

        switch (method) {
            case 'GET': {
                let allStudents: any[] = [];
                for (const spreadsheetId of sheetIds) {
                    try {
                        const metadata = await sheets.spreadsheets.get({ spreadsheetId });
                        const hasStudentsSheet = metadata.data.sheets?.some(s => s.properties?.title === 'Students');

                        if (hasStudentsSheet) {
                            const res = await sheets.spreadsheets.values.get({
                                spreadsheetId,
                                range: "'Students'!A2:G",
                            });
                            const rows = res.data.values || [];
                            const students = rows.map(row => ({
                                id: row[0],
                                name: row[1] || '',
                                surname: row[2] || '',
                                phone: row[3] || '',
                                parentPhone: row[4] || '',
                                group: row[5] || '',
                                status: row[6] || 'Active',
                                spreadsheetId // Track where it came from
                            })).filter(s => s.id);
                            allStudents = allStudents.concat(students);
                        }
                    } catch (err: any) {
                        console.error(`Error reading students from ${spreadsheetId}:`, err);
                        // Only throw if it's the primary sheet failing
                        if (spreadsheetId === PRIMARY_SHEET_ID) {
                            throw new Error(`Primary Sheet Error: ${err.message}`);
                        }
                    }
                }
                return response.status(200).json(allStudents);
            }

            case 'POST': {
                const { name, surname, phone, parentPhone, group } = request.body;

                // DATA VALIDATION
                if (!name || !surname) {
                    return response.status(400).json({ error: 'Name and Surname are required' });
                }

                const newStudentId = crypto.randomUUID();
                const newStudentRow = [
                    newStudentId,
                    name,
                    surname,
                    phone,
                    parentPhone,
                    group,
                    'Active'
                ];

                const targetSpreadsheetId = PRIMARY_SHEET_ID;

                try {
                    // 1. Ensure tab exists
                    const metadata = await sheets.spreadsheets.get({ spreadsheetId: targetSpreadsheetId });
                    const hasStudentsSheet = metadata.data.sheets?.some(s => s.properties?.title === 'Students');

                    if (!hasStudentsSheet) {
                        await sheets.spreadsheets.batchUpdate({
                            spreadsheetId: targetSpreadsheetId,
                            requestBody: {
                                requests: [{ addSheet: { properties: { title: 'Students' } } }]
                            }
                        });
                        // Add headers
                        await sheets.spreadsheets.values.update({
                            spreadsheetId: targetSpreadsheetId,
                            range: "'Students'!A1:G1",
                            valueInputOption: 'RAW',
                            requestBody: {
                                values: [['ID', 'Name', 'Surname', 'Phone', 'Parent Phone', 'Group', 'Status']]
                            }
                        });
                    }

                    // 2. Append the row
                    await sheets.spreadsheets.values.append({
                        spreadsheetId: targetSpreadsheetId,
                        range: "'Students'!A2:G",
                        valueInputOption: 'RAW',
                        requestBody: {
                            values: [newStudentRow]
                        }
                    });

                    return response.status(201).json({
                        id: newStudentId,
                        name,
                        surname,
                        phone,
                        parentPhone,
                        group,
                        status: 'Active',
                        spreadsheetId: targetSpreadsheetId
                    });
                } catch (err: any) {
                    console.error('Final POST Error:', err);
                    return response.status(err.code || 500).json({
                        error: `Google Sheets Error: ${err.message}`,
                        details: `Ensure you have shared your sheet as EDITOR with: ${email}`,
                        googleErrors: err.errors
                    });
                }
            }

            case 'PUT': {
                const { id, name, surname, phone, parentPhone, group, status, spreadsheetId } = request.body;
                if (!id || !spreadsheetId) return response.status(400).json({ error: 'Missing ID or SpreadsheetID' });

                // Find row index
                const res = await sheets.spreadsheets.values.get({
                    spreadsheetId,
                    range: "'Students'!A:A",
                });
                const rows = res.data.values || [];
                const rowIndex = rows.findIndex(row => row[0] === id) + 1;

                if (rowIndex === 0) return response.status(404).json({ error: 'Student not found in sheet' });

                await sheets.spreadsheets.values.update({
                    spreadsheetId,
                    range: `'Students'!A${rowIndex}:G${rowIndex}`,
                    valueInputOption: 'RAW',
                    requestBody: {
                        values: [[id, name, surname, phone, parentPhone, group, status]]
                    }
                });

                return response.status(200).json({ id, name, surname, phone, parentPhone, group, status });
            }

            case 'DELETE': {
                const { id, spreadsheetId } = request.body;
                if (!id || !spreadsheetId) return response.status(400).json({ error: 'Missing ID or SpreadsheetID' });

                const res = await sheets.spreadsheets.values.get({
                    spreadsheetId,
                    range: "'Students'!A:A",
                });
                const rows = res.data.values || [];
                const rowIndex = rows.findIndex(row => row[0] === id);

                if (rowIndex === -1) return response.status(404).json({ error: 'Student not found' });

                // Delete row requires batchUpdate
                const sheetMetadata = await sheets.spreadsheets.get({ spreadsheetId });
                const studentSheet = sheetMetadata.data.sheets?.find(s => s.properties?.title === 'Students');
                const sheetId = studentSheet?.properties?.sheetId;

                await sheets.spreadsheets.batchUpdate({
                    spreadsheetId,
                    requestBody: {
                        requests: [{
                            deleteDimension: {
                                range: {
                                    sheetId,
                                    dimension: 'ROWS',
                                    startIndex: rowIndex,
                                    endIndex: rowIndex + 1
                                }
                            }
                        }]
                    }
                });

                return response.status(200).json({ success: true });
            }

            default:
                return response.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error: any) {
        console.error('Students API Error:', error);
        return response.status(500).json({ error: error.message });
    }
}
