<script lang="ts">
	import ThemeToggle from './theme/ThemeToggle.svelte';
	import LocaleSwitch from './i18n/LocaleSwitch.svelte';
</script>

<header class="site-header">
	<div class="tools">
		<LocaleSwitch />
		<ThemeToggle />
	</div>
</header>

<style>
	.site-header {
		position: sticky;
		top: 0;
		z-index: 10;
		height: var(--header-height);
		border-bottom: 1px solid var(--line);
		background: var(--bg);
	}

	@supports (backdrop-filter: blur(1rem)) or (-webkit-backdrop-filter: blur(1rem)) {
		.site-header {
			background: rgb(from var(--bg) r g b / 0.72);
			-webkit-backdrop-filter: blur(1rem) saturate(1.8);
			backdrop-filter: blur(1rem) saturate(1.8);
		}
	}

	@media (prefers-reduced-transparency: reduce), (prefers-contrast: more) {
		.site-header {
			background: var(--bg);
			-webkit-backdrop-filter: none;
			backdrop-filter: none;
		}
	}

	.tools {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		gap: 0.25rem;
		max-width: 62rem;
		height: 100%;
		margin: 0 auto;
		padding: 0 0.75rem;
	}
</style>
