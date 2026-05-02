import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
	const { user } = await safeGetSession();

	const { data: trips } = await supabase
		.from('trips')
		.select('id, name, destination, start_date, end_date, cover_photo_url, description, num_travelers, created_at')
		.eq('user_id', user!.id)
		.order('start_date', { ascending: true });

	return { trips: trips ?? [] };
};
