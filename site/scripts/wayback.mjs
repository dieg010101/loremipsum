// saves one exhibition to the wayback machine (web.archive.org), when you say so:
// github → actions → "wayback" → run workflow, with the exhibition's number and
// "opened" or "closed". (run by .github/workflows/wayback.yml; `--dry-run` only lists.)
//
// what it saves: the exhibition page, every work's page, the visitors' book, the text
// version, and every link out of them (artists' sites, website works): those are what
// disappear first. the run's page lists a link to every copy.
//
// with ARCHIVE_ACCESS_KEY and ARCHIVE_SECRET_KEY (free, archive.org/account/s3.php) the
// archive takes each page as a job and says when it's done; without them it's the same
// as pasting each address into web.archive.org/save, which is slower and refuses more.

const SITE = (process.env.SITE_URL || 'https://loremipsum-49z.pages.dev').replace(/\/$/, '');
const n = Number(process.env.EXHIBITION);
const moment = process.env.MOMENT;
const dry = process.argv.includes('--dry-run');
const keys =
	process.env.ARCHIVE_ACCESS_KEY && process.env.ARCHIVE_SECRET_KEY
		? `LOW ${process.env.ARCHIVE_ACCESS_KEY}:${process.env.ARCHIVE_SECRET_KEY}`
		: null;
const wait = (s) => new Promise((r) => setTimeout(r, s * 1000));
const out = (line) => console.log(line);

if (!Number.isInteger(n) || n < 1)
	throw new Error(`no exhibition number: "${process.env.EXHIBITION}"`);
if (!['opened', 'closed'].includes(moment))
	throw new Error(`moment is "opened" or "closed", not "${moment}"`);

// links that aren't pages worth keeping on their own.
const SKIP =
	/^(mailto:|tel:|#)|web\.archive\.org|(instagram|facebook|tiktok|threads|x|twitter)\.(com|net)\/|cdn\.sanity\.io|challenges\.cloudflare\.com|\.(zip|ics)(\?|$)/;

async function page(url) {
	const res = await fetch(url, { headers: { 'user-agent': 'lorem ipsum wayback' } });
	if (!res.ok) throw new Error(`${url}: ${res.status}`);
	return res.text();
}
function links(html, base) {
	return [...html.matchAll(/href="([^"]+)"/g)]
		.map((m) => m[1].replaceAll('&amp;', '&'))
		.filter((h) => !SKIP.test(h))
		.map((h) => new URL(h, base))
		.filter((u) => u.protocol === 'https:' || u.protocol === 'http:')
		.map((u) => ((u.hash = ''), u.href));
}

async function addresses() {
	const home = `${SITE}/exhibitions/${n}`;
	const html = await page(home).catch(() => {
		throw new Error(`exhibition ${n} isn't on the site (${home})`);
	});
	const own = (u) => u.startsWith(`${home}/`) && !u.includes('?');
	const works = [...new Set(links(html, home).filter(own))];
	const pages = [...new Set([home, `${home}/book`, `${home}/exhibition.txt`, ...works])];
	const outside = new Set();
	for (const p of pages) {
		const body = p === home ? html : await page(p).catch(() => '');
		for (const l of links(body, p)) if (!l.startsWith(SITE)) outside.add(l);
	}
	return [...pages, ...outside];
}

async function save(url) {
	for (let attempt = 1; attempt <= 3; attempt++) {
		try {
			if (keys) {
				const res = await fetch('https://web.archive.org/save', {
					method: 'POST',
					headers: {
						accept: 'application/json',
						authorization: keys,
						'content-type': 'application/x-www-form-urlencoded'
					},
					body: new URLSearchParams({ url, skip_first_archive: '1' })
				});
				const job = await res.json().catch(() => ({}));
				if (!job.job_id) throw new Error(job.message || `the archive said ${res.status}`);
				for (let i = 0; i < 60; i++) {
					await wait(5);
					const s = await fetch(`https://web.archive.org/save/status/${job.job_id}`, {
						headers: { accept: 'application/json', authorization: keys }
					}).then((r) => r.json());
					if (s.status === 'success')
						return `https://web.archive.org/web/${s.timestamp}/${s.original_url}`;
					if (s.status === 'error') throw new Error(s.message || s.status_ext);
				}
				throw new Error('still saving after five minutes');
			}
			const res = await fetch(`https://web.archive.org/save/${url}`, {
				headers: { 'user-agent': 'lorem ipsum wayback' }
			});
			if (res.status === 429) throw new Error('the archive asked to slow down');
			if (!res.ok) throw new Error(`the archive said ${res.status}`);
			const at =
				res.headers.get('content-location') || (res.url.includes('/web/') ? res.url : null);
			return at
				? new URL(at, 'https://web.archive.org').href
				: `https://web.archive.org/web/*/${url}`;
		} catch (e) {
			if (attempt === 3) throw e;
			out(`  again in a minute (${e.message})`);
			await wait(60);
		}
	}
}

const list = await addresses();
out(
	`exhibition ${n}, ${moment}: ${list.length} addresses${dry ? ' (dry run: nothing saved)' : ''}\n`
);
if (dry) {
	list.forEach((u) => out(`  ${u}`));
	process.exit(0);
}

const saved = [];
const failed = [];
for (const url of list) {
	out(url);
	try {
		const copy = await save(url);
		saved.push({ url, copy });
		out(`  saved: ${copy}`);
	} catch (e) {
		failed.push({ url, why: e.message });
		out(`  not saved: ${e.message}`);
	}
	await wait(keys ? 3 : 15);
}

if (process.env.GITHUB_STEP_SUMMARY) {
	const { appendFileSync } = await import('node:fs');
	appendFileSync(
		process.env.GITHUB_STEP_SUMMARY,
		[
			`### exhibition ${n}, ${moment}: ${saved.length} of ${list.length} saved`,
			'',
			...saved.map((s) => `- [${s.url}](${s.copy})`),
			...(failed.length
				? ['', '**not saved** (run it again; already saved ones are skipped quickly):', '']
				: []),
			...failed.map((f) => `- ${f.url}: ${f.why}`)
		].join('\n') + '\n'
	);
}
if (failed.length) process.exit(1);
