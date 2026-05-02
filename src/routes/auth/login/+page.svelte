<script lang="ts">
	import { getSupabaseBrowserClient } from '$lib/supabase/client';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/button';
	import logo from '$lib/assets/logo.svg';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	const supabase = getSupabaseBrowserClient();

	async function handleLogin() {
		loading = true;
		error = '';
		const { error: err } = await supabase.auth.signInWithPassword({ email, password });
		if (err) {
			error = err.message;
			loading = false;
		} else {
			goto('/dashboard');
		}
	}
</script>

<svelte:head>
	<title>Iniciar sesión — Travelify</title>
</svelte:head>

<div class="flex min-h-[80vh] items-center justify-center">
	<div class="w-full max-w-sm space-y-6">
		<div class="text-center">
			<img src={logo} alt="Travelify" class="mx-auto mb-3 h-8 w-auto" />
			<h1 class="text-2xl font-bold bg-gradient-to-r from-sky-500 to-indigo-500 bg-clip-text text-transparent">Iniciar sesión</h1>
			<p class="mt-1 text-sm text-muted-foreground">Bienvenido de vuelta a Travelify</p>
		</div>

		<form
			onsubmit={(e) => {
				e.preventDefault();
				handleLogin();
			}}
			class="space-y-4"
		>
			{#if error}
				<div class="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
			{/if}

			<div class="space-y-2">
				<label for="email" class="text-sm font-medium">Correo electrónico</label>
				<input
					id="email"
					type="email"
					bind:value={email}
					required
					class="w-full rounded-lg border border-input bg-background px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring"
				/>
			</div>

			<div class="space-y-2">
				<label for="password" class="text-sm font-medium">Contraseña</label>
				<input
					id="password"
					type="password"
					bind:value={password}
					required
					class="w-full rounded-lg border border-input bg-background px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring"
				/>
			</div>

			<Button type="submit" disabled={loading} class="w-full bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 text-white border-0">
				{loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
			</Button>
		</form>

		<p class="text-center text-sm text-muted-foreground">
			¿No tienes cuenta?
			<a href="/auth/signup" class="text-primary underline hover:text-primary/80">Regístrate</a>
		</p>
	</div>
</div>
