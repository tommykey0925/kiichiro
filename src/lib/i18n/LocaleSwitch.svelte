<!--
	日本語と英語の切り替え。両方の名前を並べ、いまの言語に蜜色の下線を引く。
	押すと同じページのもう一方の言語へ移る (Paraglide の URL の切り替え)。
-->
<script lang="ts">
	import { page } from '$app/state';
	import { getLocale, localizeHref } from '$lib/paraglide/runtime';

	const choices = [
		{ locale: 'ja', name: '日本語' },
		{ locale: 'en', name: 'English' }
	] as const;
	const current = $derived(getLocale());
</script>

<nav class="locales" aria-label="言語 / Language">
	{#each choices as choice (choice.locale)}
		<a
			href={localizeHref(page.url.pathname, { locale: choice.locale })}
			hreflang={choice.locale}
			lang={choice.locale}
			aria-current={current === choice.locale ? 'true' : undefined}
			data-sveltekit-reload
		>
			{choice.name}
		</a>
	{/each}
</nav>

<style>
	.locales {
		display: inline-flex;
		gap: 0.125rem;
		font-size: var(--font-size-14);
		line-height: 1;
	}

	a {
		padding: 0.75rem 0.375rem;
		color: inherit;
		text-decoration: underline 0.125rem transparent;
		text-underline-offset: 0.4rem;
		opacity: 0.72;
		transition:
			opacity 0.4s,
			text-decoration-color 0.4s;
	}

	a[aria-current] {
		opacity: 1;
		text-decoration-color: var(--brand-honey);
	}

	a:hover {
		opacity: 1;
	}

	a:focus-visible {
		outline: 0.1875rem solid currentColor;
		outline-offset: 0;
		border-radius: var(--border-radius-4);
	}
</style>
