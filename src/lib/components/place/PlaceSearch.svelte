<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/button';
	import SearchIcon from '@lucide/svelte/icons/search';
	import XIcon from '@lucide/svelte/icons/x';
	import LoaderIcon from '@lucide/svelte/icons/loader-2';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';

	interface PlacePrediction {
		place_id: string;
		description: string;
		structured_formatting?: { main_text: string; secondary_text?: string };
	}

	interface PlaceDetails {
		lat: number;
		lng: number;
		name: string;
		address: string;
		photo_url?: string;
		rating?: number;
		category: string;
		website?: string;
		phone?: string;
		plus_code?: string;
	}

	let {
		dayId,
		onAdded,
		onPlaceSelected,
	}: {
		dayId: string;
		onAdded: () => void;
		onPlaceSelected?: (details: PlaceDetails & { google_place_id: string }) => void;
	} = $props();

	let query = $state('');
	let results = $state<PlacePrediction[]>([]);
	let loading = $state(false);
	let selectedPrediction: PlacePrediction | null = $state(null);
	let selectedDetails: PlaceDetails | null = $state(null);
	let fetchingDetails = $state(false);
	let visitDuration = $state(60);
	let notes = $state('');
	let error = $state('');

	let debounceTimer: ReturnType<typeof setTimeout>;

	function mapCategory(types: string[]): string {
		if (types.includes('restaurant') || types.includes('food')) return 'restaurant';
		if (types.includes('lodging') || types.includes('hotel')) return 'hotel';
		if (types.includes('museum') || types.includes('art_gallery')) return 'attraction';
		if (types.includes('park') || types.includes('amusement_park')) return 'attraction';
		if (types.includes('cafe') || types.includes('bar')) return 'restaurant';
		if (types.includes('store') || types.includes('shopping_mall')) return 'shopping';
		if (types.includes('bus_station') || types.includes('train_station') || types.includes('airport')) return 'transport';
		return 'place';
	}

	async function searchPlaces(q: string) {
		if (q.length < 3) {
			results = [];
			return;
		}
		loading = true;
		try {
			const res = await fetch(`/api/google/places?q=${encodeURIComponent(q)}`);
			const json = await res.json();
			results = json.predictions || [];
		} catch {
			results = [];
		}
		loading = false;
	}

	function onInput(e: Event) {
		const val = (e.target as HTMLInputElement).value;
		query = val;
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => searchPlaces(val), 300);
	}

	async function selectPlace(prediction: PlacePrediction) {
		selectedPrediction = prediction;
		query = prediction.description;
		results = [];
		fetchingDetails = true;
		try {
			const res = await fetch(`/api/google/places?place_id=${prediction.place_id}`);
			const data = await res.json();
			const loc = data.result?.geometry?.location;
			if (loc) {
				const photos = data.result?.photos;
				const photoRef = photos?.[0]?.photo_reference;
				const photoUrl = photoRef
					? `/api/google/photo?ref=${encodeURIComponent(photoRef)}&maxwidth=800`
					: undefined;

				selectedDetails = {
					lat: loc.lat,
					lng: loc.lng,
					name:
						data.result.name ||
						prediction.structured_formatting?.main_text ||
						prediction.description,
					address: data.result.formatted_address || prediction.description,
					photo_url: photoUrl,
					rating: data.result.rating,
					category: mapCategory(data.result.types || []),
					website: data.result.website,
					phone: data.result.formatted_phone_number,
					plus_code: data.result.plus_code?.global_code || '',
				};

				if (onPlaceSelected) {
					onPlaceSelected({ ...selectedDetails, google_place_id: prediction.place_id });
					fetchingDetails = false;
					return;
				}
			} else {
				error = 'No se pudieron obtener las coordenadas';
			}
		} catch {
			error = 'Error al obtener detalles del lugar';
		}
		fetchingDetails = false;
	}

	async function handleSubmit() {
		if (!selectedPrediction || !selectedDetails) {
			error = 'Selecciona un lugar de las sugerencias';
			return;
		}

		error = '';
		const form = new FormData();
		form.set('day_id', dayId);
		form.set('name', selectedDetails.name);
		form.set('lat', selectedDetails.lat.toString());
		form.set('lng', selectedDetails.lng.toString());
		form.set('address', selectedDetails.address);
		form.set('google_place_id', selectedPrediction.place_id);
		if (selectedDetails.plus_code) form.set('plus_code', selectedDetails.plus_code);
		form.set('visit_duration', visitDuration.toString());
		form.set('notes', notes);
		if (selectedDetails.photo_url) form.set('photo_url', selectedDetails.photo_url);
		if (selectedDetails.rating) form.set('rating', selectedDetails.rating.toString());
		form.set('category', selectedDetails.category);
		if (selectedDetails.website) form.set('website', selectedDetails.website);
		if (selectedDetails.phone) form.set('phone', selectedDetails.phone);

		const res = await fetch('?/addPlace', { method: 'POST', body: form });
		if (res.ok) {
			toast.success('Lugar añadido');
			query = '';
			selectedPrediction = null;
			selectedDetails = null;
			notes = '';
			visitDuration = 60;
			onAdded();
		} else {
			const json = await res.json();
			error = json.error || 'Error al añadir el lugar';
		}
	}
