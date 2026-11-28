<!--
	全画面メニュー。開閉はヘッダーのボタンが menu.open を切り替えて行う。
	  開く   ボタンのある右上から、墨 (ダークでは蜜) の六角形が順に敷き詰まって画面を覆い、項目が下から上がる (1.1 秒)
	  閉じる 項目が先に下へ沈み、遠い部屋から六角形が畳まれる
	蜂がメニューの上を飛べるよう、<dialog> は show() で開く (showModal の最前面には他の要素を重ねられない)。
	その代わり、開いている間は本文を inert にし (+layout)、Esc で閉じ、閉じたら開いたボタンへ焦点を戻す。
	動きを減らす設定では、敷き詰めと時間差をなくして一度に出す。
-->
<script lang="ts">
	import { onMount, tick } from 'svelte';
	import GithubLogoIcon from 'phosphor-svelte/lib/GithubLogoIcon';
	import XLogoIcon from 'phosphor-svelte/lib/XLogoIcon';
	import EnvelopeSimpleIcon from 'phosphor-svelte/lib/EnvelopeSimpleIcon';
	import { menu } from './menu.svelte';
	import LocaleSwitch from './i18n/LocaleSwitch.svelte';
	import { profile } from './profile';
	import { m } from './paraglide/messages';
	import { localizeHref } from './paraglide/runtime';

	let dialog: HTMLDialogElement;
	let sheet: HTMLCanvasElement;
	/** 項目を出している (CSS の時間差の動きの切り替え) */
	let shown = $state(false);

	const items = $derived([
		{ label: 'Works', sub: m.nav_works(), href: localizeHref('/') + '#works' },
		{ label: 'World', sub: m.nav_world(), href: localizeHref('/world') }
	]);

	type Hex = { x: number; y: number; r: number; d: number };
	let cells: Hex[] = [];
	let context: CanvasRenderingContext2D | null = null;
	let reduced = false;

	function layout() {
		if (!context) return;
		const dpr = Math.min(devicePixelRatio, 2);
		sheet.width = innerWidth * dpr;
		sheet.height = innerHeight * dpr;
		context.setTransform(dpr, 0, 0, dpr, 0, 0);
		const r = Math.max(46, innerWidth / 22);
		const w = Math.sqrt(3) * r;
		const h = 1.5 * r;
		const far = Math.hypot(innerWidth, innerHeight);
		cells = [];
		for (let row = -1; row * h < innerHeight + r; row++) {
			for (let col = -1; col * w < innerWidth + w; col++) {
				const x = col * w + (row % 2 ? w / 2 : 0);
				const y = row * h;
				// 右上 (ボタンのある角) からの距離で開く順を決める
				cells.push({ x, y, r, d: Math.hypot(x - innerWidth, y) / far });
			}
		}
	}

	const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 4);

	function draw(progress: number, opening: boolean) {
		if (!context) return;
		context.clearRect(0, 0, innerWidth, innerHeight);
		context.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--brand-menu').trim();
		for (const c of cells) {
			// 開くときは近い部屋から、閉じるときは遠い部屋から。開き終わりは少し大きく重ねて隙間を消す
			const k = opening ? ease((progress - c.d * 0.55) / 0.45) : ease((progress - (1 - c.d) * 0.55) / 0.45);
			const s = opening ? k : 1 - k;
			if (s <= 0) continue;
			context.beginPath();
			for (let i = 0; i < 6; i++) {
				const a = (Math.PI / 3) * i + Math.PI / 6;
				context.lineTo(c.x + c.r * 1.04 * s * Math.cos(a), c.y + c.r * 1.04 * s * Math.sin(a));
			}
			context.fill();
		}
	}

	function animate(opening: boolean) {
		return new Promise<void>((resolve) => {
			if (reduced) {
				draw(1, opening);
				return resolve();
			}
			const start = performance.now();
			const length = opening ? 1100 : 950;
			// 閉じるときは項目が沈みきるのを待ってから畳む
			const wait = opening ? 0 : 380;
			const frame = (now: number) => {
				const progress = Math.max(0, (now - start - wait) / length);
				draw(progress, opening);
				if (progress < 1) requestAnimationFrame(frame);
				else resolve();
			};
			requestAnimationFrame(frame);
		});
	}

	let isOpen = false;
	async function sync(open: boolean) {
		if (open === isOpen) return;
		isOpen = open;
		menu.moving = true;
		if (open) {
			dialog.show();
			// 表示した直後の同じフレームで動きを始めると、ブラウザが動きを飛ばすので 2 フレーム待つ
			await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
			shown = true;
			const done = animate(true);
			await tick();
			dialog.querySelector('a')?.focus({ preventScroll: true });
			await done;
		} else {
			shown = false;
			await animate(false);
			dialog.close();
			document.getElementById('menu-button')?.focus({ preventScroll: true });
		}
		menu.moving = false;
		// 動きの途中で切り替えられていたら、最後の状態に合わせ直す
		if (menu.open !== isOpen) sync(menu.open);
	}

	$effect(() => {
		const open = menu.open;
		if (dialog) sync(open);
	});

	onMount(() => {
		reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
		context = sheet.getContext('2d');
		layout();
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && menu.open) menu.open = false;
		};
		addEventListener('resize', layout);
		addEventListener('keydown', onKey);
		return () => {
			removeEventListener('resize', layout);
			removeEventListener('keydown', onKey);
		};
	});
