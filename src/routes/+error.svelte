<script lang="ts">
	import { page } from '$app/state';
	import { profile } from '$lib/profile';
	import { m } from '$lib/paraglide/messages';
	import { localizeHref } from '$lib/paraglide/runtime';
</script>

<svelte:head>
	<title>{page.status} — {profile.name}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<!-- 大きな番号と、トップへ戻る行き先だけを置く -->
<section class="error">
	<h1>{page.status}</h1>
	<p>{page.status === 404 ? m.not_found() : page.error?.message}</p>
	<a href={localizeHref('/')}>{m.back_to_list()}</a>
</section>

<style>
	.error {
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		min-height: 100svh;
		max-width: 75rem;
		margin: 0 auto;
		padding: calc(var(--header-height) + 3rem) max(1.25rem, env(safe-area-inset-right, 0)) 12svh max(1.25rem, env(safe-area-inset-left, 0));
	}

	h1 {
		margin: 0 0 1rem;
		font-size: clamp(6rem, 22vw, 16rem);
		line-height: 0.85;
		letter-spacing: -0.05em;
	}

	p {
		margin: 0 0 2rem;
		color: var(--muted);
		font-size: var(--font-size-18, 1.125rem);
	}

	a {
		align-self: flex-start;
		color: inherit;
		font: 700 var(--font-size-20) var(--font-display);
		text-decoration: underline 0.125rem var(--brand-honey);
		text-underline-offset: 0.35rem;
	}
</style>
