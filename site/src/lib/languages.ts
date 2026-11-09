// the languages a page can be read in. english is the default; a page shows a
// translation where one exists and english everywhere else.
export const LANGUAGES = ['en', 'fr', 'es', 'it'] as const;
export type Language = (typeof LANGUAGES)[number];

export const LANGUAGE_NAMES: Record<Language, string> = {
	en: 'english',
	fr: 'français',
	es: 'español',
	it: 'italiano'
};

/**
 * the languages the site has been translated into so far. the switcher in the
 * footer only appears once there is more than one; add a language here when its
 * translations are in sanity.
 */
export const TRANSLATED: readonly Language[] = ['en'];

export const isLanguage = (value: unknown): value is Language =>
	TRANSLATED.includes(value as Language);
