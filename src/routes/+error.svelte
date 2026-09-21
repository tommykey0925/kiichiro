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
	<a href="/">← 一覧に戻る</a>
</div>

<style>
	h1 {
		margin: 0 0 0.5rem;
		font-size: clamp(var(--font-size-28), 5vw, var(--font-size-36));
		line-height: var(--line-height-130);
	}

	p {
		margin: 0 0 1.5rem;
		color: var(--muted);
	}
</style>
