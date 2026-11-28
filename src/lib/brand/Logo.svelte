<!--
	文字ロゴ。「.」を蜂の巣の六角形に置き換えて見せる。読み上げは「kiichi.ro」のまま。
	animated を付けると、ページが出たときに文字が下から上がり、六角形が回りながら弾んで収まる (トップの大きなロゴ)。
	手書きのロゴに替えるときはこの部品の中身だけを替える。
-->
<script lang="ts">
	import { onMount } from 'svelte';

	let { animated = false }: { animated?: boolean } = $props();
	let started = $state(false);
	const ready = $derived(!animated || started);

	onMount(() => {
		if (!animated) return;
		// 出した直後の同じフレームで動きを始めると、ブラウザが動きを飛ばすので 2 フレーム待つ
		const frame = requestAnimationFrame(() => requestAnimationFrame(() => (started = true)));
		return () => cancelAnimationFrame(frame);
	});
</script>

<span class="logo" class:animated class:ready
	><span class="sr-only">kiichi.ro</span><span class="word" aria-hidden="true"><span>kiichi</span></span><span
		class="dot"
		aria-hidden="true"
	></span><span class="word" aria-hidden="true"><span>ro</span></span></span
>

<style>
	.logo {
		font-family: var(--font-display);
		font-weight: 700;
		letter-spacing: -0.02em;
		white-space: nowrap;
	}

	.dot {
		display: inline-block;
		width: 0.34em;
		height: 0.38em;
		margin: 0 0.04em;
		background: var(--brand-honey);
		clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%);
	}

	.animated .word {
		display: inline-block;
		padding-bottom: 0.06em;
		overflow: hidden;
		vertical-align: bottom;
	}

	.animated .word > span {
		display: inline-block;
	}

	@media (prefers-reduced-motion: no-preference) {
		.animated .word > span {
			transform: translateY(108%);
			transition: transform var(--duration-slow) var(--ease-out);
		}

		.animated .word:last-child > span {
			transition-delay: 0.12s;
		}

		.animated .dot {
			scale: 0;
			rotate: -120deg;
			transition:
				scale var(--duration-mid) var(--ease-spring) 0.55s,
				rotate var(--duration-slow) var(--ease-out) 0.55s;
		}

		.ready .word > span {
			transform: none;
		}

		.ready .dot {
			scale: 1;
			rotate: 0deg;
		}
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
</style>
