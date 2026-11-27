<!--
	サイトの蜂の絵。/world の蜂 (src/lib/world/BeeModel.ts) を scripts/render-brand.ts で撮った静止画で、サイトの蜂はこの 1 種類だけ。
	top と wings は同じ枠で撮ってあり、重ねると真上から見た蜂になる (羽だけを震わせて羽ばたきを見せる)。
	向きを足すときは render-brand.ts の shots と poses に足す。
-->
<script lang="ts">
	import type { HTMLImgAttributes } from 'svelte/elements';
	import hero from './mascot.webp';
	import side from './bee-side.webp';
	import top from './bee-top.webp';
	import wings from './bee-top-wings.webp';

	const poses = { hero, side, top, wings } as const;

	let { pose = 'hero', ...rest }: { pose?: keyof typeof poses } & Omit<HTMLImgAttributes, 'src' | 'alt'> = $props();
</script>

<img src={poses[pose]} alt="" decoding="async" draggable="false" {...rest} />
