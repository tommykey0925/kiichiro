<script lang="ts">
	import WorkList from '$lib/WorkList.svelte';
	import BeeIcon from '$lib/brand/BeeIcon.svelte';
	import Logo from '$lib/brand/Logo.svelte';
	import Mascot from '$lib/brand/Mascot.svelte';
	import Flower from '$lib/brand/Flower.svelte';
	import GithubLogoIcon from 'phosphor-svelte/lib/GithubLogoIcon';
	import XLogoIcon from 'phosphor-svelte/lib/XLogoIcon';
	import EnvelopeSimpleIcon from 'phosphor-svelte/lib/EnvelopeSimpleIcon';
	import { profile } from '$lib/profile';
	import '$lib/dads/link.css';
	import { showcase, others } from '$lib/works';
	import { localize } from '$lib/i18n/localize';
	import { m } from '$lib/paraglide/messages';
	import { localizeHref } from '$lib/paraglide/runtime';

	const flowers = ['petal', 'honey', 'cream'] as const;
	// 文字帯には作品名を流す。並びは一覧と同じ
	const band = [...showcase, ...others].map((w) => w.title);
</script>

<svelte:head>
	<title>{profile.name} — slops</title>
	<meta name="description" content={m.bio()} />
</svelte:head>

<section class="hero">
	<div class="hero-text">
		<p class="label">{m.hero_label()}</p>
		<h1><Logo /></h1>
		<p class="bio">{m.bio()}</p>
	</div>
	<div class="hero-art" aria-hidden="true">
		<span class="hex"></span>
		<Mascot pose="hero" class="hero-bee" fetchpriority="high" />
	</div>
	<p class="vertical" aria-hidden="true">KIICHI.RO</p>
</section>

<div class="band" aria-hidden="true">
	<div class="track">
		{#each [0, 1] as copy (copy)}
			{#each band as word (word)}
				<span>{word}</span><span class="cell"></span>
			{/each}
		{/each}
	</div>
</div>

<a class="enter" href={localizeHref('/world')} aria-label={m.enter_world()}>
	<BeeIcon />
</a>

<div class="wrap">
	<section id="works" aria-labelledby="works-heading">
		<h2 id="works-heading" class="section-heading">
			<span class="en">Works</span>
			<span class="ja">{m.showcase_heading()}</span>
		</h2>

		<ol class="picks">
			{#each showcase as work, i (work.id)}
				<li class="pick">
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
					<Flower color={flowers[i % flowers.length]} class="pick-flower" loading="lazy" aria-hidden="true" />
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
	/* ヒーロー: 網点の地に巨大なロゴ、右に蜂、端に縦書き */
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

	.label {
		display: inline-block;
		margin: 0 0 1rem;
		padding-bottom: 0.25rem;
		border-bottom: 3px solid var(--brand-honey);
		font-family: var(--font-display);
		font-size: var(--font-size-16);
		font-weight: 700;
		letter-spacing: 0.2em;
		text-transform: uppercase;
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

	.vertical {
		position: absolute;
		top: 50%;
		right: 0.5rem;
		margin: 0;
		color: transparent;
		font-family: var(--font-display);
		font-size: clamp(3rem, 7vw, 6rem);
		font-weight: 700;
		line-height: 1;
		letter-spacing: 0.05em;
		-webkit-text-stroke: 1.5px var(--muted);
		writing-mode: vertical-rl;
		translate: 0 -50%;
		pointer-events: none;
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

		.vertical {
			display: none;
		}
	}

	/* 横に流れる文字帯 */
	.band {
		overflow: hidden;
		border-block: 2px solid var(--brand-ink);
		background: var(--brand-honey);
		color: var(--brand-on-honey);
	}

	.track {
		display: flex;
		gap: 1.5rem;
		width: max-content;
		padding: 0.6rem 0;
		font-family: var(--font-display);
		font-size: var(--font-size-20);
		font-weight: 700;
		letter-spacing: 0.08em;
		white-space: nowrap;
	}

	/* 区切りはロゴの「.」と同じ六角形 */
	.cell {
		align-self: center;
		width: 0.55em;
		height: 0.62em;
		background: var(--brand-on-honey);
		clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%);
	}

	@media (prefers-reduced-motion: no-preference) {
		.track {
			animation: band 40s linear infinite;
		}
	}

	@keyframes band {
		to {
			translate: -50% 0;
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

	.pick {
		display: grid;
		grid-template-columns: 6rem minmax(0, 1fr) 10rem;
		gap: 1.5rem;
		align-items: start;
		padding: 2rem 0;
		border-top: 2px solid var(--brand-ink);
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

	.pick :global(.pick-flower) {
		width: 100%;
		height: auto;
		rotate: -6deg;
	}

	.pick:nth-child(even) :global(.pick-flower) {
		rotate: 8deg;
	}

	@media (max-width: 48rem) {
		.pick {
			grid-template-columns: 3.5rem minmax(0, 1fr);
		}

		.no {
			font-size: 3rem;
		}

		.pick h3 {
			font-size: var(--font-size-28);
		}

		.pick :global(.pick-flower) {
			display: none;
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

	/* /world への入口: 画面を飛び回る蜂 */
	.enter {
		--edge: 3rem;

		position: fixed;
		z-index: 5;
		display: block;
		width: 4.5rem;
		height: 4.5rem;
		offset-path: ellipse(42% 37%);
		offset-path: shape(
			from 50% 50%,
			curve to calc(100% - var(--edge)) 50% with 50% 0% / calc(100% - var(--edge)) 0%,
			curve to 50% 50% with calc(100% - var(--edge)) 100% / 50% 100%,
			curve to var(--edge) 50% with 50% 0% / var(--edge) 0%,
			curve to 50% 50% with var(--edge) 100% / 50% 100%
		);
		offset-rotate: auto 90deg;
		animation: bee-flight 60s linear infinite;
	}

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

	@media (prefers-reduced-motion: reduce) {
		.enter {
			display: none;
		}
	}
</style>
