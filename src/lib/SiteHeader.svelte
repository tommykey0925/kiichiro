<!--
	ヘッダー。透明のまま本文の上に重ねる。
	読み進めたぶんだけページと一緒に上へずれて消え、戻ったぶんだけ降りてくる。途中で止まったら近いほうへゆっくり収まる。
	一番上の近く・メニューを開いているとき・ヘッダーに焦点があるときは出したまま。
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import ThemeToggle from './theme/ThemeToggle.svelte';
	import LocaleSwitch from './i18n/LocaleSwitch.svelte';
	import SiteMenu from './SiteMenu.svelte';
	import Logo from './brand/Logo.svelte';
	import Comb from './forage/Comb.svelte';
	import { menu } from './menu.svelte';
	import { m } from './paraglide/messages';
	import { localizeHref } from './paraglide/runtime';

	let header: HTMLElement;
	let offset = $state(0);
	let settling = $state(false);

	$effect(() => {
		if (menu.open) {
			settling = true;
			offset = 0;
		}
	});

	onMount(() => {
		let lastY = scrollY;
		let idle = 0;
		const onScroll = () => {
			const y = scrollY;
			const dy = y - lastY;
			lastY = y;
			if (menu.open) return;
			const height = header.offsetHeight + 8;
			settling = false;
			offset = y < 4 ? 0 : Math.min(height, Math.max(0, offset + dy));
			clearTimeout(idle);
			idle = window.setTimeout(() => {
				if (offset <= 0 || offset >= height) return;
				settling = true;
				offset = offset > height / 2 && scrollY > height ? height : 0;
			}, 150);
		};
		addEventListener('scroll', onScroll, { passive: true });
		return () => {
			removeEventListener('scroll', onScroll);
			clearTimeout(idle);
		};
	});

	function toggle() {
		if (!menu.moving) menu.open = !menu.open;
	}
</script>

<header
	class="site-header"
	class:settling
	class:over-menu={menu.open || menu.moving}
	class:menu-open={menu.open}
	style:translate="0 {-offset}px"
	bind:this={header}
	onfocusin={() => {
		settling = true;
		offset = 0;
	}}
>
	<div class="start">
		<a class="home" href={localizeHref('/')}><Logo /></a>
		<Comb />
	</div>
	<div class="tools">
		<LocaleSwitch />
		<ThemeToggle />
		<button
			id="menu-button"
			class="menu-button"
			type="button"
			onclick={toggle}
			aria-label={menu.open ? m.menu_close() : m.menu_open()}
			aria-expanded={menu.open}
			aria-controls="site-menu"
		>
			<span class="label" aria-hidden="true">{menu.open ? 'Close' : 'Menu'}</span>
			<span class="bars" aria-hidden="true"></span>
		</button>
	</div>
</header>

<SiteMenu />

<style>
	.site-header {
		position: fixed;
		inset: 0 0 auto;
		z-index: 25;
		display: flex;
		justify-content: space-between;
		align-items: center;
		height: var(--header-height);
		padding: env(safe-area-inset-top, 0) max(1.25rem, env(safe-area-inset-right, 0)) 0 max(1.25rem, env(safe-area-inset-left, 0));
		box-sizing: content-box;
		color: var(--ink);
		pointer-events: none;
		transition: color 0.4s var(--ease-out);
	}

	.site-header > * {
		pointer-events: auto;
	}

	.settling {
		transition:
			translate 0.5s cubic-bezier(0.33, 1, 0.68, 1),
			color 0.4s var(--ease-out);
	}

	/* メニューの地の上では、メニューの文字色にする。開くときは六角形が右上を覆うのを待って色を変え、
	   閉じるときは畳み終わるまで (menu.moving の間) メニュー側の色のままにする。
	   ロゴの六角形は地と同じ蜜色になる (ダーク) ので差し色にする */
	.over-menu {
		color: var(--brand-on-menu);
		transition: color 0.6s var(--ease-out) 0.3s;
	}

	.over-menu .home :global(.dot) {
		background: var(--brand-menu-accent);
	}

	/* 蜂の巣もメニューの地に合わせる。縁は文字色、空き部屋は地の色、蜜のたまった部屋は差し色 */
	.over-menu :global(.comb .cell) {
		background: currentColor;
	}

	.over-menu :global(.comb .cell::after) {
		background: var(--brand-menu);
	}

	.over-menu :global(.comb .cell.full::after) {
		background: var(--brand-menu-accent);
	}

	.home {
		color: inherit;
		font-size: var(--font-size-20);
		text-decoration: none;
	}

	.start {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.tools {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.menu-button {
		display: inline-flex;
		align-items: center;
		gap: 0.75rem;
		min-height: 2.75rem;
		padding: 0 0.25rem;
		border: 0;
		background: none;
		color: inherit;
		font: 700 0.8rem/1 var(--font-display);
		letter-spacing: 0.14em;
		text-transform: uppercase;
		cursor: pointer;
	}

	.bars {
		position: relative;
		width: 1.625rem;
		height: 0.625rem;
	}

	.bars::before,
	.bars::after {
		content: '';
		position: absolute;
		left: 0;
		width: 100%;
		height: 0.125rem;
		background: currentColor;
		transition:
			translate var(--duration-mid) var(--ease-out),
			rotate var(--duration-mid) var(--ease-out);
	}

	.bars::before {
		top: 0;
	}

	.bars::after {
		bottom: 0;
	}

	.menu-open .bars::before {
		translate: 0 0.25rem;
		rotate: 45deg;
	}

	.menu-open .bars::after {
		translate: 0 -0.25rem;
		rotate: -45deg;
	}

	.home:focus-visible,
	.menu-button:focus-visible {
		outline: 0.1875rem solid currentColor;
		outline-offset: 0.1875rem;
		border-radius: var(--border-radius-4);
	}

	/* スマホでは日英の切り替えをメニューの中へ移し、ヘッダーにはロゴ・蜂の巣・色の切り替え・メニューだけを置く */
	@media (max-width: 40rem) {
		.tools > :global(.locales) {
			display: none;
		}
	}

	@media (max-width: 30rem) {
		.menu-button .label {
			display: none;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.site-header,
		.settling,
		.bars::before,
		.bars::after {
			transition: none;
		}
	}
</style>
