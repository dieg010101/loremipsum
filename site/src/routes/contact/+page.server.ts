import type { Actions } from './$types';
import { client } from '$lib/server/sanityClient';
import { fail, redirect } from '@sveltejs/kit';

export const actions: Actions = {
	default: async ({ request }) => {
		const data = Object.fromEntries(await request.formData());

		const required = ['name', 'email', 'bizDesc', 'projDesc'];
		if (required.some((k) => !data[k]?.toString().trim())) {
			return fail(400, { missing: true });
		}

		try {
			await client.create({
				_type: 'contactMessage',
				name: data.name,
				email: data.email,
				business: data.business,
				bizDesc: data.bizDesc,
				projDesc: data.projDesc,
				createdAt: new Date().toISOString()
			});
		} catch (err) {
			console.error('sanity write error', err);
			return fail(500, { error: true });
		}

		throw redirect(303, '/contact?sent=1');
	}
};
