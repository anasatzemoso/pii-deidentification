import { deidentify } from '../src/services/redaction.service';

describe('deidentify (orchestration)', () => {
  it('leaves text with no PII unchanged', () => {
    const result = deidentify({ text: 'hello world' });
    expect(result.deidentifiedText).toBe('hello world');
    expect(result.spans).toEqual([]);
    expect(result.entitiesDetected).toEqual({});
  });

  it('detects and replaces multiple entity types with counts', () => {
    const result = deidentify({
      text: 'Contact john@example.com or 123-45-6789',
    });
    expect(result.deidentifiedText).toBe('Contact [EMAIL] or [SSN]');
    expect(result.entitiesDetected).toEqual({ EMAIL: 1, SSN: 1 });
    expect(result.spans).toHaveLength(2);
  });

  it('honors entity selection', () => {
    const result = deidentify(
      { text: 'Contact john@example.com or 123-45-6789' },
      { entities: ['EMAIL'] },
    );
    expect(result.deidentifiedText).toBe('Contact [EMAIL] or 123-45-6789');
    expect(result.entitiesDetected).toEqual({ EMAIL: 1 });
  });

  it('counts repeated occurrences of a single entity type', () => {
    const result = deidentify({ text: 'a@b.com and c@d.com' });
    expect(result.deidentifiedText).toBe('[EMAIL] and [EMAIL]');
    expect(result.entitiesDetected).toEqual({ EMAIL: 2 });
  });

  it('counts multiple entity types with mixed occurrences', () => {
    const result = deidentify({
      text: 'a@b.com x@y.com 123-45-6789',
    });
    expect(result.entitiesDetected).toEqual({ EMAIL: 2, SSN: 1 });
  });

  it('returns an empty object when nothing is detected', () => {
    expect(
      deidentify({ text: 'nothing to see here' }).entitiesDetected,
    ).toEqual({});
  });

  it('returns an empty object when entity selection is empty', () => {
    const result = deidentify({ text: 'a@b.com' }, { entities: [] });
    expect(result.deidentifiedText).toBe('a@b.com');
    expect(result.entitiesDetected).toEqual({});
  });

  it('replaces PHONE with [PHONE] and counts it', () => {
    const result = deidentify({ text: 'call 123-456-7890' });
    expect(result.deidentifiedText).toBe('call [PHONE]');
    expect(result.entitiesDetected).toEqual({ PHONE: 1 });
  });

  it('replaces CREDIT_CARD with [CREDIT_CARD] and counts it', () => {
    const result = deidentify({ text: 'card 4111 1111 1111 1111' });
    expect(result.deidentifiedText).toBe('card [CREDIT_CARD]');
    expect(result.entitiesDetected).toEqual({ CREDIT_CARD: 1 });
  });

  it('replaces DATE_OF_BIRTH with [DATE_OF_BIRTH] and counts it', () => {
    const result = deidentify({ text: 'dob 1990-05-21' });
    expect(result.deidentifiedText).toBe('dob [DATE_OF_BIRTH]');
    expect(result.entitiesDetected).toEqual({ DATE_OF_BIRTH: 1 });
  });

  it('matches the assessment example end to end', () => {
    const result = deidentify({
      text:
        'Patient John Doe can be contacted at john.doe@example.com or ' +
        '+1-415-555-0134. DOB: 1990-05-12.',
    });
    expect(result.deidentifiedText).toBe(
      'Patient John Doe can be contacted at [EMAIL] or [PHONE]. DOB: [DATE_OF_BIRTH].',
    );
    expect(result.entitiesDetected).toEqual({
      EMAIL: 1,
      PHONE: 1,
      DATE_OF_BIRTH: 1,
    });
  });

  it('does not treat an ordinary (non-DOB) date as DATE_OF_BIRTH', () => {
    const result = deidentify({ text: 'Invoice date: 05/21/1990' });
    expect(result.deidentifiedText).toBe('Invoice date: 05/21/1990');
    expect(result.entitiesDetected).toEqual({});
  });
});
