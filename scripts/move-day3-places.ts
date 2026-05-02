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
	const day3Id = '23daea9c-56bf-4712-b8e1-c24d39a704ee';
	const day5Id = 'b24d7618-c058-4c77-82b4-9eb2b74bc930';
	const day6Id = 'fd47e3b2-cd35-4f37-97e1-ea474aca0844';
	const day7Id = 'e15ff7d8-b578-42cd-b7ce-940f70334611';

	const { data: day3Places } = await supabase
		.from('places')
		.select('id, name, lat, lng, order_index')
		.eq('day_id', day3Id)
		.order('order_index');

	console.log(`Day 3 places to move: ${day3Places.length}`);

	const assignments = {
		[day5Id]: {
			startIndex: 11,
			placeIds: [
				'fa223eb7-1134-4eec-b1df-98c1ed668a82', // Le Musée en Herbe
				'2cb9907f-70ca-41ec-ac9a-0a7e1b248dec', // Parque infantil Jardin Nelson-Mandela
				'951206f6-c214-4a12-be91-ee3d74b5f311', // Square du Vert-Galant
			],
		},
		[day6Id]: {
			startIndex: 4,
			placeIds: [
				'951f8c87-855b-4b91-8d34-a7f64da07379', // Moulin Rouge
			],
		},
		[day7Id]: {
			startIndex: 10,
			placeIds: [
				'cdcb6494-d992-45d4-a396-af129623a580', // Museo del Louvre
				'df5ef925-d32d-46df-83ae-3cff69d14619', // Ópera Garnier
				'd712c487-f783-4330-a8f8-5971e9633215', // Galerías Lafayette
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
		console.log(`✓ Day ${dayId}: ${config.placeIds.length} places moved (starting at index ${config.startIndex})`);
	}

	console.log('\nDone!');
}

main();
