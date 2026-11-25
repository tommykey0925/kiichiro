<!--
	トップの区切りに置くスクロール演出。花と蜂が螺旋に並び、スクロールに合わせて奥から手前へ飛んでくる。
	区間の間は画面に固定し (position: sticky)、進み具合を GSAP の ScrollTrigger で動きに変換する。
	スクロールは Lenis でなめらかにする。

	動きを減らす設定のときと、JS が動く前は、螺旋を止めた絵として 1 画面分だけ出す。
	飾りなので支援技術からは隠す。
-->
<script lang="ts">
	import { onMount, tick } from 'svelte';
	import Mascot from './brand/Mascot.svelte';
	import Flower from './brand/Flower.svelte';

	type Item = { kind: 'flower'; color: 'petal' | 'honey' | 'cream' } | { kind: 'bee'; pose: 'side' | 'top' };

	const COUNT = 36;
	const GOLDEN_ANGLE = 137.508;

	const kinds: Item[] = [
		{ kind: 'flower', color: 'petal' },
		{ kind: 'flower', color: 'honey' },
		{ kind: 'flower', color: 'cream' },
		{ kind: 'bee', pose: 'side' },
		{ kind: 'flower', color: 'petal' },
		{ kind: 'flower', color: 'cream' },
		{ kind: 'bee', pose: 'top' }
	];

	const items = Array.from({ length: COUNT }, (_, i) => ({
		...kinds[i % kinds.length],
		angle: (i * GOLDEN_ANGLE) % 360,
		// 内側ほど小さい輪に置く。止めた絵でも螺旋に見える
		radius: 0.25 + 0.75 * Math.sqrt((i + 1) / COUNT),
		spin: ((i * 53) % 90) - 45
	}));

	let section: HTMLElement;
	let live = $state(false);

	onMount(() => {
		const reduce = matchMedia('(prefers-reduced-motion: reduce)');
		if (reduce.matches) return;

		let cleanup = () => {};
		let cancelled = false;

		(async () => {
			const [{ gsap }, { ScrollTrigger }, { default: Lenis }] = await Promise.all([
				import('gsap'),
				import('gsap/ScrollTrigger'),
				import('lenis')
			]);
			if (cancelled) return;
			gsap.registerPlugin(ScrollTrigger);
			live = true;
			await tick();

			const lenis = new Lenis({ anchors: { offset: 0 } });
			const frame = (time: number) => lenis.raf(time * 1000);
			lenis.on('scroll', ScrollTrigger.update);
			gsap.ticker.add(frame);
			gsap.ticker.lagSmoothing(0);

			// メニュー (<dialog>) が開いている間は背後のページを動かさない
			const menu = document.querySelector('dialog.menu');
			const watch = new MutationObserver(() => (menu?.hasAttribute('open') ? lenis.stop() : lenis.start()));
			if (menu) watch.observe(menu, { attributes: true, attributeFilter: ['open'] });

			const stage = section.querySelector<HTMLElement>('.stage')!;
			const spiral = section.querySelector<HTMLElement>('.spiral')!;
			const nodes = gsap.utils.toArray<HTMLElement>('.item', section);
			const words = gsap.utils.toArray<HTMLElement>('.word', section);
			const reach = () => Math.min(stage.clientWidth, stage.clientHeight) * 0.42;

			const timeline = gsap.timeline({
				defaults: { ease: 'none' },
				scrollTrigger: { trigger: section, start: 'top top', end: 'bottom bottom', scrub: 0.6, invalidateOnRefresh: true }
			});

			const step = 0.14;
			const total = 1 + step * (nodes.length - 1);

			timeline.fromTo(spiral, { rotation: 0 }, { rotation: 140, duration: total }, 0);
			timeline.fromTo(words, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.15 }, 0);
			timeline.to(words, { opacity: 0, duration: 0.6 }, total - 0.6);

			nodes.forEach((node, i) => {
				const item = items[i];
				const rad = (item.angle * Math.PI) / 180;
				// timeline に含めると、画面の大きさが変わったときに位置を測り直す
				timeline.set(node, {
					x: () => Math.cos(rad) * reach() * item.radius,
					y: () => Math.sin(rad) * reach() * item.radius,
					z: -1600,
					rotation: item.spin,
					opacity: 1
				}, 0);
				const at = i * step;
				timeline.to(node, { z: 650, rotation: item.spin + 120, duration: 1 }, at);
				timeline.to(node, { opacity: 0, duration: 0.15 }, at + 0.85);
			});

			cleanup = () => {
				timeline.scrollTrigger?.kill();
				timeline.kill();
				watch.disconnect();
				gsap.ticker.remove(frame);
				lenis.destroy();
			};
		})();

		return () => {
			cancelled = true;
			cleanup();
		};
	});
</script>

<section class="garden" class:live bind:this={section} aria-hidden="true">
	<div class="stage">
		<p class="word top">Hyper</p>
		<p class="word amp">(&amp;)</p>
		<p class="word bottom">AI-Slop</p>
		<div class="spiral">
			{#each items as item, i (i)}
				<div
					class="item"
					style:--angle="{item.angle}deg"
					style:--radius={item.radius}
					style:--spin="{item.spin}deg"
				>
					{#if item.kind === 'bee'}
						<Mascot pose={item.pose} loading="lazy" />
					{:else}
						<Flower color={item.color} loading="lazy" />
					{/if}
				</div>
			{/each}
		</div>
	</div>
</section>

<style>
	.garden {
		--reach: min(42vw, 42svh);

		position: relative;
		background-image: radial-gradient(var(--line) 1.6px, transparent 1.8px);
		background-size: 14px 14px;
	}

	.garden.live {
		height: 450svh;
	}

	.stage {
		position: relative;
		height: calc(100svh - var(--header-height));
		overflow: hidden;
		perspective: 800px;
	}

	.live .stage {
		position: sticky;
		top: var(--header-height);
	}

	.spiral {
		position: absolute;
		inset: 0;
		transform-style: preserve-3d;
	}

	.item {
		position: absolute;
		top: 50%;
		left: 50%;
		--size: clamp(6rem, 14vw, 11rem);

		width: var(--size);
		margin: calc(var(--size) / -2) 0 0 calc(var(--size) / -2);
	}

	/* JS が動く前・動きを減らす設定のときの止めた絵 */
	.garden:not(.live) .item {
		translate: calc(cos(var(--angle)) * var(--reach) * var(--radius)) calc(sin(var(--angle)) * var(--reach) * var(--radius));
		rotate: var(--spin);
		scale: calc(0.5 + var(--radius) * 0.6);
	}

	.item :global(img) {
		display: block;
		width: 100%;
		height: auto;
	}

	.word {
		position: absolute;
		z-index: 1;
		margin: 0;
		font-family: var(--font-display);
		font-weight: 700;
		line-height: 1;
		letter-spacing: -0.02em;
		pointer-events: none;
	}

	.top {
		top: 1.5rem;
		left: clamp(1.25rem, 6vw, 6rem);
		color: var(--ink);
		font-size: clamp(3rem, 9vw, 7rem);
	}

	.bottom {
		bottom: 1.5rem;
		left: clamp(1.25rem, 6vw, 6rem);
		color: var(--brand-petal);
		font-size: clamp(3rem, 9vw, 7rem);
	}

	.amp {
		top: 50%;
		right: clamp(1.25rem, 8vw, 8rem);
		color: var(--muted);
		font-size: clamp(1.5rem, 3vw, 2.5rem);
		translate: 0 -50%;
	}
</style>
