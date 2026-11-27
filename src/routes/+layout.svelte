<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '@digital-go-jp/design-tokens/dist/tokens.css';
	import '$lib/theme/dark.css';
	import '$lib/fonts/noto-sans-jp.css';
	import '@fontsource/jost/latin-500.css';
	import '@fontsource/jost/latin-700.css';
	import '$lib/theme/brand.css';
	import '$lib/theme/sign.css';
	import '../app.css';
	import SiteHeader from '$lib/SiteHeader.svelte';
	import Field from '$lib/brand/Field.svelte';
	import { page } from '$app/state';
	import { profile } from '$lib/profile';
	import { deLocalizeHref, locales, localizeHref } from '$lib/paraglide/runtime';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	{#each locales as locale (locale)}
		<link rel="alternate" hreflang={locale} href="{profile.site}{localizeHref(deLocalizeHref(page.url.pathname), { locale })}" />
	{/each}
	<link rel="alternate" hreflang="x-default" href="{profile.site}{deLocalizeHref(page.url.pathname)}" />
</svelte:head>

<Field>
	<SiteHeader />
	{@render children()}
</Field>
