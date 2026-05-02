import { RAPIDAPI_KEY } from '$env/static/private';
import { json } from '@sveltejs/kit';

export async function GET({ url }) {
	const flightNumber = url.searchParams.get('flight');
	const date = url.searchParams.get('date');

	if (!flightNumber || !date) {
		return json({ error: 'Missing flight or date' }, { status: 400 });
	}

	try {
		const res = await fetch(
			`https://aerodatabox.p.rapidapi.com/flights/number/${encodeURIComponent(flightNumber)}/${date}?withAircraftImage=false&withLocation=false`,
			{
				headers: {
					'X-RapidAPI-Key': RAPIDAPI_KEY,
					'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com',
				},
			},
		);

		if (!res.ok) {
			const text = await res.text();
			return json({ error: text }, { status: res.status });
		}

		const flights = await res.json();

		if (!flights || flights.length === 0) {
			return json({ error: 'No flight found' }, { status: 404 });
		}

		const flight = flights[0];

		const extractTime = (timeObj: { local?: string }) => {
			if (!timeObj?.local) return null;
			const match = timeObj.local.match(/(\d{2}:\d{2})/);
			return match ? match[1] : null;
		};

		return json({
			flight_number: flight.number?.replace(' ', '') || flightNumber,
			airline: flight.airline?.name || null,
			origin: flight.departure?.airport?.iata || null,
			origin_name: flight.departure?.airport?.municipalityName || flight.departure?.airport?.name || null,
			destination: flight.arrival?.airport?.iata || null,
			destination_name: flight.arrival?.airport?.municipalityName || flight.arrival?.airport?.name || null,
			departure_time: extractTime(flight.departure?.scheduledTime) || extractTime(flight.departure?.revisedTime),
			arrival_time: extractTime(flight.arrival?.scheduledTime) || extractTime(flight.arrival?.revisedTime),
			status: flight.status || null,
		});
	} catch (e) {
		return json({ error: 'API request failed' }, { status: 500 });
	}
}
