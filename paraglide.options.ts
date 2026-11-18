import type { CompilerOptions } from '@inlang/paraglide-js';

export const paraglideOptions = {
	project: './project.inlang',
	outdir: './src/lib/paraglide',
	emitTsDeclarations: true,
	strategy: ['url', 'baseLocale'],
	trailingSlash: 'never',
	urlPatterns: [
		{
			pattern: '/',
			localized: [
				['en', '/en'],
				['ja', '/']
			]
		},
		{
			pattern: '/:path(.*)?',
			localized: [
				['en', '/en/:path(.*)?'],
				['ja', '/:path(.*)?']
			]
		}
	]
} satisfies CompilerOptions;
