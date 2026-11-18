import type { CompilerOptions } from '@inlang/paraglide-js';

export const paraglideOptions = {
	project: './project.inlang',
	outdir: './src/lib/paraglide',
	emitTsDeclarations: true,
	strategy: ['url', 'baseLocale'],
	urlPatterns: [
		{
			pattern: '/:path(.*)?',
			localized: [
				['en', '/en/:path(.*)?'],
				['ja', '/:path(.*)?']
			]
		}
	]
} satisfies CompilerOptions;
