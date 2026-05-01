<script lang="ts">
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
	}

	let { dayId, onAdded }: { dayId: string; onAdded: () => void } = $props();

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
				selectedDetails = {
					lat: loc.lat,
					lng: loc.lng,
					name:
						data.result.name ||
						prediction.structured_formatting?.main_text ||
						prediction.description,
					address: data.result.formatted_address || prediction.description,
				};
			} else {
				error = 'Could not get place coordinates';
			}
		} catch {
			error = 'Failed to fetch place details';
		}
		fetchingDetails = false;
	}

	async function handleSubmit() {
		if (!selectedPrediction || !selectedDetails) {
			error = 'Select a place from the suggestions';
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
		form.set('visit_duration', visitDuration.toString());
		form.set('notes', notes);

		const res = await fetch('?/addPlace', { method: 'POST', body: form });
		if (res.ok) {
			query = '';
			selectedPrediction = null;
			selectedDetails = null;
			notes = '';
			visitDuration = 60;
			onAdded();
		} else {
			const json = await res.json();
			error = json.error || 'Failed to add place';
		}
	}
</script>

<div class="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
	{#if error}
		<div class="rounded-md bg-destructive/10 p-2 text-sm text-destructive">{error}</div>
	{/if}

	<div class="relative">
		<input
			type="text"
			value={query}
			oninput={onInput}
			placeholder="Search for a place..."
			class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
		/>
		{#if loading}
			<div class="absolute right-3 top-2.5 text-xs text-muted-foreground">...</div>
		{/if}
		{#if results.length > 0}
			<ul class="absolute z-10 mt-1 w-full rounded-md border border-border bg-background shadow-lg">
				{#each results as r (r.place_id)}
					<li>
						<button
							onclick={() => selectPlace(r)}
							class="w-full px-3 py-2 text-left text-sm hover:bg-accent"
						>
							<span class="font-medium">{r.structured_formatting?.main_text || r.description}</span>
							{#if r.structured_formatting?.secondary_text}
								<span class="text-muted-foreground">
									— {r.structured_formatting.secondary_text}</span
								>
							{/if}
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</div>

	{#if selectedPrediction}
		<div class="flex items-center gap-2 text-sm text-primary">
			<span class="font-medium">Selected:</span>
			<span
				>{selectedPrediction.structured_formatting?.main_text ||
					selectedPrediction.description}</span
			>
			{#if fetchingDetails}
				<span class="text-muted-foreground">(loading coordinates...)</span>
			{/if}
		</div>

		{#if selectedDetails}
			<div class="grid grid-cols-2 gap-3">
				<div class="space-y-1">
					<label class="text-xs font-medium text-muted-foreground">Duration (min)</label>
					<input
						type="number"
						bind:value={visitDuration}
						min="15"
						step="15"
						class="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
					/>
				</div>
				<div class="space-y-1">
					<label class="text-xs font-medium text-muted-foreground">Notes</label>
					<input
						type="text"
						bind:value={notes}
						placeholder="Optional notes"
						class="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
					/>
				</div>
			</div>

			<button
				onclick={handleSubmit}
				class="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
			>
				Add to Day
			</button>
		{/if}
	{/if}
</div>
