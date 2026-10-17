import { flushPromises } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { ApiError, ValidationError } from '@/api/http';
import { deleteMemorial, fetchMemorial, updateMemorial } from '@/api/memorials';
import type { Memorial } from '@/types/memorial';
import { buttonByText, deferred, makeMemorial, mountApp, setMobileViewport } from '../helpers';

vi.mock('@/api/memorials');

const mountPage = (path = '/memorials/1') => mountApp(path);

describe('MemorialPage', () => {
    it('shows a loading state until the memorial arrives', async () => {
        const response = deferred<Memorial>();
        vi.mocked(fetchMemorial).mockReturnValue(response.promise);

        const { wrapper } = await mountPage();
        expect(wrapper.find('.skeleton').exists()).toBe(true);

        response.resolve(makeMemorial());
        await flushPromises();

        expect(wrapper.find('.skeleton').exists()).toBe(false);
        expect(wrapper.find('h1').text()).toBe('Eleanor Rose Whitfield');
        expect(wrapper.find('.memorial-details').text()).toContain('April 12, 1938');
    });

    it('shows a not-found state', async () => {
        vi.mocked(fetchMemorial).mockRejectedValue(new ApiError('Memorial not found.', 404));

        const { wrapper } = await mountPage('/memorials/99');

        expect(wrapper.find('h1').text()).toBe('Memorial not found');
    });

    it('on desktop edits inline and shows the saved data after Save', async () => {
        vi.mocked(fetchMemorial).mockResolvedValue(makeMemorial());
        vi.mocked(updateMemorial).mockResolvedValue(makeMemorial({ first_name: 'Ellie' }));
        const { wrapper } = await mountPage();

        await buttonByText(wrapper, 'Edit').trigger('click');

        expect(wrapper.find('dialog').exists()).toBe(false);
        expect(wrapper.find('.memorial-details').exists()).toBe(false);
        const firstName = wrapper.find<HTMLInputElement>('.memorial-form input');
        expect(firstName.element.value).toBe('Eleanor');
        expect(document.activeElement).toBe(firstName.element);

        await firstName.setValue('Ellie');
        await wrapper.find('form').trigger('submit');
        await flushPromises();

        expect(updateMemorial).toHaveBeenCalledWith(1, expect.objectContaining({ first_name: 'Ellie' }));
        expect(wrapper.find('.memorial-form').exists()).toBe(false);
        expect(wrapper.find('h1').text()).toBe('Ellie Rose Whitfield');
        expect(wrapper.find('[role="status"]').text()).toBe('Changes saved.');
        expect(document.activeElement?.textContent?.trim()).toBe('Edit');
    });

    it('on mobile edits in a dialog over the details and closes it after Save', async () => {
        setMobileViewport(true);
        vi.mocked(fetchMemorial).mockResolvedValue(makeMemorial());
        vi.mocked(updateMemorial).mockResolvedValue(makeMemorial());
        const { wrapper } = await mountPage();

        await buttonByText(wrapper, 'Edit').trigger('click');

        const dialog = wrapper.find<HTMLDialogElement>('dialog');
        expect(dialog.element.open).toBe(true);
        expect(dialog.find('.memorial-form').exists()).toBe(true);
        expect(wrapper.find('.memorial-details').exists()).toBe(true);

        await dialog.find('form').trigger('submit');
        await flushPromises();

        expect(wrapper.find('dialog').exists()).toBe(false);
    });

    it('shows server validation errors next to their fields', async () => {
        vi.mocked(fetchMemorial).mockResolvedValue(makeMemorial());
        vi.mocked(updateMemorial).mockRejectedValue(
            new ValidationError('The first name field is required.', {
                first_name: ['The first name field is required.'],
            }),
        );
        const { wrapper } = await mountPage();
        await buttonByText(wrapper, 'Edit').trigger('click');

        await wrapper.find('.memorial-form input').setValue('');
        await wrapper.find('form').trigger('submit');
        await flushPromises();

        const firstName = wrapper.find('.memorial-form input');
        const errorId = firstName.attributes('aria-describedby');
        expect(firstName.attributes('aria-invalid')).toBe('true');
        expect(wrapper.find(`#${errorId}`).text()).toBe('The first name field is required.');
        expect(wrapper.find('[role="alert"]').text()).toBe('Please correct the highlighted fields.');
        expect(document.activeElement).toBe(firstName.element);
    });

    it('asks before Cancel discards changes, and restores the saved values', async () => {
        vi.mocked(fetchMemorial).mockResolvedValue(makeMemorial());
        const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
        const { wrapper } = await mountPage();
        await buttonByText(wrapper, 'Edit').trigger('click');
        await wrapper.find('.memorial-form input').setValue('Ellie');

        await buttonByText(wrapper, 'Cancel').trigger('click');
        expect(confirm).toHaveBeenCalledOnce();
        expect(wrapper.find<HTMLInputElement>('.memorial-form input').element.value).toBe('Ellie');

        confirm.mockReturnValue(true);
        await buttonByText(wrapper, 'Cancel').trigger('click');
        expect(wrapper.find('.memorial-form').exists()).toBe(false);

        await buttonByText(wrapper, 'Edit').trigger('click');
        expect(wrapper.find<HTMLInputElement>('.memorial-form input').element.value).toBe('Eleanor');
    });

    it('closes without asking when nothing changed', async () => {
        vi.mocked(fetchMemorial).mockResolvedValue(makeMemorial());
        const confirm = vi.spyOn(window, 'confirm');
        const { wrapper } = await mountPage();
        await buttonByText(wrapper, 'Edit').trigger('click');

        await buttonByText(wrapper, 'Cancel').trigger('click');

        expect(confirm).not.toHaveBeenCalled();
        expect(wrapper.find('.memorial-form').exists()).toBe(false);
    });

    it('asks before Esc closes the mobile dialog with unsaved changes', async () => {
        setMobileViewport(true);
        vi.mocked(fetchMemorial).mockResolvedValue(makeMemorial());
        const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
        const { wrapper } = await mountPage();
        await buttonByText(wrapper, 'Edit').trigger('click');
        await wrapper.find('.memorial-form input').setValue('Ellie');

        await wrapper.find('dialog').trigger('keydown', { key: 'Escape' });

        expect(confirm).toHaveBeenCalledOnce();
        expect(wrapper.find<HTMLDialogElement>('dialog').element.open).toBe(true);
    });

    it('asks before navigating away from unsaved changes', async () => {
        vi.mocked(fetchMemorial).mockResolvedValue(makeMemorial());
        const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
        const { wrapper, router } = await mountPage();
        await buttonByText(wrapper, 'Edit').trigger('click');
        await wrapper.find('.memorial-form input').setValue('Ellie');

        await router.push({ name: 'memorial.create' });

        expect(confirm).toHaveBeenCalledOnce();
        expect(router.currentRoute.value.name).toBe('memorial.show');
    });

    it('does not save a half-typed date as "no date"', async () => {
        vi.mocked(fetchMemorial).mockResolvedValue(makeMemorial());
        const { wrapper } = await mountPage();
        await buttonByText(wrapper, 'Edit').trigger('click');

        // What a browser reports while a date is only partly filled in.
        const birthDate = wrapper.find<HTMLInputElement>('input[name="birth_date"]');
        Object.defineProperty(birthDate.element, 'validity', { value: { badInput: true } });
        await birthDate.setValue('');

        await wrapper.find('form').trigger('submit');
        await flushPromises();

        expect(updateMemorial).not.toHaveBeenCalled();
        expect(wrapper.find(`#${birthDate.attributes('aria-describedby')}`).text()).toBe(
            'Enter the full date, or clear it.',
        );
        expect(document.activeElement).toBe(birthDate.element);
    });

    it('moves focus to the error message when saving fails without field errors', async () => {
        vi.mocked(fetchMemorial).mockResolvedValue(makeMemorial());
        vi.mocked(updateMemorial).mockRejectedValue(new ApiError('Server Error', 500));
        const { wrapper } = await mountPage();
        await buttonByText(wrapper, 'Edit').trigger('click');

        await wrapper.find('form').trigger('submit');
        await flushPromises();

        const alert = wrapper.find('.memorial-form__alert');
        expect(alert.text()).toBe('Server Error');
        expect(document.activeElement).toBe(alert.element);
    });

    describe('deleting', () => {
        it('deletes after confirming and replaces the page, so Back skips the deleted memorial', async () => {
            vi.mocked(fetchMemorial).mockImplementation((id) => Promise.resolve(makeMemorial({ id })));
            vi.mocked(deleteMemorial).mockResolvedValue();
            vi.spyOn(window, 'confirm').mockReturnValue(true);
            const { wrapper, router } = await mountPage('/memorials/1');
            await router.push('/memorials/2');
            await flushPromises();

            await buttonByText(wrapper, 'Delete').trigger('click');
            await flushPromises();

            expect(deleteMemorial).toHaveBeenCalledWith(2);
            expect(router.currentRoute.value.name).toBe('memorial.create');

            router.back();
            await flushPromises();

            expect(router.currentRoute.value.fullPath).toBe('/memorials/1');
        });

        it('does nothing when the confirmation is declined', async () => {
            vi.mocked(fetchMemorial).mockResolvedValue(makeMemorial());
            vi.spyOn(window, 'confirm').mockReturnValue(false);
            const { wrapper, router } = await mountPage();

            await buttonByText(wrapper, 'Delete').trigger('click');
            await flushPromises();

            expect(deleteMemorial).not.toHaveBeenCalled();
            expect(router.currentRoute.value.name).toBe('memorial.show');
        });

        it('treats a memorial already deleted elsewhere as deleted', async () => {
            vi.mocked(fetchMemorial).mockResolvedValue(makeMemorial());
            vi.mocked(deleteMemorial).mockRejectedValue(new ApiError('Memorial not found.', 404));
            vi.spyOn(window, 'confirm').mockReturnValue(true);
            const { wrapper, router } = await mountPage();

            await buttonByText(wrapper, 'Delete').trigger('click');
            await flushPromises();

            expect(router.currentRoute.value.name).toBe('memorial.create');
        });

        it('keeps the memorial on screen and shows the error when deleting fails', async () => {
            vi.mocked(fetchMemorial).mockResolvedValue(makeMemorial());
            vi.mocked(deleteMemorial).mockRejectedValue(new ApiError('Server Error', 500));
            vi.spyOn(window, 'confirm').mockReturnValue(true);
            const { wrapper, router } = await mountPage();

            await buttonByText(wrapper, 'Delete').trigger('click');
            await flushPromises();

            expect(router.currentRoute.value.name).toBe('memorial.show');
            expect(wrapper.find('[role="alert"]').text()).toBe('Server Error');
            expect(wrapper.find('h1').text()).toBe('Eleanor Rose Whitfield');
        });

        it('never shows the loading placeholder for the deleted memorial', async () => {
            vi.mocked(fetchMemorial).mockResolvedValue(makeMemorial());
            vi.mocked(deleteMemorial).mockResolvedValue();
            vi.spyOn(window, 'confirm').mockReturnValue(true);
            const { wrapper } = await mountPage();
            let sawPlaceholder = false;
            const observer = new MutationObserver(() => {
                sawPlaceholder ||= document.querySelector('.skeleton') !== null;
            });
            observer.observe(document.body, { childList: true, subtree: true });

            await buttonByText(wrapper, 'Delete').trigger('click');
            await flushPromises();
            observer.disconnect();

            expect(sawPlaceholder).toBe(false);
        });
    });
});
