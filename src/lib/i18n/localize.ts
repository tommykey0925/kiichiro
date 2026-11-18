import { getLocale, type Locale } from '$lib/paraglide/runtime';

export type Localized = Record<Locale, string>;

export const localize = (text: string | Localized) =>
	typeof text === 'string' ? text : text[getLocale()];
