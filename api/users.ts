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
            // First look for any sheet with "REG" in its title
            for (const id of allSheetIds) {
                try {
                    const meta = await sheets.spreadsheets.get({ spreadsheetId: id });
                    const title = meta.data.properties?.title || '';
                    const hasDataTabs = meta.data.sheets?.some(s => ['Users', 'Students', 'Groups', 'TimeSlots'].includes(s.properties?.title || ''));
                    if (title.toUpperCase().includes('REG') || hasDataTabs) {
                        return id;
                    }
                } catch (e) { continue; }
            }
            return allSheetIds[0];
        }

        const spreadsheetId = await getSpreadsheetId();

        switch (method) {
            case 'GET': {
                const metadata = await sheets.spreadsheets.get({ spreadsheetId });
                const hasUsersSheet = metadata.data.sheets?.some(s => s.properties?.title === 'Users');

                if (!hasUsersSheet) return response.status(200).json([]);

                const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: "'Users'!A2:H" });
                const rows = res.data.values || [];
                const users = rows.map(row => ({
                    id: String(row[0] || ''),
                    employeeId: String(row[1] || ''),
                    firstName: String(row[2] || ''),
                    lastName: String(row[3] || ''),
                    password: String(row[4] || ''),
                    role: String(row[5] || 'employee'),
                    telephone: String(row[6] || ''),
                    email: String(row[7] || '')
                })).filter(u => u.id);
                return response.status(200).json(users);
            }

            case 'POST': {
                const { employeeId, firstName, lastName, password, role, telephone, email: userEmail } = request.body;
                const newUserId = crypto.randomUUID();
                const newUser = [
                    String(newUserId),
                    String(employeeId || ''),
                    String(firstName || ''),
                    String(lastName || ''),
                    String(password || ''),
                    String(role || 'employee'),
                    String(telephone || ''),
                    String(userEmail || '')
                ];

                const metadata = await sheets.spreadsheets.get({ spreadsheetId });
                const hasUsersSheet = metadata.data.sheets?.some(s => s.properties?.title === 'Users');

                if (!hasUsersSheet) {
                    await sheets.spreadsheets.batchUpdate({
                        spreadsheetId,
                        requestBody: {
                            requests: [{ addSheet: { properties: { title: 'Users' } } }]
                        }
                    });
                    await sheets.spreadsheets.values.update({
                        spreadsheetId,
                        range: "'Users'!A1:H1",
                        valueInputOption: 'RAW',
                        requestBody: {
                            values: [['ID', 'EmployeeID', 'FirstName', 'LastName', 'Password', 'Role', 'Telephone', 'Email']]
                        }
                    });
                }

                await sheets.spreadsheets.values.append({
                    spreadsheetId,
                    range: "'Users'!A2:H",
                    valueInputOption: 'RAW',
                    requestBody: { values: [newUser] }
                });

                return response.status(201).json({ id: newUserId, employeeId, firstName, lastName, password, role, telephone, email: userEmail });
            }

            case 'PUT': {
                const { id, employeeId, firstName, lastName, password, role, telephone, email: userEmail } = request.body;
                const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: "'Users'!A:A" });
                const rows = res.data.values || [];
                const rowIndex = rows.findIndex(row => row[0] === id) + 1;

                if (rowIndex === 0) return response.status(404).json({ error: 'User not found' });

                await sheets.spreadsheets.values.update({
                    spreadsheetId,
                    range: `'Users'!A${rowIndex}:H${rowIndex}`,
                    valueInputOption: 'RAW',
                    requestBody: {
                        values: [[id, employeeId, firstName, lastName, password, role, telephone, userEmail]]
                    }
                });

                return response.status(200).json({ id, employeeId, firstName, lastName, password, role, telephone, email: userEmail });
            }

            case 'DELETE': {
                const { id } = request.body;
                const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: "'Users'!A:A" });
                const rows = res.data.values || [];
                const rowIndex = rows.findIndex(row => row[0] === id);

                if (rowIndex === -1) return response.status(404).json({ error: 'User not found' });

                const sheetMetadata = await sheets.spreadsheets.get({ spreadsheetId });
                const usersSheet = sheetMetadata.data.sheets?.find(s => s.properties?.title === 'Users');
                const sheetId = usersSheet?.properties?.sheetId;

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
        return response.status(500).json({ error: error.message });
    }
}