</script>

<dialog id="site-menu" class="menu" class:shown bind:this={dialog} aria-label={m.menu_open()}>
	<canvas class="sheet" bind:this={sheet} aria-hidden="true"></canvas>
	<nav class="nav">
		<ul>
			{#each items as item, i (item.label)}
				<li style:--i={i}>
					<a href={item.href} onclick={() => (menu.open = false)}>
						<span class="label">{item.label}</span>
						<span class="sub">{item.sub}</span>
					</a>
				</li>
			{/each}
		</ul>
		<p class="contacts" style:--i={items.length}>
			<a href={profile.github} rel="me" aria-label="GitHub"><GithubLogoIcon size="1.5em" aria-hidden="true" /></a>
			<a href={profile.x} rel="me" aria-label="X (@grdevtom2gramp1)"><XLogoIcon size="1.5em" aria-hidden="true" /></a>
			<a href="mailto:{profile.email}" aria-label={m.contact_mail({ email: profile.email })}>
				<EnvelopeSimpleIcon size="1.5em" aria-hidden="true" />
			</a>
		</p>
		<div class="locale" style:--i={items.length + 1}><LocaleSwitch /></div>
	</nav>
</dialog>

<style>
	:global(:root:has(dialog.menu[open])) {
		overflow: hidden;
	}

	.menu {
		position: fixed;
		inset: 0;
		z-index: 20;
		width: 100%;
		max-width: none;
		height: 100%;
		max-height: none;
		margin: 0;
		padding: 0;
		border: none;
		background: transparent;
		color: var(--brand-on-menu);
	}

	.menu[open] {
		display: block;
	}

	.sheet {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}

	.nav {
		position: relative;
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 3rem;
		height: 100%;
		padding: 0 max(1.5rem, 8vw);
	}

	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li + li {
		margin-top: 0.5rem;
	}

	/* 項目は行の中に隠しておき、下から上がる。閉じるときは加速しながら沈む */
	li,
	.contacts {
		/* 焦点の枠が切れないよう、隠す範囲を少し広げておく */
		margin-inline: -0.5rem;
		padding: 0.5rem;
		/* hidden だと、開いた直後に項目へ焦点を移したとき行の中身がスクロールされて文字が見切れる。
		   clip はスクロールできない切り抜きなので、焦点が来ても中身は動かない */
		overflow: clip;
	}

	.nav li a,
	.contacts a {
		display: inline-flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0 1.25rem;
		color: inherit;
		text-decoration: none;
		transform: translateY(110%);
		transition: transform 0.5s cubic-bezier(0.7, 0, 0.84, 0);
	}

	.shown .nav li a,
	.shown .contacts a {
		transform: none;
		transition: transform var(--duration-mid) var(--ease-out) calc(0.45s + var(--i) * 0.09s);
	}

	.label {
		font-family: var(--font-display);
		font-size: clamp(3rem, 10vw, 7rem);
		font-weight: 700;
		line-height: 1.05;
		letter-spacing: -0.04em;
	}

	.sub {
		color: var(--brand-menu-accent);
		font-size: var(--font-size-16);
	}

	@media (hover: hover) {
		.nav li a:hover .label {
			color: var(--brand-menu-accent);
		}
	}

	.contacts {
		display: flex;
		gap: 1.75rem;
		margin-block: 0;
	}

	/* 日英の切り替えは、ヘッダーに置けないスマホのときだけメニューに出す */
	.locale {
		display: none;
		margin: -2rem -0.5rem 0;
		padding: 0.5rem;
		overflow: clip;
	}

	@media (max-width: 40rem) {
		.locale {
			display: block;
		}
	}

	.locale :global(.locales) {
		transform: translateY(110%);
		transition: transform 0.5s cubic-bezier(0.7, 0, 0.84, 0);
	}

	.shown .locale :global(.locales) {
		transform: none;
		transition: transform var(--duration-mid) var(--ease-out) calc(0.45s + var(--i) * 0.09s);
	}

	.nav a:focus-visible {
		outline: 0.1875rem solid currentColor;
		outline-offset: 0.25rem;
		border-radius: var(--border-radius-4);
	}

	@media (prefers-reduced-motion: reduce) {
		.nav li a,
		.contacts a,
		.shown .nav li a,
		.shown .contacts a,
		.locale :global(.locales),
		.shown .locale :global(.locales) {
			transition: none;
		}
	}
</style>
