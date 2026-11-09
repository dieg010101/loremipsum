<script lang="ts">
	import './media.css';
	import type { Image, Work } from '$lib/types';
	import { clock, fileSize } from '$lib/format';
	import { sp } from '$lib/spaces';

	// never autoplays; sound starts off. the controls are text.
	let {
		video,
		poster,
		title
	}: { video: NonNullable<Work['video']>; poster: Image | null; title: string } = $props();

	let element: HTMLVideoElement | undefined = $state();
	let paused = $state(true);
	let muted = $state(true);
	let time = $state(0);
	let duration = $state(0);
	let failed = $state(false);
	let subtitle: string | null = $state(null);

	// some files (streams, recordings) report an infinite duration: trust the label then.
	const total = $derived(Number.isFinite(duration) && duration > 0 ? duration : video.duration);
	const ratio = $derived(poster ? poster.width / poster.height : 16 / 9);

	function toggle() {
		if (!element) return;
		if (element.paused) element.play().catch(() => (failed = true));
		else element.pause();
	}

	function show(lang: string) {
		subtitle = subtitle === lang ? null : lang;
		for (const track of Array.from(element?.textTracks ?? []))
			track.mode = track.language === subtitle ? 'showing' : 'disabled';
	}

	// the screen's own full screen. iphones only offer it on the video itself.
	type Webkit = HTMLVideoElement & { webkitEnterFullscreen?: () => void };
	function fullscreen() {
		const video = element as Webkit | undefined;
		if (!video) return;
		if (video.requestFullscreen)
			video.requestFullscreen().catch(() => video.webkitEnterFullscreen?.());
		else video.webkitEnterFullscreen?.();
	}

	// our controls are text beside the video, so full screen gets the browser's own.
	let full = $state(false);
	const onfullscreenchange = () => (full = document.fullscreenElement === element);

	function retry() {
		failed = false;
		element?.load();
	}
</script>

<svelte:document {onfullscreenchange} />

<div class="media-box" style:--ratio={ratio} style:--color={poster?.color ?? '#bfbfb8'}>
	{#if failed}
		<p class="media-box__note" role="status">
			the video didn’t load.<br /><button class="link-button" type="button" onclick={retry}
				>try again</button
			>{#if video.download}{sp(2)}<a href={video.download.url} download
					>download it{video.download.bytes ? `, ${fileSize(video.download.bytes)}` : ''}</a
				>{/if}
		</p>
	{:else}
		<!-- svelte-ignore a11y_media_has_caption: the subtitles are the tracks below, chosen in the controls. -->
		<video
			bind:this={element}
			class="media-box__video"
			src={video.src}
			poster={poster?.src}
			preload="none"
			playsinline
			loop={video.loop}
			bind:paused
			bind:muted
			bind:currentTime={time}
			bind:duration
			controls={full}
			onclick={full ? undefined : toggle}
			onerror={() => (failed = true)}
			aria-label={title}
		>
			{#each video.tracks as track (track.lang)}
				<track kind="subtitles" src={track.src} srclang={track.lang} label={track.label} />
			{/each}
		</video>
	{/if}
</div>

<p class="media-controls">
	<button
		class="link-button"
		type="button"
		onclick={toggle}
		aria-label="{paused ? 'play' : 'pause'} {title}">{paused ? 'play' : 'pause'}</button
	>{sp(3)}{clock(time)} / {clock(total)}{sp(3)}<button
		class="link-button"
		type="button"
		aria-label={muted ? 'sound off, turn it on' : 'sound on, turn it off'}
		onclick={() => (muted = !muted)}>{muted ? 'sound off' : 'sound on'}</button
	>{#if video.tracks.length}{sp(3)}subtitles: {#each video.tracks as track, i (track.lang)}{#if i}{', '}{/if}<button
				class="link-button"
				type="button"
				aria-pressed={subtitle === track.lang}
				onclick={() => show(track.lang)}>{track.label}</button
			>{/each}{/if}{sp(3)}<button class="link-button" type="button" onclick={fullscreen}
		>full screen</button
	>{#if video.loop}{sp(3)}loop: on{/if}
</p>
