<!--
	Works の草地一面に散らした蕾。蜂が作品を訪れるたびに、その作品の色の花が草地のあちこちで咲く。
	札より奥に生えるので、文字には重ならない (PC では札の左右の草地、スマホでは札と札のあいだに見える)。

	  草地 ───────────────────────────────
	  │ * ˌ   ┌ 作品の札 ┐   ˌ *  ˌ │   遠い (上) ほど小さく、近い (下) ほど大きい
	  │   ˌ * └──────────┘ *   ˌ   │
	  │ ˌ  *  ┌ 作品の札 ┐  ˌ   * ˌ │
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { forage } from './state.svelte';
	import Flower from './Flower.svelte';

	let { works }: { works: { id: string; color: string }[] } = $props();

	/** 作品 1 つあたりの花の数 */
	const PER = 5;

	function seeded(seed: number) {
		let s = seed;
		return () => {
			s = (s * 16807) % 2147483647;
			return (s - 1) / 2147483646;
		};
	}

	const flowers = $derived.by(() => {
		const random = seeded(31);
		const slots = works.flatMap((w) => Array.from({ length: PER }, () => w));
		return slots.map((w, i) => {
			// 半分は左右の端の草地に寄せ、残りは全体に散らす
			const edge = i % 2 === 0;
			const side = random() < 0.5;
			const x = edge ? (side ? random() * 16 : 84 + random() * 16) : random() * 100;
			const y = (i + random()) / slots.length;
			return { id: w.id, color: w.color, left: x, top: y * 100, size: 0.8 + y * 0.7, turn: (random() - 0.5) * 18, delay: random() * 0.6 };
		});
	});

	let ready = $state(false);

	onMount(() => {
		forage.restore();
		requestAnimationFrame(() => (ready = true));
	});
</script>

<div class="blossoms" class:ready aria-hidden="true">
	{#each flowers as f, i (i)}
		<Flower
			open={forage.visited.has(f.id)}
			color={f.color}
			left="{f.left}%"
			bottom="{100 - f.top}%"
			size={f.size}
			turn={f.turn}
			delay={f.delay}
		/>
	{/each}
</div>

<style>
	/* ページの横幅いっぱいに広げる (Field が横のはみ出しを切る) */
	.blossoms {
		position: absolute;
		top: 0;
		bottom: 0;
		left: calc(50% - 50vw);
		width: 100vw;
		pointer-events: none;
	}
</style>
