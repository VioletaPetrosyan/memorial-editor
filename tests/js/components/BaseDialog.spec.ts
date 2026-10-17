import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import BaseDialog from '@/components/BaseDialog.vue';

function mountDialog() {
    return mount(BaseDialog, {
        props: { title: 'Edit memorial' },
        slots: { default: '<input id="field">' },
        attachTo: document.body,
    });
}

describe('BaseDialog', () => {
    it('opens as a modal while mounted and closes when unmounted', () => {
        const close = vi.spyOn(HTMLDialogElement.prototype, 'close');
        const wrapper = mountDialog();

        expect(wrapper.find<HTMLDialogElement>('dialog').element.open).toBe(true);
        expect(wrapper.find('dialog').attributes('aria-labelledby')).toBe(wrapper.find('h2').attributes('id'));

        wrapper.unmount();
        expect(close).toHaveBeenCalled();
    });

    it('turns Esc into a close request instead of closing by itself', async () => {
        const wrapper = mountDialog();
        const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });

        wrapper.find('#field').element.dispatchEvent(event);

        expect(event.defaultPrevented).toBe(true);
        expect(wrapper.emitted('requestClose')).toHaveLength(1);
    });

    it('ignores Esc while text is being composed (IME)', () => {
        const wrapper = mountDialog();

        wrapper.find('#field').element.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, isComposing: true }),
        );

        expect(wrapper.emitted('requestClose')).toBeUndefined();
    });

    it('reopens if the browser closes it without asking and the parent keeps it open', async () => {
        const wrapper = mountDialog();
        const dialog = wrapper.find<HTMLDialogElement>('dialog').element;

        // e.g. a repeated Android back gesture: "cancel" can't be prevented and the dialog closes.
        dialog.dispatchEvent(new Event('cancel', { cancelable: false }));
        dialog.close();
        await new Promise((resolve) => setTimeout(resolve));

        expect(wrapper.emitted('requestClose')).toHaveLength(1);
        expect(dialog.open).toBe(true);
    });

    it('treats a click on the backdrop as a close request, but not a drag that ends there', async () => {
        const wrapper = mountDialog();
        const dialog = wrapper.find('dialog');

        // Text selection dragged from the input out onto the backdrop.
        await wrapper.find('#field').trigger('pointerdown');
        await dialog.trigger('click');
        expect(wrapper.emitted('requestClose')).toBeUndefined();

        await dialog.trigger('pointerdown');
        await dialog.trigger('click');
        expect(wrapper.emitted('requestClose')).toHaveLength(1);
    });

    it('asks to close from the close button', async () => {
        const wrapper = mountDialog();

        await wrapper.find('button[aria-label="Close"]').trigger('click');

        expect(wrapper.emitted('requestClose')).toHaveLength(1);
    });
});
