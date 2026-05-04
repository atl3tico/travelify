<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { invalidateAll } from '$app/navigation';
	import { Button } from '$lib/button';
	import BedIcon from '@lucide/svelte/icons/bed';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import XIcon from '@lucide/svelte/icons/x';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import CheckIcon from '@lucide/svelte/icons/check';

	let { data } = $props();
	// svelte-ignore state_referenced_locally
	let snap = $state.snapshot(data);

	let name = $state(snap.trip.name);
	let destination = $state(snap.trip.destination);
	let startDate = $state(snap.trip.start_date);
	let endDate = $state(snap.trip.end_date);
	let travelers = $state(snap.trip.num_travelers || 1);
	let description = $state(snap.trip.description || '');
	let error = $state('');
	let loading = $state(false);

	let accommodations = $state(snap.accommodations);
	let showAddAcc = $state(false);
	let newAccName = $state('');
	let newAccStart = $state(snap.trip.start_date);
	let newAccEnd = $state(snap.trip.end_date);
	let editingAccId = $state<string | null>(null);
	let editAccName = $state('');
	let editAccStart = $state('');
	let editAccEnd = $state('');

	$effect(() => {
		accommodations = data.accommodations;
	});

	async function handleSave() {
		loading = true;
		error = '';
		const form = new FormData();
		form.set('name', name);
		form.set('destination', destination);
		form.set('start_date', startDate);
		form.set('end_date', endDate);
		form.set('num_travelers', travelers.toString());
		form.set('description', description);
		const res = await fetch('?/save', { method: 'POST', body: form });
		loading = false;
		if (res.ok) {
			toast.success('Viaje guardado');
			await invalidateAll();
		} else {
			toast.error('Error al guardar');
		}
	}

	async function addAccommodation() {
		if (!newAccName || !newAccStart || !newAccEnd) return;
		const form = new FormData();
		form.set('acc_name', newAccName);
		form.set('acc_start_date', newAccStart);
		form.set('acc_end_date', newAccEnd);
		const res = await fetch('?/addAccommodation', { method: 'POST', body: form });
		if (res.ok) {
			toast.success('Alojamiento añadido');
			newAccName = '';
			showAddAcc = false;
			await invalidateAll();
		}
	}

	async function removeAccommodation(id: string) {
		const form = new FormData();
		form.set('acc_id', id);
		const res = await fetch('?/removeAccommodation', { method: 'POST', body: form });
		if (res.ok) {
			toast.success('Alojamiento eliminado');
			accommodations = accommodations.filter((a: { id: string }) => a.id !== id);
			if (editingAccId === id) editingAccId = null;
		}
	}

	function startEditAcc(acc: { id: string; name: string; start_date: string; end_date: string }) {
		editingAccId = acc.id;
		editAccName = acc.name;
		editAccStart = acc.start_date;
		editAccEnd = acc.end_date;
	}

	function cancelEditAcc() {
		editingAccId = null;
	}

	async function saveEditAcc() {
		if (!editingAccId || !editAccName || !editAccStart || !editAccEnd) return;
		const form = new FormData();
		form.set('acc_id', editingAccId);
		form.set('acc_name', editAccName);
		form.set('acc_start_date', editAccStart);
		form.set('acc_end_date', editAccEnd);
		const res = await fetch('?/updateAccommodation', { method: 'POST', body: form });
		if (res.ok) {
			toast.success('Alojamiento actualizado');
			accommodations = accommodations.map((a: { id: string }) =>
				a.id === editingAccId
					? { ...a, name: editAccName, start_date: editAccStart, end_date: editAccEnd }
					: a
			);
			editingAccId = null;
		} else {
			toast.error('Error al actualizar');
		}
	}

	function formatDateShort(dateStr: string) {
		return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-ES', {
			month: 'short',
			day: 'numeric',
		});
	}

	function nightCount(start: string, end: string) {
		return Math.round((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24));
	}
</script>

<svelte:head>
	<title>Editar {data.trip.name} — TRAVELy</title>
</svelte:head>

