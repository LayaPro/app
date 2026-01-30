/**
 * Formats a Date object to YYYY-MM-DD string in local timezone
 */
export const formatDateLocal = (date: Date): string => {
  return date.getFullYear() + '-' + 
         String(date.getMonth() + 1).padStart(2, '0') + '-' + 
         String(date.getDate()).padStart(2, '0');
};

/**
 * Formats a Date object to HH:MM string in local timezone
 */
export const formatTimeLocal = (date: Date): string => {
  return String(date.getHours()).padStart(2, '0') + ':' + 
         String(date.getMinutes()).padStart(2, '0');
};

/**
 * Calculates end date and time from start date, time, and duration
 * @param fromDate - Start date in YYYY-MM-DD format
 * @param fromTime - Start time in HH:MM format
 * @param durationHours - Duration in hours
 * @returns Object with toDate (YYYY-MM-DD) and toTime (HH:MM) in local timezone
 */
export const calculateEndDateTime = (
  fromDate: string,
  fromTime: string,
  durationHours: number
): { toDate: string; toTime: string } => {
  const fromDateTime = new Date(`${fromDate}T${fromTime || '00:00'}`);
  const toDateTime = new Date(fromDateTime.getTime() + durationHours * 60 * 60 * 1000);
  
  return {
    toDate: formatDateLocal(toDateTime),
    toTime: formatTimeLocal(toDateTime)
  };
};
