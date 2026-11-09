// pages are cached at the edge for five minutes and served stale while they refresh,
// so a new exhibition shows up within minutes without anyone waiting on sanity.
export const PAGE_CACHE = {
	'cache-control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400'
};

// feeds, calendars and text versions change even less often.
export const FILE_CACHE = {
	'cache-control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400'
};
