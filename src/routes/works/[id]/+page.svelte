<script lang="ts">
	let { data } = $props();
	const work = $derived(data.work);
</script>

<svelte:head>
	<title>{work.title.ja} — Works</title>
	<meta name="description" content={work.summary.ja} />
	<meta property="og:title" content={work.title.ja} />
	<meta property="og:description" content={work.summary.ja} />
	<meta property="og:type" content="website" />
</svelte:head>

<div class="wrap">
	<a class="back" href="/">← Works</a>

	<h1>{work.title.ja}</h1>
	<p class="summary">{work.summary.ja}</p>

	<ul class="tech">
		{#each work.tech as t (t)}
			<li class="tag">{t}</li>
		{/each}
	</ul>

	<p class="links">
		<a class="pill" href={work.repo} rel="noreferrer">GitHub</a>
		{#if work.liveUrl}
			<a class="pill pill-primary" href={work.liveUrl} rel="noreferrer">Live デモ</a>
		{/if}
	</p>
</div>

<style>
	.back {
		display: inline-block;
		margin-bottom: 2rem;
		color: var(--muted);
		font-size: 0.85rem;
		text-decoration: none;
	}

	h1 {
		margin: 0 0 0.75rem;
		font-size: clamp(1.6rem, 4vw, 2.2rem);
	}

	.summary {
		max-width: 42rem;
		margin: 0 0 1.5rem;
	}

	.tech {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		margin: 0 0 2rem;
		padding: 0;
		list-style: none;
	}

	.links {
		display: flex;
		gap: 0.75rem;
	}
</style>
