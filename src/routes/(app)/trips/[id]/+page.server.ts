import type { PageServerLoad, Actions } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals: { supabase, safeGetSession } }) => {
	const { user } = await safeGetSession();
	if (!user) throw redirect(303, '/auth/login');

	const { data: trip, error: tripErr } = await supabase
		.from('trips')
		.select('*')
		.eq('id', params.id)
		.eq('user_id', user.id)
		.single();

	if (tripErr || !trip) throw error(404, 'Trip not found');

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

	return { trip, days: days ?? [], places: places ?? [] };
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
		});

		if (err) return fail(500, { error: err.message });
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
};
