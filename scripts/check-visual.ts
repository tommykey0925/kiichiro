// ビルド済みのサイト (build/) を vite preview で配り、headless Chromium で見た目の崩れを検査する。
// 使い方: pnpm build && pnpm test:visual
// CHROMIUM_PATH を省くと Playwright が入れた Chromium を使う (`pnpm exec playwright-core install chromium`)。
//
// 検査すること
//   - PC とスマホ、ライトとダークの全組み合わせで、横スクロールが出ない・ページのエラーが出ない
//   - ヘッダーの背景が不透明で、スクロールしても下の文字が透けて重ならない
//   - メニューが開き、Esc で閉じ、フォーカスが開いたボタンに戻る
//   - 作品一覧まで読み進めると花が咲き、蜂が訪れてヘッダーの蜂の巣に蜜がたまる
//   - トップでたまった蜜が /world に引き継がれ、ヘッダーの蜂の巣に出る
//   - 動きを減らす設定では、文字帯と飛ぶ蜂が止まり、読む位置に来た花はすぐ咲いて訪れた扱いになる

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

	// 蜂の演出: 作品一覧まで読み進めると、蜂が最初の花を訪れて蜜が 1 部屋たまる
	for (const [name, options] of Object.entries(viewports)) {
		const context = await browser.newContext(options);
		const page = await context.newPage();
		watchErrors(page, `${name} 蜂`);
		await page.goto(base + '/', { waitUntil: 'networkidle' });
		const comb = page.locator('.comb');
		if ((await comb.getAttribute('aria-label')) !== '0 / 7 作品に蜂が立ち寄った') fail(`${name}: 蜂の巣の初期表示が想定外 (${await comb.getAttribute('aria-label')})`);
		await page.evaluate(() => document.getElementById('works')!.scrollIntoView());
		try {
			await page.waitForFunction(() => document.querySelector('.bloom')?.classList.contains('visited'), null, { timeout: 6000 });
		} catch {
			fail(`${name}: 6 秒以内に蜂が最初の花を訪れない`);
		}
		const label = await comb.getAttribute('aria-label');
		if (!label?.startsWith('1 / 7') && !label?.startsWith('2 / 7')) fail(`${name}: 蜂の巣に蜜がたまらない (${label})`);
		// 訪れた作品の行の地面に、その作品の色の小花が咲く
		try {
			await page.waitForFunction(() => document.querySelectorAll('.meadow .flower.open').length > 0, null, { timeout: 3000 });
		} catch {
			fail(`${name}: 蜜がたまっても野原に花が咲かない`);
		}
		// 同じタブで /world へ移っても、たまった蜜はそのまま
		await page.goto(base + '/world', { waitUntil: 'networkidle' });
		const carried = await page.locator('.comb').getAttribute('aria-label').catch(() => null);
		if (carried !== label) fail(`${name}: /world に蜜が引き継がれない (トップ ${label} / world ${carried})`);
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
			meadow: getComputedStyle(document.querySelector('.meadow .head')!).transitionDuration,
			bee: document.querySelector<HTMLElement>('.bee')?.hidden
		}));
		if (state.meadow !== '0s') fail(`動きを減らす設定: 野原の花が動いて咲く (${state.meadow})`);
		if (!state.bee) fail('動きを減らす設定: 飛ぶ蜂が出ている');
		await page.evaluate(() => document.getElementById('works')!.scrollIntoView());
		await page.waitForTimeout(300);
		const first = await page.locator('.bloom').first().getAttribute('class');
		if (!first?.includes('open') || !first.includes('visited')) fail(`動きを減らす設定: 最初の花が咲いて訪れた扱いにならない (${first})`);
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
console.log(`visual ok: ${Object.keys(viewports).length * 2 * paths.length} pages, menu, bee, reduced motion`);
