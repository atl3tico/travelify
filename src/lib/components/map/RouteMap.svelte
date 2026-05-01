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
		initialMode = 'walking',
		onModeChange,
	}: {
		places: MapPlace[];
		accommodationLat: number | null;
		accommodationLng: number | null;
		initialMode?: TravelMode;
		onModeChange?: (mode: TravelMode) => void;
	} = $props();

	let mapEl: HTMLDivElement;
	let map: InstanceType<typeof google.maps.Map> | null = $state(null);
	let directionsRenderer: google.maps.DirectionsRenderer | null = $state(null);
	let routeInfo: { distance: string; duration: string } | null = $state(null);
	let googleMapsLink = $state('');
	let travelMode: TravelMode = $state(initialMode);
	let shareCopied = $state(false);

	const sorted = $derived([...places].sort((a, b) => a.order_index - b.order_index));

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
		if (map && sorted.length > 0) {
			renderRoute();
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

	async function renderRoute() {
		if (!map || sorted.length === 0) return;

		const waypoints = sorted.map((p) => ({
			location: { lat: p.lat, lng: p.lng },
			stopover: true,
		}));

		const hasAccomm = accommodationLat !== null && accommodationLng !== null;
		const origin = hasAccomm
			? { lat: accommodationLat!, lng: accommodationLng! }
			: waypoints[0].location;
		const destination = hasAccomm
			? { lat: accommodationLat!, lng: accommodationLng! }
			: waypoints[waypoints.length - 1].location;
		const dirWaypoints = hasAccomm ? waypoints : waypoints.slice(1, -1);

		try {
			const { DirectionsService, DirectionsRenderer } = await importLibrary('routes');
			const ds = new DirectionsService();
			const result = await ds.route({
				origin,
				destination,
				waypoints: dirWaypoints,
				travelMode: googleTravelMode[travelMode] as google.maps.TravelMode,
				optimizeWaypoints: false,
			});

			if (directionsRenderer) directionsRenderer.setMap(null);
			directionsRenderer = new DirectionsRenderer({
				map,
				suppressMarkers: false,
				preserveViewport: true,
			});
			directionsRenderer.setDirections(result);

			let totalDist = 0;
			let totalDur = 0;
			for (const leg of result.routes[0].legs) {
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
		await importLibrary('marker');

		const allPoints = [
			...(accommodationLat && accommodationLng
				? [{ lat: accommodationLat, lng: accommodationLng }]
				: []),
			...sorted.map((p) => ({ lat: p.lat, lng: p.lng })),
		];

		const center = allPoints.length
			? allPoints.reduce(
					(acc, p) => ({
						lat: acc.lat + p.lat / allPoints.length,
						lng: acc.lng + p.lng / allPoints.length,
					}),
					{ lat: 0, lng: 0 }
				)
			: { lat: 40.4168, lng: -3.7038 };

		map = new Map(mapEl, {
			center,
			zoom: 13,
			mapTypeControl: false,
			streetViewControl: false,
			fullscreenControl: true,
		});

		if (sorted.length > 0) renderRoute();
	});
</script>

<div class="flex h-full flex-col">
	<div
		class="flex items-center gap-1 rounded-b-lg border-x border-b border-border bg-background px-2 py-1.5"
	>
		{#each travelModes as tm (tm.value)}
			<button
				onclick={() => changeMode(tm.value)}
				class="rounded-md px-2.5 py-1 text-sm transition-colors {travelMode === tm.value
					? 'bg-primary text-primary-foreground'
					: 'text-muted-foreground hover:bg-accent'}"
				title={tm.label}
			>
				{tm.icon}
				{tm.label}
			</button>
		{/each}
	</div>

	<div bind:this={mapEl} class="min-h-0 flex-1 rounded-b-lg"></div>

	{#if routeInfo}
		<div class="flex flex-wrap items-center gap-3 pt-3">
			<div class="text-sm text-muted-foreground">
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
						class="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
					>
						Open in Google Maps
					</a>
					<button
						onclick={copyShareLink}
						class="rounded-md border border-input px-3 py-1.5 text-xs font-medium hover:bg-accent"
					>
						{shareCopied ? '\u2705 Copied!' : '\u{1F517} Share Route'}
					</button>
				{/if}
			</div>
		</div>
	{/if}
</div>
