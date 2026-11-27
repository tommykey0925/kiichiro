<!--
	ページの一番上の空。下の端が丘の稜線になり、その下は Field の草地に続く。
	トップではヒーローを中に置き、ほかのページでは低い空だけを置く。
	稜線の草むらは Meadow (蜜がたまるとその作品の色の花が咲く) をそのまま使う。
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import Meadow from '$lib/forage/Meadow.svelte';

	let {
		works = [],
		height = '9rem',
		children
	}: { works?: { id: string; color: string }[]; height?: string; children?: Snippet } = $props();

	// 近い雲ほど大きく高い位置を流れる (下の 3 つは遠く、霞んで小さい)
	const clouds = [
		{ y: 40, scale: 1.5, haze: 1, delay: -10 },
		{ y: 90, scale: 1.1, haze: 0.9, delay: -70 },
		{ y: 150, scale: 0.7, haze: 0.7, delay: -40 },
		{ y: 190, scale: 0.5, haze: 0.55, delay: -95 },
		{ y: 215, scale: 0.4, haze: 0.45, delay: -20 }
	];
</script>

<div class="sky" style:--sky-min={height}>
	<!-- 遠くのものほど小さく、空の色に霞む。雲は時間で流れる -->
	<svg class="clouds" viewBox="0 0 1200 300" preserveAspectRatio="xMidYMin slice" aria-hidden="true">
		{#each clouds as c, i (i)}
			<g class="cloud" style:--y="{c.y}px" style:--delay="{c.delay}s" style:--scale={c.scale} style:opacity={c.haze}>
				<ellipse cx="0" cy="0" rx="70" ry="18" />
				<ellipse cx="-28" cy="-12" rx="34" ry="22" />
				<ellipse cx="18" cy="-18" rx="40" ry="28" />
			</g>
		{/each}
	</svg>
	<svg class="range" viewBox="0 0 1200 80" preserveAspectRatio="none" aria-hidden="true">
		<path d="M0 60 C 120 30, 260 20, 380 42 S 600 10, 760 30 S 1000 50, 1200 24 V80 H0 Z" />
	</svg>
	{@render children?.()}
	<div class="ridge"><Meadow {works} /></div>
</div>

<style>
	.sky {
		position: relative;
		display: flex;
		flex-direction: column;
		/* ヘッダーの下まで空を伸ばす (ヘッダーは空に浮かぶ札なので透けて見える) */
		margin-top: calc(-1 * var(--header-height));
		padding-top: var(--header-height);
		min-height: var(--sky-min);
		background: linear-gradient(var(--sky-top), var(--sky-horizon) 85%);
	}

	/* 中身 (ヒーロー・稜線) は雲と山並みより手前 */
	.sky > :global(:not(svg)) {
		position: relative;
	}

	.clouds,
	.range {
		position: absolute;
		left: 0;
		width: 100%;
		pointer-events: none;
	}

	.clouds {
		top: 0;
		height: 100%;
	}

	.cloud {
		fill: var(--cloud);
		translate: -200px var(--y);
		scale: var(--scale);
	}

	@media (prefers-reduced-motion: no-preference) {
		.cloud {
			animation: drift var(--drift) infinite;
			animation-delay: var(--delay);
		}
	}

	@keyframes drift {
		to {
			translate: 1400px var(--y);
		}
	}

	/* 稜線の向こうの山並み。空の色に霞ませて遠く見せる */
	.range {
		bottom: clamp(4rem, 9vw, 8rem);
		height: clamp(3rem, 6vw, 5rem);
	}

	.range path {
		fill: color-mix(in oklab, var(--grass-deep) 30%, var(--sky-horizon));
	}

	.ridge {
		margin-top: auto;
	}
</style>
