import type { PageServerLoad, Actions } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { env } from '$env/dynamic/public';

const adminStorage = createClient(env.PUBLIC_SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY);

export const load: PageServerLoad = async ({ params, locals: { supabase, safeGetSession } }) => {
	const { user } = await safeGetSession();
	if (!user) throw redirect(303, '/auth/login');

	const { data: trip, error: tripErr } = await supabase
		.from('trips')
		.select('*')
		.eq('id', params.id)
		.eq('user_id', user.id)
		.single();

	if (tripErr || !trip) throw error(404, 'Viaje no encontrado');

	const { data: days } = await supabase
		.from('days')
		.select('*')
		.eq('trip_id', trip.id)
		.order('day_index');

	const { data: places } = await supabase
		.from('places')
		.select('*, day:days!inner(day_index, date)')
		.eq('day.trip_id', trip.id)
		.order('order_index');

	const { data: accommodations } = await supabase
		.from('accommodations')
		.select('*')
		.eq('trip_id', trip.id)
		.order('start_date');

	// Get coordinates for weather (first place or first accommodation)
	const firstPlace = (places ?? [])[0];
	const firstAcc = (accommodations ?? [])[0];
	const lat = firstPlace?.lat ?? firstAcc?.lat;
	const lng = firstPlace?.lng ?? firstAcc?.lng;

	let weather: { date: string; tempMax: number; tempMin: number; weatherCode: number }[] = [];
	if (lat && lng && days && days.length > 0) {
		try {
			const startDate = days[0].date;
			const endDate = days[days.length - 1].date;
			const today = new Date().toISOString().split('T')[0];
			const isPast = endDate < today;
			const baseUrl = isPast
				? 'https://archive-api.open-meteo.com/v1/archive'
				: 'https://api.open-meteo.com/v1/forecast';
			const res = await fetch(
				`${baseUrl}?latitude=${lat}&longitude=${lng}` +
				`&daily=temperature_2m_max,temperature_2m_min,weathercode` +
				`&start_date=${startDate}&end_date=${endDate}` +
				`&timezone=auto`
			);
			if (res.ok) {
				const data = await res.json();
				weather = data.daily.time.map((date: string, i: number) => ({
					date,
					tempMax: Math.round(data.daily.temperature_2m_max[i]),
					tempMin: Math.round(data.daily.temperature_2m_min[i]),
					weatherCode: data.daily.weathercode[i],
				}));
			}
		} catch {
			// Silently fail - weather is optional
		}
	}

	return { trip, days: days ?? [], places: places ?? [], accommodations: accommodations ?? [], weather };
};

