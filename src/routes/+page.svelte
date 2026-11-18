<script lang="ts">
	import WorkList from '$lib/WorkList.svelte';
	import BeeIcon from '$lib/BeeIcon.svelte';
	import GithubLogoIcon from 'phosphor-svelte/lib/GithubLogoIcon';
	import XLogoIcon from 'phosphor-svelte/lib/XLogoIcon';
	import EnvelopeSimpleIcon from 'phosphor-svelte/lib/EnvelopeSimpleIcon';
	import { profile } from '$lib/profile';
	import '$lib/dads/link.css';
	import { showcase, works } from '$lib/works';
	import { localize } from '$lib/i18n/localize';
	import { m } from '$lib/paraglide/messages';
	import { localizeHref } from '$lib/paraglide/runtime';

	const products = works.filter((w) => !w.pitch);
</script>

<svelte:head>
	<title>{profile.name} — slops</title>
	<meta name="description" content={m.bio()} />
</svelte:head>

<div class="wrap">
	<header>
		<h1>{profile.name}</h1>
		<p class="bio">{m.bio()}</p>
		<a class="enter" href={localizeHref('/world')} aria-label={m.enter_world()}>
			<BeeIcon />
		</a>
	</header>

	<section>
		<h2>{m.showcase_heading()}</h2>
		{#each showcase as work (work.id)}
			<article class="pick">
				<h3><a class="dads-link" href={localizeHref(`/works/${work.id}`)}>{work.title}</a></h3>
				<p>{work.pitch && localize(work.pitch)}</p>
				<p class="tech">{work.tech.map(localize).join(' / ')}</p>
				<p class="links">
					{#if work.liveUrl}
						<a class="dads-link" href={work.liveUrl} rel="noreferrer">{m.open_site()}</a>
					{/if}
					<a class="dads-link" href={work.repo} rel="noreferrer">GitHub</a>
				</p>
			</article>
		{/each}
		<WorkList works={products} />
	</section>

	<section>
		<h2>{m.contact_heading()}</h2>
		<div class="contacts">
			<a class="contact" href={profile.github} rel="me" aria-label="GitHub">
				<GithubLogoIcon size="1.25em" aria-hidden="true" />
			</a>
			<a class="contact" href={profile.x} rel="me" aria-label="X (@grdevtom2gramp1)">
				<XLogoIcon size="1.25em" aria-hidden="true" />
			</a>
			<a class="contact" href="mailto:{profile.email}" aria-label={m.contact_mail({ email: profile.email })}>
				<EnvelopeSimpleIcon size="1.25em" aria-hidden="true" />
			</a>
		</div>
	</section>
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

	.enter {
		--edge: 3rem;

		position: fixed;
		z-index: 1;
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
			position: static;
			margin: 2rem auto 0;
			offset-path: none;
			animation: none;
		}
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
