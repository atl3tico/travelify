import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PUBLIC_GOOGLE_MAPS_API_KEY } from '$env/static/public';

export const GET: RequestHandler = async ({ url }) => {
	const photoRef = url.searchParams.get('ref');
	const maxwidth = url.searchParams.get('maxwidth') || '800';

	if (!photoRef) return json({ error: 'Missing photo ref' }, { status: 400 });

	const googleUrl = `https://maps.googleapis.com/maps/api/place/photo?photoreference=${encodeURIComponent(photoRef)}&maxwidth=${maxwidth}&key=${PUBLIC_GOOGLE_MAPS_API_KEY}`;

	const res = await fetch(googleUrl);

	if (!res.ok) {
		return json({ error: 'Failed to fetch photo' }, { status: res.status });
	}

	const blob = await res.blob();
	const headers = new Headers();
	headers.set('Content-Type', blob.type || 'image/jpeg');
	headers.set('Cache-Control', 'public, max-age=604800');

	return new Response(blob, { headers });
};
