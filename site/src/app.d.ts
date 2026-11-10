// See https://svelte.dev/docs/kit/types#app.d.ts
import type { Language } from '$lib/languages';

declare global {
	namespace App {
		interface Locals {
			lang: Language;
			/** set when the studio's preview tab is looking (see $lib/server/preview). */
			preview: { asOf: string | null } | null;
		}
		interface PageData {
			/** when this page's content last changed, for the footer. */
			updated?: string;
			title?: string;
			description?: string;
			/** the page's picture, for links shared elsewhere. */
			image?: string | null;
			/** og:type: "article" for letters, "website" otherwise. */
			type?: string;
			/** only in the studio's preview tab (see +layout.server.ts). */
			preview?: {
				asOf: string | null;
				listen: { projectId: string; dataset: string; token: string };
				upcoming: { number: number; title: string; opens: string; ready: boolean }[];
			} | null;
			/** schema.org json-ld, from $lib/seo. */
			schema?: Record<string, unknown>;
		}
		interface PageState {
			/** the work open at full size, by its index in the exhibition. */
			full?: number;
		}
		// interface Error {}
		// interface Platform {}
	}
}

export {};
