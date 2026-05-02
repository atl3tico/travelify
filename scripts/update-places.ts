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

async function getGooglePlacePhoto(placeName) {
	try {
		const searchRes = await fetch(
			`https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(placeName)}&inputtype=textquery&fields=place_id,photos&key=${GOOGLE_KEY}`
		);
		const searchData = await searchRes.json();
		const candidate = searchData.candidates?.[0];
		if (!candidate) return null;

		const photos = candidate.photos;
		if (!photos || photos.length === 0) {
			// Try details endpoint
			const detailsRes = await fetch(
				`https://maps.googleapis.com/maps/api/place/details/json?place_id=${candidate.place_id}&fields=photos&key=${GOOGLE_KEY}`
			);
			const detailsData = await detailsRes.json();
			const detailsPhotos = detailsData.result?.photos;
			if (!detailsPhotos || detailsPhotos.length === 0) return null;
			
			const photoRef = detailsPhotos[0].photo_reference;
			return `/api/google/photo?ref=${encodeURIComponent(photoRef)}&maxwidth=800`;
		}

		const photoRef = photos[0].photo_reference;
		return `/api/google/photo?ref=${encodeURIComponent(photoRef)}&maxwidth=800`;
	} catch (e) {
		console.log(`  Google error: ${e.message}`);
		return null;
	}
}

async function getWikiPhoto(placeName) {
	const langs = ['en', 'es', 'fr'];
	
	for (const lang of langs) {
		try {
			const wikiRes = await fetch(
				`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(placeName)}`
			);
			if (wikiRes.ok) {
				const wikiData = await wikiRes.json();
				if (wikiData.thumbnail?.source) {
					const thumbUrl = wikiData.thumbnail.source;
					return thumbUrl.replace(/\/\d+px-/, '/800px-');
				}
			}
		} catch {}
	}

	// Search
	for (const lang of langs) {
		try {
			const searchRes = await fetch(
				`https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(placeName)}&format=json&srlimit=1`
			);
			const searchData = await searchRes.json();
			const result = searchData.query?.search?.[0];
			if (result) {
				const pageRes = await fetch(
					`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(result.title)}`
				);
				if (pageRes.ok) {
					const pageData = await pageRes.json();
					if (pageData.thumbnail?.source) {
						const thumbUrl = pageData.thumbnail.source;
						return thumbUrl.replace(/\/\d+px-/, '/800px-');
					}
				}
			}
		} catch {}
	}

	return null;
}

const nameVariations = {
	'CREPERIE Chez Suzette': ['Crêperie Chez Suzette Paris', 'Chez Suzette creperie'],
	'Ratatouille : L\'Aventure Totalement Toquée de Rémy': ['Ratatouille Disneyland Paris'],
	'Peter Pan\'s Flight': ['Peter Pan Flight Disneyland Paris'],
	'Museo del Louvre': ['Louvre Museum Paris', 'Musée du Louvre'],
	'Jardín de las Tullerías': ['Jardin des Tuileries Paris'],
	'Arco del Triunfo': ['Arc de Triomphe Paris'],
	'Disneyland Paris': ['Disneyland Paris'],
	'Sagrado Corazón': ['Basilique du Sacré-Cœur Montmartre'],
	'Notre-Dame': ['Notre-Dame de Paris cathedral'],
	'Sainte-Chapelle': ['Sainte-Chapelle Paris'],
	'Champs-Élysées': ['Avenue des Champs-Élysées'],
	'Moulin Rouge': ['Moulin Rouge Paris'],
	'Museo de Orsay': ['Musée d\'Orsay Paris'],
	'Jardín de Luxemburgo': ['Jardin du Luxembourg Paris'],
	'Panteón': ['Panthéon Paris'],
	'Barrio Latino': ['Quartier Latin Paris'],
	'Ponte Neuf': ['Pont Neuf Paris'],
	'Centro Pompidou': ['Centre Pompidou Paris'],
	'Le Marais': ['Le Marais Paris'],
	'Plaza de la República': ['Place de la République Paris'],
	'Ópera Garnier': ['Palais Garnier Paris'],
	'Galerías Lafayette': ['Galeries Lafayette Paris'],
	'Canal Saint-Martin': ['Canal Saint-Martin Paris'],
	'Torre Montparnasse': ['Tour Montparnasse Paris'],
	'Mercado de Aligre': ['Marché d\'Aligre Paris'],
	'Bastilla': ['Place de la Bastille Paris'],
	'Montmartre': ['Montmartre Paris'],
	'Torre Eiffel': ['Eiffel Tower Paris'],
};

async function main() {
	const { data: places, error } = await supabase
		.from('places')
		.select('id, name, photo_url');

	if (error) {
		console.error('Error fetching places:', error);
		process.exit(1);
	}

	console.log(`Found ${places.length} places to update`);

	for (const place of places) {
		console.log(`\n[${places.indexOf(place) + 1}/${places.length}] ${place.name}`);

		const variations = nameVariations[place.name] || [place.name];
		let photoUrl = null;

		for (const variation of variations) {
			console.log(`  Trying Google: "${variation}"`);
			photoUrl = await getGooglePlacePhoto(variation);
			if (photoUrl) {
				console.log(`  ✓ Google photo found`);
				break;
			}

			console.log(`  Trying Wikipedia: "${variation}"`);
			photoUrl = await getWikiPhoto(variation);
			if (photoUrl) {
				console.log(`  ✓ Wikipedia photo found`);
				break;
			}
		}

		if (!photoUrl) {
			console.log(`  ✗ No photo found`);
			continue;
		}

		const { error: updateError } = await supabase
			.from('places')
			.update({ photo_url: photoUrl })
			.eq('id', place.id);

		if (updateError) {
			console.error(`  Error updating: ${updateError.message}`);
		} else {
			console.log(`  ✓ Updated`);
		}

		await new Promise(r => setTimeout(r, 500));
	}

	console.log('\nDone!');
}

main();
