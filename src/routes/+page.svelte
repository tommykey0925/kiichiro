<script lang="ts">
	import WorkList from '$lib/WorkList.svelte';
	import Logo from '$lib/brand/Logo.svelte';
	import Mascot from '$lib/brand/Mascot.svelte';
	import Bloom from '$lib/brand/Bloom.svelte';
	import Bee from '$lib/forage/Bee.svelte';
	import Meadow from '$lib/forage/Meadow.svelte';
	import { detour } from '$lib/forage/state.svelte';
	import GithubLogoIcon from 'phosphor-svelte/lib/GithubLogoIcon';
	import XLogoIcon from 'phosphor-svelte/lib/XLogoIcon';
	import EnvelopeSimpleIcon from 'phosphor-svelte/lib/EnvelopeSimpleIcon';
	import { profile } from '$lib/profile';
	import '$lib/dads/link.css';
	import { showcase, others } from '$lib/works';
	import { localize } from '$lib/i18n/localize';
	import { m } from '$lib/paraglide/messages';
	import { localizeHref } from '$lib/paraglide/runtime';

	const colorOf = (w: { spot?: { color: string } }) => w.spot?.color ?? 'var(--brand-petal)';
</script>

<svelte:head>
	<title>{profile.name} — slops</title>
	<meta name="description" content={m.bio()} />
</svelte:head>

<section class="hero">
	<div class="hero-text">
		<h1><Logo /></h1>
		<p class="bio">{m.bio()}</p>
	</div>
	<div class="hero-art" aria-hidden="true">
		<span class="hex"></span>
		<Mascot pose="hero" class="hero-bee" fetchpriority="high" />
	</div>
</section>

<Bee />

