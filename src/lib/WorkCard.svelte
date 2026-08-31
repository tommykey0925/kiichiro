<script lang="ts">
	import type { Work } from './works';

	let { work }: { work: Work } = $props();
</script>

<a class="card" href="/works/{work.id}">
	<h3>{work.title.ja}</h3>
	<p>{work.summary.ja}</p>
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
		border-radius: var(--radius);
		background: var(--surface);
		color: inherit;
		text-decoration: none;
		transition:
			transform 0.15s ease,
			box-shadow 0.15s ease;
	}

	.card:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 24px rgb(35 32 28 / 0.08);
	}

	h3 {
		margin: 0 0 0.4rem;
		font-size: 1.05rem;
	}

	p {
		margin: 0 0 0.85rem;
		color: var(--muted);
		font-size: 0.9rem;
		line-height: 1.7;
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
		color: var(--accent);
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.06em;
	}
</style>
