const cityImages: Record<string, string> = {
	paris: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&h=400&fit=crop',
	madrid: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800&h=400&fit=crop',
	barcelona: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&h=400&fit=crop',
	london: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&h=400&fit=crop',
	roma: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&h=400&fit=crop',
	rome: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&h=400&fit=crop',
	'new york': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&h=400&fit=crop',
	tokyo: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&h=400&fit=crop',
	berlin: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=800&h=400&fit=crop',
	amsterdam: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800&h=400&fit=crop',
	lisbon: 'https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=800&h=400&fit=crop',
	lisboa: 'https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=800&h=400&fit=crop',
	prague: 'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=800&h=400&fit=crop',
	vienna: 'https://images.unsplash.com/photo-1516550893923-42d28e5677ff?w=800&h=400&fit=crop',
	dublin: 'https://images.unsplash.com/photo-1505020660658-0a868a06b6ca?w=800&h=400&fit=crop',
	'san francisco': 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&h=400&fit=crop',
	'los angeles': 'https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?w=800&h=400&fit=crop',
	miami: 'https://images.unsplash.com/photo-1514214246283-d427a95c5d2f?w=800&h=400&fit=crop',
	sydney: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&h=400&fit=crop',
	dubai: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&h=400&fit=crop',
	istanbul: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&h=400&fit=crop',
	singapore: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&h=400&fit=crop',
	'hong kong': 'https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=800&h=400&fit=crop',
	bangkok: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800&h=400&fit=crop',
	cancun: 'https://images.unsplash.com/photo-1510022170-t368ud788a46?w=800&h=400&fit=crop',
	mexico: 'https://images.unsplash.com/photo-1510022170-t368ud788a46?w=800&h=400&fit=crop',
	seville: 'https://images.unsplash.com/photo-1515443961218-a51367888e4b?w=800&h=400&fit=crop',
	sevilla: 'https://images.unsplash.com/photo-1515443961218-a51367888e4b?w=800&h=400&fit=crop',
	valencia: 'https://images.unsplash.com/photo-1599832303498-0afbf6d5b5a1?w=800&h=400&fit=crop',
	mallorca: 'https://images.unsplash.com/photo-1507272931001-fc06c17e4f43?w=800&h=400&fit=crop',
	ibiza: 'https://images.unsplash.com/photo-1507272931001-fc06c17e4f43?w=800&h=400&fit=crop',
	tenerife: 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=800&h=400&fit=crop',
	disneyland: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=800&h=400&fit=crop',
	venice: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=800&h=400&fit=crop',
	venecia: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=800&h=400&fit=crop',
	florence: 'https://images.unsplash.com/photo-1514890547357-a9ee288728e0?w=800&h=400&fit=crop',
	florencia: 'https://images.unsplash.com/photo-1514890547357-a9ee288728e0?w=800&h=400&fit=crop',
	milan: 'https://images.unsplash.com/photo-1513593771513-7b58b6c4af38?w=800&h=400&fit=crop',
	múnich: 'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=800&h=400&fit=crop',
	munich: 'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=800&h=400&fit=crop',
	copenhague: 'https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?w=800&h=400&fit=crop',
	copenhagen: 'https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?w=800&h=400&fit=crop',
	stockholm: 'https://images.unsplash.com/photo-1509027042765-878247b52517?w=800&h=400&fit=crop',
	oslo: 'https://images.unsplash.com/photo-1513593771513-7b58b6c4af38?w=800&h=400&fit=crop',
	helsinki: 'https://images.unsplash.com/photo-1532630571098-79a3d44b0c01?w=800&h=400&fit=crop',
	budapest: 'https://images.unsplash.com/photo-1551867633-194f125bddfa?w=800&h=400&fit=crop',
	cracovia: 'https://images.unsplash.com/photo-1568454536839-2535276ce4fc?w=800&h=400&fit=crop',
	krakow: 'https://images.unsplash.com/photo-1568454536839-2535276ce4fc?w=800&h=400&fit=crop',
	edinburgh: 'https://images.unsplash.com/photo-1506377585622-bedcbb9c1e6e?w=800&h=400&fit=crop',
};

const fallbacks = [
	'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&h=400&fit=crop',
	'https://images.unsplash.com/photo-1503220317375-aaad61436b1b?w=800&h=400&fit=crop',
	'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&h=400&fit=crop',
	'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&h=400&fit=crop',
	'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=400&fit=crop',
	'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=800&h=400&fit=crop',
];

function hashString(str: string): number {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash = (hash * 31 + str.charCodeAt(i)) | 0;
	}
	return Math.abs(hash);
}

export function getCityImage(destination: string): string {
	const key = destination.toLowerCase().trim();

	for (const [city, url] of Object.entries(cityImages)) {
		if (key.includes(city) || city.includes(key)) {
			return url;
		}
	}

	return fallbacks[hashString(key) % fallbacks.length];
}
