import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { createMemoryHistory, type RouterHistory, RouterView } from 'vue-router';
import { createAppRouter } from '@/router';
import type { Memorial } from '@/types/memorial';

export function makeMemorial(overrides: Partial<Memorial> = {}): Memorial {
    return {
        id: 1,
        first_name: 'Eleanor',
        middle_name: 'Rose',
        last_name: 'Whitfield',
        website_url: 'https://example.com',
        gender: 'female',
        relationship: 'parent',
        designation: 'Beloved mother',
        country: 'United Kingdom',
        birth_date: '1938-04-12',
        passing_date: '2024-11-03',
        published: true,
        created_at: '2026-01-01T00:00:00+00:00',
        updated_at: '2026-01-01T00:00:00+00:00',
        ...overrides,
    };
}

/** Promise whose resolution the test controls, to observe in-flight states. */
export function deferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (reason: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });

    return { promise, resolve, reject };
}

export { setMobileViewport } from './viewport';

/**
 * Renders the real router, store and pages at `path`. Tests mock only the API module.
 * Memory history by default; pass createWebHistory() to read history state (notices).
 */
export async function mountApp(path: string, history: RouterHistory = createMemoryHistory()) {
    const router = createAppRouter(history);
    await router.push(path);
    const wrapper = mount(RouterView, {
        global: { plugins: [createPinia(), router] },
        attachTo: document.body,
    });
    await flushPromises();

    return { wrapper, router };
}

export function buttonByText(wrapper: VueWrapper, text: string) {
    const button = wrapper.findAll('button').find((b) => b.text() === text);
    if (!button) throw new Error(`No "${text}" button`);

    return button;
}
