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

// Verified Wikipedia image URLs for each place
const verifiedPhotos = {
	'Arco del Triunfo': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Arc_de_Triomphe%2C_Paris_21_October_2010.jpg/800px-Arc_de_Triomphe%2C_Paris_21_October_2010.jpg',
	'Barrio Latino': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/QuartierLatin_Paris.jpg/800px-QuartierLatin_Paris.jpg',
	'Bastilla': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Place_de_la_Bastille%2C_Paris_July_2013.jpg/800px-Place_de_la_Bastille%2C_Paris_July_2013.jpg',
	'Canal Saint-Martin': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Canal_Saint-Martin%2C_Paris_10th_arrondissement_2.jpg/800px-Canal_Saint-Martin%2C_Paris_10th_arrondissement_2.jpg',
	'Centro Pompidou': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Beaubourg_-_Centre_Pompidou.jpg/800px-Beaubourg_-_Centre_Pompidou.jpg',
	'Champs-Élysées': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Avenue_des_Champs-%C3%89lys%C3%A9es%2C_Paris_8e_2.jpg/800px-Avenue_des_Champs-%C3%89lys%C3%A9es%2C_Paris_8e_2.jpg',
	'CREPERIE Chez Suzette': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Cr%C3%AApe_and_cider.jpg/800px-Cr%C3%AApe_and_cider.jpg',
	'Disneyland Paris': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Disneyland_Paris_-_Le_Ch%C3%A2teau_de_la_Belle_au_Bois_Dormant.jpg/800px-Disneyland_Paris_-_Le_Ch%C3%A2teau_de_la_Belle_au_Bois_Dormant.jpg',
	'Galerías Lafayette': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Galeries_Lafayette_Haussmann.jpg/800px-Galeries_Lafayette_Haussmann.jpg',
	'Jardín de las Tullerías': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Jardin_des_Tuileries%2C_Paris_2014.jpg/800px-Jardin_des_Tuileries%2C_Paris_2014.jpg',
	'Jardín de Luxemburgo': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Jardin_du_Luxembourg%2C_Paris_6e_1.jpg/800px-Jardin_du_Luxembourg%2C_Paris_6e_1.jpg',
	'Le Marais': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Place_des_Vosges%2C_Paris_4e_1.jpg/800px-Place_des_Vosges%2C_Paris_4e_1.jpg',
	'Mercado de Aligre': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Place_d%27Aligre_-_March%C3%A9_Beauvau_-_P1040487.jpg/800px-Place_d%27Aligre_-_March%C3%A9_Beauvau_-_P1040487.jpg',
	'Montmartre': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/View_from_Notre-Dame_de_Paris%2C_24_June_2014_004.jpg/800px-View_from_Notre-Dame_de_Paris%2C_24_June_2014_004.jpg',
	'Moulin Rouge': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Moulin_Rouge%2C_Paris_12_April_2019.jpg/800px-Moulin_Rouge%2C_Paris_12_April_2019.jpg',
	'Museo de Orsay': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Mus%C3%A9e_d%27Orsay%2C_Paris_7e_1.jpg/800px-Mus%C3%A9e_d%27Orsay%2C_Paris_7e_1.jpg',
	'Museo del Louvre': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Louvre_Museum_Wikimedia_Commons.jpg/800px-Louvre_Museum_Wikimedia_Commons.jpg',
	'Notre-Dame': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Notre-Dame_de_Paris_2013-07-24.jpg/800px-Notre-Dame_de_Paris_2013-07-24.jpg',
	'Ópera Garnier': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Palais_Garnier%2C_Paris_9e_1.jpg/800px-Palais_Garnier%2C_Paris_9e_1.jpg',
	'Panteón': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Panth%C3%A9on%2C_Paris_5e_1.jpg/800px-Panth%C3%A9on%2C_Paris_5e_1.jpg',
	'Peter Pan\'s Flight': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Peter_Pan%27s_Flight_%28Disneyland_Paris%29.jpg/800px-Peter_Pan%27s_Flight_%28Disneyland_Paris%29.jpg',
	'Plaza de la República': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Place_de_la_R%C3%A9publique%2C_Paris_2014.jpg/800px-Place_de_la_R%C3%A9publique%2C_Paris_2014.jpg',
	'Ponte Neuf': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Pont_Neuf%2C_Paris_6e_1.jpg/800px-Pont_Neuf%2C_Paris_6e_1.jpg',
	'Ratatouille : L\'Aventure Totalement Toquée de Rémy': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Ratatouille_The_Adventure_%28Walt_Disney_Studios_Park%29.jpg/800px-Ratatouille_The_Adventure_%28Walt_Disney_Studios_Park%29.jpg',
	'Sagrado Corazón': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Basilique_du_Sacr%C3%A9-C%C5%93ur_de_Montmartre%2C_Paris_18e_1.jpg/800px-Basilique_du_Sacr%C3%A9-C%C5%93ur_de_Montmartre%2C_Paris_18e_1.jpg',
	'Sainte-Chapelle': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Sainte-Chapelle_-_Upper_level.jpg/800px-Sainte-Chapelle_-_Upper_level.jpg',
	'Torre Eiffel': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Tour_Eiffel_Wikimedia_Commons_%28cropped%29.jpg/800px-Tour_Eiffel_Wikimedia_Commons_%28cropped%29.jpg',
	'Torre Montparnasse': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Tour_Montparnasse_%282019%29.jpg/800px-Tour_Montparnasse_%282019%29.jpg',
};

async function main() {
	const { data: places, error } = await supabase
		.from('places')
		.select('id, name');

	if (error) {
		console.error('Error fetching places:', error);
		process.exit(1);
	}

	console.log(`Found ${places.length} places to update`);

	for (const place of places) {
		const photoUrl = verifiedPhotos[place.name];
		if (!photoUrl) {
			console.log(`Skipping "${place.name}" - no verified photo`);
			continue;
		}

		console.log(`Updating "${place.name}"...`);

		const { error: updateError } = await supabase
			.from('places')
			.update({ photo_url: photoUrl })
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
