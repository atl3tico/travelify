import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PUBLIC_GOOGLE_MAPS_API_KEY } from '$env/static/public';

async function translateToSpanish(text: string): Promise<string> {
	try {
		const res = await fetch(
			`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.substring(0, 4500))}&langpair=en|es`
		);
		const data = await res.json();
		return data.responseData?.translatedText || text;
	} catch {
		return text;
	}
}

export const POST: RequestHandler = async ({ request }) => {
	const { name, category, lat, lng } = await request.json();

	const categoryDurations: Record<string, number> = {
		attraction: 90,
		restaurant: 60,
		hotel: 30,
		shopping: 45,
		transport: 30,
		place: 60,
	};

	let description = '';
	let plusCode = '';

	// 1. Wikipedia en español (prioridad)
	try {
		const wikiRes = await fetch(
			`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`
		);
		if (wikiRes.ok) {
			const wikiData = await wikiRes.json();
			if (wikiData.extract) {
				description = wikiData.extract;
			}
		}
	} catch {}

	// 2. Si no hay Wikipedia en español, buscar en Google Places y traducir
	if (!description && lat && lng) {
		try {
			const searchRes = await fetch(
				`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(name)}&location=${lat},${lng}&radius=5000&fields=plus_code,editorial_summary&key=${PUBLIC_GOOGLE_MAPS_API_KEY}`
			);
			const searchData = await searchRes.json();
			const firstResult = searchData.results?.[0];

			if (firstResult) {
				plusCode = firstResult.plus_code?.global_code || '';

				let rawDescription = firstResult.editorial_summary?.overview;

				if (!rawDescription && firstResult.place_id) {
					const detailsRes = await fetch(
						`https://maps.googleapis.com/maps/api/place/details/json?place_id=${firstResult.place_id}&fields=editorial_summary,reviews,plus_code&key=${PUBLIC_GOOGLE_MAPS_API_KEY}`
					);
					const detailsData = await detailsRes.json();
					const result = detailsData.result;
					if (!plusCode) plusCode = result?.plus_code?.global_code || '';

					rawDescription = result?.editorial_summary?.overview;

					if (!rawDescription) {
						const reviews = result?.reviews;
						if (reviews?.length > 0) {
							const topReviews = reviews
								.sort((a: { rating: number }, b: { rating: number }) => b.rating - a.rating)
								.slice(0, 2)
								.map((r: { text: string }) => r.text.substring(0, 200));
							rawDescription = topReviews.join(' ');
						}
					}
				}

				if (rawDescription) {
					description = await translateToSpanish(rawDescription);
				}
			}
		} catch {}
	}

	// 3. Fallback: Wikipedia en inglés y traducir
	if (!description) {
		try {
			const wikiRes = await fetch(
				`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`
			);
			if (wikiRes.ok) {
				const wikiData = await wikiRes.json();
				if (wikiData.extract) {
					description = await translateToSpanish(wikiData.extract);
				}
			}
		} catch {}
	}

	return json({
		description,
		plus_code: plusCode,
		duration: categoryDurations[category] || 60,
	});
};
