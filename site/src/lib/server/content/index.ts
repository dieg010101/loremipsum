import { env } from '$env/dynamic/private';
import { demo } from './demo';
import { sanitySource } from './sanity';
import type { ContentSource } from './source';

export type { ContentSource, NewBookEntry } from './source';

/**
 * the content for this request. DEMO_CONTENT=true runs the site on the figma's
 * placeholder content (and its clock); otherwise everything comes from sanity.
 */
export function content(): ContentSource {
	return isDemo() ? demo : sanitySource;
}

export const isDemo = () => env.DEMO_CONTENT === 'true';
