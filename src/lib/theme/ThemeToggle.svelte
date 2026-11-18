<script lang="ts">
	import { onMount } from 'svelte';
	import SunIcon from 'phosphor-svelte/lib/SunIcon';
	import MoonIcon from 'phosphor-svelte/lib/MoonIcon';
	import MonitorIcon from 'phosphor-svelte/lib/MonitorIcon';
	import { applyMode, loadMode, nextMode, saveMode, type ThemeMode } from './theme';

	const labels: Record<ThemeMode, string> = {
		light: 'ライト',
		dark: 'ダーク',
		system: 'OS に合わせる'
	};

	let mode = $state<ThemeMode>('system');

	onMount(() => {
		mode = loadMode();
	});

	function toggle() {
		mode = nextMode(mode);
		saveMode(mode);
		applyMode(mode);
	}
</script>

<button
	class="toggle"
	type="button"
	onclick={toggle}
	aria-label="表示モード: {labels[mode]}。押すと{labels[nextMode(mode)]}に切り替える"
	title="表示モード: {labels[mode]}"
>
	<span class="icon light"><SunIcon size="1.25em" aria-hidden="true" /></span>
	<span class="icon dark"><MoonIcon size="1.25em" aria-hidden="true" /></span>
	<span class="icon system"><MonitorIcon size="1.25em" aria-hidden="true" /></span>
</button>

<style>
	.toggle {
		display: inline-grid;
		place-items: center;
		width: 2.25rem;
		height: 2.25rem;
		padding: 0;
		border: none;
		border-radius: var(--border-radius-8);
		background: none;
		color: var(--ink);
		font-size: var(--font-size-16);
		cursor: pointer;
	}

	.toggle:focus-visible {
		outline: calc(4 / 16 * 1rem) solid var(--color-neutral-black);
		outline-offset: calc(-4 / 16 * 1rem);
	}

	@media (hover: hover) {
		.toggle:hover {
			background: var(--color-neutral-opacity-gray-100);
		}
	}

	.icon {
		display: none;
		grid-area: 1 / 1;
	}

	:global(:root[data-theme='light']) .light,
	:global(:root[data-theme='dark']) .dark,
	:global(:root:not([data-theme])) .system {
		display: inline-flex;
	}
</style>
