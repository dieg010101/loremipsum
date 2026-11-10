// the cloudflare worker looks in its cache before the site runs, by address alone.
// a request from the studio's preview tab carries the preview cookie and must reach
// the site (it shows drafts), so it skips that cache: it is treated like a request
// that asked for "no-cache". (its answers are never cached either: they say
// "private, no-store", see hooks.server.ts.) the cookie is checked properly inside
// the site; here only its presence matters. if the adapter's worker ever changes and
// the line isn't found, the build stops rather than ship a preview that can show stale pages.
import { readFileSync, writeFileSync } from 'node:fs';

const file = '.svelte-kit/cloudflare/_worker.js';
const before = 'let pragma = req.headers.get("cache-control") || "";';
const after =
	'let pragma = (/(?:^|;\\s*)lorem-preview=/.test(req.headers.get("cookie") || "") ? "no-cache" : "") || req.headers.get("cache-control") || "";';

const code = readFileSync(file, 'utf8');
if (code.includes(after)) process.exit(0);
if (code.split(before).length !== 2) {
	console.error(
		`preview-cache: couldn't find the cache check in ${file}. see scripts/preview-cache.mjs.`
	);
	process.exit(1);
}
writeFileSync(file, code.replace(before, after));
console.log('preview-cache: preview requests skip the worker cache.');
