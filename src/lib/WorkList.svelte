<!--
	主な作品の下に並べる、ほかの作品の一覧。1 行に番号・名前・説明と、右端に小さな作品の部屋。
-->
<script lang="ts">
	import type { Work } from './works';
	import { localize } from './i18n/localize';
	import { localizeHref } from './paraglide/runtime';
	import Cell from './brand/Cell.svelte';
	import { detour } from './forage/state.svelte';
	import { reveal } from './motion/reveal';

	let { works, start = 1 }: { works: Work[]; start?: number } = $props();
</script>

<ol class="list" {start}>
	{#each works as work, i (work.id)}
		<li class="row" use:detour={work.id} use:reveal>
			<span class="no" aria-hidden="true">{String(start + i).padStart(2, '0')}</span>
			<p class="name"><a href={localizeHref(`/works/${work.id}`)}>{work.title}</a></p>
			<div class="text">
				<p>{localize(work.summary)}</p>
				<p class="tech">{work.tech.map(localize).join(' / ')}</p>
			</div>
			<span class="row-cell"><Cell id={work.id} color={work.spot?.color ?? 'var(--brand-petal)'} size="2.6rem" /></span>
		</li>
	{/each}
</ol>

<style>
	.list {
		margin: 3rem 0 0;
		padding: 0;
		list-style: none;
	}

	.row {
		display: grid;
		grid-template-columns: 3rem 11rem minmax(0, 1fr) 2.6rem;
		gap: 1.25rem;
		align-items: center;
		padding: 1.125rem 0;
		border-bottom: 1px solid var(--line);
	}

	p {
		margin: 0;
	}

	.no {
		color: var(--muted);
		font: 500 var(--font-size-16) var(--font-display);
	}

	.name {
		font: 700 var(--font-size-18, 1.125rem) / 1.3 var(--font-display);
		overflow-wrap: anywhere;
	}

	.name a {
		color: inherit;
		text-decoration: underline 0.125rem transparent;
		text-underline-offset: 0.3rem;
		transition: text-decoration-color 0.4s;
	}

	.row:hover .name a,
	.name a:focus-visible {
		text-decoration-color: var(--brand-honey);
	}

	.text {
		color: var(--muted);
		font-size: var(--font-size-14);
		line-height: var(--line-height-160);
	}

	.tech {
		margin-top: 0.25rem;
	}

	@media (max-width: 45rem) {
		.row {
			grid-template-columns: 2.2rem minmax(0, 1fr) 2rem;
			grid-template-areas: 'no name cell' 'text text text';
			row-gap: 0.5rem;
		}

		.no {
			grid-area: no;
		}

		.name {
			grid-area: name;
		}

		.text {
			grid-area: text;
		}

		.row-cell {
			--cell-size: 2rem;
			grid-area: cell;
		}
	}
</style>
