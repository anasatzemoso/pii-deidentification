import { Detector, DetectionSpan } from '../types/pii.types';

/**
 * Phone-number detector.
 *
 * Targets North American Numbering Plan (NANP) 10-digit numbers with an
 * optional 1-3 digit country code, written with common separators (spaces,
 * dots, hyphens) and an optional parenthesized area code. Match-only.
 *
 *   (123) 456-7890   123-456-7890   123.456.7890   1234567890   +1 123 456 7890
 */
const PHONE_PATTERN =
  /(?<!\d)(?:\+\d{1,3}[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}(?!\d)/g;

export const phoneDetector: Detector = {
  entityType: 'PHONE',
  detect(text: string): DetectionSpan[] {
    const spans: DetectionSpan[] = [];

    for (const match of text.matchAll(PHONE_PATTERN)) {
      const value = match[0];
      const start = match.index;
      if (value === undefined || start === undefined) {
        continue;
      }
      // National number is 10 digits; allow 1-3 extra for a country code.
      const digitCount = value.replace(/\D/g, '').length;
      if (digitCount < 10 || digitCount > 13) {
        continue;
      }

      spans.push({
        entityType: 'PHONE',
        value,
        start,
        end: start + value.length,
      });
    }

    return spans;
  },
};
