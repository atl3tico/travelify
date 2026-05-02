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

const placeWikiTitles = {
	'Arco del Triunfo': 'Arc de Triomphe',
	'Barrio Latino': 'Quartier latin',
	'Bastilla': 'Place de la Bastille',
	'Canal Saint-Martin': 'Canal Saint-Martin',
	'Centro Pompidou': 'Centre Pompidou',
	'Champs-Élysées': 'Avenue des Champs-Élysées',
	'CREPERIE Chez Suzette': null,
	'Disneyland Paris': 'Disneyland Park (Paris)',
	'Galerías Lafayette': 'Galeries Lafayette',
	'Jardín de las Tullerías': 'Jardin des Tuileries',
	'Jardín de Luxemburgo': 'Jardin du Luxembourg',
	'Le Marais': 'Le Marais',
	'Mercado de Aligre': 'Marché d\'Aligre',
	'Montmartre': 'Montmartre',
	'Moulin Rouge': 'Moulin Rouge',
	'Museo de Orsay': 'Musée d\'Orsay',
	'Museo del Louvre': 'Louvre',
	'Notre-Dame': 'Notre-Dame de Paris',
	'Ópera Garnier': 'Palais Garnier',
	'Panteón': 'Panthéon (Paris)',
	'Peter Pan\'s Flight': 'Peter Pan\'s Flight',
	'Plaza de la República': 'Place de la République',
	'Ponte Neuf': 'Pont Neuf',
	'Ratatouille : L\'Aventure Totalement Toquée de Rémy': 'Ratatouille: L\'Aventure Totalement Toquée de Rémy',
	'Sagrado Corazón': 'Basilique du Sacré-Cœur de Montmartre',
	'Sainte-Chapelle': 'Sainte-Chapelle',
	'Torre Eiffel': 'Tour Eiffel',
	'Torre Montparnasse': 'Tour Montparnasse',
};

async function getWikiImage(title) {
	const langs = ['en', 'fr', 'es'];
	
	for (const lang of langs) {
		try {
			const res = await fetch(
				`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
			);
			if (res.ok) {
				const data = await res.json();
				if (data.thumbnail?.source) {
					const url = data.thumbnail.source;
					return url.replace(/\/\d+px-/, '/800px-');
				}
			}
		} catch (e) {
			console.log(`    ${lang} error: ${e.message}`);
		}
	}
	return null;
}

async function main() {
	const { data: places, error } = await supabase
		.from('places')
		.select('id, name, photo_url');

	if (error) {
		console.error('Error:', error);
		process.exit(1);
	}

	for (const place of places) {
		const wikiTitle = placeWikiTitles[place.name];
		if (!wikiTitle) {
			console.log(`[${place.name}] No wiki title, skipping`);
			continue;
		}

		console.log(`[${place.name}] Fetching: "${wikiTitle}"`);
		const imgUrl = await getWikiImage(wikiTitle);
		
		if (imgUrl) {
			const { error: updateError } = await supabase
				.from('places')
				.update({ photo_url: imgUrl })
				.eq('id', place.id);

			if (updateError) {
				console.log(`  ✗ DB error: ${updateError.message}`);
			} else {
				console.log(`  ✓ ${imgUrl}`);
			}
		} else {
			console.log(`  ✗ No image found`);
		}

		await new Promise(r => setTimeout(r, 300));
	}

	console.log('\nDone!');
}

main();
