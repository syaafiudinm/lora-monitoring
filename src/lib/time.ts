/**
 * Time utilities that preserve the original timezone from ISO strings
 * instead of converting to the browser's local timezone.
 *
 * Firebase data stores timestamps like "2026-02-26T04:52:57+07:00"
 * and we want to display "04:52" — not whatever the browser's TZ gives us.
 */

/**
 * Extract HH:MM from an ISO 8601 string, preserving the original timezone.
 *
 * Example: "2026-02-26T04:52:57+07:00" → "04:52"
 *
 * Falls back to timestamp_epoch (converted to UTC) if ISO string is missing/invalid.
 */
export function formatIsoTime(
  isoString?: string,
  epochSeconds?: number,
): string {
  if (isoString) {
    const match = isoString.match(/T(\d{2}):(\d{2})/);
    if (match) {
      return `${match[1]}:${match[2]}`;
    }
  }

  if (epochSeconds !== undefined) {
    const date = new Date(epochSeconds * 1000);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return "—";
}

/**
 * Extract a full date-time string from an ISO 8601 string, preserving the
 * original timezone.
 *
 * Example: "2026-02-26T04:52:57+07:00" → "26/02/2026, 04:52:57"
 *
 * Falls back to timestamp_epoch (browser local) if ISO string is missing/invalid.
 */
export function formatIsoDateTime(
  isoString?: string,
  epochSeconds?: number,
): string {
  if (isoString) {
    // Match: YYYY-MM-DDTHH:MM:SS
    const match = isoString.match(
      /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/,
    );
    if (match) {
      const [, year, month, day, hours, minutes, seconds] = match;
      return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
    }
  }

  if (epochSeconds !== undefined) {
    return new Date(epochSeconds * 1000).toLocaleString();
  }

  return "—";
}

/**
 * Extract a short date-time string from an ISO 8601 string, preserving the
 * original timezone. Useful for day/week range chart labels.
 *
 * Example: "2026-02-26T04:52:57+07:00" → "26/02 04:52"
 *
 * Falls back to timestamp_epoch (browser local) if ISO string is missing/invalid.
 */
export function formatIsoDateShort(
  isoString?: string,
  epochSeconds?: number,
): string {
  if (isoString) {
    const match = isoString.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
    if (match) {
      const [, , month, day, hours, minutes] = match;
      return `${day}/${month} ${hours}:${minutes}`;
    }
  }

  if (epochSeconds !== undefined) {
    const date = new Date(epochSeconds * 1000);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day}/${month} ${hours}:${minutes}`;
  }

  return "—";
}

/**
 * Extract the hour (0–23) from an ISO string, preserving original timezone.
 * Falls back to epoch-based extraction.
 */
export function extractIsoHour(
  isoString?: string,
  epochSeconds?: number,
): number {
  if (isoString) {
    const match = isoString.match(/T(\d{2}):/);
    if (match) return parseInt(match[1], 10);
  }
  if (epochSeconds !== undefined) {
    return new Date(epochSeconds * 1000).getHours();
  }
  return 0;
}

/**
 * Extract the date part "YYYY-MM-DD" from an ISO string, preserving original timezone.
 * Falls back to epoch-based extraction.
 */
export function extractIsoDate(
  isoString?: string,
  epochSeconds?: number,
): string {
  if (isoString) {
    const match = isoString.match(/(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
  }
  if (epochSeconds !== undefined) {
    const d = new Date(epochSeconds * 1000);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  return "1970-01-01";
}

/**
 * Format a hour-range label like "04:00 – 05:00" from a given hour number.
 */
export function formatHourRange(hour: number): string {
  const start = String(hour).padStart(2, "0");
  const end = String((hour + 1) % 24).padStart(2, "0");
  return `${start}:00 – ${end}:00`;
}

/**
 * Format a day-range label like "26/02/2026" from a "YYYY-MM-DD" date string.
 */
export function formatDayRange(dateStr: string): string {
  const match = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, year, month, day] = match;
    return `${day}/${month}/${year}`;
  }
  return dateStr;
}

/**
 * Format a week-range label like "20/02 – 26/02" from a starting "YYYY-MM-DD" date string.
 */
export function formatWeekRange(startDateStr: string): string {
  const match = startDateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return startDateStr;
  const startDate = new Date(
    parseInt(match[1]),
    parseInt(match[2]) - 1,
    parseInt(match[3]),
  );
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);
  const sDay = String(startDate.getDate()).padStart(2, "0");
  const sMonth = String(startDate.getMonth() + 1).padStart(2, "0");
  const eDay = String(endDate.getDate()).padStart(2, "0");
  const eMonth = String(endDate.getMonth() + 1).padStart(2, "0");
  return `${sDay}/${sMonth} – ${eDay}/${eMonth}`;
}

/**
 * Get all unique hour slots from history records, sorted ascending.
 * Returns array of { hour, date } objects for window navigation.
 */
export interface TimeSlot {
  hour: number;
  date: string;
  label: string;
}

export function getHourSlots(
  records: { timestamp_iso?: string; timestamp_epoch: number }[],
): TimeSlot[] {
  const seen = new Set<string>();
  const slots: TimeSlot[] = [];
  for (const r of records) {
    const date = extractIsoDate(r.timestamp_iso, r.timestamp_epoch);
    const hour = extractIsoHour(r.timestamp_iso, r.timestamp_epoch);
    const key = `${date}-${hour}`;
    if (!seen.has(key)) {
      seen.add(key);
      slots.push({
        hour,
        date,
        label: `${formatDayRange(date)} ${formatHourRange(hour)}`,
      });
    }
  }
  slots.sort((a, b) => a.date.localeCompare(b.date) || a.hour - b.hour);
  return slots;
}

/**
 * Get all unique day slots from history records, sorted ascending.
 */
export function getDaySlots(
  records: { timestamp_iso?: string; timestamp_epoch: number }[],
): { date: string; label: string }[] {
  const seen = new Set<string>();
  const slots: { date: string; label: string }[] = [];
  for (const r of records) {
    const date = extractIsoDate(r.timestamp_iso, r.timestamp_epoch);
    if (!seen.has(date)) {
      seen.add(date);
      slots.push({ date, label: formatDayRange(date) });
    }
  }
  slots.sort((a, b) => a.date.localeCompare(b.date));
  return slots;
}

/**
 * Get all unique week slots from history records, sorted ascending.
 * Each week starts on Monday.
 */
export function getWeekSlots(
  records: { timestamp_iso?: string; timestamp_epoch: number }[],
): { startDate: string; label: string }[] {
  const seen = new Set<string>();
  const slots: { startDate: string; label: string }[] = [];
  for (const r of records) {
    const dateStr = extractIsoDate(r.timestamp_iso, r.timestamp_epoch);
    const match = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (!match) continue;
    const d = new Date(
      parseInt(match[1]),
      parseInt(match[2]) - 1,
      parseInt(match[3]),
    );
    // Get Monday of this week
    const dayOfWeek = d.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(d);
    monday.setDate(monday.getDate() + mondayOffset);
    const y = monday.getFullYear();
    const m = String(monday.getMonth() + 1).padStart(2, "0");
    const day = String(monday.getDate()).padStart(2, "0");
    const key = `${y}-${m}-${day}`;
    if (!seen.has(key)) {
      seen.add(key);
      slots.push({ startDate: key, label: formatWeekRange(key) });
    }
  }
  slots.sort((a, b) => a.startDate.localeCompare(b.startDate));
  return slots;
}
