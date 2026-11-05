import { Detector } from '../types/pii.types';
import { emailDetector } from './email.detector';
import { phoneDetector } from './phone.detector';
import { ssnDetector } from './ssn.detector';
import { dobDetector } from './dob.detector';
import { creditCardDetector } from './credit-card.detector';
import { ipAddressDetector } from './ip-address.detector';

/**
 * Central list of available detectors.
 *
 * The orchestration service iterates this registry; adding a new PII type
 * means adding its detector here. No detection logic lives in this module.
 */
export const detectorRegistry: Detector[] = [
  emailDetector,
  phoneDetector,
  ssnDetector,
  dobDetector,
  creditCardDetector,
  ipAddressDetector,
];
