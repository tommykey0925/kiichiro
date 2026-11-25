// ビルド済みのサイト (build/) を vite preview で配り、headless Chromium で見た目の崩れを検査する。
// 使い方: pnpm build && pnpm test:visual
// CHROMIUM_PATH を省くと Playwright が入れた Chromium を使う (`pnpm exec playwright-core install chromium`)。
//
// 検査すること
//   - PC とスマホ、ライトとダークの全組み合わせで、横スクロールが出ない・ページのエラーが出ない
//   - ヘッダーの背景が不透明で、スクロールしても下の文字が透けて重ならない
//   - メニューが開き、Esc で閉じ、フォーカスが開いたボタンに戻る
//   - 動きを減らす設定では、文字帯と飛ぶ蜂が止まる

import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { chromium, devices, type BrowserContextOptions, type Page } from 'playwright-core';

const root = resolve(import.meta.dirname, '..');
const port = 4317;
const base = `http://localhost:${port}`;
const paths = ['/', '/en', '/works/hapax', '/en/works/ahab', '/world'];

const { defaultBrowserType: _, ...phone } = devices['iPhone 13'];
const viewports: Record<string, BrowserContextOptions> = {
	pc: { viewport: { width: 1440, height: 900 } },
	phone
};

const failures: string[] = [];
const fail = (message: string) => failures.push(message);

const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--port', String(port), '--strictPort'], {
	cwd: root,
	stdio: ['ignore', 'pipe', 'inherit']
});
await new Promise<void>((ready, reject) => {
	server.stdout!.on('data', (chunk: Buffer) => chunk.toString().includes(String(port)) && ready());
	server.on('exit', (code) => reject(new Error(`vite preview が終了した (code ${code})`)));
});

const browser = await chromium.launch({
	executablePath: process.env.CHROMIUM_PATH,
	args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']
});

// rgb(1, 2, 3) / rgba(1, 2, 3, 0.5) / rgb(1 2 3 / 0.5) / color(srgb 0.1 0.2 0.3 / 0.5) のどれからも不透明度を取り出す
function alphaOf(color: string) {
	const slash = color.match(/\/\s*([\d.]+)(%?)\s*\)/);
	if (slash) return Number(slash[1]) / (slash[2] ? 100 : 1);
	const parts = color.match(/\(([^)]*)\)/)?.[1].split(',') ?? [];
	return parts.length === 4 ? Number(parts[3]) : 1;
}

function watchErrors(page: Page, label: string) {
	page.on('pageerror', (error) => fail(`${label}: ページのエラー ${error.message}`));
	page.on('console', (message) => message.type() === 'error' && fail(`${label}: console.error ${message.text()}`));
}

try {
	for (const [name, options] of Object.entries(viewports)) {
		for (const colorScheme of ['light', 'dark'] as const) {
			const context = await browser.newContext({ ...options, colorScheme });
			const page = await context.newPage();
			for (const path of paths) {
				const label = `${name}/${colorScheme} ${path}`;
				watchErrors(page, label);
				const response = await page.goto(base + path, { waitUntil: 'networkidle' });
				if (response?.status() !== 200) fail(`${label}: 応答 ${response?.status()}`);

				const layout = await page.evaluate(() => {
					const header = document.querySelector<HTMLElement>('.site-header');
					return {
						overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
						headerBackground: header ? getComputedStyle(header).backgroundColor : null
					};
				});
				if (layout.overflow > 0) fail(`${label}: 横スクロールが ${layout.overflow}px 出る`);
				if (!layout.headerBackground || alphaOf(layout.headerBackground) < 1) {
					fail(`${label}: ヘッダーの背景が不透明でない (${layout.headerBackground})`);
				}
				page.removeAllListeners('pageerror');
				page.removeAllListeners('console');
			}
			await context.close();
		}
	}

	// メニュー: 開く → Esc で閉じる → フォーカスが戻る
	for (const [name, options] of Object.entries(viewports)) {
		const context = await browser.newContext(options);
		const page = await context.newPage();
		watchErrors(page, `${name} メニュー`);
		await page.goto(base + '/', { waitUntil: 'networkidle' });
		const opener = page.getByRole('button', { name: 'メニューを開く' });
		await opener.click();
		if (!(await page.locator('dialog.menu').evaluate((d: HTMLDialogElement) => d.open))) fail(`${name}: メニューが開かない`);
		if ((await opener.getAttribute('aria-expanded')) !== 'true') fail(`${name}: aria-expanded が true にならない`);
		await page.keyboard.press('Escape');
		if (await page.locator('dialog.menu').evaluate((d: HTMLDialogElement) => d.open)) fail(`${name}: Esc でメニューが閉じない`);
		const focused = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
		if (focused !== 'メニューを開く') fail(`${name}: 閉じた後のフォーカスが開いたボタンに戻らない (${focused})`);
		await context.close();
	}

	// 動きを減らす設定
	{
		const context = await browser.newContext({ ...viewports.pc, reducedMotion: 'reduce' });
		const page = await context.newPage();
		watchErrors(page, '動きを減らす設定');
		await page.goto(base + '/', { waitUntil: 'networkidle' });
		await page.waitForTimeout(300);
		const state = await page.evaluate(() => ({
			band: getComputedStyle(document.querySelector('.track')!).animationName,
			bee: getComputedStyle(document.querySelector('.enter')!).display
		}));
		if (state.band !== 'none') fail(`動きを減らす設定: 文字帯が流れている (${state.band})`);
		if (state.bee !== 'none') fail('動きを減らす設定: 飛ぶ蜂が出ている');
		await context.close();
	}
} finally {
	await browser.close();
	server.kill();
}

if (failures.length > 0) {
	console.error(failures.map((f) => `NG ${f}`).join('\n'));
	process.exit(1);
}
console.log(`visual ok: ${Object.keys(viewports).length * 2 * paths.length} pages, menu, reduced motion`);
