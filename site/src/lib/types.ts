export type Image = {
	src: string;
	srcset: string;
	width: number;
	height: number;
	lqip: string | null;
	alt: string;
	caption: string;
};

export type Status = 'upcoming' | 'current' | 'past';

export type Settings = {
	about: string;
	email: string;
	instagram: string;
};

export type WorkCard = {
	slug: string;
	artist: string;
	title: string;
	year: number;
	image: Image | null;
};

export type ExhibitionCard = {
	slug: string;
	title: string;
	year: number;
	status: Status;
	dates: string;
	image: Image | null;
};
