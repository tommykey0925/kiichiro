<script lang="ts">
	import { onMount } from 'svelte';
	import type { Work } from '$lib/works';
	import { works } from '$lib/works';
	import { profile } from '$lib/profile';
	import GithubLogoIcon from 'phosphor-svelte/lib/GithubLogoIcon';
	import { onThemeChange, resolvedTheme } from '$lib/theme/theme';
	import { localize } from '$lib/i18n/localize';
	import { m } from '$lib/paraglide/messages';
	import { localizeHref } from '$lib/paraglide/runtime';
	import { forage } from '$lib/forage/state.svelte';

	let canvas: HTMLCanvasElement;
	let near = $state<Work | null>(null);
	let stick = $state<{ x: number; y: number } | null>(null);
	let error = $state<string | null>(null);
	let loading = $state(true);

	onMount(() => {
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		const restore = () => {
			document.body.style.overflow = previousOverflow;
		};

		const fail = (message: string) => {
			error = message;
		};

		if (!document.createElement('canvas').getContext('webgl2')) {
			fail(m.world_no_webgl());
			return restore;
		}

		let disposed = false;
		let dispose = () => {};
		const unplant = forage.plant(works.filter((w) => w.spot).map((w) => w.id));

		import('$lib/world/World')
			.then(async ({ createWorld }) => {
				const world = await createWorld(canvas, works, (work) => (near = work), {
					visited: forage.visited,
					onVisit: (id) => forage.visit(id)
				});
				if (disposed) return world.dispose();
				setMove = world.setMove;
				world.setTheme(resolvedTheme());
				const stopTheme = onThemeChange(world.setTheme);
				dispose = () => {
					stopTheme();
					world.dispose();
				};
				loading = false;
			})
			.catch(() => {
				fail(m.world_load_failed());
			});

		return () => {
			disposed = true;
			dispose();
			unplant();
			restore();
		};
	});

	let setMove: (input: { x: number; y: number }) => void = () => {};

	function drive(event: PointerEvent, pad: HTMLElement) {
		const rect = pad.getBoundingClientRect();
		const dx = (event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
		const dy = (event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
		const length = Math.hypot(dx, dy) || 1;
		const scale = Math.min(length, 1) / length;
		stick = { x: dx * scale, y: dy * scale };
		setMove({ x: stick.x, y: -stick.y });
	}

	function release(event: PointerEvent, pad: HTMLElement) {
		pad.releasePointerCapture(event.pointerId);
		stick = null;
		setMove({ x: 0, y: 0 });
	}
</script>

<svelte:head>
	<title>World — {profile.name}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<canvas bind:this={canvas}></canvas>

{#if loading && !error}
	<p class="loading">{m.world_loading()}</p>
{/if}

{#if error}
	<div class="unsupported">
		<p>{error}</p>
		<a href={localizeHref('/')}>{m.world_to_list()}</a>
	</div>
{/if}

<a class="exit" href={localizeHref('/')}>{m.world_exit()}</a>

{#if !error && !loading}
	<p class="hint">{m.world_hint()}</p>
{/if}

{#if near}
	<aside class="panel" style:--spot={near.spot?.color}>
		<h2>{near.title}</h2>
		<p>{localize(near.summary)}</p>
		<ul>
			{#each near.tech.slice(0, 6).map(localize) as t (t)}
				<li class="tag">{t}</li>
			{/each}
		</ul>
		<div class="links">
			<a class="pill" href={localizeHref(`/works/${near.id}`)}>{m.world_details()}</a>
			<a class="pill" href={near.repo} rel="noreferrer" aria-label="GitHub">
				<GithubLogoIcon size="1.25em" aria-hidden="true" />
			</a>
			{#if near.liveUrl}
				<a class="pill pill-primary" href={near.liveUrl} rel="noreferrer">
					<span class="beacon"></span>{m.open_site()}
				</a>
			{/if}
		</div>
	</aside>
{/if}

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="pad"
	onpointerdown={(e) => {
		e.currentTarget.setPointerCapture(e.pointerId);
		drive(e, e.currentTarget);
	}}
	onpointermove={(e) => stick && drive(e, e.currentTarget)}
	onpointerup={(e) => release(e, e.currentTarget)}
	onpointercancel={(e) => release(e, e.currentTarget)}
>
	<span class="knob" style:translate="{(stick?.x ?? 0) * 26}px {(stick?.y ?? 0) * 26}px"></span>
</div>

<style>
	canvas {
		position: fixed;
		inset: 0;
		display: block;
		width: 100%;
		height: 100%;
		touch-action: none;
	}

	.exit,
	.hint {
		position: fixed;
		z-index: 1;
		padding: 0.45rem 0.9rem;
		border: 2px solid var(--brand-ink);
		border-radius: var(--border-radius-8);
		background: var(--brand-paper);
		font-family: var(--font-display);
		font-size: var(--font-size-14);
		font-weight: 700;
		text-decoration: none;
	}

	.exit {
		top: calc(var(--header-height) + 1rem);
		left: 1rem;
		color: var(--ink);
	}

	.hint {
		top: calc(var(--header-height) + 1rem);
		right: 1rem;
		margin: 0;
		color: var(--muted);
	}

	.panel {
		position: fixed;
		right: 1rem;
		bottom: 1rem;
		left: 1rem;
		z-index: 1;
		max-width: 30rem;
		margin: 0 auto;
		padding: 1.1rem 1.3rem;
		border: 2px solid var(--brand-ink);
		border-top: 0.5rem solid var(--spot, var(--brand-honey));
		border-radius: var(--border-radius-12);
		background: var(--brand-paper);
		/* トップの蜂と同じ、ずらした塗りの影 */
		box-shadow: 8px 8px 0 var(--brand-ink);
	}

	.panel h2 {
		margin: 0 0 0.4rem;
		font-size: var(--font-size-28);
		line-height: var(--line-height-150);
	}

	.panel p {
		margin: 0 0 0.7rem;
		color: var(--ink);
		font-size: var(--font-size-16);
		line-height: var(--line-height-160);
	}

	.panel ul {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem;
		margin: 0 0 0.9rem;
		padding: 0;
		list-style: none;
	}

	.links {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.links .pill {
		padding: 0.35rem 0.85rem;
		font-size: var(--font-size-14);
	}

	.loading {
		position: fixed;
		inset: 0;
		display: grid;
		place-content: center;
		margin: 0;
		background: var(--bg);
		color: var(--muted);
	}

	.unsupported {
		position: fixed;
		inset: 0;
		display: grid;
		place-content: center;
		gap: 0.75rem;
		padding: 2rem;
		background: var(--bg);
		text-align: center;
	}

	.unsupported p {
		margin: 0;
		color: var(--muted);
	}

	.pad {
		position: fixed;
		bottom: 1.5rem;
		left: 1.5rem;
		z-index: 2;
		display: none;
		place-items: center;
		width: 7rem;
		height: 7rem;
		border: 2px solid var(--brand-ink);
		border-radius: 50%;
		background: rgb(from var(--brand-paper) r g b / 0.6);
		touch-action: none;
	}

	.knob {
		width: 2.6rem;
		height: 2.6rem;
		border: 2px solid var(--brand-ink);
		border-radius: 50%;
		background: var(--brand-honey);
	}

	@media (pointer: coarse) {
		.pad {
			display: grid;
		}

		.panel {
			bottom: 9.5rem;
			max-height: calc(100dvh - 11rem);
			overflow-y: auto;
		}

		.hint {
			display: none;
		}
	}
</style>
