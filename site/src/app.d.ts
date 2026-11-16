import type { Language } from '$lib/languages';

declare global {
	namespace App {
		interface Locals {
			lang: Language;
			preview: { asOf: string | null } | null;
		}
		interface PageData {
			updated?: string;
			title?: string;
			description?: string;
			image?: string | null;
			type?: string;
			preview?: {
				asOf: string | null;
				listen: { projectId: string; dataset: string; token: string };
				upcoming: { number: number; title: string; opens: string; ready: boolean }[];
			} | null;
			schema?: Record<string, unknown>;
		}
		interface PageState {
			full?: number;
		}
	}
}

export {};
