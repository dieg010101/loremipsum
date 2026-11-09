import { error, redirect } from '@sveltejs/kit';
import { content } from './content';
import { nextLabel, timeline } from '$lib/format';

/** "14" → 14. anything else is not an exhibition. */
export function exhibitionNumber(param: string) {
	if (!/^\d{1,4}$/.test(param)) error(404, 'no such exhibition');
	return Number(param);
}

/** an exhibition and where it sits among the others. */
export async function loadExhibition(param: string) {
	const number = exhibitionNumber(param);
	if (String(number) !== param) redirect(301, `/exhibitions/${number}`);
	const source = content();
	const now = source.now();
	const [exhibition, all] = await Promise.all([source.exhibition(number), source.exhibitions()]);
	if (!exhibition) error(404, 'no such exhibition');

	const { open, next, current } = timeline(all, now);
	const sorted = [...all].sort((a, b) => a.opens.localeCompare(b.opens));
	const at = sorted.findIndex((e) => e.number === number);
	const before = sorted[at - 1] ?? null;
	const after = sorted[at + 1] ?? null;
	const afterOpen = after && new Date(after.opens) <= now;

	return {
		exhibition: {
			...exhibition,
			status: new Date(exhibition.opens) <= now ? 'open' : 'announced'
		} as typeof exhibition,
		now: now.toISOString(),
		openCount: open.length,
		current: current ? { number: current.number, title: current.title } : null,
		before: before ? { number: before.number, title: before.title } : null,
		// the one after: a link once it's open, otherwise its date.
		after: after && afterOpen ? { number: after.number, title: after.title } : null,
		afterLabel: after ? nextLabel(after, now) : nextLabel(next, now),
		upcoming:
			after && !afterOpen ? { number: after.number, title: after.title, opens: after.opens } : null
	};
}
