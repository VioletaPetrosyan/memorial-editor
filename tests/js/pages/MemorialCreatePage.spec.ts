import { flushPromises } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { createWebHistory } from 'vue-router';
import { createMemorial, deleteMemorial, fetchFirstMemorialId, fetchMemorial } from '@/api/memorials';
import { buttonByText, makeMemorial, mountApp } from '../helpers';

vi.mock('@/api/memorials');

describe('MemorialCreatePage', () => {
    it('creates a memorial and opens it without fetching it again', async () => {
        vi.mocked(createMemorial).mockResolvedValue(
            makeMemorial({ id: 5, first_name: 'Ada', middle_name: null, last_name: 'Lovelace' }),
        );
        // Web history, so the "Memorial created." notice passed in history state can be read.
        const { wrapper, router } = await mountApp('/memorials/new', createWebHistory());

        await wrapper.find('input[name="first_name"]').setValue(' Ada ');
        await wrapper.find('input[name="last_name"]').setValue('Lovelace');
        await wrapper.find('form').trigger('submit');
        await flushPromises();

        expect(createMemorial).toHaveBeenCalledWith(
            expect.objectContaining({ first_name: 'Ada', last_name: 'Lovelace', middle_name: null, published: false }),
        );
        expect(router.currentRoute.value.fullPath).toBe('/memorials/5');
        expect(wrapper.find('h1').text()).toBe('Ada Lovelace');
        expect(wrapper.find('[role="status"]').text()).toBe('Memorial created.');
        expect(fetchMemorial).not.toHaveBeenCalled();
    });

    it('replaces the form in history, so Back from the new memorial skips it', async () => {
        vi.mocked(fetchMemorial).mockResolvedValue(makeMemorial({ id: 1 }));
        vi.mocked(createMemorial).mockResolvedValue(makeMemorial({ id: 5 }));
        const { wrapper, router } = await mountApp('/memorials/1');
        await router.push('/memorials/new');
        await flushPromises();

        await wrapper.find('input[name="first_name"]').setValue('Ada');
        await wrapper.find('input[name="last_name"]').setValue('Lovelace');
        await wrapper.find('form').trigger('submit');
        await flushPromises();
        router.back();
        await flushPromises();

        expect(router.currentRoute.value.fullPath).toBe('/memorials/1');
    });

    it('shows the notice handed over after a delete', async () => {
        vi.mocked(fetchMemorial).mockResolvedValue(makeMemorial());
        vi.mocked(deleteMemorial).mockResolvedValue();
        vi.spyOn(window, 'confirm').mockReturnValue(true);
        const { wrapper, router } = await mountApp('/memorials/1', createWebHistory());

        await buttonByText(wrapper, 'Delete').trigger('click');
        await flushPromises();

        expect(router.currentRoute.value.name).toBe('memorial.create');
        expect(wrapper.find('[role="status"]').text()).toBe('Memorial deleted.');
    });

    it('goes to the home page on Cancel when there is no page to go back to', async () => {
        vi.mocked(fetchFirstMemorialId).mockResolvedValue(7);
        vi.mocked(fetchMemorial).mockResolvedValue(makeMemorial({ id: 7 }));
        const confirm = vi.spyOn(window, 'confirm');
        const { wrapper, router } = await mountApp('/memorials/new');

        await buttonByText(wrapper, 'Cancel').trigger('click');
        await flushPromises();

        expect(confirm).not.toHaveBeenCalled();
        expect(router.currentRoute.value.fullPath).toBe('/memorials/7');
    });
});
