// shared newsletter state, so signing up in one place (header, menu, corner slip)
// replaces every form for the rest of the visit and keeps the slip away for good.

const STORAGE_KEY = 'newsletter-signed-up';

function remembered() {
	try {
		return localStorage.getItem(STORAGE_KEY) === '1';
	} catch {
		return false;
	}
}

export const newsletter = $state({ signedUp: false, focusRequest: 0 });

export function loadNewsletterState() {
	newsletter.signedUp = remembered();
}

export function markSignedUp() {
	newsletter.signedUp = true;
	try {
		localStorage.setItem(STORAGE_KEY, '1');
	} catch {
		// private mode: it still holds for this visit.
	}
}

// links like "sign up for the newsletter" call this; the header focuses its
// field on desktop and opens the menu on smaller screens.
export function focusNewsletter(event?: Event) {
	event?.preventDefault();
	newsletter.focusRequest++;
}
