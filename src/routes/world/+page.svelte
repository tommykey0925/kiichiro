<script lang="ts">
	import { onMount } from 'svelte';
	import type { Work } from '$lib/works';
	import { works } from '$lib/works';
	import { profile } from '$lib/profile';
	import GithubIcon from '$lib/GithubIcon.svelte';

	let canvas: HTMLCanvasElement;
	let near = $state<Work | null>(null);
	let stick = $state<{ x: number; y: number } | null>(null);
	let error = $state<string | null>(null);
	let loading = $state(true);

	onMount(() => {
		// Svelte のコンポーネント CSS はクライアント遷移で剥がれないので、
		// :global(body) に書くと /world を離れてもスクロールが止まったままになる。
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		const restore = () => {
			document.body.style.overflow = previousOverflow;
		};

		const fail = (message: string) => {
			error = message;
		};

		if (!document.createElement('canvas').getContext('webgl2')) {
			fail('この環境では 3D を表示できません (WebGL が無効)。');
			return restore;
		}

		let disposed = false;
		let dispose = () => {};

		// Three.js は 3D モードに入って初めて読む。/ の初期表示に載せないため。
		import('$lib/world/World')
			.then(async ({ createWorld }) => {
				const world = await createWorld(canvas, works, (work) => (near = work));
				if (disposed) return world.dispose();
				setMove = world.setMove;
				dispose = world.dispose;
				loading = false;
			})
			.catch(() => {
				fail('3D の読み込みに失敗しました。');
			});

		return () => {
			disposed = true;
			dispose();
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
	<p class="loading">3D を読み込み中…</p>
{/if}

{#if error}
	<div class="unsupported">
		<p>{error}</p>
		<a href="/">一覧で見る →</a>
	</div>
{/if}

<a class="exit" href="/">← 一覧で見る</a>

{#if !error && !loading}
	<p class="hint">WASD / 矢印キーで移動　ドラッグで視点</p>
{/if}

{#if near}
	<aside class="panel">
		<h2>{near.title}</h2>
		<p>{near.summary}</p>
		<ul>
			{#each near.tech.slice(0, 6) as t (t)}
				<li class="tag">{t}</li>
			{/each}
		</ul>
		<div class="links">
			<a class="pill" href="/works/{near.id}">詳細</a>
			<a class="pill" href={near.repo} rel="noreferrer" aria-label="GitHub">
				<GithubIcon />
			</a>
			{#if near.liveUrl}
				<a class="pill pill-primary" href={near.liveUrl} rel="noreferrer">
					<span class="beacon"></span>サイトに遷移
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

	/* トークンに透過色は無いので、白トークンから相対色で派生させる */
	.exit,
	.hint {
		position: fixed;
		z-index: 1;
		padding: 0.45rem 0.9rem;
		border-radius: var(--border-radius-8);
		background: rgb(from var(--color-neutral-white) r g b / 0.85);
		font-size: var(--font-size-14);
		text-decoration: none;
	}

	.exit {
		top: 1rem;
		left: 1rem;
		color: var(--ink);
	}

	.hint {
		top: 1rem;
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
		border-radius: var(--border-radius-12);
		background: rgb(from var(--color-neutral-white) r g b / 0.94);
		box-shadow: var(--elevation-4);
	}

	.panel h2 {
		margin: 0 0 0.4rem;
		font-size: var(--font-size-18);
		line-height: var(--line-height-150);
	}

	.panel p {
		margin: 0 0 0.7rem;
		color: var(--muted);
		font-size: var(--font-size-14);
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

	/* パネルが狭いので、ここだけピルを一段小さくする */
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
		border-radius: 50%;
		background: rgb(from var(--color-neutral-white) r g b / 0.5);
		touch-action: none;
	}

	.knob {
		width: 2.6rem;
		height: 2.6rem;
		border-radius: 50%;
		background: rgb(from var(--color-neutral-white) r g b / 0.95);
		box-shadow: var(--elevation-1);
	}

	@media (pointer: coarse) {
		.pad {
			display: grid;
		}

		.panel {
			bottom: 9.5rem;
			/* 横画面だと 9.5rem 空けた残りに収まらない端末がある */
			max-height: calc(100dvh - 11rem);
			overflow-y: auto;
		}

		.hint {
			display: none;
		}
	}
</style>
