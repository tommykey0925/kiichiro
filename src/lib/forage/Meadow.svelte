<!--
	Works の花畑の地面。作品の行の下に敷き、起伏のある地面の線が行の区切りを兼ねる。
	最初は草と蕾だけで、蜂がその作品の花を訪れると、その作品の色の小花が咲く。
	/world の「蜜が届くと花畑が育つ」と同じ決まり。

	   01 hapax                         花 ← 作品の花 (Bloom)。茎がこの地面まで伸びる
	      説明・札・リンク                 │
	   ˌ * ˌ ˌ * ˌ ˌ ˌ * ˌ ˌ * ˌ ˌ ˌ ˌ*ˌ┴ˌ  ← この部品 (草・蕾・咲いた小花)
	  ～～～～～～～～～～～～～～～～～～～～～  ← 地面の線

	訪れるのは読んでいる行の中なので、その場で咲く。前に訪れた分 (戻ってきたとき) は動かさずに出す。
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { forage } from './state.svelte';

	let {
		works,
		per = 6,
		seed = 1
	}: {
		works: { id: string; color: string }[];
		/** 作品 1 つあたりの小花の数 */
		per?: number;
		/** 行ごとに草と花の並びと地面の起伏を変える */
		seed?: number;
	} = $props();

	/** 決まった並びにするための乱数 (ページを開くたびに配置が変わらないように) */
	function seeded(start: number) {
		let s = start;
		return () => {
			s = (s * 16807) % 2147483647;
			return (s - 1) / 2147483646;
		};
	}

	type Flower = { id: string; color: string; left: number; depth: number; turn: number; order: number };

	// 作品の小花を横いっぱいに混ぜて散らす。左右の位置は等間隔に揺らぎを足し、作品の並びは乱数で混ぜる
	const flowers: Flower[] = $derived.by(() => {
		const random = seeded(seed * 31 + 7);
		const slots = works.flatMap((w) => Array.from({ length: per }, (_, k) => ({ w, k })));
		for (let i = slots.length - 1; i > 0; i--) {
			const j = Math.floor(random() * (i + 1));
			[slots[i], slots[j]] = [slots[j], slots[i]];
		}
		return slots.map(({ w, k }, i) => ({
			id: w.id,
			color: w.color,
			left: ((i + 0.2 + random() * 0.6) / slots.length) * 100,
			depth: random(),
			turn: (random() - 0.5) * 16,
			order: k
		}));
	});

	const grass = $derived.by(() => {
		const count = Math.max(24, works.length * per * 3);
		const random = seeded(seed * 17 + 100);
		return Array.from({ length: count }, (_, i) => ({ left: ((i + random()) / count) * 100, depth: random(), flip: random() < 0.5 }));
	});

	// 地面の起伏。行ごとに山の位置を変え、一覧全体で丘が続いて見えるようにする
	const ground = $derived.by(() => {
		const random = seeded(seed * 13 + 3);
		const y = () => 4 + random() * 40;
		return `M0 ${y()} C 200 ${y()}, 400 ${y()}, 600 ${y()} S 1000 ${y()}, 1200 ${y()}`;
	});

	let ready = $state(false);
	onMount(() => {
		forage.restore();
		// 読み込んだ直後は動かさない。前に訪れた分は咲いた状態で出す
		requestAnimationFrame(() => (ready = true));
	});
</script>

<div class="meadow" class:ready aria-hidden="true">
	<!-- 地面は稜線だけ線にし、塗りは下へ薄れさせる (箱に見せない) -->
	<svg class="ground soil" viewBox="0 0 1200 100" preserveAspectRatio="none">
		<path d="{ground} V100 H0 Z" />
	</svg>
	<svg class="ground ridge" viewBox="0 0 1200 100" preserveAspectRatio="none">
		<path d={ground} />
	</svg>
	{#each grass as g, i (i)}
		<svg
			class="grass"
			viewBox="-10 -24 20 24"
			style:left="{g.left}%"
			style:bottom="{6 + g.depth * 38}%"
			style:scale={(g.flip ? -1 : 1) * (0.7 + (1 - g.depth) * 0.5) + ' ' + (0.7 + (1 - g.depth) * 0.5)}
		>
			<path d="M-5 0 Q -6 -12 -9 -20 M0 0 Q 1 -14 -1 -24 M5 0 Q 6 -11 9 -18" />
		</svg>
	{/each}
	{#each flowers as f, i (i)}
		<svg
			class="flower"
			class:open={forage.visited.has(f.id)}
			viewBox="-14 -46 28 46"
			style:left="{f.left}%"
			style:bottom="{2 + f.depth * 40}%"
			style:--petal={f.color}
			style:--size={0.6 + (1 - f.depth) * 0.7}
			style:--turn="{f.turn}deg"
			style:--delay="{f.order * 0.09}s"
		>
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
</div>

<style>
	.meadow {
		position: relative;
		height: var(--meadow-height, 4.5rem);
		overflow: hidden;
	}

	.ground {
		position: absolute;
		inset: auto 0 0;
		width: 100%;
		height: 70%;
		overflow: visible;
	}

	.soil {
		mask-image: linear-gradient(black 20%, transparent);
	}

	.soil path {
		fill: color-mix(in oklab, var(--brand-leaf) 35%, var(--brand-paper));
	}

	.ridge path {
		fill: none;
		stroke: var(--brand-ink);
		stroke-width: 2;
		vector-effect: non-scaling-stroke;
	}

	.grass,
	.flower {
		position: absolute;
		overflow: visible;
		translate: -50% 0;
		transform-origin: 50% 100%;
	}

	.grass {
		width: 1.5rem;
		height: 1.8rem;
	}

	.grass path,
	.stem {
		fill: none;
		stroke: color-mix(in oklab, var(--brand-leaf) 75%, var(--brand-ink));
		stroke-width: 2;
		stroke-linecap: round;
	}

	.flower {
		width: calc(2.6rem * var(--size));
		height: calc(4.2rem * var(--size));
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

	@media (prefers-reduced-motion: no-preference) {
		.ready .bud {
			transition: scale 0.25s ease-in var(--delay);
		}

		.ready .head {
			transition: scale 0.6s cubic-bezier(0.3, 1.6, 0.5, 1) calc(var(--delay) + 0.15s);
		}
	}
</style>
