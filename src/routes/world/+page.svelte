<script lang="ts">
	import { onMount } from 'svelte';
	import type { Work } from '$lib/works';
	import { works } from '$lib/works';
	import { profile } from '$lib/profile';
	import GithubLogoIcon from 'phosphor-svelte/lib/GithubLogoIcon';
	import CaretUpIcon from 'phosphor-svelte/lib/CaretUpIcon';
	import { onThemeChange, resolvedTheme } from '$lib/theme/theme';
	import { localize } from '$lib/i18n/localize';
	import { m } from '$lib/paraglide/messages';
	import { localizeHref } from '$lib/paraglide/runtime';
	import { forage } from '$lib/forage/state.svelte';

	let canvas: HTMLCanvasElement;
	let near = $state<Work | null>(null);
	/** スマホでパネルの説明を開いているか。近くの作品が変わったら畳む */
	let open = $state(false);
	$effect(() => {
		void near?.id;
		open = false;
	});
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
	<div class="loading"><p class="sign">{m.world_loading()}</p></div>
{/if}

{#if error}
	<div class="unsupported">
		<div class="sign">
			<p>{error}</p>
			<a href={localizeHref('/')}>{m.world_to_list()}</a>
		</div>
	</div>
{/if}

<a class="exit sign" href={localizeHref('/')}>{m.world_exit()}</a>

{#if !error && !loading}
	<p class="hint sign">{m.world_hint()}</p>
{/if}

{#if near}
	<!-- スマホでは名前だけの帯に畳み、押すと説明を開く。PC はいつも開いている -->
	<aside class="panel sign" class:open style:--spot={near.spot?.color}>
		<div class="head">
			<h2>{near.title}</h2>
			<button
				class="toggle"
				type="button"
				aria-expanded={open}
				aria-controls="work-detail"
				aria-label={open ? m.world_less() : m.world_more()}
				onclick={() => (open = !open)}
			>
				<CaretUpIcon size="1.25em" aria-hidden="true" />
			</button>
		</div>
		<div class="detail" id="work-detail">
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
		box-shadow: 0.2rem 0.2rem 0 var(--shade);
		font-family: var(--font-sign-title);
		font-size: var(--font-size-14);
		font-weight: 700;
		text-decoration: none;
	}

	.exit {
		top: calc(var(--header-height) + 1rem);
		left: 1rem;
		color: var(--char);
	}

	.hint {
		top: calc(var(--header-height) + 1rem);
		right: 1rem;
		margin: 0;
		color: var(--char-soft);
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
	}

	/* 作品の色は、名前の前に咲く花で見せる */
	.panel h2::before {
		content: '';
		display: inline-block;
		width: 0.7em;
		height: 0.7em;
		margin-right: 0.4em;
		border: 2px solid var(--char);
		border-radius: 50%;
		background: var(--spot, var(--petal));
		box-shadow: 0 0 0 0.18em var(--wood), 0 0 0 calc(0.18em + 2px) var(--char);
		vertical-align: 0.05em;
	}

	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.toggle {
		display: none;
		place-items: center;
		width: 2.75rem;
		height: 2.75rem;
		border: 2px solid var(--char);
		border-radius: 50%;
		background: var(--wood-pale);
		color: var(--char);
	}

	.open .toggle {
		rotate: 180deg;
	}

	.panel h2 {
		margin: 0 0 0.4rem;
		font-size: var(--font-size-28);
		line-height: var(--line-height-150);
	}

	.panel p {
		margin: 0 0 0.7rem;
		color: var(--char);
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

	/* 3D が出るまでは、空と草地の上に札を立てて待つ */
	.loading,
	.unsupported {
		position: fixed;
		inset: 0;
		display: grid;
		place-content: center;
		padding: 2rem;
		background: linear-gradient(var(--sky-top), var(--sky-horizon) 55%, var(--grass) 55%);
	}

	.loading .sign {
		margin: 0;
		padding: 0.75rem 1.25rem;
		color: var(--char-soft);
	}

	.unsupported .sign {
		display: grid;
		gap: 0.75rem;
		padding: 1.25rem 1.5rem;
		text-align: center;
	}

	.unsupported p {
		margin: 0;
		color: var(--char-soft);
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
		border: 2px solid var(--char);
		border-radius: 50%;
		background: rgb(from var(--wood) r g b / 0.6);
		touch-action: none;
	}

	.knob {
		width: 2.6rem;
		height: 2.6rem;
		border: 2px solid var(--char);
		border-radius: 50%;
		background: var(--honey);
	}

	@media (pointer: coarse) {
		.pad {
			display: grid;
		}

		/* 畳んだ帯は操作パッドの右に置き、蜂と花を隠さない */
		.panel {
			bottom: 1.5rem;
			left: 10rem;
			padding: 0.5rem 0.5rem 0.5rem 1rem;
			max-height: calc(100dvh - var(--header-height) - 6rem);
			overflow-y: auto;
		}

		.panel h2 {
			margin: 0;
			overflow: hidden;
			font-size: var(--font-size-20);
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		.toggle {
			display: grid;
			flex: none;
		}

		.panel:not(.open) .detail {
			display: none;
		}

		/* 開いたら横幅いっぱいに広げて説明を読みやすくする */
		.panel.open {
			left: 1rem;
			bottom: 9.5rem;
			padding: 1rem 1.1rem;
		}

		.panel.open .head {
			margin-bottom: 0.5rem;
		}

		.hint {
			display: none;
		}
	}
</style>
