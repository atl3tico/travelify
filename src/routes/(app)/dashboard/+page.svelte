<script lang="ts">
	let { data } = $props();
	let trips = $derived(data.trips);
	let today = new Date().toISOString().split('T')[0];

	function formatDate(dateStr: string) {
		return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
		});
	}

	function dayCount(start: string, end: string) {
		const diff = new Date(end).getTime() - new Date(start).getTime();
		return Math.round(diff / (1000 * 60 * 60 * 24)) + 1;
	}

	function isUpcoming(start: string) {
		return start >= today;
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold">My Trips</h1>
		<a
			href="/trips/new"
			class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
		>
			+ New Trip
		</a>
	</div>

	{#if trips.length === 0}
		<div class="rounded-lg border border-dashed border-border p-12 text-center">
			<h2 class="text-lg font-medium">No trips yet</h2>
			<p class="mt-1 text-sm text-muted-foreground">Create your first trip and start planning!</p>
			<a
				href="/trips/new"
				class="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
			>
				Create Trip
			</a>
		</div>
	{:else}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each trips as trip (trip.id)}
				<a
					href="/trips/{trip.id}"
					class="group block rounded-lg border border-border p-4 transition-colors hover:border-primary/50 hover:bg-accent"
				>
					<div class="flex items-start justify-between">
						<h3 class="font-medium group-hover:text-primary">{trip.name}</h3>
						{#if isUpcoming(trip.start_date)}
							<span class="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
								>Upcoming</span
							>
						{/if}
					</div>
					<p class="mt-1 text-sm text-muted-foreground">{trip.destination}</p>
					<div class="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
						<span>{formatDate(trip.start_date)} — {formatDate(trip.end_date)}</span>
						<span>{dayCount(trip.start_date, trip.end_date)} days</span>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>
