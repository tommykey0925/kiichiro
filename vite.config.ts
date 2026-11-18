import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { paraglideOptions } from './paraglide.options.ts';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			adapter: adapter({ fallback: '404.html' })
		}),
		paraglideVitePlugin(paraglideOptions)
	]
});
