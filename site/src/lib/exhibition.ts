import type { Exhibition, Work } from './types';
import { formatDate, yearOf } from './format';
import { plain, wordCount } from './rich';

export const SITE = 'loremipsum.art';

export const worksOf = (e: Pick<Exhibition, 'chapters'>) => e.chapters.flatMap((c) => c.works);

/** the short address printed in citations. */
export const shortAddress = (e: Pick<Exhibition, 'number'>) => `${SITE}/e/${e.number}`;

export function citation(e: Pick<Exhibition, 'number' | 'title' | 'opens'>) {
	return {
		default: `lorem ipsum art group, ${e.title}, online exhibition ${e.number}, opened ${formatDate(e.opens)}. ${shortAddress(e)}`,
		bibtex: `@misc{lorem${e.number},\n  title={${e.title}},\n  year=${yearOf(e.opens)},\n  url={${shortAddress(e)}}}`,
		chicago: `lorem ipsum art group. “${e.title}.” online exhibition ${e.number}, ${formatDate(e.opens)}. ${shortAddress(e)}.`
	};
}

/** a fair guess at how long it takes to see and read everything, to the nearest five minutes. */
export function minutesToSee(works: Work[]) {
	const minutes = works.reduce((sum, w) => {
		switch (w.medium) {
			case 'text':
				return sum + wordsIn(w) / 250;
			case 'sound':
				return sum + (w.sound?.duration ?? 0) / 60;
			case 'video':
				return sum + (w.video?.duration ?? 0) / 60;
			case 'pdf':
				return sum + (w.pdf?.file.pages ?? 10) / 10;
			default:
				return sum + 1;
		}
	}, 0);
	return Math.max(5, Math.round(minutes / 5) * 5);
}

// "an essay, 2,900 words": the label says the whole length; the excerpt may be all we have.
function wordsIn(w: Work) {
	const m = w.lines.join(' ').match(/([\d,]+) words/);
	if (m) return Number(m[1].replace(/,/g, ''));
	return w.text ? wordCount(w.text.paragraphs) + (w.text.moreWords ?? 0) : 0;
}

/** every file in the exhibition, named for the zip: "1.2 sed do eiusmod.jpg". */
export function zipEntries(e: Exhibition) {
	const entries: { name: string; url: string }[] = [];
	const ext = (url: string, fallback: string) =>
		url.split('?')[0].match(/\.(\w{2,4})$/)?.[1] ?? fallback;
	for (const w of worksOf(e)) {
		const base = `${w.number} ${w.title}`;
		if (w.image && w.medium === 'image')
			entries.push({ name: `${base}.${ext(w.image.full, 'jpg')}`, url: w.image.full });
		if (w.video) entries.push({ name: `${base}.${ext(w.video.src, 'mp4')}`, url: w.video.src });
		if (w.sound) entries.push({ name: `${base}.${ext(w.sound.src, 'mp3')}`, url: w.sound.src });
		if (w.text?.pdf) entries.push({ name: `${base}.pdf`, url: w.text.pdf.url });
		if (w.pdf) entries.push({ name: `${base}.pdf`, url: w.pdf.file.url });
	}
	// "every label": the whole exhibition as text, from the site itself.
	entries.push({ name: 'labels and texts.txt', url: `/exhibitions/${e.number}/exhibition.txt` });
	if (e.files.list) entries.push({ name: 'list of works.pdf', url: e.files.list.url });
	if (e.files.pressRelease)
		entries.push({ name: 'press release.pdf', url: e.files.pressRelease.url });
	return entries;
}

/** the whole exhibition as one text file: every label, every text. */
export function exhibitionText(e: Exhibition, origin: string) {
	const lines: string[] = [];
	const rule = '-'.repeat(72);
	lines.push(
		e.title,
		`online exhibition ${e.number}, lorem ipsum art group`,
		`opened ${formatDate(e.opens)}`,
		`${origin}/exhibitions/${e.number}`,
		''
	);
	for (const t of e.text) lines.push(plain(t), '');
	if (e.signature) lines.push(e.signature, '');
	for (const c of e.chapters) {
		lines.push(rule, String(c.number).padStart(2, '0'), c.artist.name);
		if (c.artist.bio) lines.push(plain(c.artist.bio));
		lines.push('');
		for (const w of c.works) {
			lines.push(`${w.number}  ${w.title}, ${w.year}`, ...w.lines);
			if (w.note) lines.push(plain(w.note));
			if (w.text)
				for (const p of w.text.paragraphs)
					lines.push('', plain(p.text), ...(p.note ? [plain(p.note)] : []));
			if (w.sound?.transcript) for (const p of w.sound.transcript) lines.push('', plain(p));
			lines.push(`${origin}/exhibitions/${e.number}/${w.index}`, '');
		}
		if (c.artist.about) lines.push('- ', plain(c.artist.about), '');
	}
	lines.push(rule, 'end of the exhibition.', '', citation(e).default, '');
	return lines.join('\n');
}
