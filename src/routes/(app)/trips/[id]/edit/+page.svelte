<script lang="ts">
	let { data } = $props();
	let name = $state(data.trip.name);
	let destination = $state(data.trip.destination);
	let accommodation = $state(data.trip.accommodation_name || '');
	let startDate = $state(data.trip.start_date);
	let endDate = $state(data.trip.end_date);
	let error = $state('');
	let loading = $state(false);

	async function handleSave() {
		loading = true;
		error = '';
		const form = new FormData();
		form.set('name', name);
		form.set('destination', destination);
		form.set('accommodation_name', accommodation);
		form.set('start_date', startDate);
		form.set('end_date', endDate);
		await fetch('?/default', { method: 'POST', body: form });
		loading = false;
	}
</script>

<div class="mx-auto max-w-lg space-y-6">
	<div>
		<h1 class="text-2xl font-bold">Edit Trip</h1>
		<p class="mt-1 text-sm text-muted-foreground">Update trip details</p>
	</div>

	<form
		onsubmit={(e) => {
			e.preventDefault();
			handleSave();
		}}
		class="space-y-4"
	>
		{#if error}
			<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
		{/if}

		<div class="space-y-2">
			<label for="name" class="text-sm font-medium">Trip name</label>
			<input
				id="name"
				type="text"
				bind:value={name}
				required
				class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
			/>
		</div>

		<div class="space-y-2">
			<label for="dest" class="text-sm font-medium">Destination</label>
			<input
				id="dest"
				type="text"
				bind:value={destination}
				required
				class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
			/>
		</div>

		<div class="space-y-2">
			<label for="acc" class="text-sm font-medium">Accommodation</label>
			<input
				id="acc"
				type="text"
				bind:value={accommodation}
				class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
			/>
		</div>

		<div class="grid grid-cols-2 gap-4">
			<div class="space-y-2">
				<label for="start" class="text-sm font-medium">Start date</label>
				<input
					id="start"
					type="date"
					bind:value={startDate}
					required
					class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
				/>
			</div>
			<div class="space-y-2">
				<label for="end" class="text-sm font-medium">End date</label>
				<input
					id="end"
					type="date"
					bind:value={endDate}
					required
					class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
				/>
			</div>
		</div>

		<div class="flex gap-3">
			<a
				href="/trips/{data.trip.id}"
				class="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-accent"
				>Cancel</a
			>
			<button
				type="submit"
				disabled={loading}
				class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
			>
				{loading ? 'Saving...' : 'Save Changes'}
			</button>
		</div>
	</form>
</div>
