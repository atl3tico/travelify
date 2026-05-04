<script lang="ts">
	import { onMount } from 'svelte';
	import { PUBLIC_GOOGLE_MAPS_API_KEY } from '$env/static/public';
	import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

	type TravelMode = 'walking' | 'driving' | 'transit' | 'bicycling';

	interface MapPlace {
		id: string;
		name: string;
		lat: number;
		lng: number;
		order_index: number;
	}

	let {
		places,
		accommodationLat,
		accommodationLng,
		accommodationName = null,
		initialMode = 'walking',
		onModeChange,
		zoomPlaceId = null,
		onZoomOut,
	}: {
		places: MapPlace[];
		accommodationLat: number | null;
		accommodationLng: number | null;
		accommodationName?: string | null;
		initialMode?: TravelMode;
		onModeChange?: (mode: TravelMode) => void;
		zoomPlaceId?: string | null;
		onZoomOut?: () => void;
	} = $props();

	let mapEl: HTMLDivElement;
	let map: google.maps.Map | null = null;
	let polyline: google.maps.Polyline | null = null;
	let gMarkers: google.maps.Marker[] = [];
	let routeInfo: { distance: string; duration: string } | null = $state(null);
	let googleMapsLink = $state('');
	// svelte-ignore state_referenced_locally
	let travelMode: TravelMode = $state($state.snapshot(initialMode));
	let shareCopied = $state(false);
	let isZoomed = $state(false);
	let includeAccommodation = $state(false);

	const sorted = $derived([...places].sort((a, b) => a.order_index - b.order_index));
	const hasAccommodation = $derived(accommodationLat !== null && accommodationLng !== null);

	const travelModes: { value: TravelMode; label: string; icon: string }[] = [
		{ value: 'walking', label: 'Walk', icon: '\u{1F6B6}' },
		{ value: 'driving', label: 'Drive', icon: '\u{1F697}' },
		{ value: 'transit', label: 'Transit', icon: '\u{1F68C}' },
		{ value: 'bicycling', label: 'Bike', icon: '\u{1F6B2}' },
	];

	const googleTravelMode: Record<TravelMode, string> = {
		walking: 'WALKING',
		driving: 'DRIVING',
		transit: 'TRANSIT',
		bicycling: 'BICYCLING',
	};

	$effect(() => {
		travelMode;
		includeAccommodation;
		const s = sorted;
		const aLat = includeAccommodation ? accommodationLat : null;
		const aLng = includeAccommodation ? accommodationLng : null;
		if (map && s.length > 0) {
			renderRoute(s, aLat, aLng);
		}
	});

	$effect(() => {
		zoomPlaceId;
		if (!map || !zoomPlaceId) { isZoomed = false; return; }
		const p = sorted.find((p) => p.id === zoomPlaceId);
		if (p) {
			map.panTo({ lat: p.lat, lng: p.lng });
			map.setZoom(17);
			isZoomed = true;
		}
	});

	$effect(() => {
		sorted;
		accommodationLat;
		accommodationLng;
		includeAccommodation;
		if (map && sorted.length > 0) {
			const allPoints = [
				...(includeAccommodation && accommodationLat && accommodationLng
					? [{ lat: accommodationLat, lng: accommodationLng }]
					: []),
				...sorted.map((p) => ({ lat: p.lat, lng: p.lng })),
			];
			const bounds = new google.maps.LatLngBounds();
			for (const p of allPoints) bounds.extend({ lat: p.lat, lng: p.lng });
			map.fitBounds(bounds, 60);
		}
	});

	async function copyShareLink() {
		if (!googleMapsLink) return;
		await navigator.clipboard.writeText(googleMapsLink);
		shareCopied = true;
		setTimeout(() => (shareCopied = false), 2000);
	}

	function changeMode(mode: TravelMode) {
		travelMode = mode;
		onModeChange?.(mode);
	}

	function zoomOut() {
		if (!map || sorted.length === 0) return;
		const allPoints = [
			...(includeAccommodation && accommodationLat && accommodationLng
				? [{ lat: accommodationLat, lng: accommodationLng }]
				: []),
			...sorted.map((p) => ({ lat: p.lat, lng: p.lng })),
		];
		const bounds = new google.maps.LatLngBounds();
		for (const p of allPoints) bounds.extend({ lat: p.lat, lng: p.lng });
		map.fitBounds(bounds, 60);
		isZoomed = false;
		onZoomOut?.();
	}

	function clearMapObjects() {
		gMarkers.forEach((m) => m.setMap(null));
		gMarkers = [];
		if (polyline) { polyline.setMap(null); polyline = null; }
	}

	function addMarkers(s: MapPlace[], hasAccomm: boolean, aLat: number, aLng: number) {
		if (hasAccomm) {
			gMarkers.push(new google.maps.Marker({
				map,
				position: { lat: aLat, lng: aLng },
				title: accommodationName || 'Alojamiento',
				icon: {
					url: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36"><circle cx="18" cy="18" r="16" fill="#2563eb" stroke="white" stroke-width="2.5"/><text x="18" y="23" text-anchor="middle" font-size="18" font-family="Arial,Helvetica,sans-serif">&#x1F3E8;</text></svg>'),
					scaledSize: new google.maps.Size(36, 36),
					anchor: new google.maps.Point(18, 18),
				},
				zIndex: 100,
			}));
		}

			s.forEach((p, i) => {
				const letter = String.fromCharCode(65 + i);
				const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="#18181b" stroke="white" stroke-width="2.5"/><text x="16" y="22" text-anchor="middle" fill="white" font-size="15" font-weight="bold" font-family="Arial,Helvetica,sans-serif">${letter}</text></svg>`;
				const svgUrl = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
				gMarkers.push(new google.maps.Marker({
					map,
					position: { lat: p.lat, lng: p.lng },
					title: `${letter}. ${p.name}`,
					icon: {
						url: svgUrl,
						scaledSize: new google.maps.Size(32, 32),
						anchor: new google.maps.Point(16, 16),
					},
					zIndex: 50,
				}));
			});
	}

	async function renderRoute(s: MapPlace[], aLat: number | null, aLng: number | null) {
		if (!map || s.length === 0) return;

		clearMapObjects();
		const hasAccomm = aLat !== null && aLng !== null;

		const waypoints = s.map((p) => ({
			location: { lat: p.lat, lng: p.lng },
			stopover: true,
		}));

		const origin = hasAccomm
			? { lat: aLat!, lng: aLng! }
			: waypoints[0].location;
		const destination = hasAccomm
			? { lat: aLat!, lng: aLng! }
			: waypoints[waypoints.length - 1].location;
		const dirWaypoints = hasAccomm ? waypoints : waypoints.slice(1, -1);

		try {
			const { DirectionsService } = await importLibrary('routes');
			const ds = new DirectionsService();
			const result = await ds.route({
				origin,
				destination,
				waypoints: dirWaypoints,
				travelMode: googleTravelMode[travelMode] as google.maps.TravelMode,
				optimizeWaypoints: false,
			});

			const route = result.routes[0];
			const pathPoints: google.maps.LatLng[] = [];
			for (const leg of route.legs) {
				for (const step of leg.steps) {
					const decoded = step.polyline?.points
						? google.maps.geometry?.encoding?.decodePath(step.polyline.points)
						: null;
					if (decoded) {
						pathPoints.push(...decoded);
					} else {
						pathPoints.push(new google.maps.LatLng(step.start_location.lat(), step.start_location.lng()));
						pathPoints.push(new google.maps.LatLng(step.end_location.lat(), step.end_location.lng()));
					}
				}
			}

			polyline = new google.maps.Polyline({
				map,
				path: pathPoints,
				strokeColor: '#18181b',
				strokeWeight: 4,
				strokeOpacity: 0.8,
			});

			addMarkers(s, hasAccomm, aLat!, aLng!);

			let totalDist = 0;
			let totalDur = 0;
			for (const leg of route.legs) {
				if (leg.distance) totalDist += leg.distance.value;
				if (leg.duration) totalDur += leg.duration.value;
			}
			routeInfo = {
				distance: totalDist >= 1000 ? (totalDist / 1000).toFixed(1) + ' km' : totalDist + ' m',
				duration:
					totalDur >= 3600
						? Math.floor(totalDur / 3600) + 'h ' + Math.round((totalDur % 3600) / 60) + 'm'
						: Math.round(totalDur / 60) + ' min',
			};

			const o = `${origin.lat},${origin.lng}`;
			const d = `${destination.lat},${destination.lng}`;
			const wp = dirWaypoints.map((w) => `${w.location.lat},${w.location.lng}`).join('|');
			googleMapsLink = `https://www.google.com/maps/dir/?api=1&origin=${o}&destination=${d}&waypoints=${wp}&travelmode=${travelMode}`;
		} catch {
			routeInfo = null;
		}
	}

	onMount(async () => {
		setOptions({ key: PUBLIC_GOOGLE_MAPS_API_KEY, v: 'weekly' });

		const { Map } = await importLibrary('maps');
		await importLibrary('geometry');

		map = new Map(mapEl, {
			center: { lat: 48.8566, lng: 2.3522 },
			zoom: 4,
			mapTypeControl: false,
			streetViewControl: false,
			fullscreenControl: true,
		});

		if (sorted.length > 0) renderRoute(sorted, includeAccommodation ? accommodationLat : null, includeAccommodation ? accommodationLng : null);
	});
</script>

<div class="flex h-full flex-col overflow-hidden">
	<div
		class="flex items-center gap-1 overflow-x-auto rounded-b-lg border-x border-b border-border bg-background px-2 py-1.5 scrollbar-none"
	>
		{#each travelModes as tm (tm.value)}
			<button
				onclick={() => changeMode(tm.value)}
				class="shrink-0 rounded-md px-2 py-1 text-xs transition-colors sm:text-sm {travelMode === tm.value
					? 'bg-primary text-primary-foreground'
					: 'text-muted-foreground hover:bg-accent'}"
				title={tm.label}
			>
				{tm.icon}
				{tm.label}
			</button>
		{/each}
		{#if hasAccommodation}
			<div class="ml-1 shrink-0 border-l border-border pl-1">
				<button
					onclick={() => (includeAccommodation = !includeAccommodation)}
					class="rounded-md px-2 py-1 text-xs transition-colors sm:text-sm {includeAccommodation
						? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
						: 'text-muted-foreground hover:bg-accent'}"
					title="Incluir alojamiento en ruta"
				>
					&#x1F3E8; Aloj.
				</button>
			</div>
		{/if}
	</div>

	<div class="relative min-h-0 flex-1">
		<div bind:this={mapEl} class="absolute inset-0 rounded-b-lg"></div>
		{#if isZoomed}
			<button
				onclick={zoomOut}
				class="absolute top-3 left-3 z-20 flex items-center gap-1 rounded-lg bg-background/90 px-3 py-1.5 text-xs font-medium shadow-md backdrop-blur hover:bg-background"
			>
				↩ Ver todo
			</button>
		{/if}
	</div>

	{#if routeInfo}
		<div class="flex flex-wrap items-center gap-2 pt-3 sm:gap-3">
			<div class="text-xs text-muted-foreground sm:text-sm">
				<span class="font-medium text-foreground">{routeInfo.distance}</span> &middot;
				<span class="font-medium text-foreground">{routeInfo.duration}</span> &middot;
				{sorted.length} stops
			</div>
			<div class="flex gap-2">
				{#if googleMapsLink}
					<a
						href={googleMapsLink}
						target="_blank"
						rel="noopener noreferrer"
						class="rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 sm:px-3 sm:py-1.5"
					>
						Google Maps
					</a>
					<button
						onclick={copyShareLink}
						class="rounded-md border border-input px-2 py-1 text-xs font-medium hover:bg-accent sm:px-3 sm:py-1.5"
					>
						{shareCopied ? '\u2705' : '\u{1F517}'}
					</button>
				{/if}
			</div>
		</div>
	{/if}
</div>
