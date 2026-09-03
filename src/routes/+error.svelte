<script lang="ts">
	import { page } from '$app/state';
	import { profile } from '$lib/profile';
</script>

<svelte:head>
	<title>{page.status} — {profile.name}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="wrap">
	<h1>{page.status}</h1>
	<p>{page.status === 404 ? 'そのページはありません。' : page.error?.message}</p>
	<a href="/">← Works</a>
</div>

<style>
	h1 {
		margin: 0 0 0.5rem;
		font-size: clamp(1.8rem, 5vw, 2.6rem);
	}

	p {
		margin: 0 0 1.5rem;
		color: var(--muted);
	}
</style>
