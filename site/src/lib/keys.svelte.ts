// the one-letter shortcuts (j, k, f and /). they can be switched off, because a
// stray letter from speech input or a switch device shouldn't move the page
// (wcag 2.1.4). the choice is kept in this browser.

const KEY = 'lorem:keys';

function stored() {
	try {
		return localStorage.getItem(KEY) !== 'off';
	} catch {
		return true;
	}
}

class Keys {
	on = $state(true);

	/** reads the saved choice; call once the page is in the browser. */
	load() {
		this.on = stored();
	}

	toggle() {
		this.on = !this.on;
		try {
			if (this.on) localStorage.removeItem(KEY);
			else localStorage.setItem(KEY, 'off');
		} catch {
			// storage off: it holds for this visit.
		}
	}
}

export const keys = new Keys();

/**
 * whether a keydown is a bare letter meant for the page: shortcuts are on, no
 * modifier is held, and nobody is typing into a field or working a control.
 */
export function isShortcut(event: KeyboardEvent) {
	if (!keys.on || event.defaultPrevented) return false;
	if (event.metaKey || event.ctrlKey || event.altKey) return false;
	const target = event.target;
	if (!(target instanceof Element)) return true;
	return !target.closest(
		'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="slider"]'
	);
}
