<script lang="ts">
	import { getSupabaseBrowserClient } from '$lib/supabase/client';
	import { goto } from '$app/navigation';

	let name = $state('');
	let destination = $state('');
	let accommodation = $state('');
	let startDate = $state('');
	let endDate = $state('');
	let error = $state('');
	let loading = $state(false);

	const supabase = getSupabaseBrowserClient();

	async function handleCreate() {
		loading = true;
		error = '';

		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) {
			error = 'Not authenticated';
			loading = false;
			return;
		}

		const { data: trip, error: err } = await supabase
			.from('trips')
			.insert({
				user_id: user.id,
				name,
				destination,
				accommodation_name: accommodation || null,
				start_date: startDate,
				end_date: endDate,
			})
			.select('id')
			.single();

		if (err) {
			error = err.message;
			loading = false;
		} else {
			goto(`/trips/${trip.id}`);
		}
	}
</script>

<div class="mx-auto max-w-lg space-y-6">
	<div>
		<h1 class="text-2xl font-bold">New Trip</h1>
		<p class="mt-1 text-sm text-muted-foreground">Plan your next adventure</p>
	</div>

	<form
		onsubmit={(e) => {
			e.preventDefault();
			handleCreate();
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
				placeholder="Weekend in Paris"
				required
				class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
			/>
		</div>

		<div class="space-y-2">
			<label for="destination" class="text-sm font-medium">Destination</label>
			<input
				id="destination"
				type="text"
				bind:value={destination}
				placeholder="Paris, France"
				required
				class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
			/>
		</div>

		<div class="space-y-2">
			<label for="accommodation" class="text-sm font-medium">Accommodation (optional)</label>
			<input
				id="accommodation"
				type="text"
				bind:value={accommodation}
				placeholder="Hotel name or address"
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
				href="/dashboard"
				class="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-accent"
			>
				Cancel
			</a>
			<button
				type="submit"
				disabled={loading}
				class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
			>
				{loading ? 'Creating...' : 'Create Trip'}
			</button>
		</div>
	</form>
</div>
