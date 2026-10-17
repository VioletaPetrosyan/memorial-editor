import { onScopeDispose, readonly, ref, type Ref } from 'vue';

/** Keep in sync with $mobile-max-width in styles/_breakpoints.scss. */
export const MOBILE_MEDIA_QUERY = '(width < 768px)';

/** Reactive result of a CSS media query, updated as the viewport changes. */
export function useMediaQuery(query: string): Readonly<Ref<boolean>> {
    const mediaQuery = window.matchMedia(query);
    const matches = ref(mediaQuery.matches);

    const update = (event: MediaQueryListEvent): void => {
        matches.value = event.matches;
    };

    mediaQuery.addEventListener('change', update);
    onScopeDispose(() => mediaQuery.removeEventListener('change', update));

    return readonly(matches);
}
