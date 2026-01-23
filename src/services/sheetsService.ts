
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

export const fetchSheetData = async (): Promise<{ fines: Fine[]; salaries: Salary[] }> => {
    try {
        const response = await fetch('/api/sheets');
        if (!response.ok) {
            throw new Error('Failed to fetch sheet data');
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching sheets:", error);
        return { fines: [], salaries: [] };
    }
};
