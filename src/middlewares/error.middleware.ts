import { NextFunction, Request, Response } from 'express';

/**
 * Centralized error-handling middleware.
 *
 * Honors an error's own HTTP status when present (e.g. a 400 from the JSON body
 * parser) and otherwise returns a generic 500. To avoid leaking sensitive data
 * it never logs the request body or any raw input text.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // `next` is required for Express to recognize this as an error handler.
  _next: NextFunction,
): void {
  const candidate = err as { status?: unknown; statusCode?: unknown };
  const status =
    typeof candidate?.status === 'number'
      ? candidate.status
      : typeof candidate?.statusCode === 'number'
        ? candidate.statusCode
        : 500;

  // Log only a fixed classification and the HTTP status. Never log err.message,
  // the error object, the request body, or a stack trace: a JSON parse error's
  // message can embed a fragment of the raw body, which may contain PII.
  console.error(`[error] request failed; status=${status}`);

  res.status(status).json({
    status: 'error',
    message:
      status === 400 ? 'Invalid request body.' : 'Internal server error.',
  });
}
