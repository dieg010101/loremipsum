<script lang="ts">
	import './media.css';
	import { onMount } from 'svelte';
	import type { Image, Work } from '$lib/types';
	import { fileSize } from '$lib/format';
	import { extension, saveAs } from '$lib/download';
	import { sp } from '$lib/spaces';
	import Tape from './Tape.svelte';
	import { claim, position, release } from '$lib/media-session';

	// never autoplays; sound starts off. the controls are text, and the tape under the
	// picture is the same as a sound work's: click along it, or ← → home end.
	let {
		video,
		poster,
		title,
		artist
	}: {
		video: NonNullable<Work['video']>;
		poster: Image | null;
		title: string;
		artist?: string;
	} = $props();

	let element: HTMLVideoElement | undefined = $state();
	let paused = $state(true);
	let ended = $state(false);
	let muted = $state(true);
	let time = $state(0);
	let duration = $state(0);
	let failed = $state(false);
	let subtitle: string | null = $state(null);

	// some files (streams, recordings) report an infinite duration: trust the label then.
	const total = $derived(Number.isFinite(duration) && duration > 0 ? duration : video.duration);
	const ratio = $derived(poster ? poster.width / poster.height : 16 / 9);
	const type = $derived(video.download ? extension(video.download.url, 'mp4') : 'mp4');

	// subtitles from another site (sanity's cdn) only load into a video marked
	// crossorigin, and that mark would make the video itself depend on the cdn's
	// permission for this address. so they're fetched as text and handed over from
	// here: at worst the subtitles are missing, never the video.
	let sources: Record<string, string> = $state({});
	onMount(() => {
		const made: string[] = [];
		for (const track of video.tracks) {
			const url = new URL(track.src, location.href);
			if (url.origin === location.origin) {
				sources[track.lang] = track.src;
				continue;
			}
			fetch(url)
				.then((res) => (res.ok ? res.blob() : Promise.reject(new Error(String(res.status)))))
				.then((blob) => {
					const local = URL.createObjectURL(new Blob([blob], { type: 'text/vtt' }));
					made.push(local);
					sources[track.lang] = local;
				})
				.catch((error) => console.error(`subtitles ${track.lang}`, error));
		}
		return () => {
			made.forEach((url) => URL.revokeObjectURL(url));
			release(element);
		};
	});
	const tracks = $derived(video.tracks.filter((t) => sources[t.lang]));

	function toggle() {
		if (!element) return;
		if (element.paused) element.play().catch(() => (failed = true));
		else element.pause();
	}

	function seek(seconds: number) {
		if (!element) return;
		element.currentTime = seconds;
		time = seconds;
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
			>{#if video.download}{sp(2)}<a
					href={saveAs(video.download.url, `${title}.${type}`)}
					download="{title}.{type}"
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
			bind:ended
			bind:muted
			bind:currentTime={time}
			bind:duration
			controls={full}
			onclick={full ? undefined : toggle}
			onplay={() => element && claim(element, { title, artist, artwork: poster?.src })}
			onpause={() => element && position(element)}
			onseeked={() => element && position(element)}
			onerror={() => (failed = true)}
			aria-label={title}
		>
			{#each tracks as track (track.lang)}
				<track
					kind="subtitles"
					src={sources[track.lang]}
					srclang={track.lang}
					label={track.label}
				/>
			{/each}
		</video>
	{/if}
</div>

<div class="media-controls">
	<Tape {title} {paused} {ended} {time} {total} ontoggle={toggle} onseek={seek} />
	<p>
		<button
			class="link-button"
			type="button"
			aria-label={muted ? 'sound off, turn it on' : 'sound on, turn it off'}
			onclick={() => (muted = !muted)}>{muted ? 'sound off' : 'sound on'}</button
		>{#if tracks.length}{sp(3)}subtitles: {#each tracks as track, i (track.lang)}{#if i}{', '}{/if}<button
					class="link-button"
					type="button"
					aria-pressed={subtitle === track.lang}
					onclick={() => show(track.lang)}>{track.label}</button
				>{/each}{/if}{sp(3)}<button class="link-button" type="button" onclick={fullscreen}
			>full screen</button
		>{#if video.loop}{sp(3)}loop: on{/if}
	</p>
</div>
