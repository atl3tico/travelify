<script lang="ts">
	import type { PageData } from './$types';
	import PlaceSearch from '$lib/components/place/PlaceSearch.svelte';
	import PlaceModal from '$lib/components/place/PlaceModal.svelte';
	import RouteMap from '$lib/components/map/RouteMap.svelte';
	import { invalidateAll } from '$app/navigation';
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/button';
	import { Badge } from '$lib/badge';
	import { getCityImage, getPlaceImage } from '$lib/utils/city-images';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import XIcon from '@lucide/svelte/icons/x';
	import MapIcon from '@lucide/svelte/icons/map';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import StarIcon from '@lucide/svelte/icons/star';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import ShareIcon from '@lucide/svelte/icons/share-2';
	import GlobeIcon from '@lucide/svelte/icons/globe';
	import BedIcon from '@lucide/svelte/icons/bed';
	import StickyNoteIcon from '@lucide/svelte/icons/sticky-note';
	import ExpandIcon from '@lucide/svelte/icons/maximize-2';
	import RouteIcon from '@lucide/svelte/icons/route';
	import GripVerticalIcon from '@lucide/svelte/icons/grip-vertical';
	import PlaneIcon from '@lucide/svelte/icons/plane';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';

	let { data }: { data: PageData } = $props();
	let activeDayIndex = $state(0);
	let days = $derived(data.days);
	let places = $derived(data.places);
	let activeDay = $derived(days[activeDayIndex]);

	$effect(() => {
		activeDayIndex;
		zoomPlaceId = null;
	});
	let activePlaces = $derived(
		places
			.filter((p: { day_id: string }) => p.day_id === activeDay?.id)
			.sort(
				(a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index
			)
	);

	let showPlaceModal = $state(false);
	let editingPlace = $state<any>(null);
	let showMap = $state(false);
	let showDayModal = $state(false);
	let showFlightModal = $state(false);
	let zoomPlaceId = $state<string | null>(null);

	let flightFields = $state<Record<string, string>>({});

	$effect(() => {
		if (showFlightModal) {
			const t = data.trip;
			flightFields = {
				outbound_flight_number: t.outbound_flight_number ?? '',
				outbound_airline: t.outbound_airline ?? '',
				outbound_origin: t.outbound_origin ?? '',
				outbound_destination: t.outbound_destination ?? '',
				outbound_departure_time: t.outbound_departure_time ?? '',
				outbound_arrival_time: t.outbound_arrival_time ?? '',
				return_flight_number: t.return_flight_number ?? '',
				return_airline: t.return_airline ?? '',
				return_origin: t.return_origin ?? '',
				return_destination: t.return_destination ?? '',
				return_departure_time: t.return_departure_time ?? '',
				return_arrival_time: t.return_arrival_time ?? '',
			};
		}
	});

	async function lookupFlight(prefix: string) {
		const num = flightFields[prefix + 'flight_number'];
		if (!num || num.length < 2) return;
		const rawDate = prefix === 'return_' ? data.trip.end_date : data.trip.start_date;
		const tripDate = new Date(rawDate + 'T12:00:00');
		const today = new Date();
		today.setHours(12, 0, 0, 0);
		const date = tripDate < today ? today.toISOString().split('T')[0] : rawDate;
		try {
			const res = await fetch(`/api/flights?flight=${encodeURIComponent(num)}&date=${date}`);
			if (!res.ok) return;
			const d = await res.json();
			if (d.error) return;
			flightFields = {
				...flightFields,
				[prefix + 'airline']: d.airline ?? '',
				[prefix + 'origin']: d.origin ?? '',
				[prefix + 'destination']: d.destination ?? '',
				[prefix + 'departure_time']: d.departure_time ?? '',
				[prefix + 'arrival_time']: d.arrival_time ?? '',
			};
		} catch {}
	}

	let modalDayIndex = $state(0);
	let dragIndex = $state<number | null>(null);
	let dragOverIndex = $state<number | null>(null);
	let optimizing = $state(false);
	let suggestingTimes = $state(false);

	let totalPlaces = $derived(places.length);
	let totalDays = $derived(days.length);
	let accommodations = $derived(data.accommodations);

	let activeAccommodation = $derived(() => {
		if (!activeDay) return null;
		return accommodations.find(
			(a: { start_date: string; end_date: string }) =>
				activeDay.date >= a.start_date && activeDay.date <= a.end_date
		) ?? null;
	});

	function nightCount(start: string, end: string) {
		const diff = new Date(end).getTime() - new Date(start).getTime();
		return Math.round(diff / (1000 * 60 * 60 * 24));
	}

	function getAccommodationForDate(date: string) {
		return accommodations.find(
			(a: { start_date: string; end_date: string }) => date >= a.start_date && date <= a.end_date
		);
	}

	async function handleModeChange(dayId: string, mode: string) {
		const form = new FormData();
		form.set('day_id', dayId);
		form.set('travel_mode', mode);
		await fetch('?/updateTravelMode', { method: 'POST', body: form });
	}

	function formatDate(dateStr: string) {
		return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-ES', {
			weekday: 'short',
			day: 'numeric',
			month: 'short',
		});
	}

	function formatDateShort(dateStr: string) {
		return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-ES', {
			month: 'short',
			day: 'numeric',
		});
	}

	function formatWeekday(dateStr: string) {
		return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long' });
	}

	function getPlacesForDay(dayId: string) {
		return places
			.filter((p: { day_id: string }) => p.day_id === dayId)
			.sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index);
	}

	function getCategoryLabel(cat: string) {
		const map: Record<string, string> = {
			restaurant: 'Restaurante',
			hotel: 'Hotel',
			attraction: 'Atracción',
			shopping: 'Compra',
			transport: 'Transporte',
			place: 'Lugar',
		};
		return map[cat] || 'Lugar';
	}

	function getCategoryColor(cat: string) {
		const map: Record<string, string> = {
			restaurant: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
			hotel: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
			attraction: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
			shopping: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
			transport: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
			place: 'bg-primary/10 text-primary',
		};
		return map[cat] || map.place;
	}

	async function removePlace(placeId: string) {
		const form = new FormData();
		form.set('place_id', placeId);
		const res = await fetch('?/removePlace', { method: 'POST', body: form });
		if (res.ok) {
			toast.success('Lugar eliminado');
		} else {
			toast.error('Error al eliminar');
		}
		invalidate();
	}

	async function handleReorder() {
		if (dragIndex === null || dragOverIndex === null || dragIndex === dragOverIndex) {
			dragIndex = null;
			dragOverIndex = null;
			return;
		}
		const items = [...activePlaces];
		const [moved] = items.splice(dragIndex, 1);
		items.splice(dragOverIndex, 0, moved);
		const orders = items.map((p: { id: string }, i: number) => ({ id: p.id, order_index: i }));
		const form = new FormData();
		form.set('orders', JSON.stringify(orders));
		await fetch('?/reorderPlaces', { method: 'POST', body: form });
		dragIndex = null;
		dragOverIndex = null;
		invalidate();
	}

	function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
		const R = 6371;
		const dLat = ((lat2 - lat1) * Math.PI) / 180;
		const dLng = ((lng2 - lng1) * Math.PI) / 180;
		const a =
			Math.sin(dLat / 2) ** 2 +
			Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
		return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	}

	async function optimizeRoute() {
		if (activePlaces.length < 3) {
			toast.info('Necesitas al menos 3 lugares para optimizar');
			return;
		}
		optimizing = true;

		const items = [...activePlaces];
		const activeAcc = activeAccommodation();
		const startLat = activeAcc?.lat ?? items[0].lat;
		const startLng = activeAcc?.lng ?? items[0].lng;

		const optimized: typeof items = [];
		const remaining = [...items];
		let currentLat = startLat;
		let currentLng = startLng;

		while (remaining.length > 0) {
			let nearestIdx = 0;
			let nearestDist = Infinity;
			for (let i = 0; i < remaining.length; i++) {
				const d = haversine(currentLat, currentLng, remaining[i].lat, remaining[i].lng);
				if (d < nearestDist) {
					nearestDist = d;
					nearestIdx = i;
				}
			}
			const [nearest] = remaining.splice(nearestIdx, 1);
			optimized.push(nearest);
			currentLat = nearest.lat;
			currentLng = nearest.lng;
		}

		const orders = optimized.map((p: { id: string }, i: number) => ({ id: p.id, order_index: i }));
		const form = new FormData();
		form.set('orders', JSON.stringify(orders));
		const res = await fetch('?/reorderPlaces', { method: 'POST', body: form });
		optimizing = false;
		if (res.ok) {
			toast.success('Ruta optimizada por proximidad');
		} else {
			toast.error('Error al optimizar la ruta');
		}
		invalidate();
	}

	async function suggestTimes() {
		const items = [...activePlaces];
		const withoutTime = items.filter((p: { start_time: string | null }) => !p.start_time);
		if (withoutTime.length === 0) {
			toast.info('Todas las actividades ya tienen horario');
			return;
		}

		suggestingTimes = true;
		let currentMinutes = 9 * 60; // Start at 9:00 AM

		// Find first place with start_time to anchor the schedule
		for (const place of items) {
			if (place.start_time) {
				const [h, m] = place.start_time.split(':').map(Number);
				currentMinutes = h * 60 + m;
				break;
			}
		}

		const updates: { id: string; start_time: string }[] = [];

		for (const place of items) {
			if (place.start_time) {
				const [h, m] = place.start_time.split(':').map(Number);
				currentMinutes = h * 60 + m + (place.visit_duration || 60);
			} else {
				// Add 15 min travel buffer
				currentMinutes += 15;
				const hh = Math.floor(currentMinutes / 60) % 24;
				const mm = currentMinutes % 60;
				const timeStr = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
				updates.push({ id: place.id, start_time: timeStr });
				currentMinutes += place.visit_duration || 60;
			}
		}

		// Batch update
		for (const update of updates) {
			const form = new FormData();
			form.set('place_id', update.id);
			form.set('start_time', update.start_time);
			await fetch('?/updatePlaceTime', { method: 'POST', body: form });
		}

		suggestingTimes = false;
		toast.success(`Horarios sugeridos para ${updates.length} actividad${updates.length !== 1 ? 'es' : ''}`);
		invalidate();
	}

	async function invalidate() {
		await invalidateAll();
	}

	async function handleDeleteTrip() {
		if (!confirm('¿Eliminar este viaje y todos sus datos?')) return;
		const form = new FormData();
		const res = await fetch('?/deleteTrip', { method: 'POST', body: form });
		if (res.ok) {
			toast.success('Viaje eliminado');
			goto('/dashboard');
		}
	}

	function openDayModal(index: number) {
		modalDayIndex = index;
		showDayModal = true;
	}

	async function shareTrip() {
		const url = window.location.href;
		try {
			await navigator.clipboard.writeText(url);
			toast.success('Enlace copiado al portapapeles');
		} catch {
			toast.error('No se pudo copiar el enlace');
		}
	}

	let modalPlaces = $derived(
		places
			.filter((p: { day_id: string }) => p.day_id === days[modalDayIndex]?.id)
			.sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index)
	);
