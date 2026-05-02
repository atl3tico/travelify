import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envLines = readFileSync('.env', 'utf-8').split('\n');
const env = {};
for (const line of envLines) {
	const trimmed = line.trim();
	if (trimmed && !trimmed.startsWith('#')) {
		const [key, ...rest] = trimmed.split('=');
		env[key.trim()] = rest.join('=').trim();
	}
}

const supabase = createClient(env.PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
	const day4Id = 'a90326da-b1e1-4978-b688-a15118e65677';
	const day5Id = 'b24d7618-c058-4c77-82b4-9eb2b74bc930';
	const day6Id = 'fd47e3b2-cd35-4f37-97e1-ea474aca0844';
	const day7Id = 'e15ff7d8-b578-42cd-b7ce-940f70334611';

	const { data: day4Places } = await supabase
		.from('places')
		.select('id, name, lat, lng, order_index')
		.eq('day_id', day4Id)
		.order('order_index');

	console.log(`Day 4 places to move: ${day4Places.length}`);

	const assignments = {
		[day5Id]: {
			startIndex: 14,
			placeIds: [
				'44c38877-f880-49f0-a53a-3c5977c482cd', // Canal Saint-Martin
			],
		},
		[day6Id]: {
			startIndex: 5,
			placeIds: [
				'684adc8e-ecb1-4736-ad64-1901e2a37294', // Plaza de la República
			],
		},
		[day7Id]: {
			startIndex: 13,
			placeIds: [
				'8f52b0c7-7a4f-4984-8940-1d010fe397e4', // Centro Pompidou
			],
		},
	};

	for (const [dayId, config] of Object.entries(assignments)) {
		for (let i = 0; i < config.placeIds.length; i++) {
			const { error } = await supabase
				.from('places')
				.update({ day_id: dayId, order_index: config.startIndex + i })
				.eq('id', config.placeIds[i]);

			if (error) {
				console.error(`Error: ${error.message}`);
			}
		}
		console.log(`✓ Day ${dayId}: ${config.placeIds.length} places moved`);
	}

	console.log('\nDone!');
}

main();
