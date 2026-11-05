import { ssnDetector } from '../../src/detectors/ssn.detector';

const values = (text: string): string[] =>
  ssnDetector.detect(text).map((s) => s.value);

describe('ssnDetector', () => {
  it('exposes entityType SSN', () => {
    expect(ssnDetector.entityType).toBe('SSN');
  });

  it('detects hyphen, space and bare formats', () => {
    expect(values('123-45-6789')).toEqual(['123-45-6789']);
    expect(values('123 45 6789')).toEqual(['123 45 6789']);
    expect(values('123456789')).toEqual(['123456789']);
  });

  it('detects an SSN with exact span', () => {
    expect(ssnDetector.detect('SSN: 123-45-6789.')).toEqual([
      { entityType: 'SSN', value: '123-45-6789', start: 5, end: 16 },
    ]);
  });

  it('rejects structurally invalid SSNs', () => {
    expect(values('000-45-6789')).toEqual([]); // area 000
    expect(values('666-45-6789')).toEqual([]); // area 666
    expect(values('900-45-6789')).toEqual([]); // area 9xx
    expect(values('123-00-6789')).toEqual([]); // group 00
    expect(values('123-45-0000')).toEqual([]); // serial 0000
  });

  it('does not match inside a 10-digit phone number', () => {
    expect(values('1234567890')).toEqual([]);
  });

  it('does not detect a ZIP+4 as an SSN (regression)', () => {
    expect(values('12345-6789')).toEqual([]);
  });

  it('requires consistent separators across both gaps (regression)', () => {
    expect(values('123-456789')).toEqual([]); // hyphen only in first gap
    expect(values('123456-789')).toEqual([]); // separator in wrong position
  });

  it('returns empty for empty or non-SSN input', () => {
    expect(values('')).toEqual([]);
    expect(values('no ssn here')).toEqual([]);
  });
});
