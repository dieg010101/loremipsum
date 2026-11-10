<script lang="ts">
	import { onMount } from 'svelte';
	import type { Work } from '$lib/types';
	import { DOT, sp } from '$lib/spaces';
	import { isShortcut, keys } from '$lib/keys.svelte';

	// bottom left: which work you're at, and the keys. j steps back through the
	// works (and from the first, up to the top) and k on; f opens the one you're
	// at full size.
	type Props = {
		works: Work[];
		onfull: (index: number) => void;
		/** while something sits on top (full size), the keys belong to it. */
		paused?: boolean;
		/** where k goes after the last work. */
		end?: string;
	};
	let { works, onfull, paused = false, end }: Props = $props();

	/** the index of the work you're at; null before the first and after the last. */
	let at: number | null = $state(null);
	const current = $derived(works.find((w) => w.index === at) ?? null);
	const canFull = $derived(current?.medium === 'image' && Boolean(current.image));

	// a work scrolled to sits this far below the top (its scroll-margin).
	const TOP = 40;
	const rows = () =>
		works
			.map((w) => document.getElementById(`work-${w.index}`))
			.filter((el): el is HTMLElement => Boolean(el));

	// you're at the last work whose top has passed the middle of the screen, until
	// you're well past its end.
	function locate() {
		const middle = innerHeight / 2;
		const list = rows();
		let found: HTMLElement | null = null;
		for (const row of list) {
			if (row.getBoundingClientRect().top <= middle) found = row;
			else break;
		}
		if (found && found === list.at(-1) && found.getBoundingClientRect().bottom < middle - 120)
			found = null;
		at = found ? Number(found.dataset.work) : null;
	}

	onMount(() => {
		keys.load();
		let frame = 0;
		const schedule = () => {
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(locate);
		};
		locate();
		addEventListener('scroll', schedule, { passive: true });
		addEventListener('resize', schedule, { passive: true });
		return () => {
			cancelAnimationFrame(frame);
			removeEventListener('scroll', schedule);
			removeEventListener('resize', schedule);
		};
	});

	function go(target: HTMLElement) {
		target.scrollIntoView({ block: 'start', behavior: 'instant' });
		// the keyboard follows, so tab carries on from this work.
		target.focus({ preventScroll: true });
		locate();
	}

	function step(by: 1 | -1) {
		const list = rows();
		const endTarget = end ? document.getElementById(end) : null;
		const targets = endTarget ? [...list, endTarget] : list;
		// tops are measured against where a work lands when scrolled to.
		if (by === 1) {
			const next = targets.find((el) => el.getBoundingClientRect().top > TOP + 2);
			if (next) go(next);
		} else {
			const before = targets.findLast((el) => el.getBoundingClientRect().top < TOP - 2);
			if (before) go(before);
			else if (scrollY > 0) {
				// before the first work: back up to the title, the facts and the text.
				scrollTo({ top: 0, behavior: 'instant' });
				// the keyboard follows: tab starts again from the top of the page.
				if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
				locate();
			}
		}
	}

	function onkeydown(event: KeyboardEvent) {
		if (paused || !isShortcut(event)) return;
		if (event.key === 'k') step(1);
		else if (event.key === 'j') step(-1);
		else if (event.key === 'f' && current && canFull) onfull(current.index);
		else return;
		event.preventDefault();
	}
</script>

<svelte:window {onkeydown} />

{#if current}
	<p class="bar desktop-only">
		<span aria-hidden="true"
			>{current.number}{sp(2)}{current.title}{#if keys.on}{DOT}j / k: previous and next work{#if canFull}{DOT}f:
					full size{/if}{/if}</span
		>{DOT}{#if keys.on}<button class="link-button" type="button" onclick={() => keys.toggle()}
				>keys off</button
			>{:else}keys are off.{' '}<button
				class="link-button"
				type="button"
				onclick={() => keys.toggle()}>turn them on</button
			>{/if}
	</p>
{/if}
