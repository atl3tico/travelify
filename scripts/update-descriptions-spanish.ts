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

const placeWikiES = {
	'Arco del Triunfo': 'Arco de Triunfo de París',
	'Barrio Latino': 'Barrio Latino',
	'Bastilla': 'Plaza de la Bastilla',
	'Canal Saint-Martin': 'Canal Saint-Martin',
	'Centro Pompidou': 'Centro Pompidou',
	'Champs-Élysées': 'Avenida de los Campos Elíseos',
	'CREPERIE Chez Suzette': null,
	'Disneyland Paris': 'Disneyland Park (París)',
	'Galerías Lafayette': 'Galeries Lafayette',
	'Jardín de las Tullerías': 'Jardín de las Tullerías',
	'Jardín de Luxemburgo': 'Jardín de Luxemburgo',
	'Le Marais': 'Le Marais',
	'Mercado de Aligre': null,
	'Montmartre': 'Montmartre',
	'Moulin Rouge': 'Moulin Rouge',
	'Museo de Orsay': 'Museo de Orsay',
	'Museo del Louvre': 'Museo del Louvre',
	'Notre-Dame': 'Catedral de Notre Dame',
	'Ópera Garnier': 'Palacio Garnier',
	'Panteón': 'Panteón de París',
	'Peter Pan\'s Flight': null,
	'Plaza de la República': 'Place de la République',
	'Ponte Neuf': 'Pont Neuf',
	'Ratatouille : L\'Aventure Totalement Toquée de Rémy': null,
	'Sagrado Corazón': 'Basílica del Sagrado Corazón de Montmartre',
	'Sainte-Chapelle': 'Sainte-Chapelle',
	'Torre Eiffel': 'Torre Eiffel',
	'Torre Montparnasse': 'Torre Montparnasse',
};

async function getSpanishDescription(wikiTitle) {
	try {
		const res = await fetch(
			`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitle)}`
		);
		if (res.ok) {
			const data = await res.json();
			if (data.extract) return data.extract;
		}
	} catch {}
	return null;
}

const manualDescriptions = {
	'CREPERIE Chez Suzette': 'Crêperie tradicional en el corazón de París, especializada en crepes dulces y galettes saladas bretonas elaboradas con ingredientes frescos y recetas auténticas.',
	'Mercado de Aligre': 'Mercado tradicional en el distrito 12 de París que combina un mercado al aire libre con el cubierto Marché Beauvau. Ofrece productos frescos, flores, especias y antigüedades desde el siglo XVIII.',
	'Peter Pan\'s Flight': 'Clásica atracción de Disneyland Paris que recrea el vuelo sobre Londres y Nunca Jamás con Peter Pan, Wendy y Campanilla en góndolas suspendidas. Una de las atracciones favoritas desde 1955.',
	'Ratatouille : L\'Aventure Totalement Toquée de Rémy': 'Atracción inmersiva en Walt Disney Studios Park que sumerge a los visitantes en el mundo de la película Ratatouille de Pixar, con vehículos con forma de ratón y efectos 3D a escala reducida.',
};

async function main() {
	const { data: places } = await supabase
		.from('places')
		.select('id, name, description');

	for (const place of places) {
		console.log(`\n[${place.name}]`);

		// Check manual first
		const manual = manualDescriptions[place.name];
		if (manual) {
			const { error } = await supabase
				.from('places')
				.update({ description: manual })
				.eq('id', place.id);
			console.log(`  Manual: ${error ? '✗' : '✓'} ${manual.substring(0, 60)}...`);
			continue;
		}

		const wikiTitle = placeWikiES[place.name];
		if (!wikiTitle) {
			console.log(`  No wiki title`);
			continue;
		}

		const desc = await getSpanishDescription(wikiTitle);
		if (desc) {
			const { error } = await supabase
				.from('places')
				.update({ description: desc })
				.eq('id', place.id);
			console.log(`  ${error ? '✗' : '✓'} ${desc.substring(0, 80)}...`);
		} else {
			console.log(`  ✗ No Spanish description found`);
		}

		await new Promise(r => setTimeout(r, 300));
	}

	console.log('\nDone!');
}

main();
