<script lang="ts">
	import './media.css';
	import { onMount } from 'svelte';
	import type { Work } from '$lib/types';
	import { clock, fileSize, tapeBar, tapeClock } from '$lib/format';
	import { sp, spaced } from '$lib/spaces';
	import RichText from './RichText.svelte';

	// the player is text. it keeps playing while you scroll, until you press pause;
	// once it's out of sight a bar bottom left says what's playing.
	let { sound, title }: { sound: NonNullable<Work['sound']>; title: string } = $props();

	let audio: HTMLAudioElement | undefined = $state();
	let player: HTMLElement | undefined = $state();
	let paused = $state(true);
	let time = $state(0);
	let duration = $state(0);
	let failed = $state(false);
	let words = $state(false);
	let inView = $state(true);

	// recordings can report an infinite duration: trust the label then.
	const total = $derived(Number.isFinite(duration) && duration > 0 ? duration : sound.duration);
	// the tape is 32 cells, or fewer when the line is narrower (a phone): it never overflows.
	let cells = $state(32);

	onMount(() => {
		if (!player) return;
		const observer = new IntersectionObserver(([entry]) => (inView = entry.isIntersecting));
		observer.observe(player);
		// "pause 00:00 [....] 00:00": 18 characters around the cells and their brackets.
		const fit = () => {
			const line = player?.querySelector<HTMLElement>('.sound__player');
			if (!line) return;
			const char =
				line.querySelector<HTMLElement>('.sound__bar')!.getBoundingClientRect().width / (cells + 2);
			cells = Math.max(8, Math.min(32, Math.floor(line.clientWidth / char) - 20));
		};
		const resize = new ResizeObserver(fit);
		resize.observe(player);
		return () => {
			observer.disconnect();
			resize.disconnect();
		};
	});

	function toggle() {
		if (!audio) return;
		if (audio.paused) audio.play().catch(() => (failed = true));
		else audio.pause();
	}

	function seek(fraction: number) {
		if (!audio || !total) return;
		audio.currentTime = Math.max(0, Math.min(1, fraction)) * total;
		time = audio.currentTime;
	}

	function click(event: MouseEvent) {
		const box = (event.currentTarget as HTMLElement).getBoundingClientRect();
		seek((event.clientX - box.left) / box.width);
	}

	function key(event: KeyboardEvent) {
		const step = event.shiftKey ? 60 : 10;
		if (event.key === 'ArrowRight') seek((time + step) / total);
		else if (event.key === 'ArrowLeft') seek((time - step) / total);
		else if (event.key === 'Home') seek(0);
		else if (event.key === 'End') seek(1);
		else return;
		event.preventDefault();
	}
</script>

<audio
	bind:this={audio}
	src={sound.src}
	preload="none"
	bind:paused
	bind:currentTime={time}
	bind:duration
	onerror={() => (failed = true)}
></audio>

<div class="sound" bind:this={player}>
	<p class="sound__player">
		<button
			class="link-button"
			type="button"
			onclick={toggle}
			aria-label="{paused ? 'play' : 'pause'} {title}">{paused ? 'play' : 'pause'}</button
		>{paused ? sp(2) : sp(1)}{tapeClock(time)}{' '}<span
			class="sound__bar"
			role="slider"
			tabindex="0"
			aria-label="position in {title}"
			aria-valuemin={0}
			aria-valuemax={Math.round(total)}
			aria-valuenow={Math.round(time)}
			aria-valuetext="{tapeClock(time)} of {tapeClock(total)}"
			onclick={click}
			onkeydown={key}>{tapeBar(time, total, cells)}</span
		>{' '}{tapeClock(total)}
	</p>
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
				href={sound.download.url}
				download>download mp3{sound.download.bytes ? `, ${fileSize(sound.download.bytes)}` : ''}</a
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
