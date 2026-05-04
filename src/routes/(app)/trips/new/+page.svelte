<script lang="ts">
	import { getSupabaseBrowserClient } from '$lib/supabase/client';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/button';

	let name = $state('');
	let destination = $state('');
	let accommodation = $state('');
	let startDate = $state('');
	let endDate = $state('');
	let travelers = $state(1);
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
			error = 'No autenticado';
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
				num_travelers: travelers,
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

<svelte:head>
	<title>Nuevo viaje — TRAVELy</title>
</svelte:head>

<div class="mx-auto max-w-lg space-y-6">
	<div>
		<h1 class="text-2xl font-bold bg-gradient-to-r from-brand-blue to-brand-orange bg-clip-text text-transparent">Nuevo viaje</h1>
		<p class="mt-1 text-sm text-muted-foreground">Planifica tu próxima aventura</p>
	</div>

	<form
		onsubmit={(e) => {
			e.preventDefault();
			handleCreate();
		}}
		class="space-y-5"
	>
		{#if error}
			<div class="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
		{/if}

		<div class="space-y-2">
			<label for="name" class="text-sm font-medium">Nombre del viaje</label>
			<input
				id="name"
				type="text"
				bind:value={name}
				placeholder="Fin de semana en París"
				required
				class="w-full rounded-lg border border-input bg-background px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring"
			/>
		</div>

		<div class="space-y-2">
			<label for="destination" class="text-sm font-medium">Destino</label>
			<input
				id="destination"
				type="text"
				bind:value={destination}
				placeholder="París, Francia"
				required
				class="w-full rounded-lg border border-input bg-background px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring"
			/>
		</div>

		<div class="space-y-2">
			<label for="accommodation" class="text-sm font-medium">Alojamiento (opcional)</label>
			<input
				id="accommodation"
				type="text"
				bind:value={accommodation}
				placeholder="Nombre o dirección del hotel"
				class="w-full rounded-lg border border-input bg-background px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring"
			/>
		</div>

		<div class="grid grid-cols-2 gap-4">
			<div class="space-y-2">
				<label for="start" class="text-sm font-medium">Fecha inicio</label>
				<input
					id="start"
					type="date"
					bind:value={startDate}
					required
					class="w-full rounded-lg border border-input bg-background px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring"
				/>
			</div>
			<div class="space-y-2">
				<label for="end" class="text-sm font-medium">Fecha fin</label>
				<input
					id="end"
					type="date"
					bind:value={endDate}
					required
					class="w-full rounded-lg border border-input bg-background px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring"
				/>
			</div>
		</div>

		<div class="space-y-2">
			<label for="travelers" class="text-sm font-medium">Viajeros</label>
			<input
				id="travelers"
				type="number"
				bind:value={travelers}
				min="1"
				max="20"
				class="w-full rounded-lg border border-input bg-background px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring"
			/>
		</div>

		<div class="flex gap-3 pt-2">
			<Button variant="outline" href="/dashboard">Cancelar</Button>
			<Button type="submit" disabled={loading} class="bg-gradient-to-r from-brand-blue to-brand-orange hover:from-brand-orange-dark hover:to-brand-blue-dark text-white border-0">
				{loading ? 'Creando...' : 'Crear viaje'}
			</Button>
		</div>
	</form>
</div>
