import { describe, expect, it } from 'vitest';
import { ageAtPassing, formatDate, fullName, lifeYears } from '@/utils/format';

describe('formatDate', () => {
    it('does not shift calendar dates for viewers west of UTC', () => {
        // The suite runs in America/Los_Angeles (vitest.config.ts), where midnight UTC
        // is still the previous day.
        expect(new Date('1938-04-12T00:00:00Z').getDate()).toBe(11);
        expect(formatDate('1938-04-12')).toBe('April 12, 1938');
    });
});

describe('fullName', () => {
    it('skips a missing middle name', () => {
        expect(fullName({ first_name: 'Ada', middle_name: null, last_name: 'Lovelace' })).toBe('Ada Lovelace');
        expect(fullName({ first_name: 'Ada', middle_name: 'King', last_name: 'Lovelace' })).toBe('Ada King Lovelace');
    });
});

describe('lifeYears', () => {
    it('describes whichever dates are known', () => {
        expect(lifeYears({ birth_date: '1938-04-12', passing_date: '2024-11-03' })).toBe('1938 – 2024');
        expect(lifeYears({ birth_date: '1938-04-12', passing_date: null })).toBe('Born 1938');
        expect(lifeYears({ birth_date: null, passing_date: '2024-11-03' })).toBe('Passed away 2024');
        expect(lifeYears({ birth_date: null, passing_date: null })).toBeNull();
    });
});

describe('ageAtPassing', () => {
    it('counts full years, including whether the birthday had come that year', () => {
        expect(ageAtPassing({ birth_date: '1938-04-12', passing_date: '2024-11-03' })).toBe(86);
        expect(ageAtPassing({ birth_date: '1938-04-12', passing_date: '2024-04-11' })).toBe(85);
        expect(ageAtPassing({ birth_date: '1938-04-12', passing_date: '2024-04-12' })).toBe(86);
        expect(ageAtPassing({ birth_date: null, passing_date: '2024-04-12' })).toBeNull();
    });
});
