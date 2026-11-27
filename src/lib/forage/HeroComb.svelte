<!--
	ヒーロー全体に敷く巣板の格子。蜂の近くの部屋が蜜色に灯り、ゆっくり冷める。
	読み込んだときに一度だけ、左下から右上へ部屋が順に灯って消える。
	動きを減らす設定では格子だけを一度描いて止める。
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { forage } from './state.svelte';

	let canvas: HTMLCanvasElement;

	onMount(() => {
		const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
		const context = canvas.getContext('2d');
		if (!context) return;
		const R = 34;
		type Room = { x: number; y: number; heat: number; wave: number };
		let rooms: Room[] = [];

		function layout() {
			const dpr = Math.min(devicePixelRatio, 2);
			const width = canvas.clientWidth;
			const height = canvas.clientHeight;
			canvas.width = width * dpr;
			canvas.height = height * dpr;
			context!.setTransform(dpr, 0, 0, dpr, 0, 0);
			const w = Math.sqrt(3) * R;
			const h = 1.5 * R;
			const far = Math.hypot(width, height);
			rooms = [];
			for (let row = -1; row * h < height + R; row++) {
				for (let col = -1; col * w < width + w; col++) {
					const x = col * w + (row % 2 ? w / 2 : 0);
					const y = row * h;
					rooms.push({ x, y, heat: 0, wave: Math.hypot(x, y - height) / far });
				}
			}
		}

		function hex(x: number, y: number, r: number) {
			context!.beginPath();
			for (let i = 0; i < 6; i++) {
				const a = (Math.PI / 3) * i + Math.PI / 6;
				context!.lineTo(x + r * Math.cos(a), y + r * Math.sin(a));
			}
			context!.closePath();
		}

		const born = performance.now();
		let frame = 0;
		function draw(now: number) {
			const t = (now - born) / 1000;
			const style = getComputedStyle(document.documentElement);
			const line = style.getPropertyValue('--brand-line').trim();
			const honey = style.getPropertyValue('--brand-honey').trim();
			const box = canvas.getBoundingClientRect();
			context!.clearRect(0, 0, box.width, box.height);
			// 画面に見えていないときは描かない
			if (box.bottom > 0 && box.top < innerHeight) {
				for (const room of rooms) {
					const wave = !reduced && t < 3 ? Math.max(0, 1 - Math.abs(t * 0.9 - room.wave * 1.6) * 3.2) : 0;
					if (forage.bee.flying) {
						const d = Math.hypot(forage.bee.x - box.left - room.x, forage.bee.y - box.top - room.y);
						if (d < R * 2.2) room.heat = Math.min(1, room.heat + (1 - d / (R * 2.2)) * 0.22);
					}
					room.heat *= 0.975;
					const glow = Math.max(room.heat, wave * 0.8);
					hex(room.x, room.y, R - 3);
					context!.strokeStyle = line;
					context!.lineWidth = 1.2;
					context!.stroke();
					if (glow > 0.02) {
						context!.globalAlpha = glow * 0.85;
						hex(room.x, room.y, (R - 5) * (0.6 + glow * 0.4));
						context!.fillStyle = honey;
						context!.fill();
						context!.globalAlpha = 1;
					}
				}
			}
			if (!reduced) frame = requestAnimationFrame(draw);
		}

		layout();
		// 大きさが変わったら並べ直す。動きを減らす設定では、並べ直したところで一度だけ描き直す
		const observer = new ResizeObserver(() => {
			layout();
			if (reduced) draw(performance.now());
		});
		observer.observe(canvas);
		frame = requestAnimationFrame(draw);
		return () => {
			cancelAnimationFrame(frame);
			observer.disconnect();
		};
	});
</script>

<canvas class="hero-comb" bind:this={canvas} aria-hidden="true"></canvas>

<style>
	.hero-comb {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}
</style>
