<script lang="ts">
	import GithubLogoIcon from 'phosphor-svelte/lib/GithubLogoIcon';
	import Sky from '$lib/brand/Sky.svelte';
	import { localize } from '$lib/i18n/localize';
	import { m } from '$lib/paraglide/messages';
	import { localizeHref } from '$lib/paraglide/runtime';

	let { data } = $props();
	const work = $derived(data.work);
</script>

<svelte:head>
	<title>{m.work_title({ title: work.title })}</title>
	<meta name="description" content={localize(work.summary)} />
	<meta property="og:title" content={work.title} />
	<meta property="og:description" content={localize(work.summary)} />
	<meta property="og:type" content="website" />
</svelte:head>

<Sky />

<div class="wrap">
<div class="sheet sign sign-post">
	<a class="back" href={localizeHref('/')}>{m.back_to_list()}</a>

	<h1>{work.title}</h1>
	<p class="summary">{localize(work.pitch ?? work.summary)}</p>

	<ul class="tech">
		{#each work.tech.map(localize) as t (t)}
			<li class="tag">{t}</li>
		{/each}
	</ul>

	{#if work.credits}
		<aside class="credits">
			<h2>{m.credits_heading()}</h2>
			<ul>
				{#each work.credits as credit (credit)}
					<li>{credit}</li>
				{/each}
			</ul>
		</aside>
	{/if}

	<p class="links">
		<a class="pill icon" href={work.repo} rel="noreferrer" aria-label="GitHub">
			<GithubLogoIcon size="1.25em" aria-hidden="true" />
		</a>
		{#if work.liveUrl}
			<a class="pill pill-primary" href={work.liveUrl} rel="noreferrer">
				<span class="beacon"></span>{m.open_site()}
			</a>
		{/if}
	</p>
</div>
</div>

<style>
	.sheet {
		margin-top: 1rem;
		margin-bottom: 4rem;
		padding: clamp(1.25rem, 4vw, 2.5rem);
	}

	.back {
		display: inline-block;
		margin-bottom: 2rem;
		color: var(--char-soft);
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

	.credits {
		margin-bottom: 2rem;
		padding: 1rem 1.2rem;
		border: 1px solid var(--wood-grain);
		border-radius: var(--border-radius-12);
		background: var(--wood-pale);
		color: var(--char-soft);
		font-size: var(--font-size-14);
	}

	.credits h2 {
		margin: 0 0 0.5rem;
		font-size: var(--font-size-16);
		font-weight: var(--font-weight-700);
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
