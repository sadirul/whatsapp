const TZ = 'Asia/Kolkata';

/**
 * Format a date/timestamp for display in IST.
 * @param {string|Date|number} d - ISO string, Date object, or unix timestamp (seconds)
 * @param {boolean} isUnix - true if d is a unix timestamp in seconds
 */
export function formatDate(d, { isUnix = false, includeSeconds = false } = {}) {
  if (!d) return '-';
  const date = isUnix ? new Date(d * 1000) : new Date(d);
  return date.toLocaleString('en-IN', {
    timeZone: TZ,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...(includeSeconds && { second: '2-digit' }),
    hour12: true,
  });
}

/**
 * Format a WhatsApp message timestamp (unix seconds) for display in IST.
 */
export function formatMessageTime(ts) {
  if (!ts) return '';
  const d = new Date(ts * 1000);
  const now = new Date();
  const diff = now - d;
  if (diff < 86400000) {
    return d.toLocaleTimeString('en-IN', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: true });
  }
  if (diff < 604800000) {
    return d.toLocaleDateString('en-IN', { timeZone: TZ, weekday: 'short' });
  }
  return d.toLocaleDateString('en-IN', { timeZone: TZ, month: 'short', day: 'numeric' });
}

/**
 * Convert a Date to the value string needed for <input type="datetime-local"> in IST.
 */
export function toISTInputValue(date = new Date()) {
  const ist = new Date(date.toLocaleString('en-US', { timeZone: TZ }));
  const pad = (n) => String(n).padStart(2, '0');
  return `${ist.getFullYear()}-${pad(ist.getMonth() + 1)}-${pad(ist.getDate())}T${pad(ist.getHours())}:${pad(ist.getMinutes())}`;
}

/**
 * Parse a datetime-local input value (in IST) to a UTC ISO string.
 */
export function fromISTInputValue(localStr) {
  if (!localStr) return null;
  const [datePart, timePart] = localStr.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);
  // Build a Date using IST offset (+5:30 = 330 minutes)
  const utcMs = Date.UTC(year, month - 1, day, hour, minute) - 330 * 60 * 1000;
  return new Date(utcMs).toISOString();
}
