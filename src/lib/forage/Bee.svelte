<!--
	画面を飛ぶ蜂。行き先は次の順で決める。
	  1. 触れている作品の花 (寄り道)
	  2. 画面に見えていて、咲いているのにまだ訪れていない花のうち、いちばん上のもの
	  3. 最後に咲いた花 (訪れ終わったら、その上で待つ)
	  4. どれもなければ、ヒーローが見えていればヒーローの蜂の場所、見えていなければ画面の右上あたりを巡回
	花の上にしばらく留まると訪れたことにする。押すと /world に入る。
	動きを減らす設定では出さない (ヒーローには静止画の蜂が残り、入口は連絡先の「3D で見る」が担う)。

	奥行き (depth): ヒーローは空を見ている場面なので、蜂は近くに大きく、斜め前から見た姿で浮かぶ。
	Works は足もとの草地を見下ろす場面なので、蜂は遠くに小さく、真上から見た姿で飛ぶ。
	行き先が決まると時間をかけて遠ざかり、姿が入れ替わる (スクロール量で直接動かさない)。

	  depth 1  ヒーロー   大きい・斜め前の姿 (Mascot hero)
	  depth 0  Works      小さい・真上の姿   (Mascot top + wings)
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

	/** ヒーローの蜂の居場所 (+page.svelte の .hero-art)。無いページでは null */
	const perch = () => document.querySelector<HTMLElement>('.hero-art')?.getBoundingClientRect() ?? null;

	onMount(() => {
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

		const heroInView = (box: DOMRect | null): box is DOMRect => !!box && box.bottom > innerHeight * 0.3 && box.top < innerHeight * 0.7;
		const home = (box: DOMRect | null): Point =>
			heroInView(box) ? { x: box.left + box.width / 2, y: box.top + box.height / 2 } : { x: innerWidth * 0.78, y: innerHeight * 0.3 };
		const start = perch();
		let flight = createFlight(heroInView(start) ? home(start) : { x: innerWidth + 60, y: innerHeight * 0.2 });
		let depth = heroInView(start) ? 1 : 0;
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
			const box = perch();
			const goal = home(box);
			for (let left = dt; left > 1e-6; left -= FLIGHT.maxStep) {
				flight = step(flight, target, goal, Math.min(left, FLIGHT.maxStep));
			}
			last = now;

			// 行き先が無く、ヒーローが見えているあいだだけ近くに来る。寄るのも離れるのも時間で少しずつ
			const near = !target && heroInView(box) ? 1 : 0;
			depth += (near - depth) * Math.min(1, dt * 2.4);
			const grown = box ? box.width / element.offsetWidth : 1;
			const scale = 1 + depth * (grown - 1);

			if (id && target && isHovering(flight, target)) {
				dwell += dt;
				if (dwell >= DWELL) forage.visit(id);
			} else {
				dwell = 0;
			}

			element.style.translate = `${flight.x}px ${flight.y}px`;
			// 近いときは斜め前の姿なので進む向きには回さず、速さに応じて少し傾けるだけにする
			element.style.rotate = `${flight.angle * (1 - depth) + depth * Math.max(-0.2, Math.min(0.2, flight.vx * 0.0006))}rad`;
			element.style.scale = String(scale);
			element.style.setProperty('--depth', depth.toFixed(3));
			element.dataset.state = target ? (isHovering(flight, target) ? 'hovering' : 'flying') : 'patrol';
			frame = requestAnimationFrame(tick);
		}

		element.hidden = false;
		// ヒーローの静止画は、飛ぶ蜂がその場所を引き継ぐので隠す
		document.documentElement.dataset.bee = 'flying';
		return () => {
			cancelAnimationFrame(frame);
			delete document.documentElement.dataset.bee;
		};
	});
</script>

<a class="bee" href={localizeHref('/world')} aria-label={m.enter_world()} bind:this={element} hidden>
	<span class="far">
		<Mascot pose="top" class="bee-body" />
		<Mascot pose="wings" class="bee-wings" />
	</span>
	<span class="near"><Mascot pose="hero" class="bee-near" /></span>
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

	/* 遠い姿と近い姿を depth で入れ替える */
	.far,
	.near {
		position: absolute;
		inset: 0;
	}

	.far {
		opacity: calc(1 - var(--depth, 0));
	}

	.near {
		opacity: var(--depth, 0);
	}

	.near :global(.bee-near) {
		width: 100%;
		height: 100%;
		object-fit: contain;
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
