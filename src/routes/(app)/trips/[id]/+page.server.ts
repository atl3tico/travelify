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

	return { trip, days: days ?? [], places: places ?? [], accommodations: accommodations ?? [] };
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
		if (form.has('photo_url')) updates.photo_url = (form.get('photo_url') as string) || null;
		if (form.has('rating')) updates.rating = form.get('rating') ? parseFloat(form.get('rating') as string) : null;

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
