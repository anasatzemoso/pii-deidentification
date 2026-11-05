import { dobDetector } from '../../src/detectors/dob.detector';

const values = (text: string): string[] =>
  dobDetector.detect(text).map((s) => s.value);

describe('dobDetector', () => {
  it('exposes entityType DATE_OF_BIRTH', () => {
    expect(dobDetector.entityType).toBe('DATE_OF_BIRTH');
  });

  describe('detects dates only in an explicit DOB context', () => {
    it('DOB: ISO date', () => {
      expect(values('DOB: 1990-05-21')).toEqual(['1990-05-21']);
    });

    it('D.O.B.: numeric date', () => {
      expect(values('D.O.B.: 05/21/1990')).toEqual(['05/21/1990']);
    });

    it('Date of Birth: month-first textual date', () => {
      expect(values('Date of Birth: May 21, 1990')).toEqual(['May 21, 1990']);
    });

    it('Born: day-first textual date', () => {
      expect(values('Born: 21 May 1990')).toEqual(['21 May 1990']);
    });

    it('Born on (no colon)', () => {
      expect(values('Born on 1990-05-21')).toEqual(['1990-05-21']);
    });

    it('context cue is case-insensitive', () => {
      expect(values('dob: 1990-05-21')).toEqual(['1990-05-21']);
    });

    it('preserves all numeric separators within context', () => {
      expect(values('DOB: 5-21-1990')).toEqual(['5-21-1990']);
      expect(values('DOB: 05.21.1990')).toEqual(['05.21.1990']);
    });
  });

  describe('does NOT detect bare or non-DOB dates', () => {
    it('bare ISO date', () => {
      expect(values('1990-05-21')).toEqual([]);
    });

    it('bare numeric date', () => {
      expect(values('05/21/1990')).toEqual([]);
    });

    it('bare textual dates', () => {
      expect(values('May 21, 1990')).toEqual([]);
      expect(values('21 May 1990')).toEqual([]);
    });

    it('invoice date', () => {
      expect(values('Invoice date: 05/21/1990')).toEqual([]);
    });

    it('appointment date', () => {
      expect(values('Appointment date: 2020-01-15')).toEqual([]);
    });

    it('a "meeting on <date>" phrase (the word "on" alone is not a cue)', () => {
      expect(values('Meeting on 2020-01-15')).toEqual([]);
    });
  });

  describe('preserves calendar + plausible-year validation within context', () => {
    it('rejects impossible or implausible dates even with a DOB cue', () => {
      expect(values('DOB: 2020-13-01')).toEqual([]); // month 13
      expect(values('DOB: 02/30/1990')).toEqual([]); // Feb 30
      expect(values('DOB: 01/01/1800')).toEqual([]); // year < 1900
      expect(values('DOB: 01/01/3000')).toEqual([]); // future year
    });

    it('accepts a valid leap day (2000-02-29)', () => {
      expect(values('DOB: 2000-02-29')).toEqual(['2000-02-29']);
    });

    it('rejects an invalid leap day (1900-02-29)', () => {
      expect(values('DOB: 1900-02-29')).toEqual([]);
    });
  });

  it('returns empty for empty or non-date input', () => {
    expect(values('')).toEqual([]);
    expect(values('no date here')).toEqual([]);
  });

  it('guarantees value === text.slice(start, end)', () => {
    const text = 'DOB: 1990-05-21 and born on May 21, 1990';
    const spans = dobDetector.detect(text);
    expect(spans.length).toBeGreaterThan(0);
    for (const s of spans) {
      expect(text.slice(s.start, s.end)).toBe(s.value);
    }
  });
});
