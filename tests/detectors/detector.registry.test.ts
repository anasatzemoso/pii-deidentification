import { detectorRegistry } from '../../src/detectors/detector.registry';

describe('detector.registry', () => {
  it('registers one detector per supported entity type', () => {
    const types = detectorRegistry.map((d) => d.entityType);
    expect(types).toEqual([
      'EMAIL',
      'PHONE',
      'SSN',
      'DATE_OF_BIRTH',
      'CREDIT_CARD',
      'IP_ADDRESS',
    ]);
  });

  it('detectors return no spans for text containing no PII', () => {
    for (const detector of detectorRegistry) {
      expect(detector.detect('sample')).toEqual([]);
    }
  });
});
