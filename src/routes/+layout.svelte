<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '@digital-go-jp/design-tokens/dist/tokens.css';
	import '$lib/theme/dark.css';
	import '$lib/fonts/noto-sans-jp.css';
	import '../app.css';
	import SiteHeader from '$lib/SiteHeader.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<SiteHeader />

{@render children()}
