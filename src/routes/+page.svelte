<script lang="ts">
	import WorkList from '$lib/WorkList.svelte';
	import Logo from '$lib/brand/Logo.svelte';
	import Cell from '$lib/brand/Cell.svelte';
	import Bee from '$lib/forage/Bee.svelte';
	import HeroComb from '$lib/forage/HeroComb.svelte';
	import { detour } from '$lib/forage/state.svelte';
	import { reveal } from '$lib/motion/reveal';
	import { profile } from '$lib/profile';
	import { showcase, others } from '$lib/works';
	import { localize } from '$lib/i18n/localize';
	import { m } from '$lib/paraglide/messages';
	import { localizeHref } from '$lib/paraglide/runtime';

	let hero = $state<HTMLElement>();
</script>

<svelte:head>
	<title>{profile.name} — slops</title>
	<meta name="description" content={m.bio()} />
</svelte:head>

<!-- ヒーロー: 巣板の格子に大きなロゴ。蜂はこの上を飛び、近くの部屋が灯る -->
<section class="hero" bind:this={hero}>
	<HeroComb />
	<h1 class="mark"><Logo animated /></h1>
	<p class="bio">{m.bio()}</p>
	<p class="cues">
		<a class="cue" href="#works" aria-label={m.to_works()}>↓</a>
		<a class="cue" href={localizeHref('/world')}>World 3D</a>
	</p>
</section>

<Bee {hero} />

