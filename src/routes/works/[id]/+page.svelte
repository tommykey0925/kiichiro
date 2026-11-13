<script lang="ts">
	import GithubIcon from '$lib/GithubIcon.svelte';

	let { data } = $props();
	const work = $derived(data.work);
</script>

<svelte:head>
	<title>{work.title} — 制作物</title>
	<meta name="description" content={work.summary} />
	<meta property="og:title" content={work.title} />
	<meta property="og:description" content={work.summary} />
	<meta property="og:type" content="website" />
</svelte:head>

<div class="wrap">
	<a class="back" href="/">← 一覧に戻る</a>

	<h1>{work.title}</h1>
	<p class="summary">{work.pitch ?? work.summary}</p>

	<ul class="tech">
		{#each work.tech as t (t)}
			<li class="tag">{t}</li>
		{/each}
	</ul>


	<p class="links">
		<a class="pill icon" href={work.repo} rel="noreferrer" aria-label="GitHub">
			<GithubIcon />
		</a>
		{#if work.liveUrl}
			<a class="pill pill-primary" href={work.liveUrl} rel="noreferrer">
				<span class="beacon"></span>サイトを開く
			</a>
		{/if}
	</p>
</div>

<style>
	.back {
		display: inline-block;
		margin-bottom: 2rem;
		color: var(--muted);
		font-size: var(--font-size-14);
		text-decoration: none;
	}

	h1 {
		margin: 0 0 0.75rem;
		font-size: clamp(var(--font-size-26), 4vw, var(--font-size-32));
		line-height: var(--line-height-130);
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
