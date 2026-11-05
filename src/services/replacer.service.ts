import { DetectionSpan } from '../types/pii.types';
import { replacementTokens } from '../config/pii.config';

/**
 * Replaces each span in `text` with its entity's replacement token.
 *
 * Expects a resolved (non-overlapping) span set, but defensively skips any span
 * that would overlap already-consumed text. Text outside spans — including
 * Unicode and newline characters — is preserved exactly.
 */
export function replaceMatches(text: string, spans: DetectionSpan[]): string {
  if (spans.length === 0) {
    return text;
  }

  const ordered = [...spans].sort((a, b) => a.start - b.start || a.end - b.end);

  let result = '';
  let cursor = 0;
  for (const span of ordered) {
    if (span.start < cursor) {
      continue;
    }
    result += text.slice(cursor, span.start);
    result += replacementTokens[span.entityType];
    cursor = span.end;
  }
  result += text.slice(cursor);

  return result;
}
