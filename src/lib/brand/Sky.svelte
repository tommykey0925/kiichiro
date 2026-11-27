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
</script>

<div class="sky" style:--sky-min={height}>
	{@render children?.()}
	<div class="ridge"><Meadow {works} /></div>
</div>

<style>
	.sky {
		display: flex;
		flex-direction: column;
		/* ヘッダーの下まで空を伸ばす (ヘッダーは空に浮かぶ札なので透けて見える) */
		margin-top: calc(-1 * var(--header-height));
		padding-top: var(--header-height);
		min-height: var(--sky-min);
		background: linear-gradient(var(--sky-top), var(--sky-horizon) 85%);
	}

	.ridge {
		margin-top: auto;
	}
</style>
