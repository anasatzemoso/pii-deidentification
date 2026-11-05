import { Detector, DetectionSpan } from '../types/pii.types';
import { isValidCalendarDate } from './validators';

/**
 * Date-of-birth detector.
 *
 * Per the specification, DATE_OF_BIRTH matches only dates that appear in an
 * explicitly recognizable date-of-birth context (e.g. `DOB:`, `D.O.B.:`,
 * `Date of Birth:`, `Born:`, `Born on`). A date's semantic role cannot be
 * inferred from its value alone, so an ordinary date with no such cue (an
 * invoice date, an appointment date, etc.) is intentionally NOT matched.
 *
 * The context is required via a leading look-behind, so it is not consumed:
 * the reported span covers only the date, preserving the DetectionSpan
 * contract (value === text.slice(start, end)). The four supported date shapes
 * and all calendar/leap-year/plausible-year validation are unchanged.
 *
 * Supported shapes (each must follow a DOB context):
 *   - ISO:            1990-05-21
 *   - Numeric (US):   05/21/1990, 5-21-1990, 05.21.1990   (MM<sep>DD<sep>YYYY)
 *   - Textual:        May 21, 1990   /   21 May 1990
 */
const MIN_YEAR = 1900;
const MAX_YEAR = new Date().getFullYear();

const MONTHS: Record<string, number> = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
};

const MONTH_NAMES =
  'January|February|March|April|May|June|July|August|September|October|November|December';

/**
 * Required date-of-birth context immediately preceding the date. Matched as a
 * zero-width look-behind (not part of the reported span). Contains only
 * non-capturing groups so the date capture-group indices below are unchanged.
 * The `i` flag on each pattern makes the cue case-insensitive.
 */
const DOB_CONTEXT = String.raw`(?<=\b(?:DOB|D\.O\.B\.?|DATE\s+OF\s+BIRTH|BORN(?:\s+ON)?)\s*:?\s*)`;

const ISO_BODY = String.raw`(?<!\d)(\d{4})-(\d{2})-(\d{2})(?!\d)`;
const NUMERIC_BODY = String.raw`(?<!\d)(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})(?!\d)`;
const MONTH_FIRST_BODY = String.raw`(?<![A-Za-z])(${MONTH_NAMES})\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})(?!\d)`;
const DAY_FIRST_BODY = String.raw`(?<![A-Za-z])(\d{1,2})(?:st|nd|rd|th)?\s+(${MONTH_NAMES}),?\s+(\d{4})(?!\d)`;

const ISO_PATTERN = new RegExp(DOB_CONTEXT + ISO_BODY, 'gi');
const NUMERIC_PATTERN = new RegExp(DOB_CONTEXT + NUMERIC_BODY, 'gi');
const MONTH_FIRST_PATTERN = new RegExp(DOB_CONTEXT + MONTH_FIRST_BODY, 'gi');
const DAY_FIRST_PATTERN = new RegExp(DOB_CONTEXT + DAY_FIRST_BODY, 'gi');

function yearPlausible(year: number): boolean {
  return year >= MIN_YEAR && year <= MAX_YEAR;
}

export const dobDetector: Detector = {
  entityType: 'DATE_OF_BIRTH',
  detect(text: string): DetectionSpan[] {
    const spans: DetectionSpan[] = [];

    const add = (
      value: string | undefined,
      start: number | undefined,
      year: number,
      month: number,
      day: number,
    ): void => {
      if (value === undefined || start === undefined) {
        return;
      }
      if (!yearPlausible(year) || !isValidCalendarDate(year, month, day)) {
        return;
      }
      spans.push({
        entityType: 'DATE_OF_BIRTH',
        value,
        start,
        end: start + value.length,
      });
    };

    for (const m of text.matchAll(ISO_PATTERN)) {
      add(m[0], m.index, Number(m[1]), Number(m[2]), Number(m[3]));
    }
    for (const m of text.matchAll(NUMERIC_PATTERN)) {
      add(m[0], m.index, Number(m[3]), Number(m[1]), Number(m[2]));
    }
    for (const m of text.matchAll(MONTH_FIRST_PATTERN)) {
      const month = MONTHS[(m[1] ?? '').toLowerCase()];
      if (month === undefined) {
        continue;
      }
      add(m[0], m.index, Number(m[3]), month, Number(m[2]));
    }
    for (const m of text.matchAll(DAY_FIRST_PATTERN)) {
      const month = MONTHS[(m[2] ?? '').toLowerCase()];
      if (month === undefined) {
        continue;
      }
      add(m[0], m.index, Number(m[3]), month, Number(m[1]));
    }

    spans.sort((a, b) => a.start - b.start);
    return spans;
  },
};
