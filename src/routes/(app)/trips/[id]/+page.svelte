<script lang="ts">
	import type { PageData } from './$types';
	import PlaceSearch from '$lib/components/place/PlaceSearch.svelte';
	import RouteMap from '$lib/components/map/RouteMap.svelte';
	import { invalidateAll } from '$app/navigation';

	let { data }: { data: PageData } = $props();
	let activeDayIndex = $state(0);
	let days = $derived(data.days);
	let places = $derived(data.places);
	let activeDay = $derived(days[activeDayIndex]);
	let activePlaces = $derived(
		places
			.filter((p: { day_id: string }) => p.day_id === activeDay?.id)
			.sort(
				(a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index
			)
	);

	let showAddPlace = $state(false);
	let dragIndex = $state<number | null>(null);

	async function handleModeChange(dayId: string, mode: string) {
		const form = new FormData();
		form.set('day_id', dayId);
		form.set('travel_mode', mode);
		await fetch('?/updateTravelMode', { method: 'POST', body: form });
	}

	function formatDate(dateStr: string) {
		return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
		});
	}

	async function removePlace(placeId: string) {
		const form = new FormData();
		form.set('place_id', placeId);
		await fetch('?/removePlace', { method: 'POST', body: form });
		invalidate();
	}

	async function handleReorder() {
		if (dragIndex === null) return;
		const items = [...activePlaces];
		const [moved] = items.splice(dragIndex, 1);
		const toIndex = dragIndex;
		items.splice(toIndex, 0, moved);
		const orders = items.map((p: { id: string }, i: number) => ({ id: p.id, order_index: i }));
		const form = new FormData();
		form.set('orders', JSON.stringify(orders));
		await fetch('?/reorderPlaces', { method: 'POST', body: form });
		dragIndex = null;
		invalidate();
	}

	async function invalidate() {
		await invalidateAll();
	}

	async function handleDeleteTrip() {
		if (!confirm('Delete this trip and all its data?')) return;
		const form = new FormData();
		await fetch('?/deleteTrip', { method: 'POST', body: form });
	}
</script>

<div class="space-y-6">
	<div class="flex items-start justify-between">
		<div>
			<h1 class="text-2xl font-bold">{data.trip.name}</h1>
			<p class="text-sm text-muted-foreground">
				{data.trip.destination} &middot; {formatDate(data.trip.start_date)} — {formatDate(
					data.trip.end_date
				)}
			</p>
		</div>
		<div class="flex gap-2">
			<a
				href="/trips/{data.trip.id}/edit"
				class="rounded-md border border-input px-3 py-1.5 text-sm hover:bg-accent"
			>
				Edit
			</a>
			<button
				onclick={handleDeleteTrip}
				class="rounded-md border border-destructive/50 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10"
			>
				Delete
			</button>
		</div>
	</div>

	<div class="flex gap-1 overflow-x-auto border-b border-border pb-px">
		{#each days as day, i (day.id)}
			<button
				onclick={() => (activeDayIndex = i)}
				class="shrink-0 rounded-t-md px-4 py-2 text-sm transition-colors {activeDayIndex === i
					? 'bg-accent font-medium text-accent-foreground'
					: 'text-muted-foreground hover:text-foreground'}"
			>
				<div class="text-xs">Day {day.day_index}</div>
				<div>{formatDate(day.date)}</div>
			</button>
		{/each}
	</div>

	{#if activeDay}
		<div class="grid gap-6 lg:grid-cols-[1fr_400px]">
			<div class="space-y-4">
				<div class="flex items-center justify-between">
					<h2 class="font-medium">
						Places ({activePlaces.length})
					</h2>
					<button
						onclick={() => (showAddPlace = !showAddPlace)}
						class="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90"
					>
						{showAddPlace ? 'Cancel' : '+ Add Place'}
					</button>
				</div>

				{#if showAddPlace}
					<PlaceSearch dayId={activeDay.id} onAdded={invalidate} />
				{/if}

				{#if activePlaces.length === 0}
					<div class="rounded-lg border border-dashed border-border p-8 text-center">
						<p class="text-sm text-muted-foreground">No places yet. Add your first stop!</p>
					</div>
				{:else}
					<div class="space-y-2">
						{#each activePlaces as place, i (place.id)}
							<div
								class="group flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:border-primary/30"
								draggable="true"
								ondragstart={() => (dragIndex = i)}
								ondragover={(e) => e.preventDefault()}
								ondrop={() => handleReorder()}
								role="listitem"
							>
								<span
									class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary"
								>
									{i + 1}
								</span>
								<div class="min-w-0 flex-1">
									<div class="font-medium">{place.name}</div>
									{#if place.address}
										<div class="truncate text-xs text-muted-foreground">{place.address}</div>
									{/if}
									<div class="mt-0.5 flex gap-3 text-xs text-muted-foreground">
										{#if place.visit_duration}
											<span>{place.visit_duration} min</span>
										{/if}
										{#if place.notes}
											<span>{place.notes}</span>
										{/if}
									</div>
								</div>
								<button
									onclick={() => removePlace(place.id)}
									class="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
									title="Remove place"
								>
									✕
								</button>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<div class="hidden lg:block">
				<div class="sticky top-6 h-[500px] rounded-lg border border-border">
					<RouteMap
						places={activePlaces}
						accommodationLat={data.trip.accommodation_lat}
						accommodationLng={data.trip.accommodation_lng}
						initialMode={activeDay?.travel_mode || 'walking'}
						onModeChange={(mode) => handleModeChange(activeDay.id, mode)}
					/>
				</div>
			</div>
		</div>
	{/if}
</div>
