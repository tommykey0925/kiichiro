<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import WorkCard from '$lib/WorkCard.svelte';
	import BeeIcon from '$lib/BeeIcon.svelte';
	import GithubIcon from '$lib/GithubIcon.svelte';
	import { profile } from '$lib/profile';
	import { preferredMode, rememberMode } from '$lib/mode';
	import { byCategory, featured } from '$lib/works';

	onMount(() => {
		// 先読みは最適化なので、リンクの有効化には使わない。
		// 失敗しても /world 側で読み直せる。
		if (!matchMedia('(pointer: fine)').matches) return;

		let left = false;
		// requestIdleCallback は iOS Safari 16.4 未満に無い。
		const schedule = globalThis.requestIdleCallback ?? ((run: () => void) => setTimeout(run, 300));
		schedule(() => {
			if (left) return;
			import('$lib/world/World').then(() => {
				if (!left && preferredMode() === 'world') goto('/world');
			});
		});
		return () => {
			left = true;
		};
	});

</script>

<svelte:head>
	<title>{profile.name} — Works</title>
	<meta name="description" content={profile.bio.ja} />
</svelte:head>

<div class="wrap">
	<header>
		<h1>{profile.name}</h1>
		<p class="bio">{profile.bio.ja}</p>
		<a class="enter" href="/world" onclick={() => rememberMode('world')} aria-label="3D で見る">
			<BeeIcon />
		</a>
	</header>

	<section>
		<h2>Works</h2>
		<div class="grid">
			{#each featured as work (work.id)}
				<WorkCard {work} />
			{/each}
		</div>
	</section>

	<section>
		<h2>学習・実験</h2>
		<div class="grid">
			{#each byCategory('learning') as work (work.id)}
				<WorkCard {work} />
			{/each}
		</div>
	</section>

	<section>
		<h2>インフラ</h2>
		<div class="grid">
			{#each byCategory('infra') as work (work.id)}
				<WorkCard {work} />
			{/each}
		</div>
	</section>

	<section>
		<h2>Contact</h2>
		<a class="github" href={profile.github} rel="me" aria-label="GitHub">
			<GithubIcon />
		</a>
	</section>
</div>

<style>
	header {
		margin-bottom: 2.5rem;
	}

	h1 {
		margin: 0 0 0.5rem;
		font-size: clamp(1.8rem, 5vw, 2.6rem);
		letter-spacing: -0.01em;
	}

	.bio {
		max-width: 42rem;
		margin: 0 0 1.25rem;
		color: var(--muted);
	}

	.enter {
		position: relative;
		display: block;
		width: 4.5rem;
		height: 4.5rem;
		margin: 2rem auto 0;
		transition: transform 0.2s ease;
	}

	.enter:hover {
		transform: translateY(-3px) scale(1.06);
	}

	/*
	 * 飛行は svg 側に持たせる。link 側の transform と取り合うと hover が効かない。
	 * キーフレームで座標を刻むと区間ごとに緩急が付いて動きが跳ねるので、
	 * ベジェ曲線を 1 本辿らせる。進行方向への向き直しも offset-rotate に任せる。
	 */
	.enter :global(svg) {
		position: absolute;
		inset: 0;
		/*
		 * 始点と終点の制御点を真上・真下に置いて、出入りの接線を垂直にしている。
		 * 斜めに出るパスだと offset-rotate がそこに合わせ、静止時の蜂が傾く。
		 */
		offset-path: path(
			'M36,36 C36,10 92,10 92,36 C92,62 36,62 36,36 C36,10 -20,10 -20,36 C-20,62 36,62 36,36'
		);
		/* Twemoji の蜂は上を向いているので、接線から 90 度ずらす */
		offset-rotate: auto 90deg;
		animation: bee-flight 7s infinite;
	}

	@keyframes bee-flight {
		0%,
		60% {
			offset-distance: 0%;
			animation-timing-function: ease-in-out;
		}
		100% {
			offset-distance: 100%;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.enter :global(svg) {
			offset-path: none;
			animation: none;
		}
	}

	.github {
		display: inline-flex;
		padding: 0.55rem;
		border: 1px solid var(--line);
		border-radius: 8px;
		background: var(--surface);
		color: var(--ink);
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(19rem, 1fr));
		gap: 1rem;
	}
</style>
