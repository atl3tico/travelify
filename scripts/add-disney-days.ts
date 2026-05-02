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

const DISNEY_LAT = 48.8674;
const DISNEY_LNG = 2.7834;

const day3Id = '23daea9c-56bf-4712-b8e1-c24d39a704ee';
const day4Id = 'a90326da-b1e1-4978-b688-a15118e65677';

const day3Places = [
	{ name: 'Disneyland Park - Main Entrance', lat: 48.8674, lng: 2.7834, category: 'theme_park', description: 'Parque principal de Disneyland Paris. Incluye Main Street U.S.A., Fantasyland, Adventureland, Frontierland y Discoveryland.', start_time: '09:30', visit_duration: 480, estimated_cost: 99 },
	{ name: 'Sleeping Beauty Castle', lat: 48.8721, lng: 2.7818, category: 'landmark', description: 'El icónico castillo de la Bella Durmiente, símbolo de Disneyland Paris.', visit_duration: 30, estimated_cost: 0 },
	{ name: 'Pirates of the Caribbean', lat: 48.8710, lng: 2.7790, category: 'attraction', description: 'Aventura en barco por las aguas del Caribe con animatrónicos y efectos especiales.', visit_duration: 45, estimated_cost: 0 },
	{ name: "It's a Small World", lat: 48.8715, lng: 2.7805, category: 'attraction', description: 'Paseo clásico por culturas del mundo con la famosa canción.', visit_duration: 30, estimated_cost: 0 },
	{ name: 'Big Thunder Mountain', lat: 48.8730, lng: 2.7850, category: 'attraction', description: 'Montaña rusa temática del viejo oeste en Frontierland.', visit_duration: 45, estimated_cost: 0 },
	{ name: 'Space Mountain: Mission 2', lat: 48.8735, lng: 2.7860, category: 'attraction', description: 'Montaña rora de alta velocidad en Discoveryland con temática espacial.', visit_duration: 45, estimated_cost: 0 },
	{ name: 'Disneyland Hotel', lat: 48.8740, lng: 2.7800, category: 'hotel', description: 'Hotel principal en la entrada del parque. Arquitectura victoriana.', visit_duration: 0, estimated_cost: 0 },
];

const day4Places = [
	{ name: 'Walt Disney Studios Park', lat: 48.8658, lng: 2.7816, category: 'theme_park', description: 'Segundo parque temático dedicado al cine y la animación. Incluye Worlds of Pixar, Marvel, Frozen y más.', start_time: '09:30', visit_duration: 480, estimated_cost: 99 },
	{ name: 'Avengers Campus', lat: 48.8650, lng: 2.7800, category: 'land', description: 'Zona temática de Marvel con atracciones de Spider-Man e Iron Man.', visit_duration: 90, estimated_cost: 0 },
	{ name: 'Ratatouille: The Adventure', lat: 48.8645, lng: 2.7810, category: 'attraction', description: 'Aventura 3D trackless basada en la película Ratatouille.', visit_duration: 30, estimated_cost: 0 },
	{ name: 'The Twilight Zone Tower of Terror', lat: 48.8665, lng: 2.7820, category: 'attraction', description: 'Torre de la caída libre con temática de hotel abandonado.', visit_duration: 45, estimated_cost: 0 },
	{ name: 'Crush\'s Coaster', lat: 48.8655, lng: 2.7825, category: 'attraction', description: 'Montaña rora giratoria basada en Buscando a Nemo.', visit_duration: 30, estimated_cost: 0 },
	{ name: 'Disney Village', lat: 48.8680, lng: 2.7790, category: 'entertainment', description: 'Zona de restaurantes, tiendas y entretenimiento junto a los parques.', visit_duration: 120, estimated_cost: 50 },
	{ name: 'Disney Stars on Parade', lat: 48.8700, lng: 2.7830, category: 'show', description: 'Desfile diario con personajes Disney, carrozas y música.', start_time: '17:30', visit_duration: 45, estimated_cost: 0 },
];

async function main() {
	console.log('Adding Disneyland places to Day 3...');
	for (let i = 0; i < day3Places.length; i++) {
		const place = day3Places[i];
		const { error } = await supabase.from('places').insert({
			day_id: day3Id,
			name: place.name,
			lat: place.lat,
			lng: place.lng,
			order_index: i,
			category: place.category,
			description: place.description,
			start_time: place.start_time || null,
			visit_duration: place.visit_duration || 60,
			estimated_cost: place.estimated_cost || 0,
		});
		if (error) {
			console.error(`Error adding ${place.name}: ${error.message}`);
		} else {
			console.log(`  ✓ ${place.name}`);
		}
	}

	console.log('\nAdding Disneyland places to Day 4...');
	for (let i = 0; i < day4Places.length; i++) {
		const place = day4Places[i];
		const { error } = await supabase.from('places').insert({
			day_id: day4Id,
			name: place.name,
			lat: place.lat,
			lng: place.lng,
			order_index: i,
			category: place.category,
			description: place.description,
			start_time: place.start_time || null,
			visit_duration: place.visit_duration || 60,
			estimated_cost: place.estimated_cost || 0,
		});
		if (error) {
			console.error(`Error adding ${place.name}: ${error.message}`);
		} else {
			console.log(`  ✓ ${place.name}`);
		}
	}

	console.log('\nDone!');
}

main();
