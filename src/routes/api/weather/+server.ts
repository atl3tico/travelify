import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const lat = url.searchParams.get('lat');
	const lng = url.searchParams.get('lng');
	const startDate = url.searchParams.get('start_date');
	const endDate = url.searchParams.get('end_date');

	if (!lat || !lng || !startDate || !endDate) {
		return new Response(JSON.stringify({ error: 'Missing parameters' }), { status: 400 });
	}

	try {
		const res = await fetch(
			`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
			`&daily=temperature_2m_max,temperature_2m_min,weathercode` +
			`&start_date=${startDate}&end_date=${endDate}` +
			`&timezone=auto`
		);

		if (!res.ok) {
			return new Response(JSON.stringify({ error: 'Failed to fetch weather' }), { status: 500 });
		}

		const data = await res.json();
		const weather = data.daily.time.map((date: string, i: number) => ({
			date,
			tempMax: Math.round(data.daily.temperature_2m_max[i]),
			tempMin: Math.round(data.daily.temperature_2m_min[i]),
			weatherCode: data.daily.weathercode[i],
		}));

		return new Response(JSON.stringify({ weather }));
	} catch {
		return new Response(JSON.stringify({ error: 'Failed to fetch weather' }), { status: 500 });
	}
};
