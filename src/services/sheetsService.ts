
export interface Fine {
    teacherName: string;
    reason: string;
    month: string;
    date: string;
    amount: string;
}

export interface Salary {
    teacherName: string;
    month: string;
    income: string;
    bonus: string;
    fine: string;
    recount: string;
    total: string;
}

export const fetchSheetData = async (): Promise<{ fines: Fine[]; salaries: Salary[]; debug?: { sheets: string[]; rawRows?: any[][] } }> => {
    // Simulate loading delay for UX
    await new Promise(resolve => setTimeout(resolve, 600));

    try {
        const response = await fetch('/api/sheets');
        if (!response.ok) {
            throw new Error('Failed to fetch sheet data');
        }
        return await response.json();
    } catch (error) {
        console.warn("Local Mode Active: Using mock salary data because API is unreachable.");

        // Return structured empty state for Local Mode
        return {
            fines: [],
            salaries: [],
            debug: {
                sheets: ['Local Cache (Offline)'],
                rawRows: []
            }
        };
    }
};
