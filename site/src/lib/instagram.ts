/** "@name", "name" or a profile address → the profile's address. */
export function instagramUrl(value: string | null | undefined): string | null {
	const v = value?.trim();
	if (!v) return null;
	if (/^https?:\/\//i.test(v)) return v;
	const handle = v.replace(/^@/, '').replace(/\/+$/, '');
	return handle ? `https://instagram.com/${encodeURIComponent(handle)}` : null;
}
