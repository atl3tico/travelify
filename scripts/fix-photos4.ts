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

// Direct file titles on Wikimedia Commons
const fileTitles = {
	'Panteón': 'File:Pantheon of Paris 007.JPG',
	'Museo del Louvre': 'File:Louvre Museum Wikimedia Commons.jpg',
	'Museo de Orsay': 'File:Musée d\'Orsay, Paris 7e 2.jpg',
	'Centro Pompidou': 'File:0 Centre Georges-Pompidou - 1986 Paris.JPG',
};

async function getFileUrl(fileTitle) {
	const res = await fetch(
		`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(fileTitle)}&prop=imageinfo&iiprop=url&iiurlwidth=800&format=json`
	);
	const data = await res.json();
	const pages = data.query?.pages || {};
	const page = Object.values(pages)[0];
	return page?.imageinfo?.[0]?.thumburl || null;
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
	for (const [placeName, fileTitle] of Object.entries(fileTitles)) {
		console.log(`\n[${placeName}]`);
		console.log(`  File: ${fileTitle}`);
		
		const imgUrl = await getFileUrl(fileTitle);
		
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
			console.log(`  ✗ No URL`);
		}

		await new Promise(r => setTimeout(r, 500));
	}

	console.log('\nDone!');
}

main();
