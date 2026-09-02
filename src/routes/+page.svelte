<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import WorkCard from '$lib/WorkCard.svelte';
	import { email, profile } from '$lib/profile';
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
		<ul class="skills">
			{#each profile.skills as skill (skill)}
				<li class="tag">{skill}</li>
			{/each}
		</ul>

		<a class="enter pill pill-primary" href="/world" onclick={() => rememberMode('world')}>3D で見る</a>
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
		<p>
			<a href="mailto:{email()}">{email()}</a> ／
			<a href={profile.github} rel="me">GitHub</a>
		</p>
	</section>

	<footer>
		3D モデルのライセンス表記: Bee by jeremy [CC-BY] via
		<a href="https://poly.pizza/m/evjB26aGfTh" rel="noreferrer">Poly Pizza</a>
	</footer>
</div>

<style>
	header {
		margin-bottom: 3.5rem;
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
		margin-top: 1.75rem;
	}

	.skills {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	h2 {
		margin: 0 0 1.1rem;
		font-size: 1.15rem;
	}

	section {
		margin-bottom: 3.25rem;
	}

	footer {
		padding-top: 1.5rem;
		border-top: 1px solid var(--line);
		color: var(--muted);
		font-size: 0.75rem;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(19rem, 1fr));
		gap: 1rem;
	}
</style>
