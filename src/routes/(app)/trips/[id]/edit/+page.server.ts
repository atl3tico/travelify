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
	return { trip };
};

export const actions: Actions = {
	default: async ({ request, params, locals: { supabase, safeGetSession } }) => {
		const { user } = await safeGetSession();
		if (!user) return fail(401);

		const form = await request.formData();
		const name = form.get('name') as string;
		const destination = form.get('destination') as string;
		const accommodationName = (form.get('accommodation_name') as string) || null;
		const startDate = form.get('start_date') as string;
		const endDate = form.get('end_date') as string;

		if (!name || !destination || !startDate || !endDate) return fail(400, { missing: true });

		const { error: err } = await supabase
			.from('trips')
			.update({
				name,
				destination,
				accommodation_name: accommodationName,
				start_date: startDate,
				end_date: endDate,
			})
			.eq('id', params.id)
			.eq('user_id', user.id);

		if (err) return fail(500, { error: err.message });
		throw redirect(303, `/trips/${params.id}`);
	},
};
