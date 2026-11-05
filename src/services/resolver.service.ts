import { DetectionSpan } from '../types/pii.types';
import { entityPriority } from '../config/pii.config';

/** Half-open interval overlap test. Touching spans ([0,5) and [5,9)) do not overlap. */
function overlaps(a: DetectionSpan, b: DetectionSpan): boolean {
  return a.start < b.end && b.start < a.end;
}

/**
 * Resolves raw spans from all detectors into a clean, non-overlapping set.
 *
 * Strategy: consider spans in order of entity priority (highest first), then
 * longer spans, then earlier start. Greedily accept a span only if it does not
 * overlap any already-accepted span. This removes duplicates and resolves
 * overlaps deterministically in favor of the higher-priority entity. The
 * result is returned sorted by start index.
 */
export function resolveMatches(spans: DetectionSpan[]): DetectionSpan[] {
  const ordered = [...spans].sort((a, b) => {
    const priorityDelta =
      entityPriority[b.entityType] - entityPriority[a.entityType];
    if (priorityDelta !== 0) {
      return priorityDelta;
    }
    const lengthDelta = b.end - b.start - (a.end - a.start);
    if (lengthDelta !== 0) {
      return lengthDelta;
    }
    return a.start - b.start;
  });

  const accepted: DetectionSpan[] = [];
  for (const span of ordered) {
    if (!accepted.some((existing) => overlaps(existing, span))) {
      accepted.push(span);
    }
  }

  accepted.sort((a, b) => a.start - b.start || a.end - b.end);
  return accepted;
}
