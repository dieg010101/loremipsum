<script lang="ts">
	import './calendar.css';
	import { page } from '$app/state';
	import { formatDate, formatTime } from '$lib/format';
	import { googleEventHref, subscribeHrefs } from '$lib/calendar';
	import { DOT } from '$lib/spaces';

	let { data } = $props();
	const links = $derived(subscribeHrefs(page.url.origin));
</script>

<h1 class="page-title">calendar</h1>
<p class="calendar__intro">
	every opening, in your own calendar. subscribe once and each new exhibition turns up by itself, on
	the day and at the hour it opens. it costs nothing and tells us nothing about you.
</p>

<dl class="calendar__sections">
	<div class="calendar__section grid">
		<dt class="strong">iphone, ipad, mac</dt>
		<dd><p><a href={links.webcal}>subscribe in apple calendar</a></p></dd>
	</div>
	<div class="calendar__section grid">
		<dt class="strong">google calendar</dt>
		<dd>
			<p>
				<a href={links.google} rel="noopener">subscribe in google calendar</a><br />easiest on a
				computer; it then shows on your phone too. google looks for new openings a few times a day.
			</p>
		</dd>
	</div>
	<div class="calendar__section grid">
		<dt class="strong">outlook and others</dt>
		<dd>
			<p>
				<a href={links.webcal}>subscribe</a>, or add a calendar “from the web” and paste this
				address:<br /><span class="calendar__address">{links.feed}</span>
			</p>
		</dd>
	</div>
	{#if data.upcoming.length}
		<div class="calendar__section grid">
			<dt class="strong">just one</dt>
			<dd>
				{#each data.upcoming as e (e.number)}
					{@const link = `${page.url.origin}/exhibitions/${e.number}`}
					<p>
						exhibition {e.number}, <a href="/exhibitions/{e.number}"><em>{e.title}</em></a>, opens
						{formatDate(e.opens)} at {formatTime(e.opens)}.<br /><a
							href={googleEventHref(e, link, e.credit)}
							rel="noopener">add to google calendar</a
						>{DOT}<a href="/exhibitions/{e.number}/calendar.ics">add to any other (.ics)</a>
					</p>
				{/each}
			</dd>
		</div>
	{/if}
</dl>
