import { fileURLToPath, URL } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';

// Kept separate from vite.config.ts so tests don't load the Laravel plugin.
export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./resources/js', import.meta.url)),
        },
    },
    test: {
        environment: 'jsdom',
        include: ['tests/js/**/*.spec.ts'],
        setupFiles: ['tests/js/setup.ts'],
        // West of UTC, so code that lets calendar dates drift a day fails here.
        env: { TZ: 'America/Los_Angeles' },
        restoreMocks: true,
    },
});