</script>

<svelte:head>
	<title>{data.trip.name} — Travelify</title>
	<meta name="description" content="Planifica tu viaje a {data.trip.destination} con itinerario día a día y mapas de ruta." />
</svelte:head>

<!-- HERO HEADER -->
<div class="relative -mt-4 mb-4 overflow-hidden rounded-b-xl sm:-mt-6 sm:mb-6 sm:rounded-xl">
	<div class="relative h-40 sm:h-56">
		<img
			src={data.trip.cover_photo_url || getCityImage(data.trip.destination)}
			alt={data.trip.destination}
			class="h-full w-full object-cover"
		/>
		<div class="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-black/10"></div>
		<div class="absolute inset-0 flex items-end p-4 sm:p-6">
			<div class="w-full">
				<div class="flex items-start justify-between gap-2 sm:gap-4">
					<div class="min-w-0">
						<h1 class="truncate text-xl font-bold text-foreground sm:text-3xl">{data.trip.name}</h1>
						<div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground sm:text-sm">
							<span class="flex items-center gap-1">
								<MapPinIcon class="size-3 sm:size-3.5" />
								{data.trip.destination}
							</span>
							<span class="flex items-center gap-1">
								<CalendarIcon class="size-3 sm:size-3.5" />
								{formatDateShort(data.trip.start_date)} — {formatDateShort(data.trip.end_date)}
							</span>
							{#if data.trip.outbound_flight_number}
								<button onclick={() => (showFlightModal = true)} class="flex items-center gap-1 transition-colors hover:text-foreground">
									<PlaneIcon class="size-3 sm:size-3.5" />
									{data.trip.outbound_flight_number}
									{#if data.trip.outbound_origin && data.trip.outbound_destination}
										<span class="hidden sm:inline"> {data.trip.outbound_origin}→{data.trip.outbound_destination}</span>
									{/if}
									{#if data.trip.return_flight_number}
										<span class="text-muted-foreground/60">·</span>
										{data.trip.return_flight_number}
									{/if}
								</button>
							{/if}
						</div>
					</div>
					<div class="flex shrink-0 gap-1.5 sm:gap-2">
						<Button variant="outline" size="sm" href="/trips/{data.trip.id}/edit">
							<PencilIcon class="size-3.5" />
						</Button>
						<Button variant="destructive" size="sm" onclick={handleDeleteTrip}>
							<TrashIcon class="size-3.5" />
						</Button>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<!-- STATS BAR -->
<div class="px-3 sm:px-4 mb-4 flex flex-wrap gap-2 sm:mb-6 sm:gap-4">
	<div class="flex shrink-0 items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs sm:gap-2 sm:px-3 sm:text-sm">
		<CalendarIcon class="size-3 text-primary sm:size-4" />
		<span><span class="font-semibold">{totalDays}</span> días</span>
	</div>
	<div class="flex shrink-0 items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs sm:gap-2 sm:px-3 sm:text-sm">
		<MapPinIcon class="size-3 text-primary sm:size-4" />
		<span><span class="font-semibold">{totalPlaces}</span> lugares</span>
	</div>
	{#if accommodations.length > 0}
		<div class="flex shrink-0 items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs sm:gap-2 sm:px-3 sm:text-sm">
			<BedIcon class="size-3 text-primary sm:size-4" />
			<span><span class="font-semibold">{accommodations.length}</span> {accommodations.length === 1 ? 'alojamiento' : 'alojamientos'}</span>
		</div>
	{/if}
</div>

<!-- DAY TABS -->
<div class="mb-6 overflow-x-auto scrollbar-none">
	<div class="flex gap-2 px-3 pb-2 sm:px-4">
		{#each days as day, i (day.id)}
			{@const dayPlaces = getPlacesForDay(day.id)}
			<button
				onclick={() => (activeDayIndex = i)}
				class="shrink-0 rounded-lg border px-4 py-2.5 text-sm transition-all min-h-11 {activeDayIndex === i
					? 'border-transparent bg-gradient-to-r from-sky-500 to-indigo-500 text-white'
					: 'border-border hover:border-primary/30 hover:bg-accent'}"
			>
				<div class="text-xs opacity-70">Día {day.day_index}</div>
				<div class="font-medium">{formatDateShort(day.date)}</div>
				{#if dayPlaces.length > 0}
					<div class="mt-0.5 text-xs opacity-60">{dayPlaces.length} {dayPlaces.length === 1 ? 'lugar' : 'lugares'}</div>
				{/if}
			</button>
		{/each}
	</div>
</div>

<!-- ACTIVE DAY CONTENT -->
{#if activeDay}
	<div class="grid gap-6 px-3 sm:px-4 lg:grid-cols-[1fr_400px]">
		<div class="space-y-3 sm:space-y-4">
			<!-- Day header -->
			<div class="flex flex-wrap items-center justify-between gap-2">
				<div class="min-w-0">
					{#if activeDay.title}
						<h2 class="text-lg font-semibold">{activeDay.title}</h2>
					{/if}
					<p class="truncate text-sm capitalize text-muted-foreground">{formatWeekday(activeDay.date)} · {formatDate(activeDay.date)}</p>
				</div>
				<div class="flex shrink-0 gap-1.5 sm:gap-2">
					{#if activePlaces.length >= 3}
						<Button
							size="sm"
							variant="outline"
							onclick={optimizeRoute}
							disabled={optimizing}
							title="Reordenar por proximidad"
						>
							<RouteIcon class="size-3.5" />
							<span class="hidden sm:inline">{optimizing ? 'Optimizando...' : 'Optimizar'}</span>
						</Button>
					{/if}
					{#if activePlaces.length > 0}
						<Button
							size="sm"
							variant="outline"
							onclick={suggestTimes}
							disabled={suggestingTimes}
							title="Sugerir horarios"
						>
							<SparklesIcon class="size-3.5" />
							<span class="hidden sm:inline">{suggestingTimes ? 'Sugiriendo...' : 'Horarios'}</span>
						</Button>
					{/if}
					<Button
						size="sm"
						variant="outline"
						onclick={() => openDayModal(activeDayIndex)}
					>
						<ExpandIcon class="size-3.5" />
						<span class="hidden sm:inline">Ver día</span>
					</Button>
					<Button
						size="sm"
						onclick={() => { editingPlace = null; showPlaceModal = true; }}
						class="bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 text-white border-0"
					>
						<PlusIcon class="size-3.5" />
						<span class="sm:inline">Añadir</span>
					</Button>
				</div>
			</div>

			{#if activeDay.summary}
				<p class="text-sm text-muted-foreground">{activeDay.summary}</p>
			{/if}

			<!-- Places list -->
			{#if activePlaces.length === 0}
				<div class="flex flex-col items-center rounded-xl border border-dashed border-border py-10 text-center">
					<MapPinIcon class="mb-2 size-8 text-muted-foreground/40" />
					<p class="text-sm text-muted-foreground">Sin lugares todavía. ¡Añade tu primera parada!</p>
				</div>
			{:else}
				<div class="space-y-3">
				{#each activePlaces as place, index (place.id)}
					<div
						class="group relative h-32 overflow-hidden rounded-xl border border-border transition-all sm:h-40 {dragIndex === index
							? 'border-primary opacity-50'
							: dragOverIndex === index
								? 'border-primary/50'
								: zoomPlaceId === place.id
									? 'border-primary'
									: 'border-border'}"
						draggable="true"
						ondragstart={() => { dragIndex = index; dragOverIndex = null; }}
						ondragover={(e) => { e.preventDefault(); dragOverIndex = index; }}
						ondragleave={() => { if (dragOverIndex === index) dragOverIndex = null; }}
						ondrop={() => handleReorder()}
						ondragend={() => { dragIndex = null; dragOverIndex = null; }}
						onclick={() => { zoomPlaceId = zoomPlaceId === place.id ? null : place.id; }}
						role="listitem"
					>
						<!-- Background Image -->
						<img
							src={place.photo_url || getPlaceImage(place.category || 'place', place.name)}
							alt={place.name}
							class="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
						/>

						<!-- Gradient Overlay -->
						<div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>

						<!-- Letter Badge -->
						<div class="absolute top-2 left-2 sm:top-3 sm:left-3">
							<span class="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 text-xs font-bold text-white shadow-lg sm:size-8 sm:text-sm">
								{String.fromCharCode(65 + index)}
							</span>
						</div>

							<!-- Actions -->
							<div class="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 sm:top-3 sm:right-3" onclick={(e) => e.stopPropagation()}>
								<button
									onclick={() => { editingPlace = place; showPlaceModal = true; }}
									class="rounded-md bg-black/50 p-1.5 text-white backdrop-blur hover:bg-black/70"
									title="Editar actividad"
								>
									<PencilIcon class="size-4" />
								</button>
								<button
									onclick={() => removePlace(place.id)}
									class="rounded-md bg-black/50 p-1.5 text-white backdrop-blur hover:bg-red-500/70"
									title="Eliminar lugar"
								>
									<XIcon class="size-4" />
								</button>
							</div>

							<!-- Content -->
							<div class="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
								<div class="flex items-center gap-2">
									<h3 class="truncate text-base font-semibold text-white sm:text-lg">{place.name}</h3>
									{#if place.category}
										<span class="hidden shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium sm:inline-block {getCategoryColor(place.category)}">
											{getCategoryLabel(place.category)}
										</span>
									{/if}
								</div>
								<div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/80">
									{#if place.address}
										<span class="truncate">{place.address}</span>
									{/if}
									{#if place.category === 'transport' && place.flight_number}
										<span class="flex items-center gap-0.5 font-semibold text-blue-300">
											<PlaneIcon class="size-3" />
											{place.flight_number}
										</span>
									{/if}
									{#if place.start_time}
										<span class="flex items-center gap-0.5 font-medium text-white">
											<ClockIcon class="size-3" />
											{place.start_time?.substring(0, 5)}
										</span>
									{/if}
									{#if place.rating}
										<span class="flex items-center gap-0.5 text-yellow-400">
											<StarIcon class="size-3" />
											{place.rating}
										</span>
									{/if}
									{#if place.visit_duration}
										<span class="flex items-center gap-0.5">
											<ClockIcon class="size-3" />
											{place.visit_duration} min
										</span>
									{/if}
									{#if place.notes}
										<span class="truncate italic">{place.notes}</span>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}

			<!-- Mobile map toggle -->
			<div class="lg:hidden">
				<Button
					variant="outline"
					class="w-full"
					onclick={() => (showMap = !showMap)}
				>
					<MapIcon class="size-4" />
					{showMap ? 'Ocultar mapa' : 'Ver mapa'}
				</Button>
				{#if showMap}
					<div class="mt-3 h-[350px] rounded-xl border border-border">
						<RouteMap
							places={activePlaces}
							accommodationLat={activeAccommodation()?.lat ?? null}
							accommodationLng={activeAccommodation()?.lng ?? null}
							accommodationName={activeAccommodation()?.name ?? null}
							initialMode={activeDay?.travel_mode || 'walking'}
							onModeChange={(mode) => handleModeChange(activeDay.id, mode)}
							{zoomPlaceId}
							onZoomOut={() => (zoomPlaceId = null)}
						/>
					</div>
				{/if}
			</div>
		</div>

		<!-- Desktop map -->
		<div class="hidden lg:block">
			<div class="sticky top-20 h-[500px] rounded-xl border border-border">
				<RouteMap
					places={activePlaces}
					accommodationLat={activeAccommodation()?.lat ?? null}
					accommodationLng={activeAccommodation()?.lng ?? null}
					accommodationName={activeAccommodation()?.name ?? null}
					initialMode={activeDay?.travel_mode || 'walking'}
					onModeChange={(mode) => handleModeChange(activeDay.id, mode)}
					{zoomPlaceId}
					onZoomOut={() => (zoomPlaceId = null)}
				/>
			</div>
		</div>
	</div>
{/if}

<!-- ACCOMMODATIONS SECTION (after activities) -->
{#if accommodations.length > 0}
	<div class="mt-6 space-y-2 sm:mt-8 sm:space-y-3">
		<div class="flex items-center gap-2">
			<BedIcon class="size-4 text-primary" />
			<h2 class="text-sm font-semibold">Alojamientos</h2>
		</div>
		<div class="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
			{#each accommodations as acc (acc.id)}
				<div class="flex items-start gap-2 rounded-lg border border-border px-3 py-2 sm:items-center">
					<BedIcon class="size-3.5 shrink-0 text-primary mt-0.5 sm:mt-0" />
					<div class="min-w-0">
						<div class="text-sm font-medium truncate">{acc.name}</div>
						<div class="text-xs text-muted-foreground">{formatDateShort(acc.start_date)}–{formatDateShort(acc.end_date)} · {nightCount(acc.start_date, acc.end_date)} noches</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
{/if}

<!-- DAY MODAL -->
{#if showDayModal && days[modalDayIndex]}
	{@const modalDay = days[modalDayIndex]}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onclick={() => (showDayModal = false)}>
		<div class="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-background shadow-2xl" onclick={(e) => e.stopPropagation()}>
			<!-- Modal header -->
			<div class="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background p-4">
				<div class="flex items-center gap-3">
					<button
						class="rounded-md p-2 min-h-11 min-w-11 flex items-center justify-center hover:bg-accent disabled:opacity-30"
						disabled={modalDayIndex === 0}
						onclick={() => (modalDayIndex--)}
					>
						<ChevronLeftIcon class="size-5" />
					</button>
					<div>
						<div class="text-sm capitalize text-muted-foreground">{formatWeekday(modalDay.date)}</div>
						<h2 class="font-semibold">
							{#if modalDay.title}
								{modalDay.title}
							{:else}
								Día {modalDay.day_index} — {formatDate(modalDay.date)}
							{/if}
						</h2>
					</div>
					<button
						class="rounded-md p-2 min-h-11 min-w-11 flex items-center justify-center hover:bg-accent disabled:opacity-30"
						disabled={modalDayIndex >= days.length - 1}
						onclick={() => (modalDayIndex++)}
					>
						<ChevronRightIcon class="size-5" />
					</button>
				</div>
				<button class="rounded-md p-2 min-h-11 min-w-11 flex items-center justify-center hover:bg-accent" onclick={() => (showDayModal = false)}>
					<XIcon class="size-5" />
				</button>
			</div>

			<!-- Modal content -->
			<div class="p-4 space-y-4">
				{#if modalDay.summary}
					<p class="text-sm text-muted-foreground">{modalDay.summary}</p>
				{/if}

				{#if modalPlaces.length === 0}
					<div class="py-10 text-center text-sm text-muted-foreground">
						Sin lugares planificados para este día
					</div>
				{:else}
					{#each modalPlaces as place, i (place.id)}
						<div class="flex gap-3 rounded-xl border border-border p-3">
							<!-- Photo or number -->
							<img src={place.photo_url || getPlaceImage(place.category || 'place', place.name)} alt={place.name} class="size-16 shrink-0 rounded-lg object-cover" />

							<div class="min-w-0 flex-1">
								<div class="flex items-center gap-2">
									{#if place.category}
										<span class="rounded-full px-1.5 py-0.5 text-[10px] font-medium {getCategoryColor(place.category)}">
											{getCategoryLabel(place.category)}
										</span>
									{/if}
								</div>
								<h3 class="mt-1 font-medium">{place.name}</h3>
								{#if place.address}
									<p class="text-xs text-muted-foreground">{place.address}</p>
								{/if}
								{#if place.description}
									<p class="mt-1 text-xs text-muted-foreground line-clamp-2">{place.description}</p>
								{/if}
								<div class="mt-1 flex flex-wrap items-center gap-2">
									{#if place.rating}
										<span class="flex items-center gap-0.5 text-xs text-yellow-500">
											<StarIcon class="size-3" />
											{place.rating}
										</span>
									{/if}
									{#if place.visit_duration}
										<span class="flex items-center gap-1 text-xs text-muted-foreground">
											<ClockIcon class="size-3" />
											{place.visit_duration} min
										</span>
									{/if}
								</div>
								{#if place.notes}
									<p class="mt-1 text-xs text-muted-foreground italic">{place.notes}</p>
								{/if}
							</div>
						</div>
					{/each}

					<!-- Mini map in modal -->
					<div class="h-[250px] overflow-hidden rounded-xl border border-border">
						<RouteMap
							places={modalPlaces}
							accommodationLat={getAccommodationForDate(modalDay?.date)?.lat ?? null}
							accommodationLng={getAccommodationForDate(modalDay?.date)?.lng ?? null}
							accommodationName={getAccommodationForDate(modalDay?.date)?.name ?? null}
							initialMode={modalDay?.travel_mode || 'walking'}
							onModeChange={() => {}}
						/>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<!-- STICKY FOOTER -->
<div class="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" style="padding-bottom: env(safe-area-inset-bottom, 0px);">
	<div class="mx-auto flex max-w-6xl items-center justify-between px-3 py-2 sm:px-4 sm:py-3">
		<div class="hidden text-sm text-muted-foreground sm:block">
			<span class="font-medium text-foreground">{data.trip.name}</span>
		</div>
		<div class="flex w-full gap-2 sm:w-auto">
			<Button variant="outline" size="sm" onclick={() => (showFlightModal = true)} class="flex-1 sm:flex-initial">
				<PlaneIcon class="size-3.5" />
				<span class="sm:inline">Vuelos</span>
			</Button>
			<Button variant="outline" size="sm" onclick={shareTrip} class="flex-1 sm:flex-initial">
				<ShareIcon class="size-3.5" />
				<span class="sm:inline">Compartir</span>
			</Button>
			<Button size="sm" href="/trips/{data.trip.id}/edit" class="flex-1 sm:flex-initial">
				<PencilIcon class="size-3.5" />
				<span class="sm:inline">Editar</span>
			</Button>
		</div>
	</div>
</div>

<!-- Spacer for sticky footer -->
<div class="h-14 sm:h-16"></div>

{#if showPlaceModal}
	<PlaceModal
		place={editingPlace}
		dayId={activeDay.id}
		days={days}
		onClose={() => { showPlaceModal = false; editingPlace = null; }}
		onSaved={invalidate}
	/>
{/if}

<!-- FLIGHT MODAL -->
{#if showFlightModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onclick={() => (showFlightModal = false)}>
		<div
			class="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-background shadow-2xl"
			onclick={(e) => e.stopPropagation()}
		>
			<div class="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background px-5 py-4">
				<h2 class="text-lg font-semibold">Vuelos</h2>
				<button class="rounded-md p-1.5 hover:bg-accent" onclick={() => (showFlightModal = false)}>
					<XIcon class="size-5" />
				</button>
			</div>

			<div class="space-y-5 p-5">
				<div class="space-y-3">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-1.5 text-sm font-semibold">
							<PlaneIcon class="size-4" />
							Vuelo de ida
						</div>
						<button
							type="button"
							onclick={() => lookupFlight('outbound_')}
							disabled={!flightFields.outbound_flight_number}
							class="rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10 disabled:opacity-30"
						>
							Autocompletar
						</button>
					</div>
					<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
						<div class="space-y-1">
							<label class="text-xs font-medium text-muted-foreground">Vuelo</label>
							<input type="text" bind:value={flightFields.outbound_flight_number} placeholder="IB1234" class="w-full rounded-lg border border-input bg-background px-3 py-3 text-base uppercase focus:outline-none focus:ring-2 focus:ring-ring" />
						</div>
						<div class="space-y-1">
							<label class="text-xs font-medium text-muted-foreground">Aerolínea</label>
							<input type="text" bind:value={flightFields.outbound_airline} placeholder="Iberia" class="w-full rounded-lg border border-input bg-background px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring" />
						</div>
					</div>
					<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
						<div class="space-y-1">
							<label class="text-xs font-medium text-muted-foreground">Origen</label>
							<input type="text" bind:value={flightFields.outbound_origin} placeholder="MAD" class="w-full rounded-lg border border-input bg-background px-3 py-3 text-base uppercase focus:outline-none focus:ring-2 focus:ring-ring" />
						</div>
						<div class="space-y-1">
							<label class="text-xs font-medium text-muted-foreground">Destino</label>
							<input type="text" bind:value={flightFields.outbound_destination} placeholder="CDG" class="w-full rounded-lg border border-input bg-background px-3 py-3 text-base uppercase focus:outline-none focus:ring-2 focus:ring-ring" />
						</div>
					</div>
					<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
						<div class="space-y-1">
							<label class="text-xs font-medium text-muted-foreground">Hora salida</label>
							<input type="time" bind:value={flightFields.outbound_departure_time} class="w-full rounded-lg border border-input bg-background px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring" />
						</div>
						<div class="space-y-1">
							<label class="text-xs font-medium text-muted-foreground">Hora llegada</label>
							<input type="time" bind:value={flightFields.outbound_arrival_time} class="w-full rounded-lg border border-input bg-background px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring" />
						</div>
					</div>
				</div>

				<div class="border-t border-border"></div>

				<div class="space-y-3">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-1.5 text-sm font-semibold">
							<PlaneIcon class="size-4 rotate-180" />
							Vuelo de vuelta
						</div>
						<button
							type="button"
							onclick={() => lookupFlight('return_')}
							disabled={!flightFields.return_flight_number}
							class="rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10 disabled:opacity-30"
						>
							Autocompletar
						</button>
					</div>
					<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
						<div class="space-y-1">
							<label class="text-xs font-medium text-muted-foreground">Vuelo</label>
							<input type="text" bind:value={flightFields.return_flight_number} placeholder="IB5678" class="w-full rounded-lg border border-input bg-background px-3 py-3 text-base uppercase focus:outline-none focus:ring-2 focus:ring-ring" />
						</div>
						<div class="space-y-1">
							<label class="text-xs font-medium text-muted-foreground">Aerolínea</label>
							<input type="text" bind:value={flightFields.return_airline} placeholder="Iberia" class="w-full rounded-lg border border-input bg-background px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring" />
						</div>
					</div>
					<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
						<div class="space-y-1">
							<label class="text-xs font-medium text-muted-foreground">Origen</label>
							<input type="text" bind:value={flightFields.return_origin} placeholder="CDG" class="w-full rounded-lg border border-input bg-background px-3 py-3 text-base uppercase focus:outline-none focus:ring-2 focus:ring-ring" />
						</div>
						<div class="space-y-1">
							<label class="text-xs font-medium text-muted-foreground">Destino</label>
							<input type="text" bind:value={flightFields.return_destination} placeholder="MAD" class="w-full rounded-lg border border-input bg-background px-3 py-3 text-base uppercase focus:outline-none focus:ring-2 focus:ring-ring" />
						</div>
					</div>
					<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
						<div class="space-y-1">
							<label class="text-xs font-medium text-muted-foreground">Hora salida</label>
							<input type="time" bind:value={flightFields.return_departure_time} class="w-full rounded-lg border border-input bg-background px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring" />
						</div>
						<div class="space-y-1">
							<label class="text-xs font-medium text-muted-foreground">Hora llegada</label>
							<input type="time" bind:value={flightFields.return_arrival_time} class="w-full rounded-lg border border-input bg-background px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring" />
						</div>
					</div>
				</div>

				<button
					onclick={async () => {
						const form = new FormData();
						for (const [k, v] of Object.entries(flightFields)) {
							form.set(k, v);
						}
						const res = await fetch('?/updateFlights', { method: 'POST', body: form });
						if (res.ok) {
							toast.success('Vuelos guardados');
							showFlightModal = false;
							invalidate();
						}
					}}
					class="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
				>
					Guardar vuelos
				</button>
			</div>
		</div>
	</div>
{/if}
