<script lang="ts">
	import GithubIcon from '$lib/GithubIcon.svelte';

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

	{#if work.credits}
		<aside class="credits">
			<h2>使用素材</h2>
			<ul>
				{#each work.credits as credit (credit)}
					<li>{credit}</li>
				{/each}
			</ul>
		</aside>
	{/if}

	<p class="links">
		<a class="pill icon" href={work.repo} rel="noreferrer" aria-label="GitHub">
			<GithubIcon />
		</a>
		{#if work.liveUrl}
			<a class="pill pill-primary" href={work.liveUrl} rel="noreferrer">
				<span class="beacon"></span>サイトに遷移
			</a>
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

	.credits {
		margin-bottom: 2rem;
		padding: 1rem 1.2rem;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: var(--surface);
		color: var(--muted);
		font-size: 0.8rem;
	}

	.credits h2 {
		margin: 0 0 0.5rem;
		font-size: 0.8rem;
		font-weight: 600;
	}

	.credits ul {
		margin: 0;
		padding-left: 1.1rem;
	}

	.links {
		display: flex;
		gap: 0.75rem;
	}
</style>
