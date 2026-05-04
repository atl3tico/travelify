<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import logo from '$lib/assets/logo.jpg';
	import '../app.css';
	import { getSupabaseBrowserClient } from '$lib/supabase/client';
	import { goto } from '$app/navigation';
	import { Toaster } from '$lib/sonner';
	import { toggleMode, mode, ModeWatcher } from 'mode-watcher';

	let { children, data } = $props();
	let mobileMenuOpen = $state(false);

	const supabase = getSupabaseBrowserClient();

	supabase.auth.onAuthStateChange(async (event) => {
		if (event === 'SIGNED_OUT') {
			await goto('/auth/login');
		}
	});

	async function handleLogout() {
		await supabase.auth.signOut();
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>TRAVELy</title>
	<meta name="description" content="Planifica tus viajes con mapas interactivos, itinerarios día a día y optimización de rutas." />
	<meta property="og:title" content="TRAVELy — Planificador de viajes" />
	<meta property="og:description" content="Planifica tus viajes con mapas interactivos, itinerarios día a día y optimización de rutas." />
	<meta property="og:type" content="website" />
	<meta name="theme-color" content="#09090b" />
</svelte:head>

<div class="isolate min-h-screen max-w-[100vw] overflow-x-clip">
	<ModeWatcher />

	{#if data.user}
		<header class="sticky top-0 z-40 border-b bg-background">
			<div class="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
				<a href="/dashboard" class="flex items-center gap-2">
					<img src={logo} alt="TRAVELy" class="h-7 w-auto" />
					<span class="hidden sm:inline text-sm font-semibold tracking-tight">TRAVELy</span>
				</a>

				<div class="hidden items-center gap-2 sm:flex">
					<span class="text-sm text-muted-foreground">{data.user.email}</span>

					<button
						class="rounded-lg size-8 inline-flex items-center justify-center transition-all hover:bg-muted hover:text-foreground"
						onclick={toggleMode}
						title="Cambiar modo oscuro"
					>
						{#if mode.current === 'dark'}
							<svg xmlns="http://www.w3.org/2000/svg" class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
						{:else}
							<svg xmlns="http://www.w3.org/2000/svg" class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
						{/if}
					</button>

					<button
						class="rounded-lg size-8 inline-flex items-center justify-center transition-all hover:bg-muted hover:text-foreground"
						onclick={handleLogout}
						title="Cerrar sesión"
					>
						<svg xmlns="http://www.w3.org/2000/svg" class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/></svg>
					</button>
				</div>

				<button
					class="sm:hidden rounded-md p-2.5 hover:bg-accent min-h-11 min-w-11 flex items-center justify-center"
					onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
				>
					{#if mobileMenuOpen}
						<svg xmlns="http://www.w3.org/2000/svg" class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
					{:else}
						<svg xmlns="http://www.w3.org/2000/svg" class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 5h16"/><path d="M4 12h16"/><path d="M4 19h16"/></svg>
					{/if}
				</button>
			</div>

			{#if mobileMenuOpen}
				<div class="border-t bg-background px-4 py-3 sm:hidden">
					<p class="mb-3 text-sm text-muted-foreground">{data.user.email}</p>
					<div class="flex gap-2">
						<button
							class="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
							onclick={toggleMode}
						>
							{#if mode.current === 'dark'}
								<svg xmlns="http://www.w3.org/2000/svg" class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
							{:else}
								<svg xmlns="http://www.w3.org/2000/svg" class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
							{/if}
							Tema
						</button>
						<button
							class="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
							onclick={handleLogout}
						>
							<svg xmlns="http://www.w3.org/2000/svg" class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/></svg>
							Salir
						</button>
					</div>
				</div>
			{/if}
		</header>
	{/if}

	<main class="mx-auto max-w-6xl py-4 sm:py-6">
		{@render children()}
	</main>
</div>

<Toaster />
