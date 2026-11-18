export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'kiichiro-theme';

const darkQuery = '(prefers-color-scheme: dark)';

export function nextMode(mode: ThemeMode): ThemeMode {
	return mode === 'light' ? 'dark' : mode === 'dark' ? 'system' : 'light';
}

export function loadMode(): ThemeMode {
	try {
		const value = localStorage.getItem(THEME_STORAGE_KEY);
		if (value === 'light' || value === 'dark') return value;
	} catch {
		return 'system';
	}
	return 'system';
}

export function saveMode(mode: ThemeMode): void {
	try {
		if (mode === 'system') localStorage.removeItem(THEME_STORAGE_KEY);
		else localStorage.setItem(THEME_STORAGE_KEY, mode);
	} catch {
		return;
	}
}

export function applyMode(mode: ThemeMode): void {
	const root = document.documentElement;
	if (mode === 'system') delete root.dataset.theme;
	else root.dataset.theme = mode;
}

export function resolvedTheme(): ResolvedTheme {
	const mode = document.documentElement.dataset.theme;
	if (mode === 'light' || mode === 'dark') return mode;
	return matchMedia(darkQuery).matches ? 'dark' : 'light';
}

export function onThemeChange(listener: (theme: ResolvedTheme) => void): () => void {
	const query = matchMedia(darkQuery);
	const notify = () => listener(resolvedTheme());
	const observer = new MutationObserver(notify);
	observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
	query.addEventListener('change', notify);
	return () => {
		observer.disconnect();
		query.removeEventListener('change', notify);
	};
}
