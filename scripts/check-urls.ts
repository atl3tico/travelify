const urls = [
	'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Pantheon_of_Paris_007.JPG/800px-Pantheon_of_Paris_007.JPG',
	'https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Louvre_Museum_Wikimedia_Commons.jpg/800px-Louvre_Museum_Wikimedia_Commons.jpg',
	'https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Mus%C3%A9e_d%27Orsay%2C_Paris_7e_2.jpg/800px-Mus%C3%A9e_d%27Orsay%2C_Paris_7e_2.jpg',
	'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/0_Centre_Georges-Pompidou_-_1986_Paris.JPG/960px-0_Centre_Georges-Pompidou_-_1986_Paris.JPG',
];

async function checkUrl(url) {
	try {
		const res = await fetch(url, { method: 'HEAD' });
		console.log(`[${res.status}] ${url.substring(0, 80)}...`);
	} catch (e) {
		console.log(`[ERROR] ${url.substring(0, 80)}... - ${e.message}`);
	}
}

async function main() {
	for (const url of urls) {
		await checkUrl(url);
	}
}

main();
