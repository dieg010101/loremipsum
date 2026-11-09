// See https://svelte.dev/docs/kit/types#app.d.ts
import type { Language } from '$lib/languages';

declare global {
	namespace App {
		interface Locals {
			lang: Language;
		}
		interface PageData {
			/** when this page's content last changed, for the footer. */
			updated?: string;
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
