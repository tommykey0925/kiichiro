<script lang="ts">
	import WorkList from '$lib/WorkList.svelte';
	import BeeIcon from '$lib/BeeIcon.svelte';
	import GithubIcon from '$lib/GithubIcon.svelte';
	import XIcon from '$lib/XIcon.svelte';
	import MailIcon from '$lib/MailIcon.svelte';
	import { profile } from '$lib/profile';
	import '$lib/dads/link.css';
	import { showcase, works } from '$lib/works';

	const products = works.filter((w) => !w.pitch);
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
		<h2>安いよ安いよ〜</h2>
		{#each showcase as work (work.id)}
			<article class="pick">
				<h3><a class="dads-link" href="/works/{work.id}">{work.title}</a></h3>
				<p>{work.pitch}</p>
				<p class="tech">{work.tech.join(' / ')}</p>
				<p class="links">
					{#if work.liveUrl}
						<a class="dads-link" href={work.liveUrl} rel="noreferrer">サイトを開く</a>
					{/if}
					<a class="dads-link" href={work.repo} rel="noreferrer">GitHub</a>
				</p>
			</article>
		{/each}
		<WorkList works={products} />
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
			<a class="contact" href="mailto:{profile.email}" aria-label="メール ({profile.email})">
				<MailIcon />
			</a>
		</div>
	</section>

	<footer class="credits">
		<p>3D の素材</p>
		<ul>
			<li>Bee by jeremy [CC-BY] via Poly Pizza</li>
			<li>Flower by Zoe XR [CC-BY] via Poly Pizza</li>
			<li>Honeybee by Twitter (Twemoji) [CC-BY 4.0]</li>
		</ul>
	</footer>
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

	.credits {
		margin-top: 4rem;
		color: var(--muted);
		font-size: var(--font-size-14);
	}

	.credits p {
		margin: 0;
	}

	.credits ul {
		margin: 0;
		padding-left: 1.1rem;
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

	.pick {
		padding: 1.25rem 0;
		border-bottom: 1px solid var(--line);
	}

	.pick:first-of-type {
		border-top: 1px solid var(--line);
	}

	.pick + :global(.list) {
		border-top: none;
	}

	.pick h3 {
		margin: 0 0 0.5rem;
		font-size: var(--font-size-20);
		line-height: var(--line-height-150);
	}

	.pick p {
		max-width: 42rem;
		margin: 0 0 0.5rem;
	}

	.pick .tech {
		color: var(--muted);
		font-size: var(--font-size-14);
		line-height: var(--line-height-150);
	}

	.pick .links {
		display: flex;
		gap: 1.5rem;
		margin: 0;
	}
</style>
