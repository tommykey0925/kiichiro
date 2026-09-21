<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '@digital-go-jp/design-tokens/dist/tokens.css';
	import '@fontsource/noto-sans-jp/400.css';
	import '@fontsource/noto-sans-jp/700.css';
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
