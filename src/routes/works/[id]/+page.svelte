<script lang="ts">
	import { localize } from '$lib/i18n/localize';
	import { reveal } from '$lib/motion/reveal';
	import { m } from '$lib/paraglide/messages';
	import { localizeHref } from '$lib/paraglide/runtime';

	let { data } = $props();
	const work = $derived(data.work);
</script>

<svelte:head>
	<title>{m.work_title({ title: work.title })}</title>
	<meta name="description" content={localize(work.summary)} />
	<meta property="og:title" content={work.title} />
	<meta property="og:description" content={localize(work.summary)} />
	<meta property="og:type" content="website" />
</svelte:head>

<article class="work" style:--spot={work.spot?.color ?? 'var(--brand-petal)'}>
	<a class="back" href={localizeHref('/') + '#works'}>{m.back_to_list()}</a>

	<!-- 作品名の下に、トップの部屋と同じ作品の色の六角形を置く -->
	<h1>{work.title}</h1>
	<span class="mark" aria-hidden="true"></span>

	<p class="pitch" use:reveal>{localize(work.pitch ?? work.summary)}</p>

	<p class="links" use:reveal>
		{#if work.liveUrl}
			<a href={work.liveUrl} rel="noreferrer">{m.open_site()} ↗</a>
		{/if}
		<a href={work.repo} rel="noreferrer">GitHub ↗</a>
	</p>

	<dl class="facts" use:reveal>
		<dt>Tech</dt>
		<dd>{work.tech.map(localize).join(' / ')}</dd>
		{#if work.credits}
			<dt>{m.credits_heading()}</dt>
			<dd>
				<ul>
					{#each work.credits as credit (credit)}
						<li>{credit}</li>
					{/each}
				</ul>
			</dd>
		{/if}
	</dl>
</article>

<style>
	.work {
		max-width: 62rem;
		margin: 0 auto;
		padding: calc(var(--header-height) + 3rem) max(1.25rem, env(safe-area-inset-right, 0)) 8rem max(1.25rem, env(safe-area-inset-left, 0));
	}

	.back {
		display: inline-block;
		margin-bottom: 3rem;
		color: var(--muted);
		font-size: var(--font-size-14);
		text-decoration: none;
	}

	.back:hover {
		color: var(--ink);
	}

	h1 {
		margin: 0;
		font-size: clamp(3rem, 10vw, 7rem);
		line-height: 0.95;
		letter-spacing: -0.045em;
		overflow-wrap: anywhere;
	}

	.mark {
		display: block;
		width: 2.25rem;
		aspect-ratio: 1 / 1.1547;
		margin: 1.5rem 0 2.5rem;
		background: var(--spot);
		clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%);
	}

	@media (prefers-reduced-motion: no-preference) {
		h1 {
			animation: rise var(--duration-slow) var(--ease-out) both;
		}

		.mark {
			animation: pop var(--duration-mid) var(--ease-spring) 0.4s both;
		}
	}

	@keyframes rise {
		from {
			opacity: 0;
			translate: 0 2rem;
		}
	}

	@keyframes pop {
		from {
			scale: 0;
			rotate: -120deg;
		}
	}

	.pitch {
		max-width: 40em;
		margin: 0 0 2rem;
		font-size: var(--font-size-18, 1.125rem);
		line-height: var(--line-height-175);
	}

	.links {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem 2rem;
		margin: 0 0 3.5rem;
		font: 700 var(--font-size-20) var(--font-display);
	}

	.links a {
		color: inherit;
		text-decoration: underline 0.125rem var(--brand-honey);
		text-underline-offset: 0.35rem;
	}

	.facts {
		display: grid;
		grid-template-columns: 8rem minmax(0, 1fr);
		margin: 0;
		border-top: 0.125rem solid var(--ink);
	}

	.facts dt,
	.facts dd {
		margin: 0;
		padding: 1rem 0;
		border-bottom: 1px solid var(--line);
	}

	.facts dt {
		color: var(--muted);
		font: 500 var(--font-size-14) var(--font-display);
		letter-spacing: 0.1em;
	}

	.facts ul {
		margin: 0;
		padding-left: 1.1rem;
	}

	@media (max-width: 40rem) {
		.facts {
			grid-template-columns: 1fr;
		}

		.facts dt {
			padding-bottom: 0;
			border-bottom: 0;
		}
	}
</style>
