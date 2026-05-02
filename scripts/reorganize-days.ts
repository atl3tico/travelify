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

function haversine(lat1, lon1, lat2, lon2) {
	const R = 6371;
	const dLat = (lat2 - lat1) * Math.PI / 180;
	const dLon = (lon2 - lon1) * Math.PI / 180;
	const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
		Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
		Math.sin(dLon/2) * Math.sin(dLon/2);
	return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

async function main() {
	const dayIds = {
		4: 'a90326da-b1e1-4978-b688-a15118e65677',
		5: 'b24d7618-c058-4c77-82b4-9eb2b74bc930',
		6: 'fd47e3b2-cd35-4f37-97e1-ea474aca0844',
	};

	// Get all places
	const { data: places } = await supabase
		.from('places')
		.select('id, name, lat, lng, day_id, order_index')
		.in('day_id', Object.values(dayIds));

	console.log(`Total places: ${places.length}`);

	// K-means clustering with k=3
	// Initial centroids: pick 3 random places
	let centroids = [
		{ lat: 48.8868, lng: 2.3404 }, // Montmartre
		{ lat: 48.8606, lng: 2.3376 }, // Louvre
		{ lat: 48.8530, lng: 2.3499 }, // Notre-Dame
	];

	let assignments = new Array(places.length).fill(0);

	// Run k-means
	for (let iter = 0; iter < 20; iter++) {
		// Assign each place to nearest centroid
		for (let i = 0; i < places.length; i++) {
			let minDist = Infinity;
			let minCluster = 0;
			for (let c = 0; c < 3; c++) {
				const dist = haversine(places[i].lat, places[i].lng, centroids[c].lat, centroids[c].lng);
				if (dist < minDist) {
					minDist = dist;
					minCluster = c;
				}
			}
			assignments[i] = minCluster;
		}

		// Update centroids
		for (let c = 0; c < 3; c++) {
			const clusterPlaces = places.filter((_, i) => assignments[i] === c);
			if (clusterPlaces.length > 0) {
				centroids[c].lat = clusterPlaces.reduce((s, p) => s + p.lat, 0) / clusterPlaces.length;
				centroids[c].lng = clusterPlaces.reduce((s, p) => s + p.lng, 0) / clusterPlaces.length;
			}
		}
	}

	// Print clusters
	const clusters = [[], [], []];
	for (let i = 0; i < places.length; i++) {
		clusters[assignments[i]].push(places[i]);
	}

	// Label clusters by centroid
	const clusterLabels = ['Montmartre/Norte', 'Louvre/Oeste', 'Île de la Cité/Este'];
	for (let c = 0; c < 3; c++) {
		console.log(`\nCluster ${c} (${clusterLabels[c]}) - ${clusters[c].length} places:`);
		for (const p of clusters[c]) {
			console.log(`  ${p.name} (${p.lat.toFixed(4)}, ${p.lng.toFixed(4)})`);
		}
	}

	// Assign clusters to days 4, 5, 6
	// Day 4: Montmartre (cluster 0)
	// Day 5: Louvre/Ouest (cluster 1)
	// Day 6: Île de la Cité/Est (cluster 2)
	const dayAssignments = [dayIds[4], dayIds[5], dayIds[6]];

	for (let c = 0; c < 3; c++) {
		const targetDayId = dayAssignments[c];
		const clusterPlaces = clusters[c];

		// Sort by proximity (nearest neighbor from first place)
		const sorted = [clusterPlaces[0]];
		const remaining = clusterPlaces.slice(1);
		
		while (remaining.length > 0) {
			const last = sorted[sorted.length - 1];
			let minIdx = 0;
			let minDist = Infinity;
			for (let i = 0; i < remaining.length; i++) {
				const dist = haversine(last.lat, last.lng, remaining[i].lat, remaining[i].lng);
				if (dist < minDist) {
					minDist = dist;
					minIdx = i;
				}
			}
			sorted.push(remaining.splice(minIdx, 1)[0]);
		}

		// Update in DB
		for (let i = 0; i < sorted.length; i++) {
			const { error } = await supabase
				.from('places')
				.update({ day_id: targetDayId, order_index: i })
				.eq('id', sorted[i].id);
			
			if (error) {
				console.error(`Error updating ${sorted[i].name}: ${error.message}`);
			}
		}

		console.log(`\n✓ Day ${c + 4} updated with ${sorted.length} places`);
		for (let i = 0; i < sorted.length; i++) {
			console.log(`  ${i + 1}. ${sorted[i].name}`);
		}
	}

	console.log('\nDone!');
}

main();
