import { getLocale, localizeHref, type Locale } from '$lib/paraglide/runtime';

export type Localized = Record<Locale, string>;

export const localize = (text: string | Localized) =>
	typeof text === 'string' ? text : text[getLocale()];

export const localizePath = (path: string, options?: { locale?: Locale }) => {
	const href = localizeHref(path, options);
	return href.length > 1 && href.endsWith('/') ? href.slice(0, -1) : href;
};
