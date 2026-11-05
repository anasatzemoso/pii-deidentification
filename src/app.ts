import express, { Application, Request, Response } from 'express';
import redactionRoutes from './routes/redaction.routes';
import { errorHandler } from './middlewares/error.middleware';

/**
 * Builds and configures the Express application.
 *
 * Application wiring lives here; starting the HTTP listener is the
 * responsibility of `server.ts`.
 */
export function createApp(): Application {
  const app = express();

  app.use(express.json());

  // Health check.
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok' });
  });

  // Feature routes.
  app.use(redactionRoutes);

  // Centralized error handling (registered last).
  app.use(errorHandler);

  return app;
}
