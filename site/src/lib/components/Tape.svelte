<script lang="ts">
	import './media.css';
	import { onMount } from 'svelte';
	import { tapeBar, tapeClock } from '$lib/format';
	import { sp } from '$lib/spaces';

	// the tape: "play  00:00 [######..........] 12:04  rewind", for sound and video alike.
	// press or drag along the bar to go there: the brackets are the very start and the
	// very end, and each dot is the start of its stretch, so the first one is 00:00.
	// "rewind" goes back to the start. on the keyboard, with the bar focused: ← → ten
	// seconds (a minute with shift, or page up and down), home or 0 the start, end the end.
	type Props = {
		title: string;
		paused: boolean;
		ended?: boolean;
		time: number;
		total: number;
		ontoggle: () => void;
		onseek: (seconds: number) => void;
	};
	let { title, paused, ended = false, time, total, ontoggle, onseek }: Props = $props();

	let line: HTMLElement | undefined = $state();
	let bar: HTMLElement | undefined = $state();
	// 32 cells, or as few as 4 when the line is narrower (a phone): it never overflows.
	let cells = $state(32);

	onMount(() => {
		if (!line) return;
		// "pause 00:00 [....] 00:00  rewind": 28 characters around the cells.
		const fit = () => {
			if (!line || !bar) return;
			const char = bar.getBoundingClientRect().width / (cells + 2);
			if (char > 0) cells = Math.max(4, Math.min(32, Math.floor(line.clientWidth / char) - 28));
		};
		const resize = new ResizeObserver(fit);
		resize.observe(line);
		return () => resize.disconnect();
	});

	const seek = (seconds: number) => total > 0 && onseek(Math.max(0, Math.min(total, seconds)));

	// which character the pointer is on: "[" and before is the start, "]" and after the end.
	function at(x: number) {
		if (!bar) return 0;
		const box = bar.getBoundingClientRect();
		const cell = Math.floor((x - box.left) / (box.width / (cells + 2))) - 1;
		if (cell < 0) return 0;
		if (cell >= cells) return total;
		return (cell / cells) * total;
	}

	let dragging = false;
	let last = -1;
	function down(event: PointerEvent) {
		if (event.button !== 0 || total <= 0) return;
		dragging = true;
		bar?.setPointerCapture(event.pointerId);
		last = at(event.clientX);
		seek(last);
	}
	function move(event: PointerEvent) {
		if (!dragging) return;
		const seconds = at(event.clientX);
		if (seconds !== last) seek((last = seconds));
	}
	const up = () => (dragging = false);

	function key(event: KeyboardEvent) {
		const step = event.shiftKey ? 60 : 10;
		if (event.key === 'ArrowRight' || event.key === 'ArrowUp') seek(time + step);
		else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') seek(time - step);
		else if (event.key === 'PageUp') seek(time + 60);
		else if (event.key === 'PageDown') seek(time - 60);
		else if (event.key === 'Home' || event.key === '0') seek(0);
		else if (event.key === 'End') seek(total);
		else return;
		event.preventDefault();
	}

	// at the end, "play" reads "again" (the same width as "pause"): it starts over.
	const label = $derived(paused ? (ended ? 'again' : 'play') : 'pause');
</script>

<p class="tape" bind:this={line}>
	<button
		class="link-button"
		type="button"
		onclick={ontoggle}
		aria-label="{paused ? (ended ? 'play again' : 'play') : 'pause'} {title}">{label}</button
	>{label === 'play' ? sp(2) : sp(1)}{tapeClock(time)}{' '}<span
		class="tape__bar"
		bind:this={bar}
		role="slider"
		tabindex="0"
		aria-label="position in {title}"
		aria-valuemin={0}
		aria-valuemax={Math.round(total)}
		aria-valuenow={Math.round(time)}
		aria-valuetext="{tapeClock(time)} of {tapeClock(total)}"
		onpointerdown={down}
		onpointermove={move}
		onpointerup={up}
		onpointercancel={up}
		onkeydown={key}>{tapeBar(time, total, cells)}</span
	>{' '}{tapeClock(total)}{sp(2)}<button
		class="link-button"
		type="button"
		onclick={() => seek(0)}
		aria-label="rewind {title} to the start">rewind</button
	>
</p>
