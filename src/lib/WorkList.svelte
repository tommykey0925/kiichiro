<script lang="ts">
	import type { Work } from './works';
	import './dads/link.css';
	import { localize } from './i18n/localize';
	import { localizeHref } from './paraglide/runtime';
	import Bloom from './brand/Bloom.svelte';
	import { detour } from './forage/state.svelte';

	let { works, start = 1 }: { works: Work[]; start?: number } = $props();
</script>

<div class="sign sign-post board">
<ol class="list" {start}>
	{#each works as work, i (work.id)}
		<li class="item" use:detour={work.id}>
			<span class="no">
				<span aria-hidden="true">{String(start + i).padStart(2, '0')}</span>
				<Bloom id={work.id} color={work.spot?.color ?? 'var(--petal)'} size="2.5rem" />
			</span>
			<p class="name">
				<a class="dads-link" href={localizeHref(`/works/${work.id}`)}>{work.title}</a>
			</p>
			<p class="summary">{localize(work.summary)}</p>
			<p class="tech">{work.tech.map(localize).join(' / ')}</p>
		</li>
	{/each}
</ol>
</div>

<style>
	.board {
		padding: 0.5rem 1.5rem;
	}

	.list {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.item {
		position: relative;
		display: grid;
		grid-template-columns: 3rem 11rem 1fr;
		column-gap: 1.5rem;
		padding: 1rem 0;
	}

	/* 行の区切りは罫線でなく、板の木目 (波打つ線) */
	.item:not(:last-child)::after {
		content: '';
		position: absolute;
		right: 0;
		bottom: -3px;
		left: 0;
		height: 6px;
		background: var(--wood-grain);
		mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='90' height='6'%3E%3Cpath d='M0 3 C 15 0, 30 6, 45 3 S 75 1, 90 3' fill='none' stroke='black' stroke-width='1.6'/%3E%3C/svg%3E") repeat-x;
		mask-size: 90px 6px;
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
		color: var(--char-soft);
		font-family: var(--font-sign-title);
		font-size: var(--font-size-20);
		font-weight: 700;
		line-height: var(--line-height-150);
	}

	.name {
		grid-row: span 2;
		font-family: var(--font-sign-title);
		font-size: var(--font-size-20);
		font-weight: 700;
		line-height: var(--line-height-150);
		overflow-wrap: anywhere;
	}

	.tech {
		grid-column: 3;
		color: var(--char-soft);
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
