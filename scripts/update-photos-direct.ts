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

// Direct page image queries for places that failed or got logos
const directQueries = {
	'Museo de Orsay': 'Musée d\'Orsay building',
	'Centro Pompidou': 'Centre Pompidou building',
	'Galerías Lafayette': 'Galeries Lafayette Haussmann dome',
	'Ratatouille : L\'Aventure Totalement Toquée de Rémy': 'Ratatouille Disneyland attraction',
	'Ponte Neuf': 'Pont Neuf Paris',
	'Le Marais': 'Place des Vosges Paris',
	'Torre Montparnasse': 'Tour Montparnasse Paris',
	'Mercado de Aligre': 'Marché d\'Aligre Paris market',
	'CREPERIE Chez Suzette': 'Creperie Paris crepes',
};

async function searchWikiImage(query) {
	const langs = ['en', 'fr'];
	
	for (const lang of langs) {
		try {
			// Search for the page
			const searchRes = await fetch(
				`https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&srlimit=3`
			);
			const searchData = await searchRes.json();
			
			for (const result of (searchData.query?.search || [])) {
				// Skip if it's a list, disambiguation, etc.
				if (result.title.includes('List of') || result.title.includes('disambiguation')) continue;
				
				// Get page with images
				const pageRes = await fetch(
					`https://${lang}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(result.title)}&prop=images&format=json&imlimit=10`
				);
				const pageData = await pageRes.json();
				const pages = pageData.query?.pages || {};
				const page = Object.values(pages)[0];
				
				if (page?.images) {
					// Look for a good image (jpg/png, not logo/svg)
					for (const img of page.images) {
						const title = img.title;
						if (title.includes('Logo') || title.includes('logo') || title.endsWith('.svg')) continue;
						if (title.match(/\.(jpg|jpeg|png)$/i)) {
							// Get thumbnail URL
							const thumbRes = await fetch(
								`https://${lang}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url&iiurlwidth=800&format=json`
							);
							const thumbData = await thumbRes.json();
							const imgPages = thumbData.query?.pages || {};
							const imgPage = Object.values(imgPages)[0];
							
							if (imgPage?.imageinfo?.[0]?.thumburl) {
								return imgPage.imageinfo[0].thumburl;
							}
						}
					}
				}
			}
		} catch (e) {
			console.log(`    ${lang} error: ${e.message}`);
		}
	}
	return null;
}

async function main() {
	for (const [placeName, query] of Object.entries(directQueries)) {
		console.log(`\n[${placeName}] Searching: "${query}"`);
		const imgUrl = await searchWikiImage(query);
		
		if (imgUrl) {
			// Find the place in DB
			const { data: places } = await supabase
				.from('places')
				.select('id')
				.eq('name', placeName);
			
			if (places && places.length > 0) {
				const { error: updateError } = await supabase
					.from('places')
					.update({ photo_url: imgUrl })
					.eq('id', places[0].id);

				if (updateError) {
					console.log(`  ✗ DB error: ${updateError.message}`);
				} else {
					console.log(`  ✓ ${imgUrl}`);
				}
			} else {
				console.log(`  ✗ Place not found in DB`);
			}
		} else {
			console.log(`  ✗ No image found`);
		}

		await new Promise(r => setTimeout(r, 500));
	}

	console.log('\nDone!');
}

main();
