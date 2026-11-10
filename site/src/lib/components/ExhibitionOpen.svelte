<script lang="ts">
	import './exhibition.css';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { pushState, replaceState } from '$app/navigation';
	import type { BookEntry, Exhibition } from '$lib/types';
	import { dayStatus, formatDate } from '$lib/format';
	import { citation, worksOf, zipEntries } from '$lib/exhibition';
	import { sp, DOT } from '$lib/spaces';
	import RichText from './RichText.svelte';
	import ExhibitionFacts from './ExhibitionFacts.svelte';
	import Contents from './Contents.svelte';
	import ContactSheet from './ContactSheet.svelte';
	import WorkRow from './WorkRow.svelte';
	import FullSize from './FullSize.svelte';
	import StatusBar from './StatusBar.svelte';
	import Cite from './Cite.svelte';
	import VisitorsBook from './VisitorsBook.svelte';
	import DownloadAll from './DownloadAll.svelte';
	import Webring from './Webring.svelte';

	type Link = { number: number; title: string } | null;
	type Props = {
		exhibition: Exhibition;
		now: string;
		openCount: number;
		before: Link;
		after: Link;
		afterLabel: string;
		upcoming: (Link & { opens: string }) | null;
		book: BookEntry[];
		bookTotal: number;
		bookResult?: Record<string, unknown> | null;
	};
	let {
		exhibition: e,
		now,
		openCount,
		before,
		after,
		afterLabel,
		upcoming,
		book,
		bookTotal,
		bookResult
	}: Props = $props();

	const works = $derived(worksOf(e));
	const images = $derived(works.filter((w) => w.medium === 'image' && w.image));
	// const artists = $derived(e.chapters.length); // for "with", commented out below
	const day = $derived(dayStatus(e, new Date(now)));
	const entries = $derived(zipEntries(e));
	const email = $derived(page.data.settings.email);
	// "accessed" is the reader's own day: the server's guess first, their clock once here.
	let here: Date | null = $state(null);
	onMount(() => (here = new Date()));
	const cite = $derived(citation(e, here ?? new Date(now)));

	// mobile: the contents and the contact sheet open in place.
	let showContents = $state(false);
	let showSheet = $state(false);

	// full size is a shallow route: the address becomes the work's own, so it can be
	// shared, and back closes it.
	const full = $derived(page.state.full);
	const workUrl = (index: number) => `/exhibitions/${e.number}/${index}`;
	const open = (index: number) => pushState(workUrl(index), { full: index });
	const move = (index: number) => replaceState(workUrl(index), { full: index });
	const close = () => history.back();

	// closing after looking through a few: the page waits at the last one you saw.
	let seen: number | undefined;
	let openedAt: number | undefined;
	$effect(() => {
		if (full !== undefined) {
			openedAt ??= full;
			seen = full;
			return;
		}
		const last = seen;
		const from = openedAt;
		seen = openedAt = undefined;
		if (last === undefined || last === from) return;
		requestAnimationFrame(() => {
			const row = document.getElementById(`work-${last}`);
			row?.scrollIntoView({ block: 'start', behavior: 'instant' });
			row?.focus({ preventScroll: true });
		});
	});
</script>

