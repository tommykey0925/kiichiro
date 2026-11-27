<!--
	全画面メニュー。開くと右の帯が滑り込み、項目 → 大きなロゴ → 連絡先の順に時間差で出る。
	<dialog> の showModal を使うので、Esc で閉じる・フォーカスの閉じ込め・開いたボタンへの復帰はブラウザに任せる。
	動きを減らす設定では時間差をなくし、一度に出す。
-->
<script lang="ts">
	import GithubLogoIcon from 'phosphor-svelte/lib/GithubLogoIcon';
	import XLogoIcon from 'phosphor-svelte/lib/XLogoIcon';
	import EnvelopeSimpleIcon from 'phosphor-svelte/lib/EnvelopeSimpleIcon';
	import Logo from './brand/Logo.svelte';
	import Mascot from './brand/Mascot.svelte';
	import { profile } from './profile';
	import { m } from './paraglide/messages';
	import { localizeHref } from './paraglide/runtime';

	let dialog: HTMLDialogElement;
	let open = $state(false);

	const items = $derived([
		{ label: 'Works', sub: m.nav_works(), href: localizeHref('/') + '#works' },
		{ label: 'World', sub: m.nav_world(), href: localizeHref('/world') },
		{ label: 'Contact', sub: m.nav_contact(), href: localizeHref('/') + '#contact' }
	]);

	function show() {
		dialog.showModal();
		open = true;
	}

	function hide() {
		dialog.close();
	}
</script>

<button class="header-button opener" type="button" onclick={show} aria-label={m.menu_open()} aria-haspopup="dialog" aria-expanded={open}>
	<span class="bars" aria-hidden="true"></span>
</button>

<dialog class="menu" bind:this={dialog} onclose={() => (open = false)} aria-label={m.menu_open()}>
	<div class="body">
		<nav>
			<ul>
				{#each items as item, i (item.label)}
					<li style:--i={i}>
						<a href={item.href} onclick={hide}>
							<span class="label">{item.label}</span>
							<span class="sub">{item.sub}</span>
						</a>
					</li>
				{/each}
			</ul>
		</nav>

		<p class="contacts" style:--i={items.length + 2}>
			<a href={profile.github} rel="me" aria-label="GitHub"><GithubLogoIcon size="1.5em" aria-hidden="true" /></a>
			<a href={profile.x} rel="me" aria-label="X (@grdevtom2gramp1)"><XLogoIcon size="1.5em" aria-hidden="true" /></a>
			<a href="mailto:{profile.email}" aria-label={m.contact_mail({ email: profile.email })}>
				<EnvelopeSimpleIcon size="1.5em" aria-hidden="true" />
			</a>
		</p>

		<p class="watermark" aria-hidden="true" style:--i={items.length}><Logo /></p>
	</div>

	<div class="strip" aria-hidden="true">
		<Mascot pose="side" class="strip-bee" />
	</div>

	<button class="header-button close" type="button" onclick={hide} aria-label={m.menu_close()}>
		<span class="bars" aria-hidden="true"></span>
	</button>
</dialog>

<style>
	.bars {
		position: relative;
		display: block;
		width: 1.5rem;
		height: 0.75rem;
		border-top: 2px solid currentColor;
		border-bottom: 2px solid currentColor;
		transition: border-color 0.2s ease;
	}

	.close .bars {
		border-color: transparent;
	}

	.close .bars::before,
	.close .bars::after {
		content: '';
		position: absolute;
		top: 50%;
		left: 0;
		width: 100%;
		border-top: 2px solid currentColor;
		translate: 0 -50%;
	}

	.close .bars::before {
		rotate: 45deg;
	}

	.close .bars::after {
		rotate: -45deg;
	}

	:global(:root:has(dialog.menu[open])) {
		overflow: hidden;
	}

	.menu {
		width: 100%;
		max-width: none;
		height: 100%;
		max-height: none;
		margin: 0;
		padding: 0;
		border: none;
		background: var(--char);
		color: var(--wood);
	}

	.menu[open] {
		display: grid;
		grid-template-columns: 1fr minmax(8rem, 24vw);
	}

	.menu::backdrop {
		background: transparent;
	}

	.body {
		position: relative;
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 3rem;
		padding: 5rem clamp(1.25rem, 8vw, 7rem);
		overflow: hidden;
	}

	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li + li {
		margin-top: 1rem;
	}

	nav a {
		display: inline-flex;
		align-items: baseline;
		gap: 1rem;
		color: inherit;
		text-decoration: none;
	}

	.label {
		font-family: var(--font-sign-title);
		font-size: clamp(2.5rem, 7vw, 4.5rem);
		font-weight: 700;
		line-height: 1.1;
		letter-spacing: -0.01em;
	}

	.sub {
		color: var(--honey);
		font-size: var(--font-size-16);
	}

	@media (hover: hover) {
		nav a:hover .label {
			color: var(--honey);
		}
	}

	.menu a:focus-visible,
	.menu button:focus-visible {
		outline: 4px solid var(--honey);
		outline-offset: 4px;
		border-radius: var(--border-radius-4);
	}

	.contacts {
		display: flex;
		gap: 1.25rem;
		margin: 0;
	}

	.contacts a {
		display: inline-flex;
		color: inherit;
	}

	.watermark {
		position: absolute;
		right: -0.05em;
		bottom: -0.2em;
		margin: 0;
		font-size: clamp(5rem, 18vw, 15rem);
		line-height: 1;
		opacity: 0.08;
		pointer-events: none;
	}

	.strip {
		position: relative;
		display: grid;
		place-items: center;
		background-color: var(--honey);
		background-image: radial-gradient(var(--char) 1.2px, transparent 1.4px);
		background-size: 12px 12px;
		overflow: hidden;
	}

	.strip :global(.strip-bee) {
		width: 160%;
		max-width: none;
		rotate: -18deg;
		filter: drop-shadow(10px 10px 0 var(--petal));
	}

	.close {
		position: absolute;
		top: 0.5rem;
		right: 0.75rem;
		color: var(--char);
	}

	@media (max-width: 40rem) {
		.menu[open] {
			grid-template-columns: 1fr;
			grid-template-rows: 1fr 7rem;
		}

		.strip :global(.strip-bee) {
			width: 9rem;
			rotate: -8deg;
		}

		.close {
			color: var(--wood);
		}
	}

	/* 時間差で出す。右の帯 → 項目を 1 つずつ → ロゴ → 連絡先 */
	@media (prefers-reduced-motion: no-preference) {
		.menu[open] .strip {
			animation: slide-in 0.5s cubic-bezier(0.2, 0.7, 0.2, 1) both;
		}

		.menu[open] li,
		.menu[open] .watermark,
		.menu[open] .contacts {
			animation: rise 0.6s cubic-bezier(0.2, 0.7, 0.2, 1) both;
			animation-delay: calc(0.25s + var(--i) * 0.1s);
		}

		.menu[open] .watermark {
			animation-name: rise-faint;
		}
	}

	@keyframes slide-in {
		from {
			translate: 100% 0;
		}
	}

	@keyframes rise {
		from {
			opacity: 0;
			translate: 0 1.5rem;
		}
	}

	@keyframes rise-faint {
		from {
			opacity: 0;
			translate: 0 3rem;
		}
	}
</style>
