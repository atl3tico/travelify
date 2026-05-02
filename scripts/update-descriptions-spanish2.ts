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

const fallbackTitles = {
	'Bastilla': ['Bastilla (París)', 'Prisión de la Bastilla'],
	'Ponte Neuf': ['Pont Neuf'],
	'Torre Montparnasse': ['Torre Montparnasse'],
	'Sainte-Chapelle': ['Sainte-Chapelle'],
	'Canal Saint-Martin': ['Canal Saint-Martin'],
	'Champs-Élysées': ['Campos Elíseos'],
	'Centro Pompidou': ['Centro Georges Pompidou'],
	'Galerías Lafayette': ['Galeries Lafayette'],
	'Jardín de Luxemburgo': ['Jardines de Luxemburgo'],
	'Ópera Garnier': ['Palacio Garnier'],
	'Museo del Louvre': ['Museo del Louvre'],
	'Museo de Orsay': ['Museo de Orsay'],
	'Notre-Dame': ['Notre Dame de París'],
};

const manualFallback = {
	'Bastilla': 'La Plaza de la Bastilla es una plaza parisina donde se alzaba la famosa prisión de la Bastilla, tomada el 14 de julio de 1789, evento que marcó el inicio de la Revolución Francesa. Hoy destaca la Columna de Julio de 52 metros y la moderna Ópera Bastille.',
	'Ponte Neuf': 'El Pont Neuf es, pese a su nombre, el puente más antiguo de París sobre el río Sena. Construido entre 1578 y 1607 por Enrique IV, fue el primer puente parisino sin casas y con aceras para peatones.',
	'Torre Montparnasse': 'La Torre Montparnasse es un rascacielos de oficinas de 210 metros situado en el distrito XV de París. Inaugurado en 1973, es el edificio más alto de la ciudad y su terraza panorámica ofrece vistas de 360°.',
	'Sainte-Chapelle': 'La Sainte-Chapelle es una capilla palatina de estilo gótico situada en la Île de la Cité de París. Construida en el siglo XIII por orden de Luis IX para albergar reliquias de la Pasión de Cristo, es famosa por sus impresionantes vitrales de 15 metros.',
	'Canal Saint-Martin': 'El Canal Saint-Martin es un canal de 4,5 km de longitud en París, que conecta el barrio de La Villette con el río Sena. Inaugurado en 1825 por Napoleón, es un lugar popular para pasear junto a sus esclusas y puentes peatonales.',
	'Champs-Élysées': 'La Avenida de los Campos Elíseos es una de las avenidas más famosas del mundo, con 1,9 km de longitud entre la Place de la Concorde y el Arco de Triunfo. Conocida por sus teatros, cafés, tiendas de lujo y el desfile militar del 14 de julio.',
	'Centro Pompidou': 'El Centro Nacional de Arte y Cultura Georges Pompidou es un complejo cultural inaugurado en 1977 en el barrio de Beaubourg. Su arquitectura revolucionaria con tuberías y estructuras exteriores de colores lo convierte en un ícono del diseño moderno. Alberga el Museo Nacional de Arte Moderno.',
	'Galerías Lafayette': 'Las Galeries Lafayette Haussmann son unos grandes almacenes icónicos en el Boulevard Haussmann de París, inaugurados en 1912. Famosos por su impresionante cúpula de vidrio art nouveau de 43 metros y su terraza panorámica gratuita con vistas de la ciudad.',
	'Jardín de Luxemburgo': 'El Jardín de Luxemburgo es un jardín de 23 hectáreas creado en 1612 por María de Médicis. Rodea el Palacio de Luxemburgo, sede del Senado francés, y cuenta con fuentes, estatuas, un huerto de manzanos, colmenas y el famoso estanque con barcas de vela.',
	'Ópera Garnier': 'El Palacio Garnier es un teatro de ópera de 1.979 localidades inaugurado en 1875 en el IX distrito de París. Famoso por su escalera monumental de mármol, el foyer dorado y por inspirar la novela El Fantasma de la Ópera de Gaston Leroux.',
	'Museo del Louvre': 'El Museo del Louvre es el museo de arte más grande del mundo, con más de 380.000 obras expuestas. Antigua residencia real, alberga la Mona Lisa, la Venus de Milo y la Victoria de Samotracia. Su pirámide de cristal de 1989 es un ícono arquitectónico.',
	'Museo de Orsay': 'El Museo de Orsay es una pinacoteca ubicada en una antigua estación de tren de 1900, dedicada al arte occidental de 1848 a 1914. Alberga la mayor colección de impresionismo del mundo con obras de Monet, Renoir, Van Gogh y Degas.',
	'Notre-Dame': 'La Catedral de Notre Dame de París es una obra maestra del gótico francés iniciada en 1163. Famosa por sus vitrales, arbotantes y torres gemelas de 69 metros. Inmortalizada por Victor Hugo, fue devastada por un incendio en 2019 y se encuentra en restauración.',
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

async function main() {
	for (const [placeName, titles] of Object.entries(fallbackTitles)) {
		console.log(`\n[${placeName}]`);
		
		for (const title of titles) {
			console.log(`  Trying: "${title}"`);
			const desc = await getSpanishDescription(title);
			if (desc) {
				const { data: places } = await supabase
					.from('places')
					.select('id')
					.eq('name', placeName);
				
				if (places && places.length > 0) {
					const { error } = await supabase
						.from('places')
						.update({ description: desc })
						.eq('id', places[0].id);
					console.log(`  ${error ? '✗' : '✓'} ${desc.substring(0, 80)}...`);
				}
				break;
			}
		}

		// If still no description, use manual
		const { data: places } = await supabase
			.from('places')
			.select('id, description')
			.eq('name', placeName)
			.single();

		if (places && (!places.description || places.description.length < 50)) {
			const manual = manualFallback[placeName];
			if (manual) {
				const { error } = await supabase
					.from('places')
					.update({ description: manual })
					.eq('id', places.id);
				console.log(`  Manual: ${error ? '✗' : '✓'}`);
			}
		}

		await new Promise(r => setTimeout(r, 300));
	}

	console.log('\nDone!');
}

main();
