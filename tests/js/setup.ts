import { enableAutoUnmount } from '@vue/test-utils';
import { afterEach } from 'vitest';
import { setMobileViewport } from './viewport';

// jsdom knows <dialog> but not its modal API; open/close is all the components rely on.
if (typeof HTMLDialogElement.prototype.showModal !== 'function') {
    HTMLDialogElement.prototype.showModal = function () {
        this.open = true;
    };
    HTMLDialogElement.prototype.close = function () {
        this.open = false;
    };
}

setMobileViewport(false);
enableAutoUnmount(afterEach);

afterEach(() => {
    setMobileViewport(false);
    document.body.innerHTML = '';
    // Tests that use the web history leave their URL and state behind.
    window.history.replaceState(null, '', '/');
});
