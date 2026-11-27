<!--
	ヒーローの下の野原。最初は草と蕾だけで、蜂が作品を訪れて蜜がたまるたびに、その作品の色の花が咲く。
	全部の作品を訪れると満開になる。/world の「蜜が届くと花畑が育つ」と同じ決まり。

	  ヒーロー
	  ─────────────────────────────── ← 丘の稜線
	   ˌ * ˌ ˌ * ˌ ˌ ˌ * ˌ ˌ * ˌ ˌ ˌ   ← 草・蕾・咲いた花 (作品ごとに PER 輪)

	花を訪れるのは帯より下の一覧なので、咲く瞬間は帯が画面の外にある。
	新しく咲く分は、帯が画面に戻ってきたときに順に開く。
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import { forage } from './state.svelte';

	let { works }: { works: { id: string; color: string }[] } = $props();

	/** 作品 1 つあたりの花の数 */
	const PER = 6;
	const GRASS = 56;

	/** 決まった並びにするための乱数 (ページを開くたびに配置が変わらないように) */
	function seeded(seed: number) {
		let s = seed;
		return () => {
			s = (s * 16807) % 2147483647;
			return (s - 1) / 2147483646;
		};
	}

	type Flower = { id: string; color: string; left: number; depth: number; turn: number };

	// 作品の花を横いっぱいに混ぜて散らす。左右の位置は等間隔に揺らぎを足し、作品の並びは乱数で混ぜる
	const flowers: Flower[] = $derived.by(() => {
		const random = seeded(7);
		const slots = works.flatMap((w) => Array.from({ length: PER }, () => w));
		for (let i = slots.length - 1; i > 0; i--) {
			const j = Math.floor(random() * (i + 1));
			[slots[i], slots[j]] = [slots[j], slots[i]];
		}
		return slots.map((w, i) => ({
			id: w.id,
			color: w.color,
			left: ((i + 0.2 + random() * 0.6) / slots.length) * 100,
			depth: random(),
			turn: (random() - 0.5) * 16
		}));
	});

	const grass = Array.from({ length: GRASS }, (_, i) => {
		const random = seeded(100 + i);
		return { left: ((i + random()) / GRASS) * 100, depth: random(), flip: random() < 0.5 };
	});

	/** 咲かせた作品と、咲いた順 (同じ回に咲く作品どうしで開く時間をずらす) */
	const shown = new SvelteMap<string, number>();
	let ready = $state(false);
	let visible = $state(false);
	let element: HTMLElement;

	onMount(() => {
		forage.restore();
		// 前に訪れた分 (詳細ページから戻ったときなど) は、動かさずに咲いた状態で出す
		for (const id of forage.visited) shown.set(id, 0);
		requestAnimationFrame(() => (ready = true));
		const observer = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting), { threshold: 0.4 });
		observer.observe(element);
		return () => observer.disconnect();
	});

	$effect(() => {
		if (!visible) return;
		let order = 0;
		for (const id of forage.visited) if (!shown.has(id)) shown.set(id, order++);
	});
</script>

<div class="meadow" class:ready bind:this={element} aria-hidden="true">
	<svg class="ground" viewBox="0 0 1200 100" preserveAspectRatio="none">
		<path class="far" d="M0 38 C 160 18, 300 30, 460 26 S 760 10, 920 24 S 1120 30, 1200 20 V100 H0 Z" />
		<path class="near" d="M0 52 C 200 40, 360 58, 560 48 S 900 36, 1060 46 S 1160 50, 1200 44 V100 H0 Z" />
		<!-- 稜線だけに線を引く (塗りの下と左右には引かない) -->
		<path class="crest" d="M0 52 C 200 40, 360 58, 560 48 S 900 36, 1060 46 S 1160 50, 1200 44" />
	</svg>
	{#each grass as g, i (i)}
		<svg
			class="grass"
			viewBox="-10 -24 20 24"
			style:left="{g.left}%"
			style:bottom="{8 + g.depth * 30}%"
			style:scale={(g.flip ? -1 : 1) * (0.7 + (1 - g.depth) * 0.6) + ' ' + (0.7 + (1 - g.depth) * 0.6)}
		>
			<path d="M-5 0 Q -6 -12 -9 -20 M0 0 Q 1 -14 -1 -24 M5 0 Q 6 -11 9 -18" />
		</svg>
	{/each}
	{#each flowers as f, i (i)}
		{@const open = shown.has(f.id)}
		<svg
			class="flower"
			class:open
			viewBox="-14 -46 28 46"
			style:left="{f.left}%"
			style:bottom="{2 + f.depth * 34}%"
			style:--petal={f.color}
			style:--size={0.75 + (1 - f.depth) * 0.5}
			style:--turn="{f.turn}deg"
			style:--delay="{(shown.get(f.id) ?? 0) * 0.45 + (i % PER) * 0.07}s"
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
		height: clamp(7rem, 13vw, 11rem);
		overflow: hidden;
	}

	.ground {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}

	.far {
		fill: color-mix(in oklab, var(--grass) 55%, var(--sky-horizon));
	}

	.near {
		fill: var(--grass);
	}

	.crest {
		fill: none;
		stroke: var(--char);
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

	.grass path {
		fill: none;
		stroke: var(--grass-deep);
		stroke-width: 2;
		stroke-linecap: round;
	}

	.flower {
		width: calc(2.4rem * var(--size));
		height: calc(3.9rem * var(--size));
		rotate: var(--turn);
	}

	.stem {
		fill: none;
		stroke: var(--grass-deep);
		stroke-width: 2;
		stroke-linecap: round;
	}

	.bud {
		fill: var(--leaf);
		stroke: var(--char);
		stroke-width: 1.2;
	}

	.head {
		translate: 0 -36px;
		scale: 0;
		fill: var(--petal);
		stroke: var(--char);
		stroke-width: 1.2;
	}

	.center {
		fill: var(--honey);
	}

	.open .bud {
		scale: 0;
	}

	.open .head {
		scale: 1;
	}

	.bud {
		transform-box: fill-box;
		transform-origin: 50% 100%;
	}

	/* 読み込んだ直後 (ready の前) は動かさない。前に訪れた分は咲いた状態で出す */
	@media (prefers-reduced-motion: no-preference) {
		.ready .bud {
			transition: scale 0.25s ease-in var(--delay);
		}

		.ready .head {
			transition: scale var(--bloom) calc(var(--delay) + 0.15s);
		}
	}
</style>
