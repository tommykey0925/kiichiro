<!--
	画面を飛ぶ 3D の蜂。行き先 (画面の点と奥行き) は次の順で決め、飛び方は flight.ts、描画は stage.ts に任せる。
	  1. メニューが開いている           → メニューの右寄り (手前で大きく)
	  2. ヒーローでマウスが動いた        → マウスの少し右上 (手前)
	  3. 触れている作品の部屋 (寄り道)
	  4. 読む位置にまだ蜜のない作品の部屋 → 画面の真ん中にいちばん近いもの (奥で小さく)
	  5. ヒーローが見えている            → ヒーローの決まった場所 (いちばん手前で大きく)
	  6. それ以外                        → 画面の右上を漂う (奥)
	部屋の上に 0.8 秒留まると訪れたことにする。three.js はページが出た後に読み込み、文字の表示を遅らせない。
	動きを減らす設定では、ヒーローの決まった場所に 1 枚だけ描いて止める。
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { forage } from './state.svelte';
	import { menu } from '$lib/menu.svelte';
	import { createFlight, step, type Goal } from './flight';

	let { hero }: { hero?: HTMLElement } = $props();

	/** 部屋の上にこれだけ留まったら訪れたことにする (秒) */
	const DWELL = 0.8;

	let canvas: HTMLCanvasElement;

	onMount(() => {
		const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
		let frame = 0;
		let disposed = false;
		let cleanup = () => {};

		let pointer: { x: number; y: number; at: number } | null = null;
		const onPointer = (e: PointerEvent) => {
			if (e.pointerType === 'mouse') pointer = { x: e.clientX, y: e.clientY, at: performance.now() };
		};
		addEventListener('pointermove', onPointer);

		import('./stage').then(({ createStage }) => {
			if (disposed) return;
			let stage: ReturnType<typeof createStage>;
			try {
				stage = createStage(canvas, { scale: 1.7, still });
			} catch {
				// WebGL が使えない環境では蜂を出さない (部屋は読む位置に来たら蜜がたまる)
				return;
			}
			const narrow = () => innerWidth < 720;
			const heroAnchor = () => ({ x: innerWidth * (narrow() ? 0.62 : 0.7), y: innerHeight * (narrow() ? 0.34 : 0.4) });
			const heroVisible = () => !!hero && hero.getBoundingClientRect().bottom > innerHeight * 0.45;
			const spot = (el: HTMLElement) => {
				const r = el.getBoundingClientRect();
				return { x: r.left + r.width / 2, y: r.top + r.height * 0.4 };
			};
			const onScreen = (el: HTMLElement) => {
				const r = el.getBoundingClientRect();
				return r.bottom > 0 && r.top < innerHeight;
			};

			function readingCell(): string | null {
				const middle = innerHeight * 0.5;
				let best: string | null = null;
				let bestDistance = Infinity;
				for (const [id, el] of forage.flowers) {
					if (forage.visited.has(id) || !forage.bloomed.has(id)) continue;
					const r = el.getBoundingClientRect();
					if (r.bottom < innerHeight * 0.2 || r.top > innerHeight * 0.75) continue;
					const distance = Math.abs(r.top + r.height / 2 - middle);
					if (distance < bestDistance) [best, bestDistance] = [id, distance];
				}
				return best;
			}

			type Pick = { x: number; y: number; z: number; wander: number; speed: number; cell?: string };
			function pick(): Pick {
				// メニューの上: 広い画面では項目の右の空き、狭い画面では項目に重ならないよう下の空き
				if (menu.open)
					return innerWidth < 640
						? { x: innerWidth * 0.66, y: innerHeight * 0.84, z: 2.2, wander: 0.6, speed: 4 }
						: { x: innerWidth * 0.74, y: innerHeight * 0.5, z: 2.2, wander: 1, speed: 4 };
				const showingHero = heroVisible();
				if (showingHero && pointer && performance.now() - pointer.at < 2500) return { x: pointer.x + 70, y: pointer.y - 50, z: 1.4, wander: 0.3, speed: 4.5 };
				const detour = forage.detour ? forage.flowers.get(forage.detour) : undefined;
				if (forage.detour && detour && onScreen(detour)) return { ...spot(detour), z: -7, wander: 0.12, speed: 5, cell: forage.detour };
				const reading = readingCell();
				if (reading) return { ...spot(forage.flowers.get(reading)!), z: -7, wander: 0.12, speed: 5, cell: reading };
				if (showingHero) return { ...heroAnchor(), z: 2.4, wander: 1, speed: 4 };
				return { x: innerWidth * 0.86, y: innerHeight * 0.3, z: -6, wander: 1.4, speed: 4 };
			}

			// 動きを減らす設定ではヒーローの場所から、ふだんは画面の右外の少し奥から飛んでくる
			const at = still ? heroAnchor() : { x: innerWidth * 1.15, y: innerHeight * 0.2 };
			let flight = createFlight(stage.toWorld(at.x, at.y, still ? 2.4 : 0), still ? undefined : { x: -2.5, y: 0, z: 0 });
			let dwell = 0;
			let last = performance.now();

			function tick(now: number) {
				const dt = Math.min((now - last) / 1000, 0.1);
				last = now;
				const target = pick();
				const goal: Goal = { at: stage.toWorld(target.x, target.y, target.z), wander: target.wander, speed: target.speed };
				flight = step(flight, goal, dt);
				stage.render(flight, dt);

				const screen = stage.toScreen(flight.p);
				forage.bee.x = screen.x;
				forage.bee.y = screen.y;
				forage.bee.flying = true;
				if (target.cell && Math.hypot(screen.x - target.x, screen.y - target.y) < 40) {
					dwell += dt;
					if (dwell >= DWELL) {
						forage.visit(target.cell);
						dwell = 0;
					}
				} else {
					dwell = 0;
				}
				if (!still) frame = requestAnimationFrame(tick);
			}

			const onResize = () => stage.resize();
			addEventListener('resize', onResize);
			frame = requestAnimationFrame(tick);
			cleanup = () => {
				removeEventListener('resize', onResize);
				stage.dispose();
			};
		});

		return () => {
			disposed = true;
			cancelAnimationFrame(frame);
			removeEventListener('pointermove', onPointer);
			forage.bee.flying = false;
			cleanup();
		};
	});
</script>

<canvas class="bee" bind:this={canvas} aria-hidden="true"></canvas>

<style>
	/* ページ全体に重ねる透明なキャンバス。押したり選んだりは下の文字に通す。メニューより手前に出す */
	.bee {
		position: fixed;
		inset: 0;
		z-index: 30;
		width: 100%;
		height: 100%;
		pointer-events: none;
	}
</style>
