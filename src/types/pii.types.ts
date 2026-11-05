/**
 * Shared domain types for the PII de-identification service.
 *
 * These are contracts only. No detection or redaction logic lives here.
 */

/** Categories of PII the service is intended to handle. */
export type EntityType =
  'EMAIL' | 'PHONE' | 'SSN' | 'DATE_OF_BIRTH' | 'CREDIT_CARD' | 'IP_ADDRESS';

/**
 * A single detected PII occurrence within a source string.
 *
 * `start` is the inclusive index of the first character of the match and
 * `end` is the exclusive index just past the last character, matching the
 * semantics of `String.prototype.slice(start, end)`.
 */
export interface DetectionSpan {
  entityType: EntityType;
  value: string;
  start: number;
  end: number;
}

/**
 * A detector locates occurrences of a single PII type within text.
 * Implementations are added in a later phase.
 */
export interface Detector {
  entityType: EntityType;
  detect(text: string): DetectionSpan[];
}

/** Input to the de-identification domain service. */
export interface RedactionRequest {
  text: string;
}

/** Occurrence count per entity type (only types with at least one match). */
export type EntityCounts = Partial<Record<EntityType, number>>;

/** Output of the de-identification domain service. */
export interface RedactionResult {
  deidentifiedText: string;
  spans: DetectionSpan[];
  /** Count of replaced occurrences per detected entity type (resolved spans). */
  entitiesDetected: EntityCounts;
}
