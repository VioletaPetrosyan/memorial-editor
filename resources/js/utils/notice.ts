/**
 * Reads a one-off message passed to this page with router.push({ state: { notice } })
 * and removes it, so it shows once and not again after a reload.
 */
export function consumeNotice(): string | null {
    const state = window.history.state as Record<string, unknown> | null;
    const notice = typeof state?.notice === 'string' ? state.notice : null;

    if (notice !== null) {
        window.history.replaceState({ ...state, notice: null }, '');
    }

    return notice;
}
