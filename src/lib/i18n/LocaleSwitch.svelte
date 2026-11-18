<script lang="ts">
	import { page } from '$app/state';
	import TranslateIcon from 'phosphor-svelte/lib/TranslateIcon';
	import { m } from '$lib/paraglide/messages';
	import { getLocale, localizeHref } from '$lib/paraglide/runtime';

	const target = $derived(getLocale() === 'ja' ? 'en' : 'ja');
	const label = $derived(m.locale_switch({}, { locale: getLocale() }));
</script>

<a
	class="header-button"
	href={localizeHref(page.url.pathname, { locale: target })}
	hreflang={target}
	lang={target}
	aria-label={label}
	title={label}
	data-sveltekit-reload
>
	<TranslateIcon size="1.25em" aria-hidden="true" />
</a>
