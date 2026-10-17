// Kept free of app imports: setup.ts uses it, and anything setup.ts imports is loaded
// before a spec's vi.mock() calls apply.

/** jsdom has no matchMedia; this one answers "mobile" queries with the given value. */
export function setMobileViewport(isMobile: boolean): void {
    window.matchMedia = (query: string) =>
        ({
            matches: isMobile,
            media: query,
            addEventListener: () => {},
            removeEventListener: () => {},
        }) as unknown as MediaQueryList;
}
