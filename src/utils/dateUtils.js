// dateUtils.js
import { startOfWeek as startOfWeekFn, addDays as addDaysFn, format } from 'date-fns';

// Start of the week (Monday)
export function startOfWeek(date) {
  return startOfWeekFn(date, { weekStartsOn: 1 }); // 1 = Monday
}

// Add days to a date
export function addDays(date, days) {
  return addDaysFn(date, days);
}

// Format date as 'MMM dd, yyyy'
export function formatDate(date, dateFormat = 'MMM dd, yyyy') {
  return format(date, dateFormat);
}

// Example helper function to generate week days (Monday to Sunday)
export const generateWeekDays = () => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 (Sun) to 6 (Sat)
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7)); // Adjust to previous Monday

  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    weekDays.push(day);
  }
  return weekDays;
};