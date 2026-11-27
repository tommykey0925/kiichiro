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
	import { afterNavigate, onNavigate } from '$app/navigation';
	import { onMount } from 'svelte';
	import { profile } from '$lib/profile';
	import { deLocalizeHref, locales, localizeHref } from '$lib/paraglide/runtime';

	let { children } = $props();

	// 札 (.sign-post) は画面に入ったら起き上がらせる。ページが移ったら新しい札も見張る
	let observer: IntersectionObserver | undefined;
	const plant = () => document.querySelectorAll('.sign-post:not(.stood)').forEach((sign) => observer?.observe(sign));

	onMount(() => {
		observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (!entry.isIntersecting) continue;
					entry.target.classList.add('stood');
					observer?.unobserve(entry.target);
				}
			},
			{ threshold: 0.1 }
		);
		plant();
		return () => observer?.disconnect();
	});

	afterNavigate(plant);

	// ページを移るときはヘッダーの札を残して野原を入れ替える (app.css の view-transition)
	onNavigate((navigation) => {
		if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		if (navigation.from?.url.pathname === navigation.to?.url.pathname) return;
		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});
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
