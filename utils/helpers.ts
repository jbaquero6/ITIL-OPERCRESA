import { Activity, SemaphoreStatus } from '../types';

export const calculateSemaphoreStatus = (activity: Partial<Omit<Activity, 'semaphoreStatus'>>): SemaphoreStatus => {
    const { completionDate, dueDate } = activity;

    // Case 1: Activity is completed
    if (completionDate) {
        // If no due date, it's always on time
        if (!dueDate) {
            return SemaphoreStatus.GREEN;
        }
        const dCompletion = new Date(completionDate);
        const dDue = new Date(dueDate);
        dCompletion.setHours(0, 0, 0, 0);
        dDue.setHours(0, 0, 0, 0);
        // Completed on or before due date vs. after
        return dCompletion <= dDue ? SemaphoreStatus.GREEN : SemaphoreStatus.RED;
    }

    // Case 2: Activity is not completed
    if (!dueDate) {
        // No due date and not done -> Gray
        return SemaphoreStatus.GRAY;
    }

    const dDue = new Date(dueDate);
    const today = new Date();
    // Set hours to 0 to compare dates only
    dDue.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    if (dDue < today) {
        // Not completed and past due date -> Red
        return SemaphoreStatus.RED;
    } else {
        // Not completed and due date is today or in the future -> Orange
        return SemaphoreStatus.ORANGE;
    }
};

export const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/D';
    // Handle cases where date might not have time part
    const date = new Date(dateString);
    if (dateString.length === 10) { // YYYY-MM-DD
         const [year, month, day] = dateString.split('-').map(Number);
         return new Date(year, month - 1, day).toLocaleDateString('es-ES');
    }
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
};

export const sanitizeFileName = (name: string, maxLength: number = 50): string => {
    const nameWithoutExtension = name.substring(0, name.lastIndexOf('.')) || name;
    return nameWithoutExtension
        .replace(/[^a-zA-Z0-9\s_-]/g, '') // Remove special characters except spaces, underscores, hyphens
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .substring(0, maxLength); // Truncate to the specified max length
};