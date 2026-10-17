import { flushPromises } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/api/http';
import { fetchFirstMemorialId, fetchMemorial } from '@/api/memorials';
import { buttonByText, deferred, makeMemorial, mountApp } from '../helpers';

vi.mock('@/api/memorials');

describe('HomePage', () => {
    it('opens the oldest memorial', async () => {
        const lookup = deferred<number | null>();
        vi.mocked(fetchFirstMemorialId).mockReturnValue(lookup.promise);
        vi.mocked(fetchMemorial).mockResolvedValue(makeMemorial({ id: 3 }));

        const { wrapper, router } = await mountApp('/');
        expect(wrapper.find('.skeleton').exists()).toBe(true);

        lookup.resolve(3);
        await flushPromises();

        expect(router.currentRoute.value.fullPath).toBe('/memorials/3');
        expect(wrapper.find('h1').text()).toBe('Eleanor Rose Whitfield');
    });

    it('opens the create page when there are no memorials', async () => {
        vi.mocked(fetchFirstMemorialId).mockResolvedValue(null);

        const { router } = await mountApp('/');

        expect(router.currentRoute.value.name).toBe('memorial.create');
    });

    it('sends unknown paths home', async () => {
        vi.mocked(fetchFirstMemorialId).mockResolvedValue(null);

        const { router } = await mountApp('/no/such/page');

        expect(router.currentRoute.value.name).toBe('memorial.create');
    });

    it('shows the error and can retry', async () => {
        vi.mocked(fetchFirstMemorialId)
            .mockRejectedValueOnce(new ApiError('Could not reach the server.', 0))
            .mockResolvedValueOnce(null);

        const { wrapper, router } = await mountApp('/');
        expect(wrapper.find('[role="alert"]').text()).toContain('Could not reach the server.');

        await buttonByText(wrapper, 'Try again').trigger('click');
        await flushPromises();

        expect(router.currentRoute.value.name).toBe('memorial.create');
    });
});
