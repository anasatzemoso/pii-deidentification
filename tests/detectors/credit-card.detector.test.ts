import { creditCardDetector } from '../../src/detectors/credit-card.detector';

const values = (text: string): string[] =>
  creditCardDetector.detect(text).map((s) => s.value);

describe('creditCardDetector', () => {
  it('exposes entityType CREDIT_CARD', () => {
    expect(creditCardDetector.entityType).toBe('CREDIT_CARD');
  });

  it('detects spaced, hyphenated and bare 16-digit Luhn-valid numbers', () => {
    expect(values('4111 1111 1111 1111')).toEqual(['4111 1111 1111 1111']);
    expect(values('4111-1111-1111-1111')).toEqual(['4111-1111-1111-1111']);
    expect(values('4111111111111111')).toEqual(['4111111111111111']);
  });

  it('detects a 15-digit Amex Luhn-valid number', () => {
    expect(values('378282246310005')).toEqual(['378282246310005']);
  });

  it('rejects Luhn-invalid candidates', () => {
    expect(values('4111 1111 1111 1112')).toEqual([]);
    expect(values('1234 5678 9012 3456')).toEqual([]);
  });

  it('detects a card immediately following a hyphen (regression)', () => {
    expect(creditCardDetector.detect('ref-4111111111111111')).toEqual([
      {
        entityType: 'CREDIT_CARD',
        value: '4111111111111111',
        start: 4,
        end: 20,
      },
    ]);
  });

  it('does not partial-match inside a longer hyphen-separated digit run', () => {
    expect(values('1111-2222-3333-4444-5555')).toEqual([]);
  });

  it('does not extract a Luhn-valid suffix after a digit-group separator', () => {
    expect(values('1234-4111111111111111')).toEqual([]);
  });

  it('ignores numbers that are too short to be a card', () => {
    expect(values('1234567890')).toEqual([]); // 10 digits
    expect(values('123456789')).toEqual([]); // 9 digits
  });

  it('returns empty for empty input', () => {
    expect(values('')).toEqual([]);
  });

  it('guarantees value === text.slice(start, end)', () => {
    for (const s of creditCardDetector.detect('card 4111 1111 1111 1111 ok')) {
      expect('card 4111 1111 1111 1111 ok'.slice(s.start, s.end)).toBe(s.value);
    }
  });
});
