/**
 * Centralized runtime configuration.
 *
 * Only non-sensitive operational settings belong here. Raw input text and
 * detected PII values must never be stored or logged (see architectural rules).
 */

import dotenv from 'dotenv';
import { EntityType } from '../types/pii.types';

dotenv.config();

export interface AppConfig {
  port: number;
  nodeEnv: string;
}

export const config: AppConfig = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
};

/**
 * Relative priority between entity types. Higher wins when two spans overlap.
 * Values are spaced so new entities can be inserted without renumbering.
 */
export const entityPriority: Record<EntityType, number> = {
  SSN: 100,
  CREDIT_CARD: 90,
  EMAIL: 80,
  IP_ADDRESS: 70,
  PHONE: 60,
  DATE_OF_BIRTH: 50,
};

/** Replacement token substituted for each detected entity type. */
export const replacementTokens: Record<EntityType, string> = {
  EMAIL: '[EMAIL]',
  PHONE: '[PHONE]',
  SSN: '[SSN]',
  DATE_OF_BIRTH: '[DATE_OF_BIRTH]',
  CREDIT_CARD: '[CREDIT_CARD]',
  IP_ADDRESS: '[IP_ADDRESS]',
};
