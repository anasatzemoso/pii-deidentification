/**
 * Shared, pure validation helpers used by detectors.
 *
 * These validate already-extracted candidate values. They contain no regex
 * scanning or span logic and no I/O, so they are trivially unit-testable.
 */

/** Luhn checksum validation for a string of digits (used by credit cards). */
export function luhn(digits: string): boolean {
  if (digits.length === 0 || !/^\d+$/.test(digits)) {
    return false;
  }
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (double) {
      d *= 2;
      if (d > 9) {
        d -= 9;
      }
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/** True when year/month/day form a real calendar date (handles leap years). */
export function isValidCalendarDate(
  year: number,
  month: number,
  day: number,
): boolean {
  if (!Number.isInteger(year) || !Number.isInteger(month)) {
    return false;
  }
  if (!Number.isInteger(day) || month < 1 || month > 12 || day < 1) {
    return false;
  }
  const daysInMonth = [
    31,
    isLeapYear(year) ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  const max = daysInMonth[month - 1];
  return max !== undefined && day <= max;
}

/**
 * Validates US SSN parts against well-known structural rules:
 * area != 000, 666, 900-999; group != 00; serial != 0000.
 */
export function isValidSsn(
  area: string,
  group: string,
  serial: string,
): boolean {
  const a = Number(area);
  const g = Number(group);
  const s = Number(serial);
  if (a === 0 || a === 666 || a >= 900) {
    return false;
  }
  if (g === 0 || s === 0) {
    return false;
  }
  return true;
}

/** Validates four IPv4 octet strings, each in the range 0-255. */
export function isValidIpv4(octets: string[]): boolean {
  if (octets.length !== 4) {
    return false;
  }
  return octets.every((o) => {
    if (!/^\d{1,3}$/.test(o)) {
      return false;
    }
    const n = Number(o);
    return n >= 0 && n <= 255;
  });
}
