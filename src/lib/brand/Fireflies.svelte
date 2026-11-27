<!--
	夜の野原を飛ぶ蛍。/world の全部満ちた夜の蛍と同じ光 (glow)。
	昼は glow が透明なので見えない。動きを減らす設定では、その場で灯ったままにする。
-->
<script lang="ts">
	const COUNT = 40;

	function seeded(seed: number) {
		let s = seed;
		return () => {
			s = (s * 16807) % 2147483647;
			return (s - 1) / 2147483646;
		};
	}

	const random = seeded(11);
	const flies = Array.from({ length: COUNT }, (_, i) => ({
		left: random() * 100,
		top: ((i + random()) / COUNT) * 100,
		delay: -random() * 5,
		path: i % 3
	}));
</script>

<div class="fireflies" aria-hidden="true">
	{#each flies as f, i (i)}
		<span class="fly path-{f.path}" style:left="{f.left}%" style:top="{f.top}%" style:--delay="{f.delay}s"></span>
	{/each}
</div>

<style>
	/* 空の上も飛ぶので、空と札より手前に置く (小さな光なので文字は読める) */
	.fireflies {
		position: absolute;
		inset: 0;
		z-index: 1;
		pointer-events: none;
	}

	.fly {
		position: absolute;
		width: 0.3rem;
		height: 0.3rem;
		border-radius: 50%;
		background: var(--glow);
		box-shadow: 0 0 0.6rem 0.25rem var(--glow);
	}

	/* ふらふら飛びながら、ゆっくり明滅する */
	@media (prefers-reduced-motion: no-preference) {
		.fly {
			animation:
				glow var(--sway) infinite alternate,
				wander-0 var(--sway) infinite alternate;
			animation-delay: var(--delay);
		}

		.path-1 {
			animation-name: glow, wander-1;
		}

		.path-2 {
			animation-name: glow, wander-2;
		}
	}

	@keyframes glow {
		from {
			opacity: 0.15;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes wander-0 {
		to {
			translate: 1.5rem -1rem;
		}
	}

	@keyframes wander-1 {
		to {
			translate: -1.2rem -1.6rem;
		}
	}

	@keyframes wander-2 {
		to {
			translate: 0.8rem 1.2rem;
		}
	}
</style>
