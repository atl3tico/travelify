<script lang="ts">
	import { Button } from '$lib/button';
	import { getCityImage } from '$lib/utils/city-images';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import UsersIcon from '@lucide/svelte/icons/users';

	let { data } = $props();
	let trips = $derived(data.trips);
	let today = new Date().toISOString().split('T')[0];

	function formatDate(dateStr: string) {
		return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-ES', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
		});
	}

	function dayCount(start: string, end: string) {
		const diff = new Date(end).getTime() - new Date(start).getTime();
		return Math.round(diff / (1000 * 60 * 60 * 24)) + 1;
	}

	function getStatus(start: string, end: string) {
		if (start > today) return 'Próximo';
		if (end < today) return 'Pasado';
		return 'En curso';
	}

	function getStatusColor(status: string) {
		if (status === 'Próximo') return 'bg-primary/10 text-primary';
		if (status === 'En curso') return 'bg-green-500/10 text-green-600 dark:text-green-400';
		return 'bg-muted text-muted-foreground';
	}
</script>

<svelte:head>
	<title>Mis viajes — Travelify</title>
</svelte:head>

<div class="space-y-8">
	<div class="flex flex-wrap items-center justify-between gap-2">
		<div>
			<h1 class="text-2xl font-bold bg-gradient-to-r from-sky-500 to-indigo-500 bg-clip-text text-transparent">Mis viajes</h1>
			<p class="text-sm text-muted-foreground">Planifica y organiza tus aventuras</p>
		</div>
		<Button href="/trips/new" class="bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 text-white border-0">
			<PlusIcon class="size-4" />
			Nuevo viaje
		</Button>
	</div>

	{#if trips.length === 0}
		<div class="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20">
			<MapPinIcon class="mb-4 size-12 text-muted-foreground/50" />
			<h2 class="text-lg font-medium">Sin viajes todavía</h2>
			<p class="mt-1 text-sm text-muted-foreground">Crea tu primer viaje y empieza a planificar</p>
			<Button class="mt-6 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 text-white border-0" href="/trips/new">
				<PlusIcon class="size-4" />
				Crear viaje
			</Button>
		</div>
	{:else}
		<div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
			{#each trips as trip (trip.id)}
				{@const status = getStatus(trip.start_date, trip.end_date)}
				<a
					href="/trips/{trip.id}"
					class="group block overflow-hidden rounded-xl border border-border transition-all hover:border-primary/30 hover:shadow-lg"
				>
					<div class="relative h-40 overflow-hidden">
						<img
							src={trip.cover_photo_url || getCityImage(trip.destination)}
							alt={trip.destination}
							class="h-full w-full object-cover transition-transform group-hover:scale-105"
							loading="lazy"
						/>
						<div class="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
						<div class="absolute right-2 top-2">
							<span class="rounded-full px-2.5 py-0.5 text-xs font-medium {getStatusColor(status)}">
								{status}
							</span>
						</div>
					</div>
					<div class="p-4">
						<h3 class="font-semibold group-hover:text-primary">{trip.name}</h3>
						<p class="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
							<MapPinIcon class="size-3.5" />
							{trip.destination}
						</p>
						<div class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
							<span class="flex items-center gap-1">
								<CalendarIcon class="size-3" />
								{formatDate(trip.start_date)} — {formatDate(trip.end_date)}
							</span>
							<span>{dayCount(trip.start_date, trip.end_date)} días</span>
							{#if trip.num_travelers > 1}
								<span class="flex items-center gap-1">
									<UsersIcon class="size-3" />
									{trip.num_travelers}
								</span>
							{/if}
						</div>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>
