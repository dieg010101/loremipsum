<script lang="ts">
	import { sp } from '$lib/spaces';
	import './footer.css';
	import { page } from '$app/state';
	import { LANGUAGE_NAMES, TRANSLATED, type Language } from '$lib/languages';
	import { formatDate } from '$lib/format';
	import Newsletter from './Newsletter.svelte';
	import { instagramUrl } from '$lib/instagram';

	const settings = $derived(page.data.settings);
	const lang = $derived((page.data.lang ?? 'en') as Language);
	const updated = $derived(page.data.updated ? formatDate(page.data.updated) : null);

	// the same page in another language: english drops the parameter.
	function inLanguage(l: Language) {
		const url = new URL(page.url);
		if (l === 'en') url.searchParams.delete('lang');
		else url.searchParams.set('lang', l);
		return url.pathname + url.search;
	}

	const plainText = $derived(`/plain${page.url.pathname === '/' ? '/' : page.url.pathname}`);
	const instagram = $derived(instagramUrl(settings.instagram) ?? 'https://instagram.com');
</script>

{#snippet languages()}
	{#each TRANSLATED as l, i (l)}{#if i}{sp(2)}{/if}{#if l === lang}{LANGUAGE_NAMES[l]}{:else}<a
				href={inLanguage(l)}
				hreflang={l}
				lang={l}>{LANGUAGE_NAMES[l]}</a
			>{/if}{/each}
{/snippet}

<footer class="footer">
	<!-- the signature delimiter, "-- ", as in an email. -->
	<p>--&nbsp;</p>
	<p class="strong">lorem ipsum art group</p>
	<p>
		<span class="desktop-only">{settings.description}</span><span class="mobile-only"
			>{settings.shortDescription}</span
		>
	</p>
	<p>
		<span class="desktop-only">write to{' '}</span><a href="mailto:{settings.email}"
			>{settings.email}</a
		>
	</p>

	<div class="footer__newsletter" id="newsletter-signup">
		<Newsletter />
	</div>

	<div class="footer__links">
		{#if TRANSLATED.length > 1}<p class="desktop-only">
				read this site in: {@render languages()}
			</p>{/if}
		<p class="desktop-only">
			<a href="/rss.xml">rss</a>{sp(2)}<a href="/calendar">calendar (.ics)</a>{sp(2)}<a
				href={plainText}
				rel="alternate"
				type="text/plain">plain text version of this page</a
			>{sp(2)}<a href="/privacy">privacy</a>{sp(2)}<a href={instagram} rel="noopener">instagram</a
			>{sp(2)}<a href="/contact">contact</a>
		</p>
		<p class="desktop-only">
			{#if updated}this page was last changed on {updated}.{' '}{/if}no cookies, no trackers, no
			analytics.
		</p>

		<p class="mobile-only">
			<a href="/rss.xml">rss</a>{sp(2)}<a href="/privacy">privacy</a>{sp(2)}<a href="/contact"
				>contact</a
			>{sp(2)}<a href={instagram} rel="noopener">instagram</a>
		</p>
		{#if TRANSLATED.length > 1}<p class="mobile-only">{@render languages()}</p>{/if}
		<p class="mobile-only">
			{#if updated}last changed {updated}.{' '}{/if}no cookies.
		</p>
	</div>
</footer>
