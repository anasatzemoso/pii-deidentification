import {
  DetectionSpan,
  EntityCounts,
  EntityType,
  RedactionRequest,
  RedactionResult,
} from '../types/pii.types';
import { detectorRegistry } from '../detectors/detector.registry';
import { resolveMatches } from './resolver.service';
import { replaceMatches } from './replacer.service';

/** Optional orchestration controls (kept out of the HTTP-facing contract). */
export interface DeidentifyOptions {
  /** When provided, only these entity types are detected. */
  entities?: EntityType[];
}

/**
 * Orchestration (domain entry point).
 *
 * Runs the selected detectors, resolves overlaps/duplicates, replaces matches
 * with tokens, and reports which entity types were detected. This module is
 * the single public entry point into the PII domain and is independent of
 * Express/HTTP.
 */
export function deidentify(
  request: RedactionRequest,
  options: DeidentifyOptions = {},
): RedactionResult {
  const { text } = request;
  const selected = options.entities;

  const detectors = selected
    ? detectorRegistry.filter((d) => selected.includes(d.entityType))
    : detectorRegistry;

  const rawSpans: DetectionSpan[] = [];
  for (const detector of detectors) {
    for (const span of detector.detect(text)) {
      rawSpans.push(span);
    }
  }

  const spans = resolveMatches(rawSpans);
  const deidentifiedText = replaceMatches(text, spans);

  // Count occurrences of each entity type among the final resolved spans
  // (rejected overlap candidates are not counted). Only types with at least
  // one replacement appear; no detections yields {}.
  const entitiesDetected: EntityCounts = {};
  for (const span of spans) {
    entitiesDetected[span.entityType] =
      (entitiesDetected[span.entityType] ?? 0) + 1;
  }

  return { deidentifiedText, spans, entitiesDetected };
}
