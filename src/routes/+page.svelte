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

	const sections = [
		{ title: '学習・実験', works: byCategory('learning').filter((w) => !w.spot) },
		{ title: 'インフラ', works: byCategory('infra').filter((w) => !w.spot) }
	];
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

		<a class="enter" href="/world" onclick={() => rememberMode('world')}>3D で見る</a>
	</header>

	<section>
		<h2>Works</h2>
		<div class="grid">
			{#each featured as work (work.id)}
				<WorkCard {work} />
			{/each}
		</div>
	</section>

	{#each sections as section (section.title)}
		<section>
			<h2>{section.title}</h2>
			<div class="grid">
				{#each section.works as work (work.id)}
					<WorkCard {work} />
				{/each}
			</div>
		</section>
	{/each}

	<section>
		<h2>Contact</h2>
		<p>
			<a href="mailto:{email()}">{email()}</a> ／
			<a href={profile.github} rel="me">GitHub</a>
		</p>
	</section>
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
		display: inline-block;
		margin-top: 1.75rem;
		padding: 0.6rem 1.4rem;
		border: 1px solid var(--accent);
		border-radius: 999px;
		background: var(--accent);
		color: #fff;
		font-size: 0.9rem;
		text-decoration: none;
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

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(19rem, 1fr));
		gap: 1rem;
	}
</style>
