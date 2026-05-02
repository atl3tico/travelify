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

const GOOGLE_KEY = env.PUBLIC_GOOGLE_MAPS_API_KEY;
const supabase = createClient(env.PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const placeQueries = {
	'Arco del Triunfo': 'Arc de Triomphe, Paris',
	'Barrio Latino': 'Quartier Latin, Paris',
	'Bastilla': 'Place de la Bastille, Paris',
	'Canal Saint-Martin': 'Canal Saint-Martin, Paris',
	'Centro Pompidou': 'Centre Pompidou, Paris',
	'Champs-Élysées': 'Avenue des Champs-Élysées, Paris',
	'CREPERIE Chez Suzette': 'Crêperie Chez Suzette, Paris',
	'Disneyland Paris': 'Disneyland Park, Marne-la-Vallée',
	'Galerías Lafayette': 'Galeries Lafayette Haussmann, Paris',
	'Jardín de las Tullerías': 'Jardin des Tuileries, Paris',
	'Jardín de Luxemburgo': 'Jardin du Luxembourg, Paris',
	'Le Marais': 'Le Marais, Paris',
	'Mercado de Aligre': 'Marché d\'Aligre, Paris',
	'Montmartre': 'Montmartre, Paris',
	'Moulin Rouge': 'Moulin Rouge, Paris',
	'Museo de Orsay': 'Musée d\'Orsay, Paris',
	'Museo del Louvre': 'Musée du Louvre, Paris',
	'Notre-Dame': 'Cathédrale Notre-Dame de Paris',
	'Ópera Garnier': 'Palais Garnier, Paris',
	'Panteón': 'Panthéon, Paris',
	'Peter Pan\'s Flight': 'Peter Pan\'s Flight, Disneyland Paris',
	'Plaza de la República': 'Place de la République, Paris',
	'Ponte Neuf': 'Pont Neuf, Paris',
	'Ratatouille : L\'Aventure Totalement Toquée de Rémy': 'Ratatouille L\'Aventure Totalement Toquée de Rémy, Disneyland Paris',
	'Sagrado Corazón': 'Basilique du Sacré-Cœur, Montmartre, Paris',
	'Sainte-Chapelle': 'Sainte-Chapelle, Paris',
	'Torre Eiffel': 'Tour Eiffel, Paris',
	'Torre Montparnasse': 'Tour Montparnasse, Paris',
};

async function getGooglePlacePhoto(query) {
	try {
		// Find place
		const findRes = await fetch(
			`https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=place_id&key=${GOOGLE_KEY}`
		);
		const findData = await findRes.json();
		const placeId = findData.candidates?.[0]?.place_id;
		
		if (!placeId) {
			console.log(`    No place_id found`);
			return null;
		}

		// Get place details with photos
		const detailsRes = await fetch(
			`https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos&key=${GOOGLE_KEY}`
		);
		const detailsData = await detailsRes.json();
		const photos = detailsData.result?.photos;
		
		if (!photos || photos.length === 0) {
			console.log(`    No photos found`);
			return null;
		}

		const photoRef = photos[0].photo_reference;
		const photoUrl = `/api/google/photo?ref=${encodeURIComponent(photoRef)}&maxwidth=800`;
		return photoUrl;
	} catch (e) {
		console.log(`    Error: ${e.message}`);
		return null;
	}
}

async function main() {
	const { data: places, error } = await supabase
		.from('places')
		.select('id, name');

	if (error) {
		console.error('Error:', error);
		process.exit(1);
	}

	console.log(`Found ${places.length} places`);

	for (const place of places) {
		const query = placeQueries[place.name];
		if (!query) {
			console.log(`\n[${place.name}] No query defined`);
			continue;
		}

		console.log(`\n[${place.name}] Searching: "${query}"`);
		const photoUrl = await getGooglePlacePhoto(query);
		
		if (photoUrl) {
			console.log(`  ✓ Photo URL obtained`);
			
			const { error: updateError } = await supabase
				.from('places')
				.update({ photo_url: photoUrl })
				.eq('id', place.id);

			if (updateError) {
				console.log(`  ✗ DB error: ${updateError.message}`);
			} else {
				console.log(`  ✓ Updated`);
			}
		} else {
			console.log(`  ✗ No photo`);
		}

		// Rate limit
		await new Promise(r => setTimeout(r, 500));
	}

	console.log('\nDone!');
}

main();
