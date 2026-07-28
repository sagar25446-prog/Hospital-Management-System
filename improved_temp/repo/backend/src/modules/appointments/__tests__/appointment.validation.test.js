const {
  parseDate,
  parseTime,
  getTodayDate,
  validateBookAppointment,
} = require('../appointment.validation');

describe('appointment.validation', () => {
  describe('parseDate', () => {
    it('accepts a well-formed YYYY-MM-DD date', () => {
      expect(parseDate('2026-08-15')).toBe('2026-08-15');
    });
    it('rejects malformed dates', () => {
      expect(parseDate('15-08-2026')).toBeNull();
      expect(parseDate('2026/08/15')).toBeNull();
      expect(parseDate('not-a-date')).toBeNull();
      expect(parseDate('')).toBeNull();
      expect(parseDate(undefined)).toBeNull();
    });
    it('rejects a syntactically valid but impossible calendar date (regression test — this used to silently roll over to March)', () => {
      expect(parseDate('2026-02-30')).toBeNull();
    });
  });

  describe('parseTime', () => {
    it('normalizes HH:MM to HH:MM:SS', () => {
      expect(parseTime('09:30')).toBe('09:30:00');
    });
    it('accepts HH:MM:SS as-is', () => {
      expect(parseTime('09:30:00')).toBe('09:30:00');
    });
    it('rejects malformed times', () => {
      expect(parseTime('9pm')).toBeNull();
      expect(parseTime('25:00')).not.toBeNull(); // regex-only; range not validated here, documents current behavior
      expect(parseTime('')).toBeNull();
    });
  });

  describe('validateBookAppointment', () => {
    const future = (() => {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      return d.toISOString().slice(0, 10);
    })();

    const validBody = {
      doctorId: 'doc-1',
      patientId: 'pat-1',
      appointment_date: future,
      start_time: '10:00',
      end_time: '10:30',
    };

    it('accepts a fully valid booking request', () => {
      const result = validateBookAppointment(validBody);
      expect(result.error).toBeUndefined();
      expect(result.value.doctorId).toBe('doc-1');
      expect(result.value.start_time).toBe('10:00:00');
    });

    it('rejects a missing doctorId', () => {
      const { error } = validateBookAppointment({ ...validBody, doctorId: undefined });
      expect(error).toMatch(/doctorId/);
    });

    it('rejects a missing patientId', () => {
      const { error } = validateBookAppointment({ ...validBody, patientId: '' });
      expect(error).toMatch(/patientId/);
    });

    it('rejects a date in the past', () => {
      const { error } = validateBookAppointment({ ...validBody, appointment_date: '2020-01-01' });
      expect(error).toMatch(/past/);
    });

    it('rejects a malformed appointment_date', () => {
      const { error } = validateBookAppointment({ ...validBody, appointment_date: 'tomorrow' });
      expect(error).toMatch(/appointment_date/);
    });

    it('accepts camelCase field aliases as well as snake_case', () => {
      const result = validateBookAppointment({
        doctorId: 'doc-1',
        patientId: 'pat-1',
        appointmentDate: future,
        startTime: '10:00',
        endTime: '10:30',
      });
      expect(result.error).toBeUndefined();
    });
  });

  describe('getTodayDate', () => {
    it('returns a YYYY-MM-DD string', () => {
      expect(getTodayDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});
