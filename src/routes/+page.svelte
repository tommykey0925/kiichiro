<script lang="ts">
	import WorkList from '$lib/WorkList.svelte';
	import Logo from '$lib/brand/Logo.svelte';
	import Mascot from '$lib/brand/Mascot.svelte';
	import Bloom from '$lib/brand/Bloom.svelte';
	import Bee from '$lib/forage/Bee.svelte';
	import Sky from '$lib/brand/Sky.svelte';
	import Blossoms from '$lib/forage/Blossoms.svelte';
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

	// ヒーローの下の丘の稜線には、作品ごとにその作品の色の花を植える
	const meadow = [...showcase, ...others].map((w) => ({ id: w.id, color: w.spot?.color ?? 'var(--petal)' }));
</script>

<svelte:head>
	<title>{profile.name} — slops</title>
	<meta name="description" content={m.bio()} />
</svelte:head>

<Sky works={meadow} height="calc(100svh - 1rem)">
	<section class="hero">
		<div class="hero-text sign sign-post">
			<h1><Logo /></h1>
			<p class="bio">{m.bio()}</p>
		</div>
		<div class="hero-art" aria-hidden="true">
			<Mascot pose="hero" class="hero-bee" fetchpriority="high" />
		</div>
	</section>
</Sky>

<Bee />

<div class="wrap">
	<section id="works" aria-labelledby="works-heading">
		<Blossoms works={meadow} />
		<h2 id="works-heading" class="section-heading sign sign-post">
			<span class="en">Works</span>
			<span class="ja">{m.showcase_heading()}</span>
		</h2>

		<ol class="picks">
			{#each showcase as work, i (work.id)}
				<li class="pick" use:detour={work.id}>
					<div class="pick-sign sign sign-post sign-swing">
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
					</div>
					<span class="pick-bloom"><Bloom id={work.id} color={work.spot?.color ?? 'var(--petal)'} size="8rem" /></span>
				</li>
			{/each}
		</ol>

		<WorkList works={others} start={showcase.length + 1} />
	</section>

	<section id="contact" aria-labelledby="contact-heading">
		<h2 id="contact-heading" class="section-heading sign sign-post">
			<span class="en">{m.contact_heading()}</span>
			<span class="ja">{m.nav_contact()}</span>
		</h2>
		<div class="contact-sign sign sign-post sign-swing">
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
		</div>
	</section>
</div>

<style>
	/* ヒーロー: 空に蜂が飛び、丘の稜線に立てた札にロゴを書く */
	.hero {
		display: grid;
		flex: 1;
		grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
		align-items: end;
		gap: 2rem;
		padding: 2rem clamp(1.25rem, 6vw, 6rem) 0;
	}

	.hero-text {
		justify-self: start;
		/* 杭の先が稜線の草に隠れるところまで下げる */
		margin-bottom: -1rem;
		padding: 1.5rem clamp(1.25rem, 3vw, 2.5rem);
		--post-height: 3rem;
	}

	h1 {
		margin: 0;
		font-size: clamp(3.5rem, 11vw, 9.5rem);
		line-height: 0.95;
	}

	.bio {
		margin: 1rem 0 0;
		font-size: var(--font-size-20);
		font-weight: 700;
	}

	.hero-art {
		align-self: center;
		display: grid;
		place-items: center;
	}

	.hero-art :global(.hero-bee) {
		width: 100%;
		max-width: 32rem;
		height: auto;
	}

	@media (max-width: 48rem) {
		.hero {
			grid-template-columns: 1fr;
			align-content: end;
		}

		.hero-art {
			grid-row: 1;
			width: min(70vw, 20rem);
			margin: 0 auto;
		}
	}

	#works {
		position: relative;
		padding-top: 3rem;
	}

	/* 飛ぶ蜂 (Bee.svelte) がこの場所を引き継いだら、静止画は隠す */
	:global(:root[data-bee]) .hero-art :global(.hero-bee) {
		visibility: hidden;
	}

	/* 見出しの札: 大きな英字と小さな和文 */
	.section-heading {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.25rem 1rem;
		width: fit-content;
		margin: 0 0 3rem;
		padding: 0.75rem 1.5rem;
	}

	.section-heading .en {
		font-size: clamp(2.5rem, 7vw, 4.5rem);
		line-height: 1;
		letter-spacing: -0.02em;
	}

	.section-heading .ja {
		color: var(--char-soft);
		font-size: var(--font-size-20);
	}

	section + section {
		margin-top: 5rem;
	}

	.picks {
		margin: 0 0 3rem;
		padding: 0;
		list-style: none;
	}

	/* 作品: 札と、その脇に咲く作品の花 */
	.pick {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 9rem;
		align-items: end;
		gap: 1rem;
		margin-bottom: 3.5rem;
	}

	.pick-sign {
		display: grid;
		grid-template-columns: 5rem minmax(0, 1fr);
		gap: 1.25rem;
		padding: 1.5rem;
	}

	.no {
		color: transparent;
		font-family: var(--font-sign-title);
		font-size: 4rem;
		font-weight: 700;
		line-height: 1;
		-webkit-text-stroke: 1.5px var(--char);
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
		display: grid;
		place-items: end center;
		margin-bottom: 1rem;
	}

	@media (max-width: 48rem) {
		.pick {
			grid-template-columns: 1fr;
		}

		/* スマホでは花を札の右上に咲かせる */
		.pick-bloom {
			grid-row: 1;
			justify-self: end;
			margin: 0 1rem -0.5rem 0;
			--bloom-size: 4rem;
		}

		.pick-sign {
			grid-template-columns: 1fr;
			gap: 0.25rem;
			padding: 1.25rem;
		}

		.no {
			font-size: 2.5rem;
		}

		.pick h3 {
			font-size: var(--font-size-28);
		}
	}

	.contact-sign {
		width: fit-content;
		margin-bottom: 4rem;
		padding: 1.5rem;
	}

	.contacts {
		display: flex;
		gap: 0.75rem;
	}

	/* 連絡先も小さな札 (.pill と同じ) */
	.contact {
		display: inline-flex;
		padding: 0.75rem;
		border: 2px solid var(--char);
		border-radius: var(--border-radius-8);
		background: var(--wood);
		box-shadow: 0.2rem 0.2rem 0 var(--shade);
		color: var(--char);
	}

	@media (hover: hover) {
		.contact:hover {
			background: var(--wood-pale);
		}
	}

	.world {
		margin: 1.5rem 0 0;
	}
</style>
