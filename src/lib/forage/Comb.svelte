<!--
	ヘッダーの蜂の巣。ページの花 (トップは作品の部屋 Cell、/world は 3D の花) の数だけ部屋があり、
	蜂が訪れた花の数だけ蜜がたまる。花のないページ (詳細ページなど) では出さない。
-->
<script lang="ts">
	import { forage } from './state.svelte';
	import { m } from '$lib/paraglide/messages';

	const ids = $derived(forage.flowers.size > 0 ? [...forage.flowers.keys()] : forage.field);
	const total = $derived(ids.length);
	const visited = $derived(ids.filter((id) => forage.visited.has(id)).length);
</script>

{#if total > 0}
	<span class="comb" role="img" aria-label={m.forage_progress({ visited, total })} title={m.forage_progress({ visited, total })}>
		{#each { length: total }, i (i)}
			<span class="cell" class:full={i < visited}></span>
		{/each}
	</span>
{/if}

<style>
	.comb {
		display: inline-flex;
		align-items: center;
	}

	/* 隣り合う部屋を上下に互い違いにして、蜂の巣の並びに見せる */
	.cell {
		width: 0.85rem;
		height: 0.98rem;
		margin-left: -0.06rem;
		background: var(--brand-on-honey);
		clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%);
	}

	.cell:nth-child(even) {
		translate: 0 0.42rem;
	}

	.cell::after {
		content: '';
		display: block;
		width: 100%;
		height: 100%;
		background: var(--brand-paper);
		clip-path: polygon(50% 12%, 88% 32%, 88% 68%, 50% 88%, 12% 68%, 12% 32%);
		transition: background-color 0.4s ease;
	}

	.cell.full::after {
		background: var(--brand-honey);
	}

	:global(:root[data-theme='dark']) .cell {
		background: var(--brand-muted);
	}

	@media (prefers-color-scheme: dark) {
		:global(:root:not([data-theme='light'])) .cell {
			background: var(--brand-muted);
		}
	}
</style>
