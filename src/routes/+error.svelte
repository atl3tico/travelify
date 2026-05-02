<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/button';

	let status = $derived(page.status);
	let message = $derived(page.error?.message ?? 'Error desconocido');
</script>

<div class="flex min-h-[60vh] flex-col items-center justify-center space-y-4 text-center">
	<h1 class="text-6xl font-bold text-muted-foreground">{status}</h1>
	<p class="text-lg text-muted-foreground">{message}</p>
	<div class="flex gap-3">
		<Button variant="outline" href="/">Inicio</Button>
		<Button onclick={() => history.back()}>Volver</Button>
	</div>
</div>
