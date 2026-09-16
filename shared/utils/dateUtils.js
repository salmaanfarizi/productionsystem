/**
 * Date helpers
 */

/**
 * YYYY-MM-DD in the device's local time zone.
 * toISOString() gives the UTC date, which in Saudi Arabia (UTC+3)
 * is still yesterday between midnight and 3 AM.
 * @param {Date} date - Date to format (default: now)
 */
export function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