<div class="exhibition" id="top">
	<!-- the phone version starts with the day, the title and the text. -->
	<p class="exhibition__kicker mobile-only">
		exhibition {e.number}{#if day}{' · '}{day}{/if}
	</p>
	<h1 class="exhibition__title">{e.title}</h1>

	<ExhibitionFacts
		exhibition={e}
		now={new Date(now)}
		{openCount}
		{before}
		{after}
		{afterLabel}
		{upcoming}
		zip={{ entries, email }}
	/>

	<div class="exhibition__contents desktop-only"><Contents {works} /></div>

	<div class="exhibition__text">
		{#each e.text as paragraph, i (i)}<p><RichText text={paragraph} /></p>{/each}
		{#if e.signature}<p class="exhibition__signature desktop-only">{e.signature}</p>{/if}
	</div>

	<p class="exhibition__facts-short mobile-only">
		<span class="strong">dates</span> opened {formatDate(e.opens)}<br />
		<!-- "with": off for now, the contents list already counts the artists and works.
		<span class="strong">with</span>
		{artists} artists, {works.length} works<br /> -->
		<button
			class="link-button"
			type="button"
			aria-expanded={showContents}
			onclick={() => (showContents = !showContents)}>contents</button
		>{sp(2)}<button
			class="link-button"
			type="button"
			aria-expanded={showSheet}
			aria-controls="sheet-drawer"
			onclick={() => (showSheet = !showSheet)}>contact sheet</button
		>{sp(2)}<DownloadAll
			href="/exhibitions/{e.number}/download.zip"
			label="download it all (.zip)"
			zip={e.files.zip?.url ?? null}
			bytes={e.files.zipBytes ?? null}
			{entries}
			filename="lorem ipsum {e.number}, {e.title}.zip"
			{email}
			suffix={false}
		/>
	</p>
	<div class="exhibition__drawer mobile-only" id="contents-drawer" hidden={!showContents}>
		{#if showContents}<Contents {works} id="contents-phone" />{/if}
	</div>
	<div class="exhibition__drawer mobile-only" id="sheet-drawer" hidden={!showSheet}>
		{#if showSheet}<ContactSheet {works} />{/if}
	</div>

	{#each e.chapters as chapter (chapter.number)}
		<section class="chapter" aria-labelledby="artist-{chapter.number}">
			<!-- the artist first, on every screen: their name, a line about them, and where to find them. -->
			<header class="chapter__head grid">
				<p class="chapter__number">{String(chapter.number).padStart(2, '0')}</p>
				<h2 class="chapter__name" id="artist-{chapter.number}">{chapter.artist.name}</h2>
				<p class="chapter__bio">
					{#if chapter.artist.bio}<RichText text={chapter.artist.bio} />{/if}<br
					/>{#if chapter.artist.website}<a href={chapter.artist.website} rel="noopener">website</a
						>{sp(2)}{/if}{#if chapter.artist.instagram}<a
							href={chapter.artist.instagram}
							rel="noopener">instagram</a
						>{sp(2)}{/if}<a href="/index?q={encodeURIComponent(chapter.artist.name)}"
						>every work by {chapter.artist.name}</a
					>
				</p>
			</header>
			<div class="chapter__works">
				{#each chapter.works as work (work.index)}
					<WorkRow
						{work}
						id="work-{work.index}"
						eager={work.index === 1}
						onfull={work.image ? () => open(work.index) : undefined}
					/>
				{/each}
			</div>
			{#if chapter.artist.about}
				<p class="chapter__about">-&nbsp;<br /><RichText text={chapter.artist.about} /></p>
			{/if}
		</section>
	{/each}

	<section class="exhibition__end" id="the-end" tabindex="-1" aria-labelledby="end">
		<h2 class="exhibition__end-title" id="end">end of the exhibition.</h2>
		<div class="colophon grid">
			{#if e.colophon.translations}<p>
					<span class="strong">translations</span><br
					/>{#each e.colophon.translations.split('\n') as l, i (i)}{#if i}<br />{/if}{l}{/each}
				</p>{/if}
			{#if e.colophon.images}<p>
					<span class="strong">images</span><br
					/>{#each e.colophon.images.split('\n') as l, i (i)}{#if i}<br />{/if}{l}{/each}
				</p>{/if}
			{#if e.colophon.thanks}<p><span class="strong">thanks</span><br />{e.colophon.thanks}</p>{/if}
			{#if e.colophon.press}<p>
					<span class="strong">press</span><br /><RichText text={e.colophon.press} />
				</p>{/if}
			<p class="colophon__cite">
				<span class="strong">cite this exhibition</span><br /><Cite
					formats={cite}
					title={e.title}
				/>
			</p>
			<p class="colophon__page"><a href="#top">back to the top</a></p>
		</div>
	</section>

	<div class="exhibition__book">
		<VisitorsBook exhibition={e.number} entries={book} total={bookTotal} result={bookResult} />
	</div>

	<section class="take" aria-labelledby="take">
		<h2 class="take__title" id="take">take it with you</h2>
		<p class="take__text">
			<DownloadAll
				href="/exhibitions/{e.number}/download.zip"
				label="download the exhibition"
				zip={e.files.zip?.url ?? null}
				bytes={e.files.zipBytes ?? e.files.zip?.bytes ?? null}
				{entries}
				filename="lorem ipsum {e.number}, {e.title}.zip"
				{email}
			/>: every image at full size, the video, the tape, the essay, the book and every label, as
			files you can keep.<br />{#if e.files.list}<a href={e.files.list.url}>the list of works</a>
				(.pdf{e.files.list.pages ? `, ${e.files.list.pages} pages` : ''}){DOT}{/if}<a
				href="/exhibitions/{e.number}/exhibition.txt">the whole exhibition as one text file</a
			>
			(.txt){#if e.files.pressRelease}{DOT}<a href={e.files.pressRelease.url}>press release</a> (.pdf){/if}
		</p>
	</section>

	<div class="exhibition__webring">
		<Webring {before} next={after} nextLabel={afterLabel} />
	</div>
</div>

<StatusBar {works} onfull={open} paused={full !== undefined} end="the-end" />

{#if full !== undefined && images.some((w) => w.index === full)}
	<FullSize works={images} index={full} onclose={close} onmove={move} />
{/if}
