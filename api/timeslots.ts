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
            "1WkHjKplq7Ruf3u1IxvlW3H_MeTbAXejREKRpFPOOaUw"
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
                const metadata = await sheets.spreadsheets.get({ spreadsheetId });
                const hasSlotsSheet = metadata.data.sheets?.some(s => s.properties?.title === 'TimeSlots');

                if (!hasSlotsSheet) return response.status(200).json([]);

                const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: "'TimeSlots'!A2:C" });
                const rows = res.data.values || [];
                const slots = rows.map(row => ({
                    id: row[0],
                    name: row[1] || '',
                    parentId: row[2] || null
                })).filter(s => s.id);
                return response.status(200).json(slots);
            }

            case 'POST': {
                const { name, parentId } = request.body;
                const newSlotId = crypto.randomUUID();
                const newSlot = [newSlotId, name, parentId || ''];

                const metadata = await sheets.spreadsheets.get({ spreadsheetId });
                const hasSlotsSheet = metadata.data.sheets?.some(s => s.properties?.title === 'TimeSlots');

                if (!hasSlotsSheet) {
                    await sheets.spreadsheets.batchUpdate({
                        spreadsheetId,
                        requestBody: {
                            requests: [{ addSheet: { properties: { title: 'TimeSlots' } } }]
                        }
                    });
                    await sheets.spreadsheets.values.update({
                        spreadsheetId,
                        range: "'TimeSlots'!A1:C1",
                        valueInputOption: 'RAW',
                        requestBody: {
                            values: [['ID', 'Name', 'ParentID']]
                        }
                    });
                }

                await sheets.spreadsheets.values.append({
                    spreadsheetId,
                    range: "'TimeSlots'!A2:C",
                    valueInputOption: 'RAW',
                    requestBody: { values: [newSlot] }
                });

                return response.status(201).json({ id: newSlotId, name, parentId });
            }

            case 'DELETE': {
                const { id } = request.body;
                const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: "'TimeSlots'!A:A" });
                const rows = res.data.values || [];
                const rowIndex = rows.findIndex(row => row[0] === id);

                if (rowIndex === -1) return response.status(404).json({ error: 'Time Slot not found' });

                const sheetMetadata = await sheets.spreadsheets.get({ spreadsheetId });
                const slotsSheet = sheetMetadata.data.sheets?.find(s => s.properties?.title === 'TimeSlots');
                const sheetId = slotsSheet?.properties?.sheetId;

                await sheets.spreadsheets.batchUpdate({
                    spreadsheetId,
                    requestBody: {
                        requests: [{
                            deleteDimension: {
                                range: { sheetId, dimension: 'ROWS', startIndex: rowIndex, endIndex: rowIndex + 1 }
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
        const { email } = { email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL };
        return response.status(500).json({
            error: error.message,
            spreadsheetId: (global as any).lastSpreadsheetId,
            serviceAccount: email
        });
    }
}
