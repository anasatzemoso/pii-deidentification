import { NextFunction, Request, Response } from 'express';
import { detectorRegistry } from '../detectors/detector.registry';

/** Runtime set of supported entity type names, derived from the registry. */
const SUPPORTED_ENTITIES = new Set<string>(
  detectorRegistry.map((d) => d.entityType),
);

/**
 * Validates the POST /deidentify request body.
 *
 * Rules:
 *  - `text` is required and must be a non-empty string.
 *  - `entities` is optional; when present it must be an array of supported
 *    entity-type names.
 *
 * On failure it responds with 400 and never echoes the input text or PII.
 */
export function validateDeidentifyRequest(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const body: unknown = req.body;

  if (typeof body !== 'object' || body === null) {
    res.status(400).json({
      status: 'error',
      message: 'Request body must be a JSON object.',
    });
    return;
  }

  const { text, entities } = body as Record<string, unknown>;

  if (typeof text !== 'string' || text.length === 0) {
    res.status(400).json({
      status: 'error',
      message: 'Field "text" is required and must be a non-empty string.',
    });
    return;
  }

  if (entities !== undefined) {
    const valid =
      Array.isArray(entities) &&
      entities.every((e) => typeof e === 'string' && SUPPORTED_ENTITIES.has(e));
    if (!valid) {
      res.status(400).json({
        status: 'error',
        message: 'Field "entities" must be an array of supported entity types.',
      });
      return;
    }
  }

  next();
}
