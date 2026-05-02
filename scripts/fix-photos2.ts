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
	'Panteón': ['Panthéon (Paris)', 'Panthéon'],
	'Museo del Louvre': ['Louvre', 'Musée du Louvre'],
	'Museo de Orsay': ['Musée d\'Orsay'],
	'Centro Pompidou': ['Centre Pompidou'],
};

async function getImageUrl(wikiPage) {
	const langs = ['en', 'fr'];
	
	for (const lang of langs) {
		try {
			const res = await fetch(
				`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiPage)}`
			);
			if (res.ok) {
				const data = await res.json();
				if (data.thumbnail?.source) {
					let url = data.thumbnail.source;
					// Skip SVGs and logos
					if (url.includes('.svg') || url.includes('logo') || url.includes('Logo')) continue;
					// Change to 800px
					url = url.replace(/\/\d+px-/, '/800px-');
					return url;
				}
			}
		} catch {}
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
	for (const [placeName, wikiPages] of Object.entries(placeWikiPages)) {
		console.log(`\n[${placeName}]`);
		
		for (const wikiPage of wikiPages) {
			console.log(`  Trying: "${wikiPage}"`);
			const imgUrl = await getImageUrl(wikiPage);
			
			if (!imgUrl) continue;
			
			console.log(`  URL: ${imgUrl.substring(0, 100)}...`);
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
				break;
			}
		}

		await new Promise(r => setTimeout(r, 300));
	}

	console.log('\nDone!');
}

main();
