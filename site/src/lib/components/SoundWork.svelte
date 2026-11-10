<script lang="ts">
	import './media.css';
	import { onMount } from 'svelte';
	import type { Work } from '$lib/types';
	import { clock, fileSize } from '$lib/format';
	import { extension, saveAs } from '$lib/download';
	import { sp, spaced } from '$lib/spaces';
	import RichText from './RichText.svelte';
	import Tape from './Tape.svelte';
	import { claim, position, release } from '$lib/media-session';

	// the player is text. it keeps playing while you scroll, until you press pause;
	// once it's out of sight a bar bottom left says what's playing.
	type Props = {
		sound: NonNullable<Work['sound']>;
		title: string;
		artist?: string;
		artwork?: string | null;
	};
	let { sound, title, artist, artwork }: Props = $props();

	let audio: HTMLAudioElement | undefined = $state();
	let player: HTMLElement | undefined = $state();
	let paused = $state(true);
	let ended = $state(false);
	let time = $state(0);
	let duration = $state(0);
	let failed = $state(false);
	let words = $state(false);
	let inView = $state(true);

	// recordings can report an infinite duration: trust the label then.
	const total = $derived(Number.isFinite(duration) && duration > 0 ? duration : sound.duration);
	const type = $derived(sound.download ? extension(sound.download.url, 'mp3') : 'mp3');

	onMount(() => {
		if (!player) return;
		const observer = new IntersectionObserver(([entry]) => (inView = entry.isIntersecting));
		observer.observe(player);
		return () => {
			observer.disconnect();
			release(audio);
		};
	});

	function toggle() {
		if (!audio) return;
		if (audio.paused) audio.play().catch(() => (failed = true));
		else audio.pause();
	}

	function seek(seconds: number) {
		if (!audio) return;
		audio.currentTime = seconds;
		time = seconds;
	}
</script>

<audio
	bind:this={audio}
	src={sound.src}
	preload="none"
	bind:paused
	bind:ended
	bind:currentTime={time}
	bind:duration
	onplay={() => audio && claim(audio, { title, artist, artwork })}
	onpause={() => audio && position(audio)}
	onseeked={() => audio && position(audio)}
	onerror={() => (failed = true)}
></audio>

<div class="sound" bind:this={player}>
	<Tape {title} {paused} {ended} {time} {total} ontoggle={toggle} onseek={seek} />
	{#if failed}
		<p class="error" role="status">
			the sound didn’t load. <button
				class="link-button"
				type="button"
				onclick={() => ((failed = false), audio?.load())}>try again</button
			>
		</p>
	{/if}
	{#if sound.sides}<p class="sound__sides">{spaced(sound.sides)}</p>{/if}
	<p>
		{#if sound.transcript}<button
				class="link-button"
				type="button"
				aria-expanded={words}
				onclick={() => (words = !words)}>the words, as text</button
			>{/if}{#if sound.transcript && sound.download}{sp(2)}{/if}{#if sound.download}<a
				href={saveAs(sound.download.url, `${title}.${type}`)}
				download="{title}.{type}"
				>download {type}{sound.download.bytes ? `, ${fileSize(sound.download.bytes)}` : ''}</a
			>{/if}
	</p>
	{#if words && sound.transcript}
		<div class="sound__words">
			{#each sound.transcript as paragraph, i (i)}<p><RichText text={paragraph} /></p>{/each}
		</div>
	{/if}
</div>

{#if !paused && !inView}
	<p class="bar bar--sound">
		playing: {title}, {clock(time)}{sp(2)}·{sp(2)}<button
			class="link-button"
			type="button"
			onclick={toggle}>pause</button
		>
	</p>
{/if}
