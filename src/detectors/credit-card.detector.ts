import { Detector, DetectionSpan } from '../types/pii.types';
import { luhn } from './validators';

/**
 * Credit-card detector.
 *
 * Matches 13-19 digit sequences with optional single space/hyphen separators
 * between digits, then requires a valid Luhn checksum. Match-only. The digit
 * length range keeps it distinct from phone (10) and SSN (9) candidates.
 */
// Left boundary: never start right after a digit, nor after a digit-group
// separator hyphen (`\d-`). A hyphen preceded by a non-digit (e.g. "ref-4111…")
// is allowed, so such cards are detected. Right boundary unchanged.
const CREDIT_CARD_PATTERN = /(?<!\d)(?<!\d-)\d(?:[ -]?\d){12,18}(?![\d-])/g;

export const creditCardDetector: Detector = {
  entityType: 'CREDIT_CARD',
  detect(text: string): DetectionSpan[] {
    const spans: DetectionSpan[] = [];

    for (const match of text.matchAll(CREDIT_CARD_PATTERN)) {
      const value = match[0];
      const start = match.index;
      if (value === undefined || start === undefined) {
        continue;
      }
      const digits = value.replace(/\D/g, '');
      if (digits.length < 13 || digits.length > 19) {
        continue;
      }
      if (!luhn(digits)) {
        continue;
      }

      spans.push({
        entityType: 'CREDIT_CARD',
        value,
        start,
        end: start + value.length,
      });
    }

    return spans;
  },
};
