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

<div class="wrap">
	<h1>{page.status}</h1>
	<p>{page.status === 404 ? m.not_found() : page.error?.message}</p>
	<a href={localizeHref('/')}>{m.back_to_list()}</a>
</div>

<style>
	h1 {
		margin: 0 0 0.5rem;
		font-size: clamp(var(--font-size-28), 5vw, var(--font-size-36));
		line-height: var(--line-height-130);
	}

	p {
		margin: 0 0 1.5rem;
		color: var(--char-soft);
	}
</style>
