<script lang="ts">
	import ThemeToggle from './theme/ThemeToggle.svelte';
	import LocaleSwitch from './i18n/LocaleSwitch.svelte';
	import SiteMenu from './SiteMenu.svelte';
	import Logo from './brand/Logo.svelte';
	import Comb from './forage/Comb.svelte';
	import { localizeHref } from './paraglide/runtime';
</script>

<header class="site-header">
	<div class="inner">
		<div class="start">
			<a class="home" href={localizeHref('/')}><Logo /></a>
			<Comb />
		</div>
		<div class="tools">
			<LocaleSwitch />
			<ThemeToggle />
			<SiteMenu />
		</div>
	</div>
</header>

<style>
	/* 文字の上に重ならないよう、背景は常に不透明にする */
	.site-header {
		position: sticky;
		top: 0;
		z-index: 10;
		height: var(--header-height);
		border-bottom: 1px solid var(--wood-grain);
		background: var(--wood);
	}

	.inner {
		display: flex;
		justify-content: space-between;
		align-items: center;
		max-width: 80rem;
		height: 100%;
		margin: 0 auto;
		padding: 0 clamp(0.75rem, 3vw, 2rem);
	}

	.home {
		color: var(--char);
		font-size: var(--font-size-20);
		text-decoration: none;
	}

	.home:focus-visible {
		outline: 4px solid var(--char);
		outline-offset: 2px;
		border-radius: var(--border-radius-4);
	}

	.start {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.tools {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}
</style>
