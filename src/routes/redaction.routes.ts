import { Router } from 'express';
import { deidentifyHandler } from '../controllers/redaction.controller';
import { validateDeidentifyRequest } from '../middlewares/validation.middleware';

/**
 * Routes for the de-identification feature.
 *
 * Request validation runs before the controller; detection/replacement logic
 * lives entirely in the domain services, not here.
 */
const router = Router();

router.post('/deidentify', validateDeidentifyRequest, deidentifyHandler);

export default router;
