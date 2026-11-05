import { Request, Response } from 'express';
import { deidentify } from '../services/redaction.service';
import { EntityType } from '../types/pii.types';

/**
 * HTTP controller for POST /deidentify.
 *
 * Assumes the request has passed validation middleware. It maps the HTTP body
 * to a domain call and shapes the response. The public response exposes only
 * `deidentifiedText` and `entitiesDetected`; the internal detection spans
 * (offsets and raw matched values) are deliberately kept inside the domain
 * pipeline and never serialised to the client.
 */
export function deidentifyHandler(req: Request, res: Response): void {
  const body = req.body as { text: string; entities?: EntityType[] };

  const result = deidentify({ text: body.text }, { entities: body.entities });

  res.status(200).json({
    deidentifiedText: result.deidentifiedText,
    entitiesDetected: result.entitiesDetected,
  });
}
