<!--
	画面を飛ぶ蜂。行き先は次の順で決める。
	  1. 触れている作品の花 (寄り道)
	  2. 画面に見えていて、咲いているのにまだ訪れていない花のうち、いちばん上のもの
	  3. 最後に咲いた花 (訪れ終わったら、その上で待つ)
	  4. どれもなければ画面の右上あたりを巡回
	花の上にしばらく留まると訪れたことにする。押すと /world に入る。
	動きを減らす設定では出さない (入口は連絡先の「3D で見る」が担う)。
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import Mascot from '$lib/brand/Mascot.svelte';
	import { forage } from './state.svelte';
	import { createFlight, FLIGHT, isHovering, step, type Point } from './flight';
	import { m } from '$lib/paraglide/messages';
	import { localizeHref } from '$lib/paraglide/runtime';

	/** 花の上にこれだけ留まったら訪れたことにする (秒) */
	const DWELL = 0.8;

	let element: HTMLAnchorElement;

	onMount(() => {
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

		const home = (): Point => ({ x: innerWidth * 0.78, y: innerHeight * 0.3 });
		let flight = createFlight({ x: innerWidth + 60, y: innerHeight * 0.2 });
		let dwell = 0;
		let last = performance.now();
		let frame = requestAnimationFrame(tick);

		function pickTarget(): [string, Point] | null {
			const candidates = [
				forage.detour,
				[...forage.flowers.keys()].find((id) => forage.bloomed.has(id) && !forage.visited.has(id) && centerOf(id)),
				forage.current
			];
			for (const id of candidates) {
				if (!id || !forage.bloomed.has(id)) continue;
				const point = centerOf(id);
				if (point) return [id, point];
			}
			return null;
		}

		function centerOf(id: string | null): Point | null {
			const flower = id ? forage.flowers.get(id) : undefined;
			if (!flower) return null;
			const box = flower.getBoundingClientRect();
			if (box.bottom < 0 || box.top > innerHeight) return null;
			// 花の真ん中より少し上に留まり、花が蜂に隠れきらないようにする
			return { x: box.left + box.width / 2, y: box.top + box.height * 0.22 };
		}

		function tick(now: number) {
			const [id, target] = pickTarget() ?? [null, null];
			const dt = Math.min((now - last) / 1000, 0.1);
			// 1 回で進める時間には上限があるので、画面の更新が遅い端末でも同じ速さで飛ぶよう分けて進める
			const goal = home();
			for (let left = dt; left > 1e-6; left -= FLIGHT.maxStep) {
				flight = step(flight, target, goal, Math.min(left, FLIGHT.maxStep));
			}
			last = now;

			if (id && target && isHovering(flight, target)) {
				dwell += dt;
				if (dwell >= DWELL) forage.visit(id);
			} else {
				dwell = 0;
			}

			element.style.translate = `${flight.x}px ${flight.y}px`;
			element.style.rotate = `${flight.angle}rad`;
			element.dataset.state = target ? (isHovering(flight, target) ? 'hovering' : 'flying') : 'patrol';
			frame = requestAnimationFrame(tick);
		}

		element.hidden = false;
		return () => cancelAnimationFrame(frame);
	});
</script>

<a class="bee" href={localizeHref('/world')} aria-label={m.enter_world()} bind:this={element} hidden>
	<Mascot pose="top" class="bee-body" />
	<Mascot pose="wings" class="bee-wings" />
</a>

<style>
	.bee {
		position: fixed;
		top: 0;
		left: 0;
		z-index: 5;
		display: block;
		width: 3.5rem;
		height: 3.5rem;
		margin: -1.75rem 0 0 -1.75rem;
		will-change: translate, rotate;
	}

	@media (max-width: 48rem) {
		.bee {
			width: 2.75rem;
			height: 2.75rem;
			margin: -1.375rem 0 0 -1.375rem;
		}
	}

	.bee[hidden] {
		display: none;
	}

	.bee:focus-visible {
		outline: 4px solid var(--char);
		outline-offset: 2px;
		border-radius: 50%;
	}

	/* 体の上に、同じ枠で撮った羽の絵を重ねる */
	.bee :global(.bee-body),
	.bee :global(.bee-wings) {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}

	/* 羽ばたき。羽の絵だけを速く小さく振る (/world の蜂と同じく、残像の扇がちらついて見える) */
	@media (prefers-reduced-motion: no-preference) {
		.bee :global(.bee-wings) {
			animation: buzz var(--flutter) infinite alternate;
		}
	}

	@keyframes buzz {
		from {
			scale: 1 1;
			opacity: 1;
		}
		to {
			scale: 0.82 1;
			opacity: 0.7;
		}
	}
</style>
