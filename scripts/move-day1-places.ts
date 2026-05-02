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
	const day1Id = '8e0e8a7e-e6bf-4ed4-b815-280eeb977172';
	const day5Id = 'b24d7618-c058-4c77-82b4-9eb2b74bc930';
	const day6Id = 'fd47e3b2-cd35-4f37-97e1-ea474aca0844';
	const day7Id = 'e15ff7d8-b578-42cd-b7ce-940f70334611';

	const { data: day1Places } = await supabase
		.from('places')
		.select('id, name, lat, lng, order_index')
		.eq('day_id', day1Id)
		.order('order_index');

	console.log(`Day 1 places to move: ${day1Places.length}`);

	const assignments = {
		[day5Id]: {
			startIndex: 8, // after existing 8 places (0-7)
			placeIds: [
				'ebe59beb-41d8-4745-82cc-206596513a08', // CREPERIE Chez Suzette
				'546eb49c-4c0e-4432-a0c9-9663613448be', // Montmartre
				'20efcad3-ba73-4d60-bf84-a35441dfb584', // Sagrado Corazón
			],
		},
		[day6Id]: {
			startIndex: 3, // after existing 3 places (0-2)
			placeIds: [
				'47d3dff0-fb1b-445f-a82d-b79fde62a2b3', // Ponte Neuf
			],
		},
		[day7Id]: {
			startIndex: 7, // after existing 7 places (0-6)
			placeIds: [
				'e34e1f30-5b0c-47ba-aee8-96ce3307eb63', // Notre-Dame
				'180ab7cc-9f50-48af-82df-661545a7e7e9', // Shakespeare and Company
				'd7048d63-00b8-4549-99d5-a6e75e2ae352', // Sainte-Chapelle
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
				console.error(`Error updating place ${config.placeIds[i]}: ${error.message}`);
			}
		}
		console.log(`✓ Day ${dayId} updated with ${config.placeIds.length} places (starting at index ${config.startIndex})`);
	}

	console.log('\nDone!');
}

main();
