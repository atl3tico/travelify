import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

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
	const langs = ['es', 'en', 'fr'];
	
	for (const lang of langs) {
		try {
			const res = await fetch(
				`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`
			);
			if (res.ok) {
				const data = await res.json();
				if (data.extract) {
					description = data.extract;
					break;
				}
			}
		} catch {}
	}

	return json({
		description,
		duration: categoryDurations[category] || 60,
	});
};
