import { createApp } from './app';
import { config } from './config/pii.config';

/**
 * HTTP server entry point.
 *
 * Responsible only for starting the listener; all application wiring is in
 * `app.ts`.
 */
const app = createApp();

app.listen(config.port, () => {
  console.log(`pii-deidentification-service listening on port ${config.port}`);
});
