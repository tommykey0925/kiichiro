<!--
	野原に生える 1 輪。蕾で始まり、open になると花びらが開く。Meadow (ヒーローの稜線) と Blossoms (Works の草地) が使う。
	位置と大きさは親が決める。開く動きは、親のどこかに .ready が付いてから付ける (読み込んだ直後に前の分まで動かさない)。
-->
<script lang="ts">
	let {
		open,
		color,
		left,
		bottom,
		size,
		turn,
		delay
	}: { open: boolean; color: string; left: string; bottom: string; size: number; turn: number; delay: number } = $props();
</script>

<svg
	class="flower"
	class:open
	viewBox="-14 -46 28 46"
	style:left
	style:bottom
	style:--petal={color}
	style:--size={size}
	style:--turn="{turn}deg"
	style:--delay="{delay}s"
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

<style>
	.flower {
		position: absolute;
		overflow: visible;
		width: calc(2.4rem * var(--size));
		height: calc(3.9rem * var(--size));
		translate: -50% 0;
		transform-origin: 50% 100%;
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
		transform-box: fill-box;
		transform-origin: 50% 100%;
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

	@media (prefers-reduced-motion: no-preference) {
		/* 茎ごと風に揺れる */
		.flower {
			animation: sway var(--sway) infinite alternate;
			animation-delay: calc(var(--delay) * -3);
		}

		/* 蕾は咲く瞬間に花と入れ替わる */
		:global(.ready) .bud {
			transition: scale 0s var(--delay);
		}

		:global(.ready) .head {
			transition: scale var(--bloom) calc(var(--delay) + 0.15s);
		}
	}

	@keyframes sway {
		from {
			rotate: calc(var(--turn) - 4deg);
		}
		to {
			rotate: calc(var(--turn) + 4deg);
		}
	}
</style>
