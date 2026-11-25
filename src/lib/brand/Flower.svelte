<!--
	作品を表す花。いまは static/flower.glb から scripts/render-brand.ts で書き出した静止画。
-->
<script lang="ts">
	import type { HTMLImgAttributes } from 'svelte/elements';
	import petal from './flower-petal.webp';
	import honey from './flower-honey.webp';
	import cream from './flower-cream.webp';

	const colors = { petal, honey, cream } as const;

	let { color = 'petal', ...rest }: { color?: keyof typeof colors } & Omit<HTMLImgAttributes, 'src' | 'alt'> = $props();
</script>

<img src={colors[color]} alt="" decoding="async" draggable="false" {...rest} />
