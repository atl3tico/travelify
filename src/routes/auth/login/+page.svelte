<script lang="ts">
	import { getSupabaseBrowserClient } from '$lib/supabase/client';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/button';
	import logo from '$lib/assets/logo.svg';

	let email = $state('');
	let password = $state('');
	let rememberMe = $state(false);
	let error = $state('');
	let loading = $state(false);

	const supabase = getSupabaseBrowserClient();

	async function handleLogin() {
		loading = true;
		error = '';
		const { error: err } = await supabase.auth.signInWithPassword({
			email,
			password,
		});
		if (err) {
			error = err.message;
			loading = false;
		} else {
			goto('/dashboard');
		}
	}

	async function handleGoogleLogin() {
		loading = true;
		error = '';
		const { error: err } = await supabase.auth.signInWithOAuth({
			provider: 'google',
			options: {
				redirectTo: `${window.location.origin}/auth/callback`,
			},
		});
		if (err) {
			error = err.message;
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Iniciar sesión — TRAVELy</title>
</svelte:head>

<div class="flex min-h-[80vh] items-center justify-center">
	<div class="w-full max-w-sm space-y-6">
		<div class="text-center">
			<img src={logo} alt="TRAVELy" class="mx-auto mb-3 h-8 w-auto" />
			<h1 class="text-2xl font-bold bg-gradient-to-r from-sky-500 to-indigo-500 bg-clip-text text-transparent">Iniciar sesión</h1>
			<p class="mt-1 text-sm text-muted-foreground">Bienvenido de vuelta a TRAVELy</p>
		</div>

		{#if error}
			<div class="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
		{/if}

		<button
			type="button"
			onclick={handleGoogleLogin}
			disabled={loading}
			class="flex w-full items-center justify-center gap-2 rounded-lg border border-input bg-background px-4 py-3 text-sm font-medium hover:bg-accent disabled:opacity-50"
		>
			<svg class="size-5" viewBox="0 0 24 24">
				<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
				<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
				<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
				<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
			</svg>
			Continuar con Google
		</button>

		<div class="relative">
			<div class="absolute inset-0 flex items-center">
				<div class="w-full border-t border-border"></div>
			</div>
			<div class="relative flex justify-center text-xs uppercase">
				<span class="bg-background px-2 text-muted-foreground">o con email</span>
			</div>
		</div>

		<form
			onsubmit={(e) => {
				e.preventDefault();
				handleLogin();
			}}
			class="space-y-4"
		>
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

			<div class="flex items-center gap-2">
				<input
					id="remember"
					type="checkbox"
					bind:checked={rememberMe}
					class="size-4 rounded border-input text-primary focus:ring-primary"
				/>
				<label for="remember" class="text-sm text-muted-foreground cursor-pointer">Recordarme</label>
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
