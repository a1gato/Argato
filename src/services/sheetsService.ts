
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


export const SALARY_STORAGE_KEY = 'os_salary_data';

export const fetchSheetData = async (): Promise<{ fines: Fine[]; salaries: Salary[]; debug?: { sheets: string[]; rawRows?: any[][] } }> => {
    // Simulate loading delay for UX
    await new Promise(resolve => setTimeout(resolve, 600));

    try {
        const stored = localStorage.getItem(SALARY_STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }

        // Return default empty state if nothing stored
        return {
            fines: [],
            salaries: [],
            debug: {
                sheets: ['Local Cache'],
                rawRows: []
            }
        };
    } catch (error) {
        console.warn("Local Storage Error: Returning empty state.");
        return {
            fines: [],
            salaries: [],
            debug: {
                sheets: ['Error Loading Local Data'],
                rawRows: []
            }
        };
    }
};
