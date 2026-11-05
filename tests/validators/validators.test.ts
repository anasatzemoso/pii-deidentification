import {
  luhn,
  isValidCalendarDate,
  isValidSsn,
  isValidIpv4,
} from '../../src/detectors/validators';

describe('luhn', () => {
  it('accepts valid card numbers', () => {
    expect(luhn('4111111111111111')).toBe(true); // Visa test
    expect(luhn('378282246310005')).toBe(true); // Amex test
  });
  it('rejects invalid or non-numeric input', () => {
    expect(luhn('4111111111111112')).toBe(false);
    expect(luhn('')).toBe(false);
    expect(luhn('12a4')).toBe(false);
  });
});

describe('isValidCalendarDate', () => {
  it('accepts real dates including leap days', () => {
    expect(isValidCalendarDate(2020, 2, 29)).toBe(true);
    expect(isValidCalendarDate(1990, 12, 31)).toBe(true);
  });
  it('rejects impossible dates', () => {
    expect(isValidCalendarDate(2019, 2, 29)).toBe(false); // not a leap year
    expect(isValidCalendarDate(1990, 13, 1)).toBe(false);
    expect(isValidCalendarDate(1990, 4, 31)).toBe(false);
    expect(isValidCalendarDate(1990, 0, 10)).toBe(false);
  });
});

describe('isValidSsn', () => {
  it('accepts a structurally valid SSN', () => {
    expect(isValidSsn('123', '45', '6789')).toBe(true);
  });
  it('rejects reserved/invalid parts', () => {
    expect(isValidSsn('000', '45', '6789')).toBe(false);
    expect(isValidSsn('666', '45', '6789')).toBe(false);
    expect(isValidSsn('900', '45', '6789')).toBe(false);
    expect(isValidSsn('123', '00', '6789')).toBe(false);
    expect(isValidSsn('123', '45', '0000')).toBe(false);
  });
});

describe('isValidIpv4', () => {
  it('accepts four in-range octets', () => {
    expect(isValidIpv4(['192', '168', '1', '1'])).toBe(true);
    expect(isValidIpv4(['0', '0', '0', '0'])).toBe(true);
  });
  it('rejects out-of-range or wrong-count octets', () => {
    expect(isValidIpv4(['256', '1', '1', '1'])).toBe(false);
    expect(isValidIpv4(['1', '2', '3'])).toBe(false);
    expect(isValidIpv4(['1', '2', '3', '4', '5'])).toBe(false);
  });
});
