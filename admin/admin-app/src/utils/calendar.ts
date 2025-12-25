// Calendar utility functions

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export type CalendarView = 'month' | 'week' | 'day' | 'list';

/**
 * Get the first day of the month (0 = Sunday, 6 = Saturday)
 */
export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

/**
 * Get the number of days in a month
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Format a date as YYYY-MM-DD
 */
export function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse YYYY-MM-DD string to Date object
 */
export function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/**
 * Format time in 12-hour format (e.g., "2:00 PM")
 */
export function formatTime12Hour(date: Date): string {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const minutesStr = String(minutes).padStart(2, '0');
  return `${hours}:${minutesStr} ${ampm}`;
}

/**
 * Format time string (HH:mm) to 12-hour format
 */
export function formatTimeString(timeStr: string): string {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${String(minutes).padStart(2, '0')} ${ampm}`;
}

/**
 * Parse time string to minutes from midnight
 */
export function parseTimeToMinutes(timeStr: string): number {
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return 0;

  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const period = match[3].toUpperCase();

  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

/**
 * Get the start of the week for a given date (Sunday)
 */
export function getWeekStart(date: Date): Date {
  const result = new Date(date);
  result.setDate(date.getDate() - date.getDay());
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Get the end of the week for a given date (Saturday)
 */
export function getWeekEnd(date: Date): Date {
  const result = new Date(date);
  result.setDate(date.getDate() + (6 - date.getDay()));
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(date.getDate() + days);
  return result;
}

/**
 * Add months to a date
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(date.getMonth() + months);
  return result;
}

/**
 * Get formatted date range string
 */
export function getDateRangeString(startDate: Date, endDate: Date): string {
  const startMonth = MONTH_NAMES[startDate.getMonth()];
  const endMonth = MONTH_NAMES[endDate.getMonth()];
  const startDay = startDate.getDate();
  const endDay = endDate.getDate();
  const year = startDate.getFullYear();

  if (startDate.getMonth() === endDate.getMonth()) {
    return `${startMonth} ${startDay} - ${endDay}, ${year}`;
  } else {
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
  }
}

/**
 * Format date for month/date input (YYYY-MM)
 */
export function formatMonthInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Get initials from name
 */
export function getInitials(firstName: string, lastName: string): string {
  const first = firstName?.charAt(0)?.toUpperCase() || '';
  const last = lastName?.charAt(0)?.toUpperCase() || '';
  return first + last;
}

/**
 * Get avatar color class based on string (for consistent colors)
 */
export function getAvatarColorClass(str: string): string {
  const colors = [
    'from-orange-400 to-red-500',
    'from-indigo-400 to-purple-500',
    'from-teal-400 to-cyan-500',
    'from-pink-400 to-rose-500',
    'from-amber-400 to-yellow-500',
    'from-green-400 to-emerald-500',
    'from-blue-400 to-indigo-500',
    'from-violet-400 to-purple-500',
  ];
  
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

/**
 * Determine event color based on date (past/present/future)
 */
export function getEventColor(eventDate: Date): 'green' | 'blue' | 'purple' {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const compareDate = new Date(eventDate);
  compareDate.setHours(0, 0, 0, 0);

  if (compareDate < today) return 'green'; // past
  if (compareDate.getTime() === today.getTime()) return 'blue'; // today
  return 'purple'; // future
}
