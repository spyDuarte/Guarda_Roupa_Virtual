/**
 * Formats a date as YYYY-MM-DD for storage keys and comparison.
 * Uses local time to avoid timezone shifts.
 * @param {Date} date
 * @returns {string}
 */
export function formatDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}
