import type { PageServerLoad, Actions } from './$types';
import { redirect, error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals: { supabase, safeGetSession } }) => {
	const { user } = await safeGetSession();
	if (!user) throw redirect(303, '/auth/login');

	const { data: trip } = await supabase
		.from('trips')
		.select('*')
		.eq('id', params.id)
		.eq('user_id', user.id)
		.single();

	if (!trip) throw error(404, 'Viaje no encontrado');

	const { data: accommodations } = await supabase
		.from('accommodations')
		.select('*')
		.eq('trip_id', trip.id)
		.order('start_date');

	return { trip, accommodations: accommodations ?? [] };
};

export const actions: Actions = {
	save: async ({ request, params, locals: { supabase, safeGetSession } }) => {
		const { user } = await safeGetSession();
		if (!user) throw redirect(303, '/auth/login');

		const form = await request.formData();
		const name = form.get('name') as string;
		const destination = form.get('destination') as string;
		const startDate = form.get('start_date') as string;
		const endDate = form.get('end_date') as string;
		const numTravelers = parseInt(form.get('num_travelers') as string) || 1;
		const description = (form.get('description') as string) || null;

		const { error: err } = await supabase
			.from('trips')
			.update({
				name,
				destination,
				start_date: startDate,
				end_date: endDate,
				num_travelers: numTravelers,
				description,
			})
			.eq('id', params.id)
			.eq('user_id', user.id);

		if (err) {
			return { success: false, error: err.message };
		}

		// Regenerate days: delete orphaned days (no places) then add missing
		const { data: existingDays } = await supabase
			.from('days')
			.select('id, date')
			.eq('trip_id', params.id)
			.order('day_index');

		const existingDates = new Set((existingDays ?? []).map((d: { date: string }) => d.date));
		const expectedDates: string[] = [];
		let current = new Date(startDate);
		const end = new Date(endDate);
		while (current <= end) {
			expectedDates.push(current.toISOString().split('T')[0]);
			current.setDate(current.getDate() + 1);
		}

		// Delete days with no places that are outside new range
		for (const day of existingDays ?? []) {
			if (!expectedDates.includes(day.date)) {
				const { count } = await supabase
					.from('places')
					.select('*', { count: 'exact', head: true })
					.eq('day_id', day.id);
				if (count === 0) {
					await supabase.from('days').delete().eq('id', day.id);
				}
			}
		}

		// Add missing days (upsert prevents duplicates)
		let idx = 1;
		for (const dateStr of expectedDates) {
			await supabase
				.from('days')
				.upsert({
					trip_id: params.id,
					date: dateStr,
					day_index: idx,
				}, { onConflict: 'trip_id, date' });
			idx++;
		}

		// Re-index all days sequentially
		const { data: allDays } = await supabase
			.from('days')
			.select('id')
			.eq('trip_id', params.id)
			.order('date');
		for (let i = 0; i < (allDays ?? []).length; i++) {
			await supabase
				.from('days')
				.update({ day_index: i + 1 })
				.eq('id', allDays![i].id);
		}

		return { success: true };
	},

	addAccommodation: async ({ request, params, locals: { supabase, safeGetSession } }) => {
		const { user } = await safeGetSession();
		if (!user) throw redirect(303, '/auth/login');

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
		if (!user) throw redirect(303, '/auth/login');

		const form = await request.formData();
		const accId = form.get('acc_id') as string;
		if (!accId) return { success: false };

		await supabase.from('accommodations').delete().eq('id', accId);
		return { success: true };
	},

	updateAccommodation: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { user } = await safeGetSession();
		if (!user) throw redirect(303, '/auth/login');

		const form = await request.formData();
		const accId = form.get('acc_id') as string;
		const accName = form.get('acc_name') as string;
		const accStart = form.get('acc_start_date') as string;
		const accEnd = form.get('acc_end_date') as string;

		if (!accId || !accName || !accStart || !accEnd) return { success: false };

		const { error: err } = await supabase
			.from('accommodations')
			.update({ name: accName, start_date: accStart, end_date: accEnd })
			.eq('id', accId);

		if (err) return { success: false, error: err.message };
		return { success: true };
	},
};
