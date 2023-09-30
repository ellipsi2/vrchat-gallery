import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/kit/vite';
import path from 'node:path';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: vitePreprocess(),

    /**
     * 
     * @param {any} warning 
     * @param {any} handler 
     */
    onwarn: (warning, handler) => {
        // This is an indispensable syntax due to the specifications of SvelteKit itself,
        // so it should not be modified.
        let isUnusedWarning = warning.code === 'unused-export-let';
        if (isUnusedWarning && warning.message.includes("'data'")) return;

        // You should not directly modify external modules in this project.
        if (warning.filename.includes('node_modules/')) return;

        handler(warning);
    },

	kit: {
		// adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
		// If your environment is not supported or you settled on a specific environment, switch out the adapter.
		// See https://kit.svelte.dev/docs/adapters for more information about adapters.
		adapter: adapter({
			out: 'build',
		}),
        alias: {
            '@components': path.resolve('./src/components'),
        },
	},
};

export default config;
