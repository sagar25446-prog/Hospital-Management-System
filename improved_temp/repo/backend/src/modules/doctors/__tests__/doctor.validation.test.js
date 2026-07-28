const { validateScheduleBody } = require('../doctor.validation');

describe('doctor.validation.validateScheduleBody', () => {
  it('accepts an empty slots array', () => {
    expect(validateScheduleBody({ slots: [] })).toEqual({ value: { slots: [] } });
  });

  it('accepts a well-formed slot with HH:MM times', () => {
    const result = validateScheduleBody({
      slots: [{ day_of_week: 1, start_time: '09:00', end_time: '13:00' }],
    });
    expect(result.error).toBeUndefined();
    expect(result.value.slots[0]).toMatchObject({
      day_of_week: 1,
      start_time: '09:00',
      end_time: '13:00',
      is_available: true,
    });
  });

  it('accepts camelCase field aliases', () => {
    const result = validateScheduleBody({
      slots: [{ dayOfWeek: 2, startTime: '10:00', endTime: '12:00' }],
    });
    expect(result.error).toBeUndefined();
    expect(result.value.slots[0].day_of_week).toBe(2);
  });

  it('rejects a day_of_week out of range', () => {
    const result = validateScheduleBody({ slots: [{ day_of_week: 7, start_time: '09:00', end_time: '10:00' }] });
    expect(result.error).toMatch(/0-6/);
  });

  it('rejects a missing start_time', () => {
    const result = validateScheduleBody({ slots: [{ day_of_week: 1, end_time: '10:00' }] });
    expect(result.error).toMatch(/start_time/);
  });

  it('respects a bare array body (not wrapped in {slots: []})', () => {
    const result = validateScheduleBody([{ day_of_week: 3, start_time: '09:00', end_time: '10:00' }]);
    expect(result.error).toBeUndefined();
    expect(result.value.slots).toHaveLength(1);
  });
});
