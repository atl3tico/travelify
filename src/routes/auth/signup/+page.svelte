<script lang="ts">
	import { getSupabaseBrowserClient } from '$lib/supabase/client';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/button';
	import logo from '$lib/assets/logo.svg';
	import MailIcon from '@lucide/svelte/icons/mail';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);
	let emailSent = $state(false);

	const supabase = getSupabaseBrowserClient();

	async function handleSignup() {
		loading = true;
		error = '';
		const { data, error: err } = await supabase.auth.signUp({ email, password });
		if (err) {
			error = err.message;
			loading = false;
		} else if (data.user && !data.session) {
			emailSent = true;
			loading = false;
		} else {
			goto('/dashboard');
		}
	}
</script>

<svelte:head>
	<title>Crear cuenta — Travelify</title>
</svelte:head>

<div class="flex min-h-[80vh] items-center justify-center">
	<div class="w-full max-w-sm space-y-6">
		{#if emailSent}
			<div class="space-y-4 text-center">
				<MailIcon class="mx-auto size-12 text-sky-500" />
				<h1 class="text-2xl font-bold bg-gradient-to-r from-sky-500 to-indigo-500 bg-clip-text text-transparent">Revisa tu correo</h1>
				<p class="text-sm text-muted-foreground">
					Enviamos un enlace de confirmación a <strong>{email}</strong>. Haz clic para verificar tu cuenta.
				</p>
				<Button variant="outline" href="/auth/login" class="mt-4">
					Ir a iniciar sesión
				</Button>
			</div>
		{:else}
			<div class="text-center">
				<img src={logo} alt="Travelify" class="mx-auto mb-3 h-8 w-auto" />
				<h1 class="text-2xl font-bold bg-gradient-to-r from-sky-500 to-indigo-500 bg-clip-text text-transparent">Crear cuenta</h1>
				<p class="mt-1 text-sm text-muted-foreground">Empieza a planificar tus viajes</p>
			</div>

			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleSignup();
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
						minlength="6"
						class="w-full rounded-lg border border-input bg-background px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring"
					/>
				</div>

				<Button type="submit" disabled={loading} class="w-full bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 text-white border-0">
					{loading ? 'Creando cuenta...' : 'Registrarse'}
				</Button>
			</form>

			<p class="text-center text-sm text-muted-foreground">
				¿Ya tienes cuenta?
				<a href="/auth/login" class="text-primary underline hover:text-primary/80">Inicia sesión</a>
			</p>
		{/if}
	</div>
</div>
