import type { RequestHandler } from './$types';

// everyone is welcome. the demo's stand-in files and the plain text copies of
// pages stay out of search results; the sitemap lists the rest.
export const GET: RequestHandler = ({ url }) =>
	new Response(
		`User-agent: *\nAllow: /\nDisallow: /demo/\nDisallow: /demo-media/\nDisallow: /plain/\n\nSitemap: ${url.origin}/sitemap.xml\n`,
		{
			headers: {
				'content-type': 'text/plain; charset=utf-8',
				'cache-control': 'public, max-age=3600'
			}
		}
	);
