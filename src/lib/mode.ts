const KEY = 'kiichiro:mode';

export type Mode = 'list' | 'world';

export const rememberMode = (mode: Mode) => {
	try {
		localStorage.setItem(KEY, mode);
	} catch {
		// プライベートウィンドウ等で localStorage が使えなくても表示は続ける
	}
};

export const preferredMode = (): Mode | null => {
	try {
		return localStorage.getItem(KEY) as Mode | null;
	} catch {
		return null;
	}
};