<div class="wrap">
	<section id="works" aria-labelledby="works-heading">
		<h2 id="works-heading" class="section-heading">
			<span class="en">Works</span>
			<span class="ja">{m.showcase_heading()}</span>
		</h2>

		<ol class="picks">
			{#each showcase as work, i (work.id)}
				<li class="pick" use:detour={work.id}>
					<span class="no" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
					<div class="pick-body">
						<h3><a class="dads-link" href={localizeHref(`/works/${work.id}`)}>{work.title}</a></h3>
						<p>{localize(work.summary)}</p>
						<ul class="tags">
							{#each work.tech.map(localize) as t (t)}
								<li class="tag">{t}</li>
							{/each}
						</ul>
						<p class="links">
							{#if work.liveUrl}
								<a class="dads-link" href={work.liveUrl} rel="noreferrer">{m.open_site()}</a>
							{/if}
							<a class="dads-link" href={work.repo} rel="noreferrer">GitHub</a>
						</p>
					</div>
					<span class="pick-bloom"><Bloom id={work.id} color={colorOf(work)} size="8rem" /></span>
					<div class="pick-ground"><Meadow works={[{ id: work.id, color: colorOf(work) }]} per={9} seed={i + 1} /></div>
				</li>
			{/each}
		</ol>

		<WorkList works={others} start={showcase.length + 1} />
	</section>

	<section id="contact" aria-labelledby="contact-heading">
		<h2 id="contact-heading" class="section-heading">
			<span class="en">{m.contact_heading()}</span>
			<span class="ja">{m.nav_contact()}</span>
		</h2>
		<div class="contacts">
			<a class="contact" href={profile.github} rel="me" aria-label="GitHub">
				<GithubLogoIcon size="1.5em" aria-hidden="true" />
			</a>
			<a class="contact" href={profile.x} rel="me" aria-label="X (@grdevtom2gramp1)">
				<XLogoIcon size="1.5em" aria-hidden="true" />
			</a>
			<a class="contact" href="mailto:{profile.email}" aria-label={m.contact_mail({ email: profile.email })}>
				<EnvelopeSimpleIcon size="1.5em" aria-hidden="true" />
			</a>
		</div>
		<p class="world">
			<a class="pill pill-primary" href={localizeHref('/world')}>{m.enter_world()} →</a>
		</p>
	</section>
</div>

<style>
	/* ヒーロー: 網点の地に巨大なロゴ、右に蜂 */
	.hero {
		position: relative;
		display: grid;
		grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
		align-items: center;
		gap: 2rem;
		min-height: calc(100svh - var(--header-height) - 4rem);
		padding: 3rem clamp(1.25rem, 6vw, 6rem);
		background-image: radial-gradient(var(--line) 1.6px, transparent 1.8px);
		background-size: 14px 14px;
		overflow: hidden;
	}

	h1 {
		margin: 0;
		font-size: clamp(4rem, 13vw, 11rem);
		line-height: 0.95;
	}

	.bio {
		margin: 1.5rem 0 0;
		font-size: var(--font-size-20);
		font-weight: 700;
	}

	.hero-art {
		position: relative;
		display: grid;
		place-items: center;
	}

	.hex {
		position: absolute;
		width: 85%;
		aspect-ratio: 1 / 1.1547;
		background: var(--brand-honey);
		clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%);
		rotate: 8deg;
	}

	.hero-art :global(.hero-bee) {
		position: relative;
		width: 100%;
		max-width: 36rem;
		height: auto;
		filter: drop-shadow(14px 12px 0 var(--brand-petal)) drop-shadow(10px 8px 0 var(--brand-on-honey));
	}

	@media (max-width: 48rem) {
		.hero {
			grid-template-columns: 1fr;
			min-height: auto;
			padding-top: 2rem;
		}

		.hero-art {
			width: min(80vw, 24rem);
			margin: 0 auto;
		}
	}

	/* 見出し: 大きな英字と小さな和文 */
	.section-heading {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.5rem 1.25rem;
		margin: 0 0 2rem;
	}

	.section-heading .en {
		font-size: clamp(3rem, 9vw, 6rem);
		line-height: 1;
		letter-spacing: -0.02em;
	}

	.section-heading .ja {
		color: var(--muted);
		font-size: var(--font-size-20);
	}

	section + section {
		margin-top: 6rem;
	}

	.picks {
		margin: 0 0 3rem;
		padding: 0;
		list-style: none;
	}

	/* 作品の行: 文字は地面より上に置き、作品の花の茎が行の下の地面まで伸びる */
	.pick {
		display: grid;
		grid-template-columns: 6rem minmax(0, 1fr) 10rem;
		grid-template-rows: auto auto;
		column-gap: 1.5rem;
		align-items: start;
		padding-top: 2rem;
		--meadow-height: 7rem;
	}

	.pick-body {
		padding-bottom: 1rem;
	}

	.pick-ground {
		grid-column: 1 / -1;
		grid-row: 2;
	}

	.no {
		color: transparent;
		font-family: var(--font-display);
		font-size: 4.5rem;
		font-weight: 700;
		line-height: 1;
		-webkit-text-stroke: 1.5px var(--brand-ink);
	}

	.pick h3 {
		margin: 0 0 0.75rem;
		font-size: var(--font-size-36);
		line-height: 1.2;
	}

	.pick p {
		max-width: 42rem;
		margin: 0 0 1rem;
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		margin: 0 0 1rem;
		padding: 0;
		list-style: none;
	}

	.links {
		display: flex;
		gap: 1.5rem;
	}

	.pick-bloom {
		position: relative;
		z-index: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		align-self: stretch;
		grid-row: 1;
		grid-column: 3;
		padding-top: 1rem;
		/* 茎を地面 (下の行の中ほど) まで伸ばす */
		margin-bottom: calc(var(--meadow-height) * -0.45);
	}

	.pick-bloom::after {
		content: '';
		flex: 1;
		width: 3px;
		margin-top: -0.6rem;
		border-radius: 2px;
		background: color-mix(in oklab, var(--brand-leaf) 75%, var(--brand-ink));
	}

	@media (max-width: 48rem) {
		.pick {
			grid-template-columns: 3.5rem minmax(0, 1fr);
			grid-template-rows: auto 1fr auto;
			column-gap: 1rem;
			--meadow-height: 5rem;
		}

		.pick-ground {
			grid-row: 3;
		}

		.pick-body {
			grid-column: 2;
			grid-row: 1 / span 2;
		}

		.no {
			font-size: 3rem;
		}

		.pick h3 {
			font-size: var(--font-size-28);
		}

		/* スマホでは番号の下に小さく咲かせる */
		.pick-bloom {
			grid-column: 1;
			grid-row: 2;
			padding-top: 0.5rem;
		}

		.pick-bloom {
			--bloom-size: 3.5rem;
		}
	}

	.contacts {
		display: flex;
		gap: 0.75rem;
	}

	.contact {
		display: inline-flex;
		padding: 0.75rem;
		border: 2px solid var(--brand-ink);
		border-radius: var(--border-radius-8);
		background: var(--surface);
		color: var(--ink);
	}

	.world {
		margin: 2rem 0 0;
	}
</style>