<div class="mx-auto max-w-lg space-y-6">
	<div>
		<h1 class="text-2xl font-bold">Editar viaje</h1>
		<p class="mt-1 text-sm text-muted-foreground">Actualiza los detalles del viaje</p>
	</div>

	<form
		onsubmit={(e) => {
			e.preventDefault();
			handleSave();
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
				required
				class="w-full rounded-lg border border-input bg-background px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring"
			/>
		</div>

		<div class="space-y-2">
			<label for="dest" class="text-sm font-medium">Destino</label>
			<input
				id="dest"
				type="text"
				bind:value={destination}
				required
				class="w-full rounded-lg border border-input bg-background px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring"
			/>
		</div>

		<div class="space-y-2">
			<label for="desc" class="text-sm font-medium">Descripción</label>
			<textarea
				id="desc"
				bind:value={description}
				rows="3"
				placeholder="Describe tu viaje..."
				class="w-full rounded-lg border border-input bg-background px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring"
			></textarea>
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
			<Button variant="outline" href="/trips/{data.trip.id}">Cancelar</Button>
			<Button type="submit" disabled={loading}>
				{loading ? 'Guardando...' : 'Guardar cambios'}
			</Button>
		</div>
	</form>

	<!-- ACCOMMODATIONS SECTION -->
	<div class="space-y-4 rounded-xl border border-border p-4">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<BedIcon class="size-4 text-primary" />
				<h2 class="font-semibold">Alojamientos</h2>
				<span class="text-sm text-muted-foreground">({accommodations.length})</span>
			</div>
			<Button
				size="sm"
				variant={showAddAcc ? 'outline' : 'default'}
				onclick={() => (showAddAcc = !showAddAcc)}
			>
				{#if showAddAcc}
					<XIcon class="size-3.5" />
				{:else}
					<PlusIcon class="size-3.5" />
				{/if}
				{showAddAcc ? 'Cancelar' : 'Añadir'}
			</Button>
		</div>

		{#if showAddAcc}
			<form
				onsubmit={(e) => {
					e.preventDefault();
					addAccommodation();
				}}
				class="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-3"
			>
				<div class="space-y-2">
					<label for="acc_name" class="text-sm font-medium">Nombre del alojamiento</label>
					<input
						id="acc_name"
						type="text"
						bind:value={newAccName}
						placeholder="Hotel, apartamento..."
						required
						class="w-full rounded-md border border-input bg-background px-3 py-3 text-base"
					/>
				</div>
				<div class="grid grid-cols-2 gap-3">
					<div class="space-y-2">
						<label for="acc_start" class="text-sm font-medium">Check-in</label>
						<input
							id="acc_start"
							type="date"
							bind:value={newAccStart}
							required
							class="w-full rounded-md border border-input bg-background px-3 py-3 text-base"
						/>
					</div>
					<div class="space-y-2">
						<label for="acc_end" class="text-sm font-medium">Check-out</label>
						<input
							id="acc_end"
							type="date"
							bind:value={newAccEnd}
							required
							class="w-full rounded-md border border-input bg-background px-3 py-3 text-base"
						/>
					</div>
				</div>
				<Button type="submit" class="w-full" size="sm">Añadir alojamiento</Button>
			</form>
		{/if}

		{#if accommodations.length === 0}
			<p class="py-4 text-center text-sm text-muted-foreground">Sin alojamientos. Añade dónde te quedarás.</p>
		{:else}
			<div class="space-y-2">
				{#each accommodations as acc (acc.id)}
					{#if editingAccId === acc.id}
						<form
							onsubmit={(e) => { e.preventDefault(); saveEditAcc(); }}
							class="space-y-3 rounded-lg border border-primary/50 bg-primary/5 p-3"
						>
							<div class="space-y-2">
								<input
									type="text"
									bind:value={editAccName}
									required
									class="w-full rounded-md border border-input bg-background px-3 py-3 text-base"
								/>
							</div>
							<div class="grid grid-cols-2 gap-3">
								<div class="space-y-1">
									<label class="text-xs font-medium text-muted-foreground" for="acc-checkin">Check-in</label>
									<input
										id="acc-checkin"
										type="date"
										bind:value={editAccStart}
										required
										class="w-full rounded-md border border-input bg-background px-3 py-3 text-base"
									/>
								</div>
								<div class="space-y-1">
									<label class="text-xs font-medium text-muted-foreground" for="acc-checkout">Check-out</label>
									<input
										id="acc-checkout"
										type="date"
										bind:value={editAccEnd}
										required
										class="w-full rounded-md border border-input bg-background px-3 py-3 text-base"
									/>
								</div>
							</div>
							<div class="flex gap-2">
								<Button type="submit" size="sm" class="flex-1">
									<CheckIcon class="size-3.5" />
									Guardar
								</Button>
								<Button type="button" variant="outline" size="sm" onclick={cancelEditAcc}>
									<XIcon class="size-3.5" />
								</Button>
							</div>
						</form>
					{:else}
						<div class="flex items-center gap-3 rounded-lg border border-border p-3">
							<div class="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
								<BedIcon class="size-4 text-primary" />
							</div>
							<div class="min-w-0 flex-1">
								<div class="font-medium truncate">{acc.name}</div>
								<div class="text-xs text-muted-foreground">
									{formatDateShort(acc.start_date)} — {formatDateShort(acc.end_date)} ({nightCount(acc.start_date, acc.end_date)} noches)
								</div>
							</div>
							<div class="flex shrink-0 gap-1">
								<button
									onclick={() => startEditAcc(acc)}
									class="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
									title="Editar"
								>
									<PencilIcon class="size-4" />
								</button>
								<button
									onclick={() => removeAccommodation(acc.id)}
									class="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
									title="Eliminar"
								>
									<TrashIcon class="size-4" />
								</button>
							</div>
						</div>
					{/if}
				{/each}
			</div>
		{/if}
	</div>
</div>
