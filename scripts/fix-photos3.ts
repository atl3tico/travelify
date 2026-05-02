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

async function getProperImageUrl(wikiPage) {
	const langs = ['en', 'fr'];
	
	for (const lang of langs) {
		try {
			// Get page ID first
			const res = await fetch(
				`https://${lang}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(wikiPage)}&format=json`
			);
			const data = await res.json();
			const pages = data.query?.pages || {};
			const page = Object.values(pages)[0];
			
			if (!page?.pageid) continue;
			
			// Get page images
			const imgRes = await fetch(
				`https://${lang}.wikipedia.org/w/api.php?action=query&pageids=${page.pageid}&prop=images&format=json&imlimit=10`
			);
			const imgData = await imgRes.json();
			const imgPages = imgData.query?.pages || {};
			const imgPage = Object.values(imgPages)[0];
			
			if (imgPage?.images) {
				for (const img of imgPage.images) {
					// Skip logos, SVGs
					if (img.title.includes('Logo') || img.title.includes('logo') || img.title.endsWith('.svg')) continue;
					
					// Get image info with proper URL
					const infoRes = await fetch(
						`https://${lang}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(img.title)}&prop=imageinfo&iiprop=url&iiurlwidth=800&format=json`
					);
					const infoData = await infoRes.json();
					const infoPages = infoData.query?.pages || {};
					const infoPage = Object.values(infoPages)[0];
					
					if (infoPage?.imageinfo?.[0]?.thumburl) {
						return infoPage.imageinfo[0].thumburl;
					}
				}
			}
		} catch (e) {
			console.log(`    Error: ${e.message}`);
		}
	}
	return null;
}

async function testUrl(url) {
	try {
		const res = await fetch(url, { method: 'HEAD' });
		return res.status;
	} catch {
		return 0;
	}
}

async function main() {
	const places = ['Panteón', 'Museo del Louvre', 'Museo de Orsay', 'Centro Pompidou'];
	const wikiPages = {
		'Panteón': 'Panthéon (Paris)',
		'Museo del Louvre': 'Louvre',
		'Museo de Orsay': 'Musée d\'Orsay',
		'Centro Pompidou': 'Centre Pompidou',
	};

	for (const placeName of places) {
		console.log(`\n[${placeName}]`);
		const wikiPage = wikiPages[placeName];
		
		const imgUrl = await getProperImageUrl(wikiPage);
		
		if (imgUrl) {
			console.log(`  URL: ${imgUrl.substring(0, 120)}...`);
			const status = await testUrl(imgUrl);
			console.log(`  Status: ${status}`);
			
			if (status === 200) {
				const { error } = await supabase
					.from('places')
					.update({ photo_url: imgUrl })
					.eq('name', placeName);
				
				if (error) {
					console.log(`  ✗ DB error`);
				} else {
					console.log(`  ✓ Updated`);
				}
			}
		} else {
			console.log(`  ✗ No image found`);
		}

		await new Promise(r => setTimeout(r, 500));
	}

	console.log('\nDone!');
}

main();
