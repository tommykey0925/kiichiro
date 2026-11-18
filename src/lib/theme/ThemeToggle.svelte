<script lang="ts">
	import { onMount } from 'svelte';
	import SunIcon from 'phosphor-svelte/lib/SunIcon';
	import MoonIcon from 'phosphor-svelte/lib/MoonIcon';
	import MonitorIcon from 'phosphor-svelte/lib/MonitorIcon';
	import { applyMode, loadMode, nextMode, saveMode, type ThemeMode } from './theme';
	import { m } from '$lib/paraglide/messages';

	const labels: Record<ThemeMode, () => string> = {
		light: m.theme_light,
		dark: m.theme_dark,
		system: m.theme_system
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
	class="header-button"
	type="button"
	onclick={toggle}
	aria-label={m.theme_toggle({ current: labels[mode](), next: labels[nextMode(mode)]() })}
	title={m.theme_title({ current: labels[mode]() })}
>
	<span class="icon light"><SunIcon size="1.25em" aria-hidden="true" /></span>
	<span class="icon dark"><MoonIcon size="1.25em" aria-hidden="true" /></span>
	<span class="icon system"><MonitorIcon size="1.25em" aria-hidden="true" /></span>
</button>

<style>
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
