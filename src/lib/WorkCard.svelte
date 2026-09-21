<script lang="ts">
	import type { Work } from './works';

	let { work }: { work: Work } = $props();
</script>

<a class="card" href="/works/{work.id}">
	<h3>{work.title}</h3>
	<p>{work.summary}</p>
	<ul class="tech">
		{#each work.tech.slice(0, 5) as t (t)}
			<li class="tag">{t}</li>
		{/each}
		{#if work.tech.length > 5}
			<li class="tag">+{work.tech.length - 5}</li>
		{/if}
	</ul>
	{#if work.liveUrl}
		<span class="live">Live</span>
	{/if}
</a>

<style>
	.card {
		position: relative;
		display: block;
		padding: 1.25rem 1.35rem;
		border: 1px solid var(--line);
		border-radius: var(--border-radius-12);
		background: var(--surface);
		color: inherit;
		text-decoration: none;
		transition: border-color 0.15s ease;
	}

	.card:hover {
		border-color: var(--color-neutral-solid-gray-400);
	}

	h3 {
		margin: 0 0 0.4rem;
		font-size: var(--font-size-18);
		line-height: var(--line-height-150);
	}

	p {
		margin: 0 0 0.85rem;
		color: var(--muted);
		font-size: var(--font-size-16);
		line-height: var(--line-height-170);
	}

	.tech {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.live {
		position: absolute;
		top: 1.25rem;
		right: 1.35rem;
		color: var(--color-semantic-success-2);
		font-size: var(--font-size-14);
		font-weight: var(--font-weight-700);
		letter-spacing: 0.06em;
	}
</style>
