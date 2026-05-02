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

const allDescriptions = {
	'Arco del Triunfo': 'Monumento icónico en la Place Charles de Gaulle, encargado por Napoleón en 1806 para conmemorar las victorias del ejército francés. Alberga la Tumba del Soldado Desconocido con su llama eterna y ofrece vistas panorámicas de París desde su terraza.',
	'Bastilla': 'La Place de la Bastille ocupa el lugar donde se alzaba la prisión tomada el 14 de julio de 1789, símbolo de la Revolución Francesa. Hoy destaca la Columna de Julio de 52 metros y la moderna Ópera Bastille.',
	'Canal Saint-Martin': 'Canal histórico de 4,5 km inaugurado en 1825 por Napoleón. Conecta el barrio de La Villette con el río Sena y es un lugar popular para pasear junto a sus esclusas, puentes peatonales y árboles.',
	'Centro Pompidou': 'Museo de arte moderno y contemporáneo inaugurado en 1977. Su arquitectura revolucionaria con tuberías y estructuras exteriores de colores lo convierte en un ícono del diseño del siglo XX. Alberga obras de Picasso, Warhol y Kandinsky.',
	'Champs-Élysées': 'La avenida más famosa de París, de 1,9 km entre la Place de la Concorde y el Arco del Triunfo. Conocida por sus teatros, cafés, tiendas de lujo y el desfile militar del 14 de julio.',
	'CREPERIE Chez Suzette': 'Crêperie tradicional en el corazón de París, especializada en crepes dulces y galettes saladas bretonas elaboradas con ingredientes frescos y recetas auténticas.',
	'Disneyland Paris': 'El parque temático más visitado de Europa, inaugurado en 1992. Cuenta con atracciones icónicas como Space Mountain, Pirates of the Caribbean, It\'s a Small World y el Castillo de la Bella Durmiente.',
	'Galerías Lafayette': 'Icónicos grandes almacenes en el Boulevard Haussmann, inaugurados en 1912. Famosos por su impresionante cúpula de vidrio art nouveau de 43 metros y su terraza panorámica gratuita con vistas de París.',
	'Jardín de las Tullerías': 'Jardín de 25 hectáreas creado en 1564 por Catalina de Médicis. Situado entre el Louvre y la Place de la Concorde, cuenta con fuentes, esculturas de Rodin y Maillol, y un estanque central con barcas.',
	'Jardín de Luxemburgo': 'Jardín de 23 hectáreas creado en 1612 por María de Médicis. Rodea el Palacio de Luxemburgo y cuenta con fuentes, estatuas, un huerto de manzanos, colmenas y el famoso estanque con barcas de vela.',
	'Le Marais': 'Barrio histórico en los distritos 3 y 4, conocido por sus mansiones medievales como la Place des Vosges, galerías de arte, tiendas de moda, museos como el Picasso y su vibrante vida cultural y gastronómica.',
	'Mercado de Aligre': 'Mercado tradicional en el distrito 12 que combina un mercado al aire libre con el cubierto Marché Beauvau. Ofrece productos frescos, flores, especias y antigüedades desde el siglo XVIII.',
	'Montmartre': 'Histórico barrio de París situado en una colina del distrito 18. Famoso por la Basílica del Sacré-Cœur, sus calles empedradas, viñedos y su legado artístico como hogar de Picasso, Dalí y Toulouse-Lautrec.',
	'Moulin Rouge': 'Cabaré icónico fundado en 1889 en el barrio de Pigalle, cuna del can-can. Su molino rojo es un símbolo de París. Ofrece espectáculos de revista con plumas, lentejuelas y música en vivo.',
	'Museo de Orsay': 'Museo de arte en una antigua estación de tren de 1900, dedicado al arte occidental de 1848 a 1914. Alberga la mayor colección de impresionismo del mundo con obras de Monet, Renoir, Van Gogh y Degas.',
	'Museo del Louvre': 'El museo de arte más grande del mundo con más de 380.000 obras. Antigua residencia real, alberga la Mona Lisa, la Venus de Milo y la Gioconda. Su pirámide de cristal de 1989 es un ícono arquitectónico.',
	'Notre-Dame': 'Catedral gótica maestra iniciada en 1163, famosa por sus vitrales, arbotantes y torres gemelas de 69 metros. Inmortalizada por Victor Hugo. Devastada por un incendio en 2019, su restauración avanza para reapertura.',
	'Ópera Garnier': 'El Palacio Garnier es un teatro de ópera de estilo napoleónico inaugurado en 1875. Famoso por su escalera monumental de mármol, el foyer dorado y por inspirar El Fantasma de la Ópera de Gaston Leroux.',
	'Panteón': 'Monumento neoclásico en el Barrio Latino, originalmente iglesia dedicada a Santa Genoveva. Hoy alberga los restos de figuras ilustres como Voltaire, Rousseau, Victor Hugo, Émile Zola y Marie Curie.',
	'Peter Pan\'s Flight': 'Clásica atracción de Disneyland Paris que recrea el vuelo sobre Londres y Nunca Jamás con Peter Pan, Wendy y Campanilla en góndolas suspendidas. Una de las atracciones favoritas desde 1955.',
	'Plaza de la República': 'Importante plaza parisina en la intersección de los distritos 3, 10 y 11. En su centro se erige el Monument à la République con una estatua de Marianne de 9 metros de altura.',
	'Ponte Neuf': 'El Pont Neuf es, pese a su nombre, el puente más antiguo de París sobre el Sena, construido entre 1578 y 1607 por Enrique IV. Fue el primer puente sin casas y con aceras para peatones.',
	'Ratatouille : L\'Aventure Totalement Toquée de Rémy': 'Atracción inmersiva en Walt Disney Studios Park que sumerge a los visitantes en el mundo de la película Ratatouille de Pixar, con vehículos con forma de ratón y efectos 3D a escala reducida.',
	'Sagrado Corazón': 'La Basílica del Sacré-Cœur es una iglesia católica de estilo románico-bizantino en la cima de Montmartre. Construida entre 1875 y 1914, ofrece vistas panorámicas de 360° de París.',
	'Sainte-Chapelle': 'Capilla gótica del siglo XIII en la Île de la Cité, construida por Luis IX para albergar reliquias de la Pasión. Famosa por sus 15 vitrales de 15 metros con escenas bíblicas en colores vibrantes.',
	'Torre Eiffel': 'Torre de hierro forjado de 330 metros construida por Gustave Eiffel para la Exposición Universal de 1889. Símbolo de París y Francia, recibe 7 millones de visitantes al año con tres niveles accesibles.',
	'Torre Montparnasse': 'Rascacielos de oficinas de 210 metros, el más alto de París. Inaugurado en 1973, su terraza panorámica en la planta 56 ofrece vistas espectaculares de 360° de la ciudad, incluida la Torre Eiffel.',
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
		const desc = allDescriptions[place.name];
		if (!desc) {
			console.log(`Skipping "${place.name}" - no description defined`);
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