</script>

<div class="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
	{#if error}
		<div class="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
	{/if}

	<div class="relative">
		<div class="relative">
			<SearchIcon class="absolute left-3 top-2.5 size-4 text-muted-foreground" />
			<input
				type="text"
				value={query}
				oninput={onInput}
				placeholder="Buscar un lugar..."
				class="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
			/>
			{#if loading}
				<LoaderIcon class="absolute right-3 top-2.5 size-4 animate-spin text-muted-foreground" />
			{/if}
		</div>
		{#if results.length > 0}
			<ul class="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg">
				{#each results as r (r.place_id)}
					<li>
						<button
							onclick={() => selectPlace(r)}
							class="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-accent"
						>
							<MapPinIcon class="size-4 shrink-0 text-muted-foreground" />
							<span class="min-w-0 truncate">
								<span class="font-medium">{r.structured_formatting?.main_text || r.description}</span>
								{#if r.structured_formatting?.secondary_text}
									<span class="text-muted-foreground"> — {r.structured_formatting.secondary_text}</span>
								{/if}
							</span>
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</div>

	{#if selectedPrediction}
		<div class="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
			{#if selectedDetails?.photo_url}
				<img src={selectedDetails.photo_url} alt="" class="size-12 rounded-md object-cover" />
			{:else}
				<div class="flex size-12 items-center justify-center rounded-md bg-primary/10">
					<MapPinIcon class="size-5 text-primary" />
				</div>
			{/if}
			<div class="min-w-0 flex-1">
				<div class="font-medium text-sm">
					{selectedPrediction.structured_formatting?.main_text || selectedPrediction.description}
				</div>
				{#if fetchingDetails}
					<span class="text-xs text-muted-foreground">Cargando detalles...</span>
				{:else if selectedDetails?.rating}
					<span class="text-xs text-muted-foreground">{selectedDetails.rating} ★</span>
				{/if}
			</div>
		</div>

		{#if selectedDetails}
			<div class="grid grid-cols-2 gap-3">
				<div class="space-y-1">
					<label for="duration" class="text-xs font-medium text-muted-foreground">Duración (min)</label>
					<input
						id="duration"
						type="number"
						bind:value={visitDuration}
						min="15"
						step="15"
						class="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
					/>
				</div>
				<div class="space-y-1">
					<label for="notes" class="text-xs font-medium text-muted-foreground">Notas</label>
					<input
						id="notes"
						type="text"
						bind:value={notes}
						placeholder="Opcional"
						class="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
					/>
				</div>
			</div>

			<Button class="w-full" onclick={handleSubmit}>
				Añadir al día
			</Button>
		{/if}
	{/if}
</div>
