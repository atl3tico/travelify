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

const placeWikiPages = {
	'Panteón': 'Panthéon (Paris)',
	'Museo del Louvre': 'Louvre',
	'Museo de Orsay': 'Musée d\'Orsay',
	'Centro Pompidou': 'Centre Pompidou',
};

async function getCorrectImageUrl(wikiPage) {
	const langs = ['en', 'fr'];
	
	for (const lang of langs) {
		try {
			// Get page images
			const res = await fetch(
				`https://${lang}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(wikiPage)}&prop=images&format=json&imlimit=5`
			);
			const data = await res.json();
			const pages = data.query?.pages || {};
			const page = Object.values(pages)[0];
			
			if (page?.images) {
				for (const img of page.images) {
					const imgTitle = img.title;
					// Skip logos, flags, etc.
					if (imgTitle.includes('Logo') || imgTitle.includes('logo') || 
					    imgTitle.includes('Flag') || imgTitle.includes('Coat of arms')) continue;
					
					// Get thumbnail URL
					const thumbRes = await fetch(
						`https://${lang}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(imgTitle)}&prop=imageinfo&iiprop=url&iiurlwidth=800&format=json`
					);
					const thumbData = await thumbRes.json();
					const imgPages = thumbData.query?.pages || {};
					const imgPage = Object.values(imgPages)[0];
					
					if (imgPage?.imageinfo?.[0]?.thumburl) {
						return imgPage.imageinfo[0].thumburl;
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
	for (const [placeName, wikiPage] of Object.entries(placeWikiPages)) {
		console.log(`\n[${placeName}] Getting image from: "${wikiPage}"`);
		const imgUrl = await getCorrectImageUrl(wikiPage);
		
		if (imgUrl) {
			console.log(`  Found: ${imgUrl}`);
			
			// Test if URL works
			try {
				const testRes = await fetch(imgUrl, { method: 'HEAD' });
				console.log(`  Test: [${testRes.status}]`);
				
				if (testRes.status === 200) {
					// Update in DB
					const { data, error } = await supabase
						.from('places')
						.update({ photo_url: imgUrl })
						.eq('name', placeName)
						.select('id');
					
					if (error) {
						console.log(`  ✗ DB error: ${error.message}`);
					} else {
						console.log(`  ✓ Updated`);
					}
				}
			} catch (e) {
				console.log(`  Test error: ${e.message}`);
			}
		} else {
			console.log(`  ✗ No image found`);
		}

		await new Promise(r => setTimeout(r, 500));
	}

	console.log('\nDone!');
}

main();
