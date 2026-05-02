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

const manualDescriptions = {
	'CREPERIE Chez Suzette': 'Crêperie tradicional en el corazón de París, especializada en crepes y galettes bretonas elaboradas con ingredientes frescos y recetas auténticas.',
	'Ratatouille : L\'Aventure Totalement Toquée de Rémy': 'Atracción inmersiva en Walt Disney Studios Park que sumerge a los visitantes en el mundo de la película Ratatouille de Pixar, con vehículos con forma de ratón y efectos 3D.',
	'Peter Pan\'s Flight': 'Clásica atracción de Disneyland Paris que recrea el vuelo sobre Londres y Nunca Jamás con Peter Pan, Wendy y Campanilla en góndolas suspendidas.',
	'Disneyland Paris': 'El parque temático más visitado de Europa, inaugurado en 1992. Cuenta con atracciones icónicas como Space Mountain, Pirates of the Caribbean y el Castillo de la Bella Durmiente.',
	'Montmartre': 'Histórico barrio de París situado en una colina del distrito 18. Famoso por la Basílica del Sacré-Cœur, sus calles empedradas y su legado artístico como hogar de Picasso y Dalí.',
	'Sagrado Corazón': 'La Basílica del Sacré-Cœur es una iglesia católica de estilo románico-bizantino en la cima de Montmartre. Construida entre 1875 y 1914, ofrece vistas panorámicas de París.',
	'Arco del Triunfo': 'Monumento icónico en la Place Charles de Gaulle, encargado por Napoleón en 1806. Conmemora a los soldados franceses y alberga la Tumba del Soldado Desconocido con su llama eterna.',
	'Plaza de la República': 'Importante plaza parisina en la intersección de los distritos 3, 10 y 11. En su centro se erige el Monument à la République con una estatua de Marianne de 9 metros de altura.',
	'Panteón': 'Monumento neoclásico en el Barrio Latino, originalmente iglesia dedicada a Santa Genoveva. Hoy alberga los restos de figuras ilustres como Voltaire, Rousseau, Victor Hugo y Marie Curie.',
	'Le Marais': 'Barrio histórico en el distrito 4, conocido por sus mansiones medievales, la Place des Vosges, galerías de arte, tiendas de moda y su vibrante vida cultural y gastronómica.',
	'Bastilla': 'La Place de la Bastille ocupa el lugar donde se alzaba la famosa prisión tomada en 1789. Hoy es un símbolo de la Revolución Francesa con su columna de Julio y la Ópera Bastille.',
	'Torre Montparnasse': 'Rascacielos de oficinas de 210 metros, el más alto de París. Inaugurado en 1973, su terraza panorámica en la planta 56 ofrece vistas espectaculares de 360° de la ciudad.',
	'Canal Saint-Martin': 'Canal histórico de 4,5 km inaugurado en 1825 por Napoleón. Conecta el barrio de La Villette con el río Sena y es un lugar popular para pasear junto a sus esclusas y puentes peatonales.',
	'Mercado de Aligre': 'Mercado tradicional en el distrito 12 que combina un mercado al aire libre con el cubierto Marché Beauvau. Ofrece productos frescos, flores, especias y antigüedades desde el siglo XVIII.',
	'Champs-Élysées': 'La avenida más famosa de París, de 1,9 km entre la Place de la Concorde y el Arco del Triunfo. Conocida por sus teatros, cafés, tiendas de lujo y el desfile militar del 14 de julio.',
	'Jardín de Luxemburgo': 'Jardín de 23 hectáreas creado en 1612 por María de Médicis. Rodea el Palacio de Luxemburgo y cuenta con fuentes, estatuas, un huerto de manzanos y el famoso estanque con barcas.',
	'Centro Pompidou': 'Museo de arte moderno y contemporáneo inaugurado en 1977. Su arquitectura revolucionaria con tuberías y estructuras exteriores lo convierte en un ícono del diseño del siglo XX.',
	'Ópera Garnier': 'El Palacio Garnier es un teatro de ópera de estilo napoleónico inaugurado en 1875. Famoso por su escalera monumental, el foyer dorado y la inspiración para El Fantasma de la Ópera.',
	'Galerías Lafayette': 'Icónicos grandes almacenes en el Boulevard Haussmann, inaugurados en 1912. Famosos por su impresionante cúpula de vidrio art nouveau y su terraza panorámica gratuita.',
	'Notre-Dame': 'La Catedral de Notre-Dame de París es una obra maestra del gótico francés iniciada en 1163. Famosa por sus vitrales, arbotantes y las torres gemelas de 69 metros. Devastada por un incendio en 2019, actualmente en restauración.',
	'Ponte Neuf': 'El Pont Neuf es el puente más antiguo de París sobre el Sena, construido entre 1578 y 1607. A pesar de su nombre (Puente Nuevo), es el puente que ha sobrevivido más tiempo en su forma original.',
	'Sainte-Chapelle': 'Capilla gótica del siglo XIII en la Île de la Cité, construida por Luis IX para albergar reliquias de la Pasión. Famosa por sus 15 vitrales de 15 metros con escenas bíblicas en colores vibrantes.',
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
		const desc = manualDescriptions[place.name];
		if (!desc) {
			console.log(`Skipping "${place.name}" - no manual description`);
			continue;
		}

		if (place.description && place.description.length > 50) {
			console.log(`Skipping "${place.name}" - already has description`);
			continue;
		}

		console.log(`Updating "${place.name}"...`);

		const { error: updateError } = await supabase
			.from('places')
			.update({ description: desc })
			.eq('id', place.id);

		if (updateError) {
			console.error(`  Error: ${updateError.message}`);
		} else {
			console.log(`  ✓ Updated`);
		}
	}

	console.log('\nDone!');
}

main();
