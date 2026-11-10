<script lang="ts">
	import type { Work } from '$lib/types';
	import Picture from './Picture.svelte';
	import TextWork from './TextWork.svelte';
	import SoundWork from './SoundWork.svelte';
	import VideoWork from './VideoWork.svelte';
	import PdfWork from './PdfWork.svelte';
	import WebsiteWork from './WebsiteWork.svelte';

	type Props = {
		work: Work;
		eager?: boolean;
		whole?: boolean;
		onfull?: () => void;
		heading?: 2 | 3;
	};
	let { work, eager = false, whole = false, onfull, heading = 3 }: Props = $props();

	// four columns on a computer; the whole width on a phone.
	const SIZES = '(min-width: 760px) min(66vw, 947px), 100vw';
</script>

{#if work.medium === 'text' && work.text}
	<TextWork {work} {whole} {heading} />
{:else if work.medium === 'sound' && work.sound}
	<SoundWork
		sound={work.sound}
		title={work.title}
		artist={work.artist.name}
		artwork={work.image?.src}
	/>
{:else if work.medium === 'video' && work.video}
	<VideoWork video={work.video} poster={work.image} title={work.title} artist={work.artist.name} />
{:else if work.medium === 'pdf' && work.pdf}
	<PdfWork pdf={work.pdf} artist={work.artist.name} />
{:else if work.medium === 'website' && work.website}
	<WebsiteWork website={work.website} title={work.title} />
{:else if work.image}
	<Picture
		image={work.image}
		title={work.title}
		sizes={SIZES}
		maxHeight={620}
		{eager}
		href={work.image.full}
		onopen={onfull}
		class="work-picture"
	/>
{/if}
