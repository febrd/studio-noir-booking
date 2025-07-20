
// WITA timezone utilities - WITA is UTC+8 (Central Indonesia Time)

/**
 * Converts a datetime-local input value to WITA display format
 * Input: "2025-07-20T08:00" (from datetime-local input)
 * Output: "2025-07-20T08:00" (treating as WITA time)
 */
export const formatDatetimeLocalWITA = (dateTimeString: string): string => {
  if (!dateTimeString) return '';
  
  // The datetime-local input already gives us the local time
  // We just need to ensure it's formatted correctly
  return dateTimeString;
};

/**
 * Converts WITA datetime string to UTC for database storage
 * Input: "2025-07-20T08:00" (WITA time)
 * Output: UTC Date object (2025-07-20T00:00:00.000Z)
 */
export const parseWITAToUTC = (witaDateTimeString: string): Date => {
  if (!witaDateTimeString) return new Date();
  
  // Create date treating the input as WITA time
  const date = new Date(witaDateTimeString);
  
  // Convert WITA (UTC+8) to UTC by subtracting 8 hours
  const utcDate = new Date(date.getTime() - (8 * 60 * 60 * 1000));
  
  return utcDate;
};

/**
 * Converts UTC datetime from database to WITA for display
 * Input: "2025-07-20T00:00:00.000Z" (UTC from database)
 * Output: "20/07/2025 08:00" (WITA display format)
 */
export const formatDateTimeWITA = (utcDateTimeString: string): string => {
  if (!utcDateTimeString) return '';
  
  // Parse UTC datetime and convert to WITA by adding 8 hours
  const utcDate = new Date(utcDateTimeString);
  const witaDate = new Date(utcDate.getTime() + (8 * 60 * 60 * 1000));
  
  return witaDate.toLocaleString('id-ID', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

/**
 * Converts UTC datetime from database to datetime-local format for editing
 * Input: "2025-07-20T00:00:00.000Z" (UTC from database)
 * Output: "2025-07-20T08:00" (for datetime-local input)
 */
export const formatUTCToDatetimeLocal = (utcDateTimeString: string): string => {
  if (!utcDateTimeString) return '';
  
  // Parse UTC and convert to WITA for editing
  const utcDate = new Date(utcDateTimeString);
  const witaDate = new Date(utcDate.getTime() + (8 * 60 * 60 * 1000));
  
  // Format for datetime-local input
  const year = witaDate.getFullYear();
  const month = String(witaDate.getMonth() + 1).padStart(2, '0');
  const day = String(witaDate.getDate()).padStart(2, '0');
  const hours = String(witaDate.getHours()).padStart(2, '0');
  const minutes = String(witaDate.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Formats time only in WITA
 * Input: "2025-07-20T00:00:00.000Z" (UTC from database)
 * Output: "08:00" (WITA time only)
 */
export const formatTimeWITA = (utcDateTimeString: string): string => {
  if (!utcDateTimeString) return '';
  
  const utcDate = new Date(utcDateTimeString);
  const witaDate = new Date(utcDate.getTime() + (8 * 60 * 60 * 1000));
  
  return witaDate.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};
