<!--
	サイトの顔になる蜂の絵。いまは static/bee.glb から scripts/render-brand.ts で書き出した静止画。
	描いた絵に替えるときは同じ名前の画像を置き換える。向きを足すときは poses に足す。
-->
<script lang="ts">
	import type { HTMLImgAttributes } from 'svelte/elements';
	import hero from './mascot.webp';
	import side from './bee-side.webp';
	import top from './bee-top.webp';

	const poses = { hero, side, top } as const;

	let { pose = 'hero', ...rest }: { pose?: keyof typeof poses } & Omit<HTMLImgAttributes, 'src' | 'alt'> = $props();
</script>

<img src={poses[pose]} alt="" decoding="async" draggable="false" {...rest} />
