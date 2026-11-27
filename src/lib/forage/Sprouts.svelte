<!--
	作品の行の下端に生える草と蕾。蜂がその作品の花を訪れて蜜がたまると、蕾がその作品の色の花に開く。
	次の行の区切り線を地面にする。PC とスマホで置き方は同じ。

	  01  hapax  説明・技術の札            ✿   ← 作品の花 (Bloom)
	  ˌ ˌ*ˌ ˌ ˌ*ˌ ˌ ˌ*ˌ ˌ ˌ*ˌ ˌ*ˌ ˌ ˌ*ˌ ˌ    ← ここ
	  ───────────────────────────────────────  ← 次の行の区切り線

	読み込んだときに訪れ済みの作品は、動かさずに咲いた状態で出す。
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { forage } from './state.svelte';

	let { id, color, count = 6, scale = 1 }: { id: string; color: string; count?: number; scale?: number } = $props();

	const GRASS = 14;

	/** 作品ごとに決まった並びにするための乱数 */
	function seeded(text: string) {
		let s = [...text].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 2147483647, 7) || 1;
		return () => {
			s = (s * 16807) % 2147483647;
			return (s - 1) / 2147483646;
		};
	}

	const layout = $derived.by(() => {
		const random = seeded(id);
		// 花は行の幅に等間隔で並べ、少し揺らす。草は花の間を埋める
		const flowers = Array.from({ length: count }, (_, i) => ({
			left: ((i + 0.25 + random() * 0.5) / count) * 100,
			size: 0.8 + random() * 0.4,
			turn: (random() - 0.5) * 16
		}));
		const grass = Array.from({ length: GRASS }, (_, i) => ({
			left: ((i + random()) / GRASS) * 100,
			size: 0.7 + random() * 0.5,
			flip: random() < 0.5
		}));
		return { flowers, grass };
	});

	const open = $derived(forage.visited.has(id));
	let ready = $state(false);

	onMount(() => {
		forage.restore();
		requestAnimationFrame(() => (ready = true));
	});
</script>

<span class="sprouts" class:ready class:open style:--petal={color} style:--scale={scale} aria-hidden="true">
	{#each layout.grass as g, i (i)}
		<svg class="grass" viewBox="-10 -24 20 24" style:left="{g.left}%" style:--size={g.size} style:--flip={g.flip ? -1 : 1}>
			<path d="M-5 0 Q -6 -12 -9 -20 M0 0 Q 1 -14 -1 -24 M5 0 Q 6 -11 9 -18" />
		</svg>
	{/each}
	{#each layout.flowers as f, i (i)}
		<svg class="flower" viewBox="-14 -46 28 46" style:left="{f.left}%" style:--size={f.size} style:--turn="{f.turn}deg" style:--delay="{i * 0.08}s">
			<path class="stem" d="M0 0 Q 2 -18 0 -34" />
			<ellipse class="bud" cx="0" cy="-36" rx="3.6" ry="5.5" />
			<g class="head">
				{#each [0, 72, 144, 216, 288] as angle (angle)}
					<ellipse cx="0" cy="-6.5" rx="4.2" ry="6.5" transform="rotate({angle})" />
				{/each}
				<circle class="center" r="3" />
			</g>
		</svg>
	{/each}
</span>

<style>
	.sprouts {
		position: absolute;
		inset: auto 0 0;
		height: calc(3.6rem * var(--scale));
		pointer-events: none;
	}

	.grass,
	.flower {
		position: absolute;
		bottom: 0;
		overflow: visible;
		translate: -50% 0;
		transform-origin: 50% 100%;
	}

	.grass {
		width: calc(1.2rem * var(--size) * var(--scale));
		height: calc(1.45rem * var(--size) * var(--scale));
		scale: var(--flip) 1;
	}

	.grass path,
	.stem {
		fill: none;
		stroke: color-mix(in oklab, var(--brand-leaf) 70%, var(--brand-on-honey));
		stroke-width: 2;
		stroke-linecap: round;
	}

	.flower {
		width: calc(2rem * var(--size) * var(--scale));
		height: calc(3.3rem * var(--size) * var(--scale));
		rotate: var(--turn);
	}

	.bud {
		fill: var(--brand-leaf);
		stroke: var(--brand-on-honey);
		stroke-width: 1.2;
		transform-box: fill-box;
		transform-origin: 50% 100%;
	}

	.head {
		translate: 0 -36px;
		scale: 0;
		fill: var(--petal);
		stroke: var(--brand-on-honey);
		stroke-width: 1.2;
	}

	.center {
		fill: var(--brand-honey);
	}

	.open .bud {
		scale: 0;
	}

	.open .head {
		scale: 1;
	}

	/* 読み込んだ直後 (ready の前) は動かさない */
	@media (prefers-reduced-motion: no-preference) {
		.ready .bud {
			transition: scale 0.25s ease-in var(--delay);
		}

		.ready .head {
			transition: scale 0.6s cubic-bezier(0.3, 1.6, 0.5, 1) calc(var(--delay) + 0.15s);
		}
	}
</style>
