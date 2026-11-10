/**
 * the phone's lock screen, the headphones' buttons and the keyboard's media keys:
 * whichever player last started playing answers them. "previous" goes back to the
 * start, as on a cassette deck (there is no previous track here).
 */
type Details = { title: string; artist?: string; artwork?: string | null };

let owner: HTMLMediaElement | null = null;

const ACTIONS: MediaSessionAction[] = [
	'play',
	'pause',
	'seekbackward',
	'seekforward',
	'seekto',
	'previoustrack'
];

function handle(action: MediaSessionAction, handler: MediaSessionActionHandler | null) {
	// a browser that doesn't know an action throws: it just goes without it.
	try {
		navigator.mediaSession.setActionHandler(action, handler);
	} catch {
		/* not offered here */
	}
}

/** the element now answers the lock screen. call it when it starts playing. */
export function claim(media: HTMLMediaElement, details: Details) {
	if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
	owner = media;
	const session = navigator.mediaSession;
	session.metadata = new MediaMetadata({
		title: details.title,
		artist: details.artist ?? '',
		album: 'lorem ipsum',
		artwork: details.artwork ? [{ src: details.artwork }] : []
	});
	const to = (seconds: number) => {
		const end = Number.isFinite(media.duration) ? media.duration : Infinity;
		media.currentTime = Math.max(0, Math.min(end, seconds));
		position(media);
	};
	handle('play', () => void media.play().catch(() => {}));
	handle('pause', () => media.pause());
	handle('seekbackward', (d) => to(media.currentTime - (d.seekOffset ?? 10)));
	handle('seekforward', (d) => to(media.currentTime + (d.seekOffset ?? 10)));
	handle('seekto', (d) => d.seekTime !== undefined && to(d.seekTime));
	handle('previoustrack', () => to(0));
	position(media);
}

/** keeps the lock screen's bar in step: on seeking, playing and pausing. */
export function position(media: HTMLMediaElement) {
	if (owner !== media || !('mediaSession' in navigator)) return;
	navigator.mediaSession.playbackState = media.paused ? 'paused' : 'playing';
	if (!Number.isFinite(media.duration) || media.duration <= 0) return;
	try {
		navigator.mediaSession.setPositionState({
			duration: media.duration,
			playbackRate: media.playbackRate || 1,
			position: Math.min(media.currentTime, media.duration)
		});
	} catch {
		/* an older browser */
	}
}

/** the element is going away: if it had the lock screen, let it go. */
export function release(media: HTMLMediaElement | undefined) {
	if (!media || owner !== media || !('mediaSession' in navigator)) return;
	owner = null;
	navigator.mediaSession.metadata = null;
	navigator.mediaSession.playbackState = 'none';
	for (const action of ACTIONS) handle(action, null);
}