<section class="works" id="works" aria-labelledby="works-heading">
	<h2 id="works-heading" class="heading" use:reveal>
		<span class="en">Works</span>
		<span class="ja">{m.showcase_heading()}</span>
	</h2>

	<ol class="picks">
		{#each showcase as work, i (work.id)}
			<li class="pick" use:detour={work.id} use:reveal>
				<span class="no" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
				<div class="body">
					<h3><a href={localizeHref(`/works/${work.id}`)}>{work.title}</a></h3>
					<p>{localize(work.summary)}</p>
					<p class="tags">{work.tech.map(localize).join(' / ')}</p>
					<p class="links">
						{#if work.liveUrl}
							<a href={work.liveUrl} rel="noreferrer">{m.open_site()} ↗</a>
						{/if}
						<a href={work.repo} rel="noreferrer">GitHub ↗</a>
					</p>
				</div>
				<span class="pick-cell"><Cell id={work.id} color={work.spot?.color ?? 'var(--brand-petal)'} size="7rem" /></span>
			</li>
		{/each}
	</ol>

	<WorkList works={others} start={showcase.length + 1} />
</section>

<section class="contact" id="contact" aria-labelledby="contact-heading">
	<h2 id="contact-heading" class="heading" use:reveal>
		<span class="en">{m.contact_heading()}</span>
		<span class="ja">{m.nav_contact()}</span>
	</h2>
	<p class="contacts" use:reveal>
		<a href={profile.github} rel="me">GitHub</a>
		<a href={profile.x} rel="me" aria-label="X (@grdevtom2gramp1)">X</a>
		<a href="mailto:{profile.email}" aria-label={m.contact_mail({ email: profile.email })}>Mail</a>
	</p>
</section>

<style>
	.hero {
		position: relative;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		min-height: max(35rem, 100svh);
		padding: 7.5rem max(1.25rem, env(safe-area-inset-right, 0)) 9svh max(1.25rem, env(safe-area-inset-left, 0));
		overflow: hidden;
	}

	/* 横にしたスマホ (背が低い画面) では、ロゴと一言が最初の画面に収まるよう上の余白と高さを詰める */
	@media (max-height: 32.5rem) and (orientation: landscape) {
		.hero {
			min-height: 100svh;
			padding-top: 4rem;
			padding-bottom: 3.5rem;
		}

		.cues {
			margin-top: 1rem;
		}
	}

	.mark {
		position: relative;
		margin: 0;
		font-size: clamp(3.4rem, min(15vw, 30svh), 13rem);
		line-height: 0.9;
		letter-spacing: -0.045em;
	}

	.mark :global(.logo) {
		letter-spacing: inherit;
	}

	.bio,
	.cues {
		position: relative;
	}

	.bio {
		margin: 1.5rem 0 0;
		font-size: clamp(var(--font-size-16), 2vw, var(--font-size-22, 1.375rem));
		font-weight: 700;
	}

	.cues {
		display: flex;
		gap: 2rem;
		margin: 2.5rem 0 0;
	}

	.cue {
		color: inherit;
		font: 500 0.875rem var(--font-display);
		letter-spacing: 0.2em;
		text-decoration: none;
		text-transform: uppercase;
	}

	.cue:hover {
		text-decoration: underline 0.125rem var(--brand-honey);
		text-underline-offset: 0.4rem;
	}

	/* 一言と行き先は、ロゴが上がりきるころに出る */
	@media (prefers-reduced-motion: no-preference) {
		.bio,
		.cues {
			animation: rise var(--duration-mid) var(--ease-out) 0.8s both;
		}

		.cues {
			animation-delay: 1s;
		}
	}

	@keyframes rise {
		from {
			opacity: 0;
			translate: 0 1rem;
		}
	}

	.works,
	.contact {
		max-width: 75rem;
		margin: 0 auto;
		padding: clamp(5rem, 12vw, 10rem) max(1.25rem, env(safe-area-inset-right, 0)) 2.5rem max(1.25rem, env(safe-area-inset-left, 0));
	}

	.contact {
		padding-bottom: 10rem;
	}

	/* 見出し: 大きな英字と小さな和文 */
	.heading {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.25rem 1.25rem;
		margin: 0 0 3rem;
	}

	.heading .en {
		font-size: clamp(3rem, 10vw, 8rem);
		line-height: 0.9;
		letter-spacing: -0.04em;
	}

	.heading .ja {
		color: var(--muted);
		font-family: var(--font-family-sans);
		font-size: var(--font-size-16);
	}

	.picks {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.pick {
		display: grid;
		grid-template-columns: clamp(3.5rem, 8vw, 7rem) minmax(0, 1fr) clamp(4.5rem, 9vw, 7.5rem);
		gap: clamp(1rem, 3vw, 2.5rem);
		align-items: start;
		padding: clamp(1.75rem, 4vw, 3rem) 0;
		border-top: 0.125rem solid var(--ink);
	}

	.pick:last-child {
		border-bottom: 0.125rem solid var(--ink);
	}

	.no {
		color: transparent;
		font: 500 clamp(2.4rem, 5vw, 4.5rem) / 1 var(--font-display);
		-webkit-text-stroke: 0.09375rem var(--ink);
	}

	.pick h3 {
		margin: 0 0 0.625rem;
		font-size: clamp(1.9rem, 4vw, 3rem);
		line-height: 1.05;
		letter-spacing: -0.02em;
	}

	/* 作品名に触れると、蜜色の帯が左から引かれる */
	.pick h3 a {
		color: inherit;
		text-decoration: none;
		background: linear-gradient(var(--brand-honey), var(--brand-honey)) 0 88% / 0 0.32em no-repeat;
		transition: background-size var(--duration-mid) var(--ease-out);
	}

	.pick:hover h3 a,
	.pick h3 a:focus-visible {
		background-size: 100% 0.32em;
	}

	.body p {
		max-width: 40em;
		margin: 0;
	}

	.tags {
		margin-top: 0.875rem !important;
		color: var(--muted);
		font-size: var(--font-size-14);
	}

	.links {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 1.5rem;
		margin-top: 1rem !important;
		font-family: var(--font-display);
		font-weight: 700;
	}

	.links a {
		color: inherit;
		text-decoration: underline 0.125rem var(--brand-honey);
		text-underline-offset: 0.3rem;
	}

	.pick-cell {
		--cell-size: 100%;
		display: block;
		padding-top: 0.5rem;
	}

	@media (max-width: 45rem) {
		.pick {
			grid-template-columns: minmax(0, 1fr) 4.2rem;
			grid-template-areas: 'no cell' 'body body';
		}

		.no {
			grid-area: no;
		}

		.body {
			grid-area: body;
		}

		.pick-cell {
			grid-area: cell;
		}
	}

	.contacts {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem 2.5rem;
		margin: 0;
		font: 700 clamp(1.4rem, 3vw, 2.2rem) var(--font-display);
	}

	.contacts a {
		color: inherit;
		text-decoration: none;
		background: linear-gradient(currentColor, currentColor) 0 100% / 0 0.125rem no-repeat;
		transition: background-size var(--duration-mid) var(--ease-out);
	}

	.contacts a:hover,
	.contacts a:focus-visible {
		background-size: 100% 0.125rem;
	}
</style>
