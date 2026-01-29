import { google } from 'googleapis';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

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
        (global as any).lastSpreadsheetId = spreadsheetId;

        switch (method) {
            case 'GET': {
                try {
                    const metadata = await sheets.spreadsheets.get({ spreadsheetId });
                    const hasGroupsSheet = metadata.data.sheets?.some(s => s.properties?.title === 'Groups');

                    if (!hasGroupsSheet) return response.status(200).json([]);

                    const res = await sheets.spreadsheets.values.get({
                        spreadsheetId,
                        range: "'Groups'!A2:F",
                    });
                    const rows = res.data.values || [];
                    const groups = rows.map(row => ({
                        id: row[0],
                        name: row[1] || '',
                        description: row[2] || '',
                        teacherId: row[3] || '',
                        scheduleType: row[4] || 'MWF',
                        timeSlotId: row[5] || ''
                    })).filter(g => g.id);
                    return response.status(200).json(groups);
                } catch (err: any) {
                    return response.status(err.code || 500).json({
                        error: `Google Sheets Error: ${err.message}`,
                        details: `Ensure you have shared your sheet as EDITOR with: ${email}`
                    });
                }
            }

            case 'POST': {
                try {
                    const { name, description, teacherId, scheduleType, timeSlotId } = request.body;
                    const newGroupId = crypto.randomUUID();
                    const newGroup = [newGroupId, name, description, teacherId, scheduleType, timeSlotId];

                    const metadata = await sheets.spreadsheets.get({ spreadsheetId });
                    const hasGroupsSheet = metadata.data.sheets?.some(s => s.properties?.title === 'Groups');

                    if (!hasGroupsSheet) {
                        await sheets.spreadsheets.batchUpdate({
                            spreadsheetId,
                            requestBody: {
                                requests: [{ addSheet: { properties: { title: 'Groups' } } }]
                            }
                        });
                        await sheets.spreadsheets.values.update({
                            spreadsheetId,
                            range: "'Groups'!A1:F1",
                            valueInputOption: 'RAW',
                            requestBody: {
                                values: [['ID', 'Name', 'Description', 'Teacher ID', 'Schedule', 'Time Slot ID']]
                            }
                        });
                    }

                    await sheets.spreadsheets.values.append({
                        spreadsheetId,
                        range: "'Groups'!A2:F",
                        valueInputOption: 'RAW',
                        requestBody: { values: [newGroup] }
                    });

                    return response.status(201).json({ id: newGroupId, name, description, teacherId, scheduleType, timeSlotId });
                } catch (err: any) {
                    return response.status(err.code || 500).json({
                        error: `Google Sheets Error: ${err.message}`,
                        details: `Ensure you have shared your sheet as EDITOR with: ${email}`
                    });
                }
            }

            case 'PUT': {
                try {
                    const { id, name, description, teacherId, scheduleType, timeSlotId } = request.body;
                    const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: "'Groups'!A:A" });
                    const rows = res.data.values || [];
                    const rowIndex = rows.findIndex(row => row[0] === id) + 1;

                    if (rowIndex === 0) return response.status(404).json({ error: 'Group not found' });

                    await sheets.spreadsheets.values.update({
                        spreadsheetId,
                        range: `'Groups'!A${rowIndex}:F${rowIndex}`,
                        valueInputOption: 'RAW',
                        requestBody: {
                            values: [[id, name, description, teacherId, scheduleType, timeSlotId]]
                        }
                    });

                    return response.status(200).json({ id, name, description, teacherId, scheduleType, timeSlotId });
                } catch (err: any) {
                    return response.status(err.code || 500).json({
                        error: `Google Sheets Error: ${err.message}`,
                        details: `Ensure you have shared your sheet as EDITOR with: ${email}`
                    });
                }
            }

            case 'DELETE': {
                try {
                    const { id } = request.body;
                    const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: "'Groups'!A:A" });
                    const rows = res.data.values || [];
                    const rowIndex = rows.findIndex(row => row[0] === id);

                    if (rowIndex === -1) return response.status(404).json({ error: 'Group not found' });

                    const sheetMetadata = await sheets.spreadsheets.get({ spreadsheetId });
                    const groupSheet = sheetMetadata.data.sheets?.find(s => s.properties?.title === 'Groups');
                    const sheetId = groupSheet?.properties?.sheetId;

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
                } catch (err: any) {
                    return response.status(err.code || 500).json({
                        error: `Google Sheets Error: ${err.message}`,
                        details: `Ensure you have shared your sheet as EDITOR with: ${email}`
                    });
                }
            }

            default:
                return response.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error: any) {
        console.error('Groups API Error:', error);
        const { email } = { email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL };
        return response.status(500).json({
            error: error.message,
            spreadsheetId: (global as any).lastSpreadsheetId,
            serviceAccount: email
        });
    }
}
