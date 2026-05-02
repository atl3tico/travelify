<script lang="ts" generics="T extends Record<string, any>">
	import { toast } from 'svelte-sonner';
	import PlaceSearch from '$lib/components/place/PlaceSearch.svelte';
	import XIcon from '@lucide/svelte/icons/x';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import FileIcon from '@lucide/svelte/icons/paperclip';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import SearchIcon from '@lucide/svelte/icons/search';
	import LoaderIcon from '@lucide/svelte/icons/loader-2';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';

	interface Place {
		id: string;
		name: string;
		notes: string;
		description?: string;
		visit_duration: number;
		category: string;
		start_time?: string | null;
		ticket_url?: string | null;
		photo_url?: string | null;
		rating?: number | null;
		address?: string | null;
		lat: number;
		lng: number;
		day_id: string;
		flight_number?: string | null;
		airline?: string | null;
		origin?: string | null;
		destination?: string | null;
		arrival_time?: string | null;
	}

	let {
		place = null,
		dayId,
		days = [],
		onClose,
		onSaved,
	}: {
		place?: Place | null;
		dayId: string;
		days?: { id: string; date: string; title?: string | null }[];
		onClose: () => void;
		onSaved: () => void;
	} = $props();

	let isEdit = $derived(place !== null);
	let loading = $state(false);
	let selectedDayId = $state(place?.day_id ?? dayId);

	let selectedDetails: {
		name: string;
		lat: number;
		lng: number;
		address: string;
		photo_url?: string;
		rating?: number;
		category: string;
		website?: string;
		phone?: string;
		google_place_id?: string;
		description?: string;
	} | null = $state(null);

	let name = $state(place?.name ?? '');
	let visitDuration = $state(place?.visit_duration ?? 60);
	let notes = $state(place?.notes ?? '');
	let description = $state(place?.description ?? '');
	let startTime = $state(place?.start_time?.substring(0, 5) ?? '');
	let category = $state(place?.category ?? 'place');
	let ticketFile: File | null = $state(null);
	let ticketUrl = $state(place?.ticket_url ?? '');
	let error = $state('');
	let changingPlace = $state(false);

	let searchQuery = $state('');
	let searchResults: { place_id: string; description: string; structured_formatting?: { main_text: string; secondary_text?: string } }[] = $state([]);
	let searchLoading = $state(false);
	let autofillLoading = $state(false);

	const categoryDurations: Record<string, number> = {
		attraction: 90,
		restaurant: 60,
		hotel: 30,
		shopping: 45,
		transport: 30,
		place: 60,
	};

	async function autofillDetails() {
		if (!selectedDetails && !name) return;
		autofillLoading = true;

		const placeName = selectedDetails?.name || name;

		// Set duration based on category
		if (!visitDuration || visitDuration === 60) {
			visitDuration = categoryDurations[category] || 60;
		}

		// Fetch description from Wikipedia if not already set
		if (!description) {
			try {
				const langs = ['es', 'en', 'fr'];
				for (const lang of langs) {
					const res = await fetch(
						`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(placeName)}`
					);
					if (res.ok) {
						const data = await res.json();
						if (data.extract && lang === 'es') {
							description = data.extract;
							break;
						}
					}
				}
			} catch {}
		}

		autofillLoading = false;
	}
	let searchDebounce: ReturnType<typeof setTimeout>;

	const categories = [
		{ value: 'place', label: 'Lugar' },
		{ value: 'attraction', label: 'Atracción' },
		{ value: 'restaurant', label: 'Restaurante' },
		{ value: 'hotel', label: 'Hotel' },
		{ value: 'shopping', label: 'Compra' },
		{ value: 'transport', label: 'Transporte' },
	];

	function formatDateShort(dateStr: string) {
		const d = new Date(dateStr + 'T12:00:00');
		return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
	}

	function handlePlaceSelected(details: NonNullable<typeof selectedDetails>) {
		selectedDetails = details;
		name = details.name;
		category = details.category;
		visitDuration = categoryDurations[category] || 60;
	}

	async function searchAddress(q: string) {
		if (q.length < 3) { searchResults = []; return; }
		searchLoading = true;
		try {
			const res = await fetch(`/api/google/places?q=${encodeURIComponent(q)}`);
			const json = await res.json();
			searchResults = json.predictions || [];
		} catch { searchResults = []; }
		searchLoading = false;
	}

	function onSearchInput(e: Event) {
		const val = (e.target as HTMLInputElement).value;
		searchQuery = val;
		clearTimeout(searchDebounce);
		searchDebounce = setTimeout(() => searchAddress(val), 300);
	}

	async function selectSearchResult(prediction: typeof searchResults[0]) {
		searchLoading = true;
		try {
			const res = await fetch(`/api/google/places?place_id=${prediction.place_id}`);
			const data = await res.json();
			const loc = data.result?.geometry?.location;
			if (loc) {
				const photos = data.result?.photos;
				const photoRef = photos?.[0]?.photo_reference;
				let photoUrl = photoRef ? `/api/google/photo?ref=${encodeURIComponent(photoRef)}&maxwidth=800` : undefined;
				let editorialSummary = data.result?.editorial_summary?.overview || '';

				if (!photoUrl || !editorialSummary) {
					try {
						const placeName = data.result.name || prediction.structured_formatting?.main_text || prediction.description;
						const wikiRes = await fetch(`/api/unsplash?q=${encodeURIComponent(placeName)}`);
						const wikiData = await wikiRes.json();
						if (!photoUrl && wikiData.url) {
							photoUrl = wikiData.url;
						}
						if (!editorialSummary && wikiData.description) {
							editorialSummary = wikiData.description;
						}
					} catch {}
				}

				selectedDetails = {
					lat: loc.lat,
					lng: loc.lng,
					name: data.result.name || prediction.structured_formatting?.main_text || prediction.description,
					address: data.result.formatted_address || prediction.description,
					photo_url: photoUrl,
					rating: data.result.rating,
					category: mapCategory(data.result.types || []),
					website: data.result.website,
					phone: data.result.formatted_phone_number,
					google_place_id: prediction.place_id,
					description: editorialSummary,
				};
				name = selectedDetails.name;
				category = selectedDetails.category;
				if (editorialSummary && !description) {
					description = editorialSummary;
				}
				if (!visitDuration || visitDuration === 60) {
					visitDuration = categoryDurations[category] || 60;
				}
				changingPlace = false;
			}
		} catch { }
		searchLoading = false;
		searchResults = [];
		searchQuery = '';
	}

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

	async function handleSubmit() {
		loading = true;
		error = '';

		if (isEdit && place) {
			const form = new FormData();
			form.set('place_id', place.id);
			form.set('name', name);
			form.set('visit_duration', visitDuration.toString());
			form.set('notes', notes);
			form.set('description', description);
			form.set('start_time', startTime);
			form.set('category', category);
			if (selectedDayId !== place.day_id) form.set('day_id', selectedDayId);
			if (ticketFile) form.set('ticket_file', ticketFile);
			if (selectedDetails) {
				form.set('lat', selectedDetails.lat.toString());
				form.set('lng', selectedDetails.lng.toString());
				form.set('address', selectedDetails.address);
				if (selectedDetails.google_place_id) form.set('google_place_id', selectedDetails.google_place_id);
				if (selectedDetails.photo_url) form.set('photo_url', selectedDetails.photo_url);
				if (selectedDetails.description) form.set('description', selectedDetails.description);
				if (selectedDetails.rating) form.set('rating', selectedDetails.rating.toString());
			}

			const res = await fetch('?/updatePlace', { method: 'POST', body: form });
			loading = false;
			if (res.ok) {
				toast.success('Actividad actualizada');
				onSaved();
				onClose();
			} else {
				error = 'Error al guardar';
			}
		} else {
			if (!selectedDetails) {
				error = 'Selecciona un lugar';
				loading = false;
				return;
			}

			const form = new FormData();
			form.set('day_id', dayId);
			form.set('name', selectedDetails.name);
			form.set('lat', selectedDetails.lat.toString());
			form.set('lng', selectedDetails.lng.toString());
			form.set('address', selectedDetails.address);
			if (selectedDetails.google_place_id) form.set('google_place_id', selectedDetails.google_place_id);
			form.set('visit_duration', visitDuration.toString());
			form.set('notes', notes);
			form.set('description', description);
			form.set('start_time', startTime);
			form.set('category', category);
			if (selectedDetails.photo_url) form.set('photo_url', selectedDetails.photo_url);
			if (selectedDetails.description) form.set('description', selectedDetails.description);
			if (selectedDetails.rating) form.set('rating', selectedDetails.rating.toString());
			if (selectedDetails.website) form.set('website', selectedDetails.website);
			if (selectedDetails.phone) form.set('phone', selectedDetails.phone);
			if (ticketFile) form.set('ticket_file', ticketFile);

			const res = await fetch('?/addPlace', { method: 'POST', body: form });
			loading = false;
			if (res.ok) {
				toast.success('Actividad añadida');
				onSaved();
				onClose();
			} else {
				error = 'Error al añadir';
			}
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onClose();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onclick={onClose}>
	<div
		class="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-background shadow-2xl"
		onclick={(e) => e.stopPropagation()}
	>
		<div class="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background px-5 py-4">
			<h2 class="text-lg font-semibold">{isEdit ? 'Editar actividad' : 'Nueva actividad'}</h2>
			<button class="rounded-md p-1.5 hover:bg-accent" onclick={onClose}>
				<XIcon class="size-5" />
			</button>
		</div>

		<div class="space-y-4 p-5 pb-8">
			{#if error}
				<div class="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
			{/if}

			{#if isEdit}
				<div class="space-y-1">
					<label class="text-sm font-medium">Nombre</label>
					<input
						type="text"
						bind:value={name}
						class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
					/>
				</div>

				<div class="space-y-1">
					<label class="flex items-center gap-1 text-sm font-medium">
						<MapPinIcon class="size-3.5" />
						Ubicación
					</label>
					{#if selectedDetails}
						<div class="flex items-center gap-2 rounded-lg border border-border bg-primary/5 p-2.5">
							<MapPinIcon class="size-4 shrink-0 text-primary" />
							<div class="min-w-0 flex-1">
								<div class="text-sm font-medium">{selectedDetails.name}</div>
								<div class="text-xs text-muted-foreground truncate">{selectedDetails.address}</div>
							</div>
							<button
								type="button"
								onclick={() => { selectedDetails = null; changingPlace = true; }}
								class="text-xs text-muted-foreground hover:text-foreground whitespace-nowrap"
							>
								Cambiar
							</button>
						</div>
					{:else if changingPlace}
						<div class="relative">
							<SearchIcon class="absolute left-3 top-2.5 size-4 text-muted-foreground" />
							<input
								type="text"
								value={searchQuery}
								oninput={onSearchInput}
								placeholder="Buscar nueva ubicación..."
								class="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
							/>
							{#if searchLoading}
								<LoaderIcon class="absolute right-3 top-2.5 size-4 animate-spin text-muted-foreground" />
							{/if}
							{#if searchResults.length > 0}
								<ul class="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg">
									{#each searchResults as r (r.place_id)}
										<li>
											<button
												type="button"
												onclick={() => selectSearchResult(r)}
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
						{#if place?.address}
							<button
								type="button"
								onclick={() => { changingPlace = false; searchResults = []; searchQuery = ''; }}
								class="text-xs text-muted-foreground hover:text-foreground"
							>
								Cancelar
							</button>
						{/if}
					{:else}
						<div class="flex items-center gap-2 rounded-lg border border-border p-2.5">
							<MapPinIcon class="size-4 shrink-0 text-muted-foreground" />
							<span class="flex-1 text-sm text-muted-foreground truncate">{place?.address || 'Sin dirección'}</span>
							<button
								type="button"
								onclick={() => (changingPlace = true)}
								class="text-xs text-primary hover:underline whitespace-nowrap"
							>
								Cambiar
							</button>
						</div>
					{/if}
				</div>

				<div class="space-y-1">
					<label class="flex items-center gap-1 text-sm font-medium">
						<CalendarIcon class="size-3.5" />
						Día
					</label>
					<select
						bind:value={selectedDayId}
						class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
					>
						{#each days as d, i (d.id)}
							<option value={d.id}>
								Día {i + 1} — {formatDateShort(d.date)}{d.title ? ` · ${d.title}` : ''}
							</option>
						{/each}
					</select>
				</div>
			{:else}
				{#if selectedDetails}
					<div class="flex items-center gap-3 rounded-lg border border-border p-3">
						{#if selectedDetails.photo_url}
							<img src={selectedDetails.photo_url} alt="" class="size-12 rounded-lg object-cover" />
						{/if}
						<div class="min-w-0 flex-1">
							<div class="font-medium">{selectedDetails.name}</div>
							<div class="text-xs text-muted-foreground truncate">{selectedDetails.address}</div>
							{#if selectedDetails.rating}
								<span class="text-xs text-yellow-500">{selectedDetails.rating} ★</span>
							{/if}
						</div>
						<button
							class="text-xs text-muted-foreground hover:text-foreground"
							onclick={() => (selectedDetails = null)}
						>
							Cambiar
						</button>
					</div>
				{:else}
					<PlaceSearch dayId={dayId} onAdded={() => {}} onPlaceSelected={handlePlaceSelected} />
				{/if}
			{/if}

			{#if isEdit || selectedDetails}
				<div class="space-y-1">
					<label class="text-sm font-medium">Categoría</label>
					<div class="flex flex-wrap gap-2">
						{#each categories as cat (cat.value)}
							<button
								type="button"
								onclick={() => (category = cat.value)}
								class="rounded-full border px-3 py-1 text-xs transition-colors {category === cat.value
									? 'border-primary bg-primary text-primary-foreground'
									: 'border-border hover:border-primary/30'}"
							>
								{cat.label}
							</button>
						{/each}
					</div>
				</div>

				<div class="grid grid-cols-2 gap-3">
					<div class="space-y-1">
						<label class="flex items-center gap-1 text-sm font-medium">
							<ClockIcon class="size-3.5" />
							Hora
						</label>
						<input
							type="time"
							bind:value={startTime}
							class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
						/>
					</div>
					<div class="space-y-1">
						<label class="text-sm font-medium">Duración (min)</label>
						<input
							type="number"
							bind:value={visitDuration}
							min="15"
							step="15"
							class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
						/>
					</div>
				</div>

				<div class="space-y-1">
					<div class="flex items-center justify-between">
						<label class="text-sm font-medium">Descripción</label>
						<button
							type="button"
							onclick={autofillDetails}
							disabled={autofillLoading || (!selectedDetails && !name)}
							class="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10 disabled:opacity-30 disabled:cursor-not-allowed"
						>
							{#if autofillLoading}
								<LoaderIcon class="size-3 animate-spin" />
							{:else}
								<SparklesIcon class="size-3" />
							{/if}
							Autocompletar
						</button>
					</div>
					<textarea
						bind:value={description}
						rows="2"
						placeholder="Notas sobre la actividad..."
						class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
					></textarea>
				</div>

				<div class="space-y-1">
					<label class="text-sm font-medium">Notas rápidas</label>
					<input
						type="text"
						bind:value={notes}
						placeholder="Notas breves..."
						class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
					/>
				</div>

				<div class="space-y-1">
					<label class="flex items-center gap-1 text-sm font-medium">
						<FileIcon class="size-3.5" />
						Entradas / Tickets
					</label>
					{#if ticketUrl}
						<div class="flex items-center gap-2 rounded-lg border border-border p-2">
							<FileIcon class="size-4 text-primary" />
							<a href={ticketUrl} target="_blank" rel="noopener" class="text-sm text-primary underline truncate flex-1">
								Ver entrada actual
							</a>
							<button
								type="button"
								onclick={() => (ticketUrl = '')}
								class="rounded p-1 text-muted-foreground hover:text-destructive"
							>
								<TrashIcon class="size-3.5" />
							</button>
						</div>
					{/if}
					<input
						type="file"
						accept="image/*,.pdf"
						onchange={(e) => {
							const input = e.target as HTMLInputElement;
							ticketFile = input.files?.[0] ?? null;
						}}
						class="w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary hover:file:bg-primary/20"
					/>
				</div>

				<button
					onclick={handleSubmit}
					disabled={loading}
					class="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
				>
					{loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Añadir actividad'}
				</button>
			{/if}
		</div>
	</div>
</div>
