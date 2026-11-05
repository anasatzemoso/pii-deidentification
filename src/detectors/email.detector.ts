import { Detector, DetectionSpan } from '../types/pii.types';

/**
 * Email detector.
 *
 * Finds email addresses with a pragmatic regular expression plus light custom
 * validation. This detector is match-only: it never replaces or redacts text,
 * and it deliberately does not attempt full RFC 5322 validation.
 *
 * Candidate shape: <local>@<label>(.<label>)*.<tld>
 *   - local: letters, digits and `. _ % + -` (supports dots and plus addressing)
 *   - domain: one or more dot-separated labels (supports subdomains)
 *   - tld: two or more letters
 *
 * The character classes exclude whitespace, newlines and common surrounding
 * punctuation (parentheses, commas, angle brackets, a trailing period), so
 * those are naturally left out of the matched span.
 */
const EMAIL_PATTERN =
  /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g;

/**
 * Rejects obviously invalid candidates that the pattern can still produce,
 * e.g. a local part with a leading/trailing dot or consecutive dots.
 */
function isValidEmailCandidate(candidate: string): boolean {
  const atIndex = candidate.indexOf('@');
  if (atIndex <= 0) {
    return false;
  }

  const local = candidate.slice(0, atIndex);
  const domain = candidate.slice(atIndex + 1);

  // Local part: bounded length, no leading/trailing or consecutive dots.
  if (local.length > 64) {
    return false;
  }
  if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) {
    return false;
  }

  // Domain: bounded length, must contain a dot, no consecutive dots.
  if (domain.length === 0 || domain.length > 255) {
    return false;
  }
  if (!domain.includes('.') || domain.includes('..')) {
    return false;
  }

  // Each domain label must not start or end with a hyphen (e.g. -bad, bad-).
  const labels = domain.split('.');
  if (labels.some((label) => label.startsWith('-') || label.endsWith('-'))) {
    return false;
  }

  return true;
}

export const emailDetector: Detector = {
  entityType: 'EMAIL',
  detect(text: string): DetectionSpan[] {
    const spans: DetectionSpan[] = [];

    for (const match of text.matchAll(EMAIL_PATTERN)) {
      const value = match[0];
      const start = match.index;
      if (value === undefined || start === undefined) {
        continue;
      }
      if (!isValidEmailCandidate(value)) {
        continue;
      }

      spans.push({
        entityType: 'EMAIL',
        value,
        start,
        end: start + value.length,
      });
    }

    return spans;
  },
};
