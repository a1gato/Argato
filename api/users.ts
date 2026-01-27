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

        // Get the first ID from environment variable or fallback to known ID
        const spreadsheetId = (process.env.GOOGLE_SHEET_ID || '').split(',')[0]?.trim() || "1ozJmAzAVf-ISwa6pvtSrwQSkkKpxE5sUpJVTKH_Xw-k";

        switch (method) {
            case 'GET': {
                const metadata = await sheets.spreadsheets.get({ spreadsheetId });
                const hasUsersSheet = metadata.data.sheets?.some(s => s.properties?.title === 'Users');

                if (!hasUsersSheet) return response.status(200).json([]);

                const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: "'Users'!A2:H" });
                const rows = res.data.values || [];
                const users = rows.map(row => ({
                    id: row[0],
                    employeeId: row[1] || '',
                    firstName: row[2] || '',
                    lastName: row[3] || '',
                    password: row[4] || '',
                    role: row[5] || 'employee',
                    telephone: row[6] || '',
                    email: row[7] || ''
                })).filter(u => u.id);
                return response.status(200).json(users);
            }

            case 'POST': {
                const { employeeId, firstName, lastName, password, role, telephone, email: userEmail } = request.body;
                const newUserId = crypto.randomUUID();
                const newUser = [newUserId, employeeId, firstName, lastName, password, role, telephone, userEmail];

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
