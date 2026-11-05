import { Detector, DetectionSpan } from '../types/pii.types';
import { isValidSsn } from './validators';

/**
 * US Social Security Number detector.
 *
 * Matches the AAA-GG-SSSS shape with optional hyphen or space separators, then
 * applies structural SSN rules (see {@link isValidSsn}). Match-only. The
 * surrounding non-digit boundaries keep it from matching inside longer digit
 * runs (e.g. a 10-digit phone number).
 */
// Both separators must be identical (captured once as group 2 and backreferenced
// as `\2`): consistently hyphenated, consistently spaced, or neither. This
// rejects ZIP+4 (12345-6789), whose single hyphen sits only in the second gap.
const SSN_PATTERN = /(?<!\d)(\d{3})([-\s]?)(\d{2})\2(\d{4})(?!\d)/g;

export const ssnDetector: Detector = {
  entityType: 'SSN',
  detect(text: string): DetectionSpan[] {
    const spans: DetectionSpan[] = [];

    for (const match of text.matchAll(SSN_PATTERN)) {
      const value = match[0];
      const start = match.index;
      const area = match[1];
      const group = match[3];
      const serial = match[4];
      if (
        value === undefined ||
        start === undefined ||
        area === undefined ||
        group === undefined ||
        serial === undefined
      ) {
        continue;
      }
      if (!isValidSsn(area, group, serial)) {
        continue;
      }

      spans.push({
        entityType: 'SSN',
        value,
        start,
        end: start + value.length,
      });
    }

    return spans;
  },
};
