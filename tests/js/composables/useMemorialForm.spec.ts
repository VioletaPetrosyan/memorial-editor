import { describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { ApiError, ValidationError } from '@/api/http';
import { toFormValues, toPayload, useMemorialForm } from '@/composables/useMemorialForm';
import { makeMemorial } from '../helpers';

describe('form value mapping', () => {
    it('starts from empty values when creating', () => {
        expect(toFormValues(null)).toMatchObject({ first_name: '', gender: '', birth_date: '', published: false });
    });

    it('maps null API values to empty inputs', () => {
        const values = toFormValues(makeMemorial({ middle_name: null, gender: null, birth_date: null }));

        expect(values).toMatchObject({ middle_name: '', gender: '', birth_date: '' });
    });

    it('trims text and sends empty optional values as null', () => {
        const payload = toPayload({
            ...toFormValues(makeMemorial()),
            first_name: '  Eleanor ',
            middle_name: '   ',
            website_url: '',
            gender: '',
            birth_date: '',
        });

        expect(payload).toMatchObject({
            first_name: 'Eleanor',
            middle_name: null,
            website_url: null,
            gender: null,
            birth_date: null,
        });
    });
});

describe('useMemorialForm', () => {
    it('is pre-filled from the memorial and clean', () => {
        const form = useMemorialForm(makeMemorial());

        expect(form.values.first_name).toBe('Eleanor');
        expect(form.isDirty.value).toBe(false);
    });

    it('tracks dirtiness against the starting values', () => {
        const form = useMemorialForm(makeMemorial());

        form.values.first_name = 'Ellie';
        expect(form.isDirty.value).toBe(true);

        form.values.first_name = 'Eleanor';
        expect(form.isDirty.value).toBe(false);

        // Whitespace doesn't change what would be saved.
        form.values.last_name = 'Whitfield  ';
        expect(form.isDirty.value).toBe(false);
    });

    it('reset discards edits and errors', async () => {
        const form = useMemorialForm(makeMemorial());
        form.values.first_name = 'Ellie';
        await form.submit(() => Promise.reject(new ValidationError('Invalid', { last_name: ['Required.'] })));

        form.reset();

        expect(form.values.first_name).toBe('Eleanor');
        expect(form.errors.value).toEqual({});
        expect(form.formError.value).toBeNull();
        expect(form.isDirty.value).toBe(false);
    });

    it('submits the payload and adopts the saved memorial as the new starting point', async () => {
        const form = useMemorialForm(makeMemorial());
        form.values.first_name = ' Ellie ';
        const saved = makeMemorial({ first_name: 'Ellie', updated_at: '2026-02-01T00:00:00+00:00' });
        const persist = vi.fn().mockResolvedValue(saved);

        await expect(form.submit(persist)).resolves.toBe(saved);

        expect(persist).toHaveBeenCalledWith(expect.objectContaining({ first_name: 'Ellie', middle_name: 'Rose' }));
        expect(form.isDirty.value).toBe(false);

        form.reset();
        expect(form.values.first_name).toBe('Ellie');
    });

    it('puts server validation errors on their fields and keeps the draft', async () => {
        const form = useMemorialForm(makeMemorial());
        form.values.first_name = '';

        const result = await form.submit(() =>
            Promise.reject(
                new ValidationError('The first name field is required. (and 1 more error)', {
                    first_name: ['The first name field is required.', 'Second message'],
                    passing_date: ['The passing date cannot be earlier than the birth date.'],
                }),
            ),
        );

        expect(result).toBeNull();
        expect(form.errors.value).toEqual({
            first_name: 'The first name field is required.',
            passing_date: 'The passing date cannot be earlier than the birth date.',
        });
        expect(form.formError.value).toBe('Please correct the highlighted fields.');
        expect(form.isDirty.value).toBe(true);
    });

    it('shows the server summary when an error has no matching field', async () => {
        const form = useMemorialForm(makeMemorial());

        await form.submit(() => Promise.reject(new ValidationError('Too many requests.', { token: ['Bad.'] })));

        expect(form.formError.value).toBe('Too many requests.');
    });

    it('shows a form-level message for non-validation failures', async () => {
        const form = useMemorialForm(makeMemorial());

        await form.submit(() => Promise.reject(new ApiError('Server Error', 500)));

        expect(form.formError.value).toBe('Server Error');
        expect(form.errors.value).toEqual({});
    });

    it('clears a date error when the other date is edited, since they are checked together', async () => {
        const form = useMemorialForm(makeMemorial({ birth_date: '1950-05-10', passing_date: '1950-05-09' }));
        await form.submit(() =>
            Promise.reject(
                new ValidationError('Invalid', {
                    passing_date: ['The passing date cannot be earlier than the birth date.'],
                    last_name: ['Required.'],
                }),
            ),
        );

        form.values.birth_date = '1940-01-01';
        await nextTick();

        expect(form.errors.value).toEqual({ last_name: 'Required.' });
    });

    it('can show errors found before anything is sent', () => {
        const form = useMemorialForm(makeMemorial());

        form.setFieldErrors({ birth_date: 'Enter the full date, or clear it.' });

        expect(form.errors.value).toEqual({ birth_date: 'Enter the full date, or clear it.' });
        expect(form.formError.value).toBe('Please correct the highlighted fields.');
    });

    it('clears a field error once that field is edited', async () => {
        const form = useMemorialForm(makeMemorial());
        await form.submit(() =>
            Promise.reject(new ValidationError('Invalid', { first_name: ['Required.'], last_name: ['Required.'] })),
        );

        form.values.first_name = 'Ellie';
        await nextTick();

        expect(form.errors.value).toEqual({ last_name: 'Required.' });
    });
});
