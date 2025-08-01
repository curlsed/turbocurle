import type {MarkdownInstance} from 'astro';

export const formatDate = (pubDate: string) => {
	var options: Intl.DateTimeFormatOptions = {
		weekday: 'short',
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	};

	return new Date(pubDate).toLocaleDateString('en-US', options);
};

export const mappedSort = <S, T>(sorter: (a:T, b:T)=> number, mapper: (i:S) => T) => {
	return (a: S, b: S) => {
		return sorter(mapper(a), mapper(b));
	};
}

export type HasPubDate = {
	pubDate: Date;
	isPinned?: boolean;
}

export const sortPostsByDate = (a: HasPubDate, b: HasPubDate) => {
	// First, check if either post is pinned
	const isPinnedA = a.isPinned === true;
	const isPinnedB = b.isPinned === true;

	// If one is pinned and the other isn't, prioritize the pinned one
	if (isPinnedA && !isPinnedB) {
		return -1;
	}
	if (!isPinnedA && isPinnedB) {
		return 1;
	}

	// If both are pinned or both are not pinned, sort by date
	const pubDateA = new Date(a.pubDate);
	const pubDateB = new Date(b.pubDate);
	if (pubDateA < pubDateB) {
		return 1;
	}
	if (pubDateA > pubDateB) {
		return -1;
	}
	return 0;
};
