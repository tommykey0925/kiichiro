<!--
	全画面メニュー。野原に立てた大きな札に行き先を書き、空には蜂が飛ぶ。
	<dialog> の showModal を使うので、Esc で閉じる・フォーカスの閉じ込め・開いたボタンへの復帰はブラウザに任せる。
	動くのは生き物と風と光だけ (CLAUDE.md「コンセプト」) なので、項目を時間差で出す動きは付けない。
-->
<script lang="ts">
	import GithubLogoIcon from 'phosphor-svelte/lib/GithubLogoIcon';
	import XLogoIcon from 'phosphor-svelte/lib/XLogoIcon';
	import EnvelopeSimpleIcon from 'phosphor-svelte/lib/EnvelopeSimpleIcon';
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
	<div class="sky" aria-hidden="true">
		<Mascot pose="side" class="menu-bee" />
	</div>
	<svg class="ridge" viewBox="0 0 1200 60" preserveAspectRatio="none" aria-hidden="true">
		<path class="hill" d="M0 30 C 220 8, 420 34, 640 20 S 1020 6, 1200 22 V60 H0 Z" />
		<path class="crest" d="M0 30 C 220 8, 420 34, 640 20 S 1020 6, 1200 22" />
	</svg>

	<div class="board sign sign-post">
		<nav>
			<ul>
				{#each items as item (item.label)}
					<li>
						<a href={item.href} onclick={hide}>
							<span class="label">{item.label}</span>
							<span class="sub">{item.sub}</span>
						</a>
					</li>
				{/each}
			</ul>
		</nav>

		<p class="contacts">
			<a href={profile.github} rel="me" aria-label="GitHub"><GithubLogoIcon size="1.5em" aria-hidden="true" /></a>
			<a href={profile.x} rel="me" aria-label="X (@grdevtom2gramp1)"><XLogoIcon size="1.5em" aria-hidden="true" /></a>
			<a href="mailto:{profile.email}" aria-label={m.contact_mail({ email: profile.email })}>
				<EnvelopeSimpleIcon size="1.5em" aria-hidden="true" />
			</a>
		</p>
	</div>

	<button class="header-button close sign" type="button" onclick={hide} aria-label={m.menu_close()}>
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

	/* 空と草地。札の杭は草地に刺さる */
	.menu {
		width: 100%;
		max-width: none;
		height: 100%;
		max-height: none;
		margin: 0;
		padding: 0;
		border: none;
		background: linear-gradient(var(--sky-top), var(--sky-horizon) 58%, var(--grass) 58%, color-mix(in oklab, var(--grass) 82%, var(--grass-deep)));
		color: var(--char);
	}

	.menu[open] {
		display: grid;
		grid-template-rows: 1fr auto 1fr;
		justify-items: start;
		padding: 0 clamp(1.25rem, 8vw, 7rem);
	}

	.menu::backdrop {
		background: transparent;
	}

	.sky {
		position: absolute;
		top: 8%;
		right: clamp(0.5rem, 8vw, 8rem);
		width: clamp(9rem, 30vw, 24rem);
		pointer-events: none;
	}

	.sky :global(.menu-bee) {
		width: 100%;
		height: auto;
	}

	/* 空と草地の境の丘。札より奥 */
	.ridge {
		position: absolute;
		top: calc(58% - 3.5rem);
		left: 0;
		width: 100%;
		height: 3.6rem;
		pointer-events: none;
	}

	.hill {
		fill: var(--grass);
	}

	.crest {
		fill: none;
		stroke: var(--char);
		stroke-width: 2;
		vector-effect: non-scaling-stroke;
	}

	.board {
		position: relative;
		grid-row: 2;
		display: flex;
		flex-direction: column;
		gap: 2rem;
		padding: clamp(1.25rem, 4vw, 2.5rem) clamp(1.5rem, 5vw, 3.5rem);
		--post-height: 4rem;
	}

	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li + li {
		margin-top: 0.5rem;
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
		font-size: clamp(2.25rem, 7vw, 4.5rem);
		font-weight: 700;
		line-height: 1.1;
		letter-spacing: -0.01em;
	}

	.sub {
		color: var(--char-soft);
		font-size: var(--font-size-16);
	}

	@media (hover: hover) {
		nav a:hover .label {
			color: var(--petal);
		}
	}

	.menu a:focus-visible,
	.menu button:focus-visible {
		outline: 4px solid var(--char);
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

	.close {
		position: absolute;
		top: 0.4rem;
		right: clamp(0.75rem, 3vw, 2rem);
		border: 2px solid var(--char);
		background: var(--wood);
		box-shadow: none;
	}

	@media (max-width: 40rem) {
		.sky {
			top: 12%;
		}
	}
</style>
