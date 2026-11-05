import { Detector, DetectionSpan } from '../types/pii.types';
import { isValidIpv4 } from './validators';

/**
 * IPv4 address detector.
 *
 * Matches dotted-quad candidates and validates each octet is 0-255. Match-only.
 * IPv6 is intentionally out of scope for this phase (see README limitations).
 */
// Right boundary `(?!\.?\d)` allows a trailing sentence period but rejects a
// 5th dotted group (so "1.2.3.4.5" is not matched as "1.2.3.4").
const IPV4_PATTERN =
  /(?<![\d.])(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})(?!\.?\d)/g;

export const ipAddressDetector: Detector = {
  entityType: 'IP_ADDRESS',
  detect(text: string): DetectionSpan[] {
    const spans: DetectionSpan[] = [];

    for (const match of text.matchAll(IPV4_PATTERN)) {
      const value = match[0];
      const start = match.index;
      const o1 = match[1];
      const o2 = match[2];
      const o3 = match[3];
      const o4 = match[4];
      if (
        value === undefined ||
        start === undefined ||
        o1 === undefined ||
        o2 === undefined ||
        o3 === undefined ||
        o4 === undefined
      ) {
        continue;
      }
      if (!isValidIpv4([o1, o2, o3, o4])) {
        continue;
      }

      spans.push({
        entityType: 'IP_ADDRESS',
        value,
        start,
        end: start + value.length,
      });
    }

    return spans;
  },
};
