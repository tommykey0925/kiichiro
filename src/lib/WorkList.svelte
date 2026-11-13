<script lang="ts">
	import type { Work } from './works';
	import './dads/link.css';

	let { works }: { works: Work[] } = $props();
</script>

<ul class="list">
	{#each works as work (work.id)}
		<li class="item">
			<p class="name">
				<a class="dads-link" href="/works/{work.id}">{work.title}</a>
				{#if work.liveUrl}
					<span class="live">公開中</span>
				{/if}
			</p>
			<p class="summary">{work.summary}</p>
			<p class="tech">{work.tech.join(' / ')}</p>
		</li>
	{/each}
</ul>

<style>
	.list {
		margin: 0;
		padding: 0;
		list-style: none;
		border-top: 1px solid var(--line);
	}

	.item {
		display: grid;
		grid-template-columns: 11rem 1fr;
		column-gap: 1.5rem;
		padding: 0.75rem 0;
		border-bottom: 1px solid var(--line);
	}

	p {
		margin: 0;
	}

	.name {
		grid-row: span 2;
		font-weight: var(--font-weight-700);
		overflow-wrap: anywhere;
	}

	.live {
		display: block;
		color: var(--color-key-900);
		font-size: var(--font-size-14);
	}

	.tech {
		color: var(--muted);
		font-size: var(--font-size-14);
		line-height: var(--line-height-150);
	}

	@media (max-width: 40rem) {
		.item {
			grid-template-columns: 1fr;
		}

		.name {
			grid-row: auto;
		}

		.live {
			display: inline;
			margin-left: 0.5rem;
		}
	}
</style>
