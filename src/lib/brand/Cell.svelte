<!--
	作品の部屋。墨の縁の六角形で、蜂が留まると下から蜜が満ち、真ん中に作品の色 (work.spot.color、/world の花と同じ) がにじむ。
	画面の上 65% に入ったら「読む位置に来た」(咲いた) とし、蜂がここへ飛んでくる。
	動きを減らす設定では、読む位置に来た時点で蜜をためた状態にする。
	絵を描き直すときはこの部品の中身だけを替える。
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { forage } from '$lib/forage/state.svelte';

	let { id, color, size = '6rem' }: { id: string; color: string; size?: string } = $props();

	let element: HTMLElement;
	const open = $derived(forage.bloomed.has(id));
	const visited = $derived(forage.visited.has(id));

	onMount(() => {
		const unregister = forage.register(id, element);
		const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (!entry.isIntersecting) continue;
					forage.bloom(id);
					if (reduce) forage.visit(id);
				}
			},
			{ rootMargin: '0px 0px -35% 0px' }
		);
		observer.observe(element);
		return () => {
			observer.disconnect();
			unregister();
		};
	});
</script>

<span class="cell" class:open class:visited style:--size={size} style:--spot={color} bind:this={element} aria-hidden="true">
	<span class="fill"></span>
</span>

<style>
	/* 置く側は --cell-size で上書きできる (画面幅ごとに大きさを変えるため) */
	.cell {
		--hex: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%);
		position: relative;
		display: block;
		width: var(--cell-size, var(--size));
		aspect-ratio: 1 / 1.1547;
		background: var(--brand-ink);
		clip-path: var(--hex);
	}

	.cell::before,
	.fill {
		position: absolute;
		inset: 0.1875rem;
		clip-path: var(--hex);
	}

	.cell::before {
		content: '';
		background: var(--brand-paper-2);
	}

	.fill {
		background: var(--brand-honey);
		transform: translateY(100%);
		transition: transform 1.8s var(--ease-out);
	}

	.fill::after {
		content: '';
		position: absolute;
		top: 52%;
		left: 50%;
		width: 34%;
		aspect-ratio: 1;
		border-radius: 50%;
		background: var(--spot);
		translate: -50% -50%;
		scale: 0;
		transition: scale var(--duration-mid) var(--ease-spring) 1.1s;
	}

	.visited .fill {
		transform: none;
	}

	.visited .fill::after {
		scale: 1;
	}

	@media (prefers-reduced-motion: reduce) {
		.fill,
		.fill::after {
			transition: none;
		}
	}
</style>
