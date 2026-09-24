<script lang="ts">
	import WorkCard from '$lib/WorkCard.svelte';
	import WorkTable from '$lib/WorkTable.svelte';
	import BeeIcon from '$lib/BeeIcon.svelte';
	import GithubIcon from '$lib/GithubIcon.svelte';
	import XIcon from '$lib/XIcon.svelte';
	import { profile } from '$lib/profile';
	import { byCategory } from '$lib/works';
</script>

<svelte:head>
	<title>{profile.name} — 制作物</title>
	<meta name="description" content={profile.bio} />
</svelte:head>

<div class="wrap">
	<header>
		<h1>{profile.name}</h1>
		<p class="bio">{profile.bio}</p>
		<a class="enter" href="/world" aria-label="3D で見る">
			<BeeIcon />
		</a>
	</header>

	<section>
		<h2>制作物</h2>
		<div class="grid">
			{#each byCategory('product') as work (work.id)}
				<WorkCard {work} />
			{/each}
		</div>
	</section>

	<section>
		<h2>学習・実験</h2>
		<WorkTable works={byCategory('learning')} />
	</section>

	<section>
		<h2>インフラ</h2>
		<WorkTable works={byCategory('infra')} />
	</section>

	<section>
		<h2>連絡先</h2>
		<div class="contacts">
			<a class="contact" href={profile.github} rel="me" aria-label="GitHub">
				<GithubIcon />
			</a>
			<a class="contact" href={profile.x} rel="me" aria-label="X (@grdevtom2gramp1)">
				<XIcon />
			</a>
		</div>
	</section>
</div>

<style>
	header {
		margin-bottom: 2.5rem;
	}

	h1 {
		margin: 0 0 0.5rem;
		font-size: clamp(var(--font-size-28), 5vw, var(--font-size-36));
		line-height: var(--line-height-130);
		letter-spacing: -0.01em;
	}

	h2 {
		font-size: var(--font-size-24);
		line-height: var(--line-height-150);
	}

	.bio {
		max-width: 42rem;
		margin: 0 0 1.25rem;
		color: var(--muted);
	}

	/*
	 * 画面いっぱいを飛ばすため、蜂自身を fixed にする。offset-path の % は
	 * containing block に対して解決されるので、fixed = ビューポート基準になり、
	 * 幅を問わず同じ図形を描く。中の svg に持たせると % が 4.5rem 基準になる。
	 */
	.enter {
		/* 左右の折り返し位置。% だと狭い画面で蜂が端からはみ出すので、
		   蜂の半分 (2.25rem) より広い固定値を画面幅から引く。 */
		--edge: 3rem;

		position: fixed;
		z-index: 1;
		display: block;
		width: 4.5rem;
		height: 4.5rem;
		/* shape() 非対応ブラウザはこちらが残る。∞ ではなくなるが飛びはする */
		offset-path: ellipse(42% 37%);
		/*
		 * 制御点を 0% / 100% に置いているのは、3 次ベジェが制御点まで届かないため。
		 * 曲線が実際に届く高さは (100 + 6 * 制御点) / 8 で、0% / 100% のとき
		 * 12.5% / 87.5%。見た目の縦幅を画面の 3/4 にするための値。
		 */
		offset-path: shape(
			from 50% 50%,
			curve to calc(100% - var(--edge)) 50% with 50% 0% / calc(100% - var(--edge)) 0%,
			curve to 50% 50% with calc(100% - var(--edge)) 100% / 50% 100%,
			curve to var(--edge) 50% with 50% 0% / var(--edge) 0%,
			curve to 50% 50% with var(--edge) 100% / 50% 100%
		);
		/* Twemoji の蜂は上を向いているので、接線から 90 度ずらす */
		offset-rotate: auto 90deg;
		animation: bee-flight 60s linear infinite;
	}

	/*
	 * hover の拡大はリンク本体ではなく中の svg に当てる。個別プロパティの scale は
	 * offset (経路上への移動) より先に合成されるため、リンク本体に付けると移動量まで
	 * 1.12 倍され、蜂が経路から 100px ほど滑る。
	 */
	.enter :global(svg) {
		transition: scale 0.2s ease;
	}

	.enter:hover :global(svg) {
		scale: 1.12;
	}

	@keyframes bee-flight {
		from {
			offset-distance: 0%;
		}
		to {
			offset-distance: 100%;
		}
	}

	/* 動きを止める人には、飛ばさず元どおりヘッダーの中に置く */
	@media (prefers-reduced-motion: reduce) {
		.enter {
			position: static;
			margin: 2rem auto 0;
			offset-path: none;
			animation: none;
		}
	}

	.contacts {
		display: flex;
		gap: 0.5rem;
	}

	.contact {
		display: inline-flex;
		padding: 0.55rem;
		border: 1px solid var(--line);
		border-radius: var(--border-radius-8);
		background: var(--surface);
		color: var(--ink);
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(19rem, 1fr));
		gap: 1rem;
	}
</style>
