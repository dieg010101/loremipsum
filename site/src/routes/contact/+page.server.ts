import { fail } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { content } from '$lib/server/content';
import { backend } from '$lib/server/backend';
import { sendMail, verifyTurnstile } from '$lib/server/mail';
import { looksLikeEmail } from '$lib/email';
import { inExhibitionHref } from '$lib/work';
import type { Work } from '$lib/types';
import type { Actions, PageServerLoad } from './$types';

type About = { key: string; title: string; artist: string; number: string; href: string };

/** "14.2" or "store/slug" → the work it names. */
async function findWork(key: string | null): Promise<Work | null> {
	if (!key) return null;
	const source = content();
	const store = key.match(/^store\/([a-z0-9-]+)$/);
	if (store) return source.storeItem(store[1]);
	const m = key.match(/^(\d{1,4})\.(\d{1,3})$/);
	if (!m) return null;
	const e = await source.exhibition(Number(m[1]));
	return e?.chapters.flatMap((c) => c.works).find((w) => w.index === Number(m[2])) ?? null;
}

const toAbout = (key: string, w: Work): About => ({
	key,
	title: w.title,
	artist: w.artist.name,
	number: w.number,
	href: inExhibitionHref(w)
});

const MESSAGES: Record<string, string> = {
	buy: 'i’d like to buy this. ',
	notify: 'please tell me if it’s free again. ',
	similar: 'i’d like to hear about similar work. '
};

export const load: PageServerLoad = async ({ url }) => {
	const key = url.searchParams.get('work');
	const work = await findWork(key);
	const intent = ['buy', 'notify', 'similar'].find((k) => url.searchParams.get(k) === '1');
	const [settings, all] = await Promise.all([content().settings(), content().exhibitions()]);
	const current = all
		.filter((e) => new Date(e.opens) <= content().now())
		.sort((a, b) => b.opens.localeCompare(a.opens))[0];
	return {
		about: work && key ? toAbout(key, work) : null,
		message: intent ? MESSAGES[intent] : '',
		aside: settings.contactAside,
		current: current ? `/exhibitions/${current.number}` : '/exhibitions',
		// PUBLIC_ variables only exist in the public module, never the private one.
		turnstile: publicEnv.PUBLIC_TURNSTILE_SITE_KEY || null,
		title: 'contact',
		description: 'ask about a work, an exhibition, a submission or anything else.'
	};
};

export const actions: Actions = {
	default: async ({ request, getClientAddress }) => {
		const form = await request.formData();
		const get = (k: string) => String(form.get(k) ?? '').trim();
		const values = {
			name: get('name'),
			email: get('email'),
			message: get('message'),
			work: get('work'),
			subject: get('subject').slice(0, 200)
		};

		// bots fill every field: thank them and move on.
		if (get('website'))
			return {
				sent: { name: values.name.split(' ')[0] || 'you', email: values.email, back: null }
			};

		const errors: Partial<Record<'name' | 'email' | 'message', string>> = {};
		if (!values.name) errors.name = 'add your name, or what we should call you.';
		if (!values.email) errors.email = 'add your email, so we can answer.';
		else if (!looksLikeEmail(values.email) || values.email.length > 254)
			errors.email = values.email.includes('@')
				? 'that doesn’t look like an email address.'
				: 'that doesn’t look like an email address. is the @ missing?';
		if (!values.message) errors.message = 'write something first. a line is enough.';
		else if (values.message.length > 10_000)
			errors.message = 'that’s a lot. could you make it shorter, or email it?';
		if (Object.keys(errors).length) return fail(400, { values, errors });

		if (
			!(await verifyTurnstile(
				form.get('cf-turnstile-response') as string | null,
				getClientAddress()
			))
		)
			return fail(400, {
				values,
				errors: { message: 'we couldn’t check you’re a person. try again.' }
			});

		const work = await findWork(values.work || null);
		const about = work
			? `${work.title}, ${work.artist.name}${work.number ? ` (${work.number})` : ''}`
			: values.subject;
		const text = [
			`from: ${values.name} <${values.email}>`,
			about ? `about: ${about}` : null,
			'',
			values.message
		]
			.filter((l) => l !== null)
			.join('\n');

		// the email to us and the copy in the sheet go side by side: the message is safe
		// if either lands, so one service having a bad moment never loses it.
		const to = env.CONTACT_TO || (dev ? 'hello@loremipsum.art' : '');
		const [mailed, archived] = await Promise.allSettled([
			to
				? sendMail({
						to,
						subject: `${values.name}${about ? `, about ${work?.title ?? about}` : ''}`,
						text,
						replyTo: values.email
					})
				: Promise.reject(new Error('CONTACT_TO is not set')),
			backend('contact', {
				name: values.name,
				email: values.email,
				about,
				work: values.work,
				message: values.message
			})
		]);
		if (mailed.status === 'rejected') console.error('contact email failed', mailed.reason);
		if (archived.status === 'rejected') console.error('contact archive failed', archived.reason);
		if (mailed.status === 'rejected' && archived.status === 'rejected')
			return fail(502, { values, failed: true });

		// the copy is a courtesy: if it fails, the message still arrived.
		if (mailed.status === 'fulfilled')
			await sendMail({
				to: values.email,
				subject: 'your message to lorem ipsum',
				text: `this is a copy of what you sent. we answer within three days, usually sooner.\n\n${text}`
			}).catch((err) => console.error('contact copy failed', err));

		return {
			sent: {
				name: values.name.split(/\s+/)[0],
				email: values.email,
				back: work?.exhibition ? inExhibitionHref(work) : null
			}
		};
	}
};
