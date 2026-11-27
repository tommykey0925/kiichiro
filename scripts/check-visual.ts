// ビルド済みのサイト (build/) を vite preview で配り、headless Chromium で見た目の崩れを検査する。
// 使い方: pnpm build && pnpm test:visual
// CHROMIUM_PATH を省くと Playwright が入れた Chromium を使う (`pnpm exec playwright-core install chromium`)。
//
// 検査すること
//   - PC とスマホ、ライトとダークの全組み合わせで、横スクロールが出ない・ページのエラーが出ない
//   - ヘッダーは透明のまま、下へ読むと上へ隠れ、上へ戻ると出てくる (見出しの上に文字が重なったままにならない)
//   - メニューが開き、本文が操作できなくなり、Esc で閉じ、フォーカスが開いたボタンに戻る
//   - 作品一覧まで読み進めると作品の部屋が開き、3D の蜂が訪れてヘッダーの蜂の巣に蜜がたまる
//   - トップでたまった蜜が /world に引き継がれ、ヘッダーの蜂の巣に出る
//   - 動きを減らす設定では、出てくる動きがなく、読む位置に来た部屋はすぐ蜜がたまった扱いになる

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

				const layout = await page.evaluate(() => ({
					overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
					header: !!document.querySelector('.site-header')
				}));
				if (layout.overflow > 0) fail(`${label}: 横スクロールが ${layout.overflow}px 出る`);
				if (!layout.header) fail(`${label}: ヘッダーがない`);
				page.removeAllListeners('pageerror');
				page.removeAllListeners('console');
			}
			await context.close();
		}
	}

	// ヘッダー: 下へ読むと上へ隠れ、上へ戻ると出てくる
	for (const [name, options] of Object.entries(viewports)) {
		const context = await browser.newContext(options);
		const page = await context.newPage();
		watchErrors(page, `${name} ヘッダー`);
		await page.goto(base + '/', { waitUntil: 'networkidle' });
		const bottom = () => page.evaluate(() => document.querySelector('.site-header')!.getBoundingClientRect().bottom);
		for (let i = 0; i < 6; i++) {
			await page.evaluate(() => scrollBy(0, 150));
			await page.waitForTimeout(50);
		}
		await page.waitForTimeout(800);
		if ((await bottom()) > 0) fail(`${name}: 下へ読んでもヘッダーが隠れない (下端 ${await bottom()}px)`);
		for (let i = 0; i < 4; i++) {
			await page.evaluate(() => scrollBy(0, -40));
			await page.waitForTimeout(50);
		}
		await page.waitForTimeout(800);
		const header = await page.evaluate(() => document.querySelector('.site-header')!.getBoundingClientRect().top);
		if (header < 0) fail(`${name}: 上へ戻ってもヘッダーが出てこない (上端 ${header}px)`);
		await context.close();
	}

	// メニュー: 開く → 本文が操作できない → Esc で閉じる → フォーカスが戻る
	for (const [name, options] of Object.entries(viewports)) {
		const context = await browser.newContext(options);
		const page = await context.newPage();
		watchErrors(page, `${name} メニュー`);
		await page.goto(base + '/', { waitUntil: 'networkidle' });
		const opener = page.locator('#menu-button');
		await opener.click();
		if (!(await page.locator('dialog.menu').evaluate((d: HTMLDialogElement) => d.open))) fail(`${name}: メニューが開かない`);
		if ((await opener.getAttribute('aria-expanded')) !== 'true') fail(`${name}: aria-expanded が true にならない`);
		if (!(await page.locator('.page').evaluate((el) => (el as HTMLElement).inert))) fail(`${name}: メニューを開いても本文が操作できる`);
		await page.waitForTimeout(1500);
		await page.keyboard.press('Escape');
		try {
			await page.waitForFunction(() => !document.querySelector<HTMLDialogElement>('dialog.menu')!.open, null, { timeout: 3000 });
		} catch {
			fail(`${name}: Esc でメニューが閉じない`);
		}
		const focused = await page.evaluate(() => document.activeElement?.id);
		if (focused !== 'menu-button') fail(`${name}: 閉じた後のフォーカスが開いたボタンに戻らない (${focused})`);
		await context.close();
	}

	// 蜂の演出: 作品一覧まで読み進めると、蜂が最初の作品の部屋を訪れて蜜が 1 部屋たまる
	for (const [name, options] of Object.entries(viewports)) {
		const context = await browser.newContext(options);
		const page = await context.newPage();
		watchErrors(page, `${name} 蜂`);
		await page.goto(base + '/', { waitUntil: 'networkidle' });
		const comb = page.locator('.comb');
		if ((await comb.getAttribute('aria-label')) !== '0 / 7 作品に蜂が立ち寄った') fail(`${name}: 蜂の巣の初期表示が想定外 (${await comb.getAttribute('aria-label')})`);
		await page.evaluate(() => document.getElementById('works')!.scrollIntoView());
		try {
			await page.waitForFunction(() => document.querySelector('#works .cell')?.classList.contains('visited'), null, { timeout: 10000 });
		} catch {
			fail(`${name}: 10 秒以内に蜂が最初の作品の部屋を訪れない`);
		}
		const label = await comb.getAttribute('aria-label');
		if (!label?.startsWith('1 / 7') && !label?.startsWith('2 / 7')) fail(`${name}: 蜂の巣に蜜がたまらない (${label})`);
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
		const hidden = await page.evaluate(() => document.querySelectorAll('.reveal').length);
		if (hidden > 0) fail(`動きを減らす設定: 下から出てくる動きが ${hidden} か所に残っている`);
		await page.evaluate(() => document.getElementById('works')!.scrollIntoView());
		await page.waitForTimeout(300);
		const first = await page.locator('#works .cell').first().getAttribute('class');
		if (!first?.includes('open') || !first.includes('visited')) fail(`動きを減らす設定: 最初の作品の部屋に蜜がたまった扱いにならない (${first})`);
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
console.log(`visual ok: ${Object.keys(viewports).length * 2 * paths.length} pages, header, menu, bee, reduced motion`);
