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

async function getWikiDescription(placeName) {
	const langs = ['es', 'en', 'fr'];
	
	for (const lang of langs) {
		try {
			const wikiRes = await fetch(
				`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(placeName)}`
			);
			if (wikiRes.ok) {
				const wikiData = await wikiRes.json();
				if (wikiData.extract && lang === 'es') {
					return wikiData.extract;
				}
			}
		} catch {}
	}

	// Search in Spanish Wikipedia
	try {
		const searchRes = await fetch(
			`https://es.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(placeName)}&format=json&srlimit=1`
		);
		const searchData = await searchRes.json();
		const result = searchData.query?.search?.[0];
		if (result) {
			const pageRes = await fetch(
				`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(result.title)}`
			);
			if (pageRes.ok) {
				const pageData = await pageRes.json();
				return pageData.extract || '';
			}
		}
	} catch {}

	return null;
}

const nameVariations = {
	'CREPERIE Chez Suzette': ['Crêperie Chez Suzette'],
	'Ratatouille : L\'Aventure Totalement Toquée de Rémy': ['Ratatouille (Disneyland Paris)'],
	'Peter Pan\'s Flight': ['Peter Pan (atracción)'],
	'Museo del Louvre': ['Museo del Louvre'],
	'Jardín de las Tullerías': ['Jardín de las Tullerías'],
	'Arco del Triunfo': ['Arco de Triunfo (París)'],
	'Disneyland Paris': ['Disneyland Park (París)'],
	'Sagrado Corazón': ['Basílica del Sacré-Cœur'],
	'Notre-Dame': ['Catedral de Notre Dame'],
	'Sainte-Chapelle': ['Sainte-Chapelle'],
	'Champs-Élysées': ['Avenida de los Campos Elíseos'],
	'Moulin Rouge': ['Moulin Rouge'],
	'Museo de Orsay': ['Museo de Orsay'],
	'Jardín de Luxemburgo': ['Jardín de Luxemburgo'],
	'Panteón': ['Panteón de París'],
	'Barrio Latino': ['Barrio Latino'],
	'Ponte Neuf': ['Pont Neuf'],
	'Centro Pompidou': ['Centro Pompidou'],
	'Le Marais': ['Le Marais'],
	'Plaza de la República': ['Place de la République'],
	'Ópera Garnier': ['Palacio Garnier'],
	'Galerías Lafayette': ['Galeries Lafayette'],
	'Canal Saint-Martin': ['Canal Saint-Martin'],
	'Torre Montparnasse': ['Torre Montparnasse'],
	'Mercado de Aligre': ['Marché d\'Aligre'],
	'Bastilla': ['Place de la Bastille'],
	'Montmartre': ['Montmartre'],
	'Torre Eiffel': ['Torre Eiffel'],
};

async function main() {
	const { data: places, error } = await supabase
		.from('places')
		.select('id, name, description');

	if (error) {
		console.error('Error fetching places:', error);
		process.exit(1);
	}

	console.log(`Found ${places.length} places to check`);

	for (const place of places) {
		console.log(`\n[${places.indexOf(place) + 1}/${places.length}] ${place.name}`);

		const variations = nameVariations[place.name] || [place.name];
		let spanishDesc = null;

		for (const variation of variations) {
			console.log(`  Trying: "${variation}"`);
			spanishDesc = await getWikiDescription(variation);
			if (spanishDesc) {
				console.log(`  ✓ Spanish description found`);
				break;
			}
		}

		if (!spanishDesc) {
			console.log(`  ✗ No Spanish description found`);
			continue;
		}

		const { error: updateError } = await supabase
			.from('places')
			.update({ description: spanishDesc })
			.eq('id', place.id);

		if (updateError) {
			console.error(`  Error updating: ${updateError.message}`);
		} else {
			console.log(`  ✓ Updated description`);
		}

		await new Promise(r => setTimeout(r, 300));
	}

	console.log('\nDone!');
}

main();
