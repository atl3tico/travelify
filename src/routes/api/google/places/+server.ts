import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PUBLIC_GOOGLE_MAPS_API_KEY } from '$env/static/public';

export const GET: RequestHandler = async ({ url }) => {
	const query = url.searchParams.get('q');
	const placeId = url.searchParams.get('place_id');

	if (placeId) {
		const res = await fetch(
			`https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry,name,formatted_address,photos,rating,website,formatted_phone_number,types,url&key=${PUBLIC_GOOGLE_MAPS_API_KEY}`
		);
		const data = await res.json();
		return json(data);
	}

	if (!query || query.length < 3) return json({ predictions: [] });

	const res = await fetch(
		`https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${PUBLIC_GOOGLE_MAPS_API_KEY}`
	);
	const data = await res.json();
	return json(data);
};
