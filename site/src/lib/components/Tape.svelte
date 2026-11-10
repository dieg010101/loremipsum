<script lang="ts">
	import './media.css';
	import { onMount } from 'svelte';
	import { tapeBar, tapeClock } from '$lib/format';
	import { sp } from '$lib/spaces';

	// the tape: "play 00:00 [######..........] 12:04", for sound and video alike.
	// click anywhere on the bar to go there; on the keyboard ← → skip ten seconds
	// (a minute with shift), home goes back to the start and end to the end.
	type Props = {
		title: string;
		paused: boolean;
		time: number;
		total: number;
		ontoggle: () => void;
		onseek: (seconds: number) => void;
	};
	let { title, paused, time, total, ontoggle, onseek }: Props = $props();

	let line: HTMLElement | undefined = $state();
	let bar: HTMLElement | undefined = $state();
	// 32 cells, or fewer when the line is narrower (a phone): it never overflows.
	let cells = $state(32);

	onMount(() => {
		if (!line) return;
		// "pause 00:00 [....] 00:00": 18 characters around the cells and their brackets.
		const fit = () => {
			if (!line || !bar) return;
			const char = bar.getBoundingClientRect().width / (cells + 2);
			if (char > 0) cells = Math.max(8, Math.min(32, Math.floor(line.clientWidth / char) - 20));
		};
		const resize = new ResizeObserver(fit);
		resize.observe(line);
		return () => resize.disconnect();
	});

	const seek = (seconds: number) => total > 0 && onseek(Math.max(0, Math.min(total, seconds)));

	function click(event: MouseEvent) {
		const box = (event.currentTarget as HTMLElement).getBoundingClientRect();
		seek(((event.clientX - box.left) / box.width) * total);
	}

	function key(event: KeyboardEvent) {
		const step = event.shiftKey ? 60 : 10;
		if (event.key === 'ArrowRight') seek(time + step);
		else if (event.key === 'ArrowLeft') seek(time - step);
		else if (event.key === 'Home') seek(0);
		else if (event.key === 'End') seek(total);
		else return;
		event.preventDefault();
	}
</script>

<p class="tape" bind:this={line}>
	<button
		class="link-button"
		type="button"
		onclick={ontoggle}
		aria-label="{paused ? 'play' : 'pause'} {title}">{paused ? 'play' : 'pause'}</button
	>{paused ? sp(2) : sp(1)}{tapeClock(time)}{' '}<span
		class="tape__bar"
		bind:this={bar}
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
