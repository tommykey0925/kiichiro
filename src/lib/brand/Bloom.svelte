<!--
	作品を表す花。蕾で始まり、forage の状態で咲いたら花びらが順に開く。
	蜂が訪れると真ん中の六角形に蜜がたまる。色は /world の花と同じ work.spot.color。
	絵を描き直すときはこの SVG を替える。花びらの数と開き方は petals と CSS で決まる。
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { forage } from '$lib/forage/state.svelte';

	let { id, color, size = '6rem' }: { id: string; color: string; size?: string } = $props();

	const petals = Array.from({ length: 6 }, (_, i) => i * 60);

	let element: HTMLElement;
	const open = $derived(forage.bloomed.has(id));
	const visited = $derived(forage.visited.has(id));

	onMount(() => {
		const unregister = forage.register(id, element);
		const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

		// 画面の上 65% に入ったら「読む位置に来た」とみなす。下の端だけ見えている間は咲かない
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (!entry.isIntersecting) continue;
					forage.bloom(id);
					if (reduce) forage.visit(id);
				}
			},
			{ rootMargin: '0px 0px -35% 0px' }
		);
		observer.observe(element);

		return () => {
			observer.disconnect();
			unregister();
		};
	});
</script>

<span class="bloom" class:open class:visited style:--size={size} style:--petal={color} bind:this={element} aria-hidden="true">
	<svg viewBox="-50 -50 100 100">
		<path class="stem" d="M0 8 C 4 26, -6 36, 2 50" />
		{#each petals as angle, i (angle)}
			<g class="petal" style:--angle="{angle}deg" style:--i={i}>
				<ellipse cx="0" cy="-22" rx="11" ry="20" />
			</g>
		{/each}
		<polygon class="cell" points="0,-9 7.8,-4.5 7.8,4.5 0,9 -7.8,4.5 -7.8,-4.5" />
	</svg>
</span>

<style>
	.bloom {
		display: inline-block;
		/* 置く側は --bloom-size で上書きできる (画面幅ごとに大きさを変えるため) */
		width: var(--bloom-size, var(--size));
		height: var(--bloom-size, var(--size));
	}

	svg {
		display: block;
		width: 100%;
		height: 100%;
		overflow: visible;
	}

	.stem {
		fill: none;
		stroke: var(--brand-leaf);
		stroke-width: 3;
		stroke-linecap: round;
	}

	.petal {
		fill: var(--petal);
		stroke: var(--brand-on-honey);
		stroke-width: 1.5;
		transform: rotate(var(--angle)) scale(0.25);
		transform-origin: 0 0;
	}

	.open .petal {
		transform: rotate(var(--angle)) scale(1);
	}

	.cell {
		fill: var(--brand-paper);
		stroke: var(--brand-on-honey);
		stroke-width: 1.5;
	}

	.visited .cell {
		fill: var(--brand-honey);
	}

	@media (prefers-reduced-motion: no-preference) {
		.petal {
			transform: rotate(calc(var(--angle) - 50deg)) scale(0.25);
			transition: transform 0.7s cubic-bezier(0.3, 1.5, 0.5, 1);
			transition-delay: calc(var(--i) * 60ms);
		}

		.open .petal {
			transform: rotate(var(--angle)) scale(1);
		}

		.cell {
			transition: fill 0.4s ease;
		}
	}
</style>
