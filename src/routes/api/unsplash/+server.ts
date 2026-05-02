import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const query = url.searchParams.get('q');
	const width = url.searchParams.get('width') || '800';
	const height = url.searchParams.get('height') || '400';

	if (!query || query.length < 2) {
		return json({ url: null });
	}

	try {
		const wikiRes = await fetch(
			`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`
		);
		const wikiData = await wikiRes.json();
		
		if (wikiData.thumbnail?.source) {
			const thumbUrl = wikiData.thumbnail.source;
			const highRes = thumbUrl.replace(/\/\d+px-/, `/${width}px-`);
			return json({ url: highRes, description: wikiData.extract || '' });
		}

		// Fallback: buscar en Wikipedia
		const searchRes = await fetch(
			`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(query)}&prop=pageimages&format=json&pithumbsize=${width}`
		);
		const searchData = await searchRes.json();
		const pages = searchData.query?.pages || {};
		const page = Object.values(pages)[0] as { thumbnail?: { source: string } } | undefined;
		
		if (page?.thumbnail?.source) {
			return json({ url: page.thumbnail.source });
		}
	} catch {}

	return json({ url: null });
};
