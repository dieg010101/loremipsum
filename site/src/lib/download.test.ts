import { describe, expect, it } from 'vitest';
import { extension, plainName, saveAs } from './download';

describe('downloads', () => {
	it('names files the cdn will accept', () => {
		expect(plainName('caffè, 1.2 (side a).mp3')).toBe('caffe-1.2-side-a.mp3');
		expect(plainName('magna aliqua.mp3')).toBe('magna-aliqua.mp3');
		expect(plainName('???')).toBe('download');
	});
	it('asks sanity to send a download, and leaves our own files alone', () => {
		expect(saveAs('https://cdn.sanity.io/files/p/d/abc.mp3', 'magna aliqua.mp3')).toBe(
			'https://cdn.sanity.io/files/p/d/abc.mp3?dl=magna-aliqua.mp3'
		);
		expect(saveAs('/demo/magna-aliqua.mp3', 'x.mp3')).toBe('/demo/magna-aliqua.mp3');
	});
	it('reads the extension', () => {
		expect(extension('https://cdn.sanity.io/files/p/d/abc.MP4?x=1', 'mp4')).toBe('mp4');
		expect(extension('/no-extension', 'mp3')).toBe('mp3');
	});
});
