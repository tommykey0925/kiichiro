<script lang="ts">
	import type { Work } from './works';
	import './dads/link.css';
	import { localize } from './i18n/localize';
	import { localizeHref } from './paraglide/runtime';
	import Bloom from './brand/Bloom.svelte';
	import { detour } from './forage/state.svelte';

	let { works, start = 1 }: { works: Work[]; start?: number } = $props();
</script>

<ol class="list" {start}>
	{#each works as work, i (work.id)}
		<li class="item" use:detour={work.id}>
			<span class="no">
				<span aria-hidden="true">{String(start + i).padStart(2, '0')}</span>
				<Bloom id={work.id} color={work.spot?.color ?? 'var(--brand-petal)'} size="2.5rem" />
			</span>
			<p class="name">
				<a class="dads-link" href={localizeHref(`/works/${work.id}`)}>{work.title}</a>
			</p>
			<p class="summary">{localize(work.summary)}</p>
			<p class="tech">{work.tech.map(localize).join(' / ')}</p>
		</li>
	{/each}
</ol>

<style>
	.list {
		margin: 0;
		padding: 0;
		list-style: none;
		border-top: 1px solid var(--line);
	}

	.item {
		display: grid;
		grid-template-columns: 3rem 11rem 1fr;
		column-gap: 1.5rem;
		padding: 1rem 0;
		border-bottom: 1px solid var(--line);
	}

	p {
		margin: 0;
	}

	.no {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.25rem;
		grid-row: span 2;
		color: var(--muted);
		font-family: var(--font-display);
		font-size: var(--font-size-20);
		font-weight: 700;
		line-height: var(--line-height-150);
	}

	.name {
		grid-row: span 2;
		font-family: var(--font-display);
		font-size: var(--font-size-20);
		font-weight: 700;
		line-height: var(--line-height-150);
		overflow-wrap: anywhere;
	}

	.tech {
		grid-column: 3;
		color: var(--muted);
		font-size: var(--font-size-14);
		line-height: var(--line-height-150);
	}

	@media (max-width: 40rem) {
		.item {
			grid-template-columns: 2.5rem 1fr;
		}

		.no {
			grid-row: span 3;
		}

		.name {
			grid-row: auto;
		}

		.tech {
			grid-column: 2;
		}
	}
</style>