export const actions: Actions = {
	addPlace: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { user } = await safeGetSession();
		if (!user) return fail(401);

		const form = await request.formData();
		const dayId = form.get('day_id') as string;
		const name = form.get('name') as string;
		const lat = parseFloat(form.get('lat') as string);
		const lng = parseFloat(form.get('lng') as string);
		const address = (form.get('address') as string) || null;
		const googlePlaceId = (form.get('google_place_id') as string) || null;
		const plusCode = (form.get('plus_code') as string) || null;
		const visitDuration = parseInt(form.get('visit_duration') as string) || 60;
		const notes = (form.get('notes') as string) || '';
		const photoUrl = (form.get('photo_url') as string) || null;
		const rating = form.get('rating') ? parseFloat(form.get('rating') as string) : null;
		const category = (form.get('category') as string) || 'place';
		const website = (form.get('website') as string) || null;
		const phone = (form.get('phone') as string) || null;
		const description = (form.get('description') as string) || '';
		const startTime = (form.get('start_time') as string) || null;

		let ticketUrl: string | null = null;
		const ticketFile = form.get('ticket_file') as File | null;
		if (ticketFile && ticketFile.size > 0) {
			const ext = ticketFile.name.split('.').pop();
			const path = `tickets/${user.id}/${Date.now()}.${ext}`;
			const { error: uploadErr } = await adminStorage.storage
				.from('tickets')
				.upload(path, ticketFile, { upsert: true });
			if (!uploadErr) {
				const { data: urlData } = adminStorage.storage.from('tickets').getPublicUrl(path);
				ticketUrl = urlData.publicUrl;
			}
		}

		if (!dayId || !name || isNaN(lat) || isNaN(lng)) return fail(400, { missing: true });

		const { data: existing } = await supabase
			.from('places')
			.select('order_index')
			.eq('day_id', dayId)
			.order('order_index', { ascending: false })
			.limit(1);

		const nextIndex = (existing?.[0]?.order_index ?? -1) + 1;

		const { error: err } = await supabase.from('places').insert({
			day_id: dayId,
			name,
			lat,
			lng,
			address,
			google_place_id: googlePlaceId,
			plus_code: plusCode,
			visit_duration: visitDuration,
			notes,
			order_index: nextIndex,
			photo_url: photoUrl,
			rating,
			category,
			website,
			phone,
			description,
			start_time: startTime,
			ticket_url: ticketUrl,
			flight_number: (form.get('flight_number') as string) || null,
			airline: (form.get('airline') as string) || null,
			origin: (form.get('origin') as string) || null,
			destination: (form.get('destination') as string) || null,
			arrival_time: (form.get('arrival_time') as string) || null,
			estimated_cost: form.has('estimated_cost') ? parseFloat(form.get('estimated_cost') as string) || 0 : 0,
		});

		if (err) return fail(500, { error: err.message });
	},

	updatePlace: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { user } = await safeGetSession();
		if (!user) return fail(401);

		const form = await request.formData();
		const placeId = form.get('place_id') as string;
		if (!placeId) return fail(400);

		const updates: Record<string, unknown> = {};

		if (form.has('name')) updates.name = form.get('name') as string;
		if (form.has('visit_duration')) updates.visit_duration = parseInt(form.get('visit_duration') as string) || 60;
		if (form.has('notes')) updates.notes = (form.get('notes') as string) || '';
		if (form.has('description')) updates.description = (form.get('description') as string) || '';
		if (form.has('start_time')) updates.start_time = (form.get('start_time') as string) || null;
		if (form.has('category')) updates.category = (form.get('category') as string) || 'place';
		if (form.has('day_id')) {
			const newDayId = (form.get('day_id') as string) || null;
			if (newDayId) {
				const { data: maxPlace } = await supabase
					.from('places')
					.select('order_index')
					.eq('day_id', newDayId)
					.order('order_index', { ascending: false })
					.limit(1);
				updates.day_id = newDayId;
				updates.order_index = (maxPlace?.[0]?.order_index ?? -1) + 1;
			}
		}
		if (form.has('flight_number')) updates.flight_number = (form.get('flight_number') as string) || null;
		if (form.has('airline')) updates.airline = (form.get('airline') as string) || null;
		if (form.has('origin')) updates.origin = (form.get('origin') as string) || null;
		if (form.has('destination')) updates.destination = (form.get('destination') as string) || null;
		if (form.has('arrival_time')) updates.arrival_time = (form.get('arrival_time') as string) || null;
		if (form.has('lat')) updates.lat = parseFloat(form.get('lat') as string);
		if (form.has('lng')) updates.lng = parseFloat(form.get('lng') as string);
		if (form.has('address')) updates.address = (form.get('address') as string) || null;
		if (form.has('google_place_id')) updates.google_place_id = (form.get('google_place_id') as string) || null;
		if (form.has('plus_code')) updates.plus_code = (form.get('plus_code') as string) || null;
		if (form.has('photo_url')) updates.photo_url = (form.get('photo_url') as string) || null;
		if (form.has('rating')) updates.rating = form.get('rating') ? parseFloat(form.get('rating') as string) : null;
		if (form.has('estimated_cost')) updates.estimated_cost = parseFloat(form.get('estimated_cost') as string) || 0;

		const ticketFile = form.get('ticket_file') as File | null;
		if (ticketFile && ticketFile.size > 0) {
			const ext = ticketFile.name.split('.').pop();
			const path = `tickets/${user.id}/${Date.now()}.${ext}`;
			const { error: uploadErr } = await adminStorage.storage
				.from('tickets')
				.upload(path, ticketFile, { upsert: true });
			if (!uploadErr) {
				const { data: urlData } = adminStorage.storage.from('tickets').getPublicUrl(path);
				updates.ticket_url = urlData.publicUrl;
			}
		}

		const { error: err } = await supabase
			.from('places')
			.update(updates)
			.eq('id', placeId);

		if (err) return fail(500, { error: err.message });
		return { success: true };
	},

	removePlace: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { user } = await safeGetSession();
		if (!user) return fail(401);

		const form = await request.formData();
		const placeId = form.get('place_id') as string;
		if (!placeId) return fail(400);

		await supabase.from('places').delete().eq('id', placeId);
	},

	reorderPlaces: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { user } = await safeGetSession();
		if (!user) return fail(401);

		const form = await request.formData();
		const orders = JSON.parse(form.get('orders') as string) as {
			id: string;
			order_index: number;
		}[];

		for (const item of orders) {
			await supabase.from('places').update({ order_index: item.order_index }).eq('id', item.id);
		}
	},

	redistributePlaces: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { user } = await safeGetSession();
		if (!user) return fail(401);

		const form = await request.formData();
		const tripId = form.get('trip_id') as string;
		const selectedDayIds = JSON.parse(form.get('day_ids') as string) as string[];

		if (!tripId || !selectedDayIds || selectedDayIds.length < 2) return fail(400);

		// Get all places from selected days
		const { data: allPlaces, error: fetchErr } = await supabase
			.from('places')
			.select('*')
			.in('day_id', selectedDayIds);

		if (fetchErr || !allPlaces || allPlaces.length === 0) return fail(400, { error: 'No hay lugares' });

		// Separate places into Disneyland vs Paris groups by proximity
		const DISNEY_LAT = 48.8674;
		const DISNEY_LNG = 2.7834;

		function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
			const R = 6371;
			const dLat = ((lat2 - lat1) * Math.PI) / 180;
			const dLng = ((lng2 - lng1) * Math.PI) / 180;
			const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
			return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		}

		const disneyPlaces = allPlaces.filter(p => haversine(p.lat, p.lng, DISNEY_LAT, DISNEY_LNG) < 15);
		const parisPlaces = allPlaces.filter(p => haversine(p.lat, p.lng, DISNEY_LAT, DISNEY_LNG) >= 15);

		// Determine how many days Disney needs based on place count
		const targetPerDay = Math.ceil(allPlaces.length / selectedDayIds.length);
		const disneyDayCount = disneyPlaces.length > 0
			? Math.max(1, Math.ceil(disneyPlaces.length / targetPerDay))
			: 0;

		// First N selected days = Disney, rest = Paris
		const disneyDayIds = selectedDayIds.slice(0, disneyDayCount);
		const parisDayIds = selectedDayIds.slice(disneyDayCount);

		const assignments: Record<string, string> = {};

		// Distribute Disney places evenly across Disney days
		if (disneyPlaces.length > 0 && disneyDayIds.length > 0) {
			const sorted = disneyPlaces.sort((a, b) => a.order_index - b.order_index);
			for (let i = 0; i < sorted.length; i++) {
				assignments[sorted[i].id] = disneyDayIds[i % disneyDayIds.length];
			}
		}

		// Distribute Paris places using k-means across Paris days
		if (parisPlaces.length > 0 && parisDayIds.length > 0) {
			const k = parisDayIds.length;
			const centroids = parisDayIds.map((_, i) => {
				const seed = parisPlaces[i % parisPlaces.length];
				return { lat: seed.lat, lng: seed.lng };
			});

			let parisAssignments = new Array(parisPlaces.length).fill(0);

			for (let iter = 0; iter < 50; iter++) {
				for (let i = 0; i < parisPlaces.length; i++) {
					let bestC = 0;
					let bestDist = Infinity;
					for (let c = 0; c < k; c++) {
						const d = Math.pow(parisPlaces[i].lat - centroids[c].lat, 2) + Math.pow(parisPlaces[i].lng - centroids[c].lng, 2);
						if (d < bestDist) { bestDist = d; bestC = c; }
					}
					parisAssignments[i] = bestC;
				}

				for (let c = 0; c < k; c++) {
					const cluster = parisPlaces.filter((_, i) => parisAssignments[i] === c);
					if (cluster.length === 0) continue;
					centroids[c].lat = cluster.reduce((s, p) => s + p.lat, 0) / cluster.length;
					centroids[c].lng = cluster.reduce((s, p) => s + p.lng, 0) / cluster.length;
				}
			}

			// Balance
			const targetSize = Math.ceil(parisPlaces.length / k);
			for (let pass = 0; pass < 10; pass++) {
				const overloaded: number[] = [];
				const underloaded: number[] = [];
				for (let c = 0; c < k; c++) {
					const count = parisAssignments.filter(a => a === c).length;
					if (count > targetSize) overloaded.push(c);
					if (count < targetSize) underloaded.push(c);
				}
				if (overloaded.length === 0 || underloaded.length === 0) break;

				for (const oc of overloaded) {
					const ocCount = parisAssignments.filter(a => a === oc).length;
					if (ocCount <= targetSize) continue;

					let bestIdx = -1;
					let bestDist = Infinity;
					for (let i = 0; i < parisPlaces.length; i++) {
						if (parisAssignments[i] !== oc) continue;
						for (const uc of underloaded) {
							const d = Math.pow(parisPlaces[i].lat - centroids[uc].lat, 2) + Math.pow(parisPlaces[i].lng - centroids[uc].lng, 2);
							if (d < bestDist) { bestDist = d; bestIdx = i; }
						}
					}
					if (bestIdx >= 0) {
						let bestUc = underloaded[0];
						let bestUDist = Infinity;
						for (const uc of underloaded) {
							const d = Math.pow(parisPlaces[bestIdx].lat - centroids[uc].lat, 2) + Math.pow(parisPlaces[bestIdx].lng - centroids[uc].lng, 2);
							if (d < bestUDist) { bestUDist = d; bestUc = uc; }
						}
						parisAssignments[bestIdx] = bestUc;
					}
				}
			}

			// Sort within clusters and assign
			const clusters: Record<number, typeof parisPlaces> = {};
			for (let c = 0; c < k; c++) {
				clusters[c] = parisPlaces
					.filter((_, i) => parisAssignments[i] === c)
					.sort((a, b) => a.order_index - b.order_index);
			}

			for (let c = 0; c < k; c++) {
				const targetDayId = parisDayIds[c];
				for (let i = 0; i < clusters[c].length; i++) {
					assignments[clusters[c][i].id] = targetDayId;
				}
			}
		}

		// Batch update
		for (const [placeId, dayId] of Object.entries(assignments)) {
			const dayPlaces = Object.entries(assignments)
				.filter(([, d]) => d === dayId)
				.map(([id]) => id);
			const orderIdx = dayPlaces.indexOf(placeId);

			await supabase
				.from('places')
				.update({ day_id: dayId, order_index: orderIdx })
				.eq('id', placeId);
		}

		return { success: true };
	},

	deleteTrip: async ({ params, locals: { supabase, safeGetSession } }) => {
		const { user } = await safeGetSession();
		if (!user) return fail(401);

		await supabase.from('trips').delete().eq('id', params.id).eq('user_id', user.id);
		throw redirect(303, '/dashboard');
	},

	updateTravelMode: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { user } = await safeGetSession();
		if (!user) return fail(401);

		const form = await request.formData();
		const dayId = form.get('day_id') as string;
		const travelMode = form.get('travel_mode') as string;

		if (!dayId || !travelMode) return fail(400);

		await supabase.from('days').update({ travel_mode: travelMode }).eq('id', dayId);
	},

	updateTransportCost: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { user } = await safeGetSession();
		if (!user) return fail(401);

		const form = await request.formData();
		const dayId = form.get('day_id') as string;
		const transportCost = parseFloat(form.get('transport_cost') as string) || 0;

		if (!dayId) return fail(400);

		await supabase.from('days').update({ transport_cost: transportCost }).eq('id', dayId);
	},

	updatePlaceTime: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { user } = await safeGetSession();
		if (!user) return fail(401);

		const form = await request.formData();
		const placeId = form.get('place_id') as string;
		const startTime = form.get('start_time') as string;

		if (!placeId || !startTime) return fail(400);

		const { error: err } = await supabase
			.from('places')
			.update({ start_time: startTime })
			.eq('id', placeId);

		if (err) return fail(500, { error: err.message });
		return { success: true };
	},

	addAccommodation: async ({ request, params, locals: { supabase, safeGetSession } }) => {
		const { user } = await safeGetSession();
		if (!user) return fail(401);

		const form = await request.formData();
		const accName = form.get('acc_name') as string;
		const accStart = form.get('acc_start_date') as string;
		const accEnd = form.get('acc_end_date') as string;

		if (!accName || !accStart || !accEnd) return { success: false };

		await supabase.from('accommodations').insert({
			trip_id: params.id,
			name: accName,
			start_date: accStart,
			end_date: accEnd,
		});
		return { success: true };
	},

	removeAccommodation: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { user } = await safeGetSession();
		if (!user) return fail(401);

		const form = await request.formData();
		const accId = form.get('accommodation_id') as string;
		if (!accId) return fail(400);

		await supabase.from('accommodations').delete().eq('id', accId);
	},

	updateFlights: async ({ request, params, locals: { supabase, safeGetSession } }) => {
		const { user } = await safeGetSession();
		if (!user) return fail(401);

		const form = await request.formData();
		const get = (key: string) => (form.get(key) as string) || null;

		const { error: err } = await supabase
			.from('trips')
			.update({
				outbound_flight_number: get('outbound_flight_number'),
				outbound_airline: get('outbound_airline'),
				outbound_origin: get('outbound_origin'),
				outbound_destination: get('outbound_destination'),
				outbound_departure_time: get('outbound_departure_time'),
				outbound_arrival_time: get('outbound_arrival_time'),
				return_flight_number: get('return_flight_number'),
				return_airline: get('return_airline'),
				return_origin: get('return_origin'),
				return_destination: get('return_destination'),
				return_departure_time: get('return_departure_time'),
				return_arrival_time: get('return_arrival_time'),
			})
			.eq('id', params.id);

		if (err) return fail(500, { error: err.message });
		return { success: true };
	},
};
