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
		margin-bottom: 3rem;
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
		display: block;
		width: 4.5rem;
		height: 4.5rem;
		margin: 2.75rem auto 0;
		transition: transform 0.2s ease;
	}

	.enter:hover {
		transform: translateY(-3px) scale(1.06);
	}

	/* 飛行は svg 側に持たせる。link 側の transform と取り合わないようにするため。 */
	.enter :global(svg) {
		animation: bee-flight 7s ease-in-out infinite;
	}

	@keyframes bee-flight {
		0%,
		60.00% {
			transform: translate(-0.0px, -0.0px);
		}
		63.33% {
			transform: translate(-17.0px, -14.7px);
		}
		66.67% {
			transform: translate(-29.4px, -14.7px);
		}
		70.00% {
			transform: translate(-34.0px, -0.0px);
		}
		73.33% {
			transform: translate(-29.4px, 14.7px);
		}
		76.67% {
			transform: translate(-17.0px, 14.7px);
		}
		80.00% {
			transform: translate(-0.0px, 0.0px);
		}
		83.33% {
			transform: translate(17.0px, -14.7px);
		}
		86.67% {
			transform: translate(29.4px, -14.7px);
		}
		90.00% {
			transform: translate(34.0px, -0.0px);
		}
		93.33% {
			transform: translate(29.4px, 14.7px);
		}
		96.67% {
			transform: translate(17.0px, 14.7px);
		}
		100.00% {
			transform: translate(0.0px, 0.0px);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.enter :global(svg) {
			animation: none;
		}
	}

	h2 {
		margin: 0 0 1.1rem;
		font-size: 1.15rem;
	}

	section {
		margin-bottom: 3.25rem;
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
