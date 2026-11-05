import { ipAddressDetector } from '../../src/detectors/ip-address.detector';

const values = (text: string): string[] =>
  ipAddressDetector.detect(text).map((s) => s.value);

describe('ipAddressDetector', () => {
  it('exposes entityType IP_ADDRESS', () => {
    expect(ipAddressDetector.entityType).toBe('IP_ADDRESS');
  });

  it('detects valid IPv4 addresses', () => {
    expect(values('192.168.1.1')).toEqual(['192.168.1.1']);
    expect(values('10.0.0.255')).toEqual(['10.0.0.255']);
    expect(values('255.255.255.255')).toEqual(['255.255.255.255']);
  });

  it('excludes a trailing sentence period from the span', () => {
    expect(ipAddressDetector.detect('host 192.168.0.1.')).toEqual([
      { entityType: 'IP_ADDRESS', value: '192.168.0.1', start: 5, end: 16 },
    ]);
  });

  it('rejects out-of-range octets and malformed quads', () => {
    expect(values('256.1.1.1')).toEqual([]); // octet > 255
    expect(values('192.168.1')).toEqual([]); // only 3 octets
    expect(values('1.2.3.4.5')).toEqual([]); // 5 groups
  });

  it('returns empty for empty or non-IP input', () => {
    expect(values('')).toEqual([]);
    expect(values('version 2.0.1 build')).toEqual([]);
  });
});
