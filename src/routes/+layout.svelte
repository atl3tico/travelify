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
		<header class="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl">
			<div class="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:h-16 sm:gap-4">
				<!-- Logo -->
				<a href="/dashboard" class="flex shrink-0 items-center gap-3">
					<img src={logo} alt="TRAVELy" class="h-9 w-auto sm:h-11" />
					<span class="font-serif text-base italic tracking-tight sm:text-lg">TRAVELy</span>
				</a>

				<!-- Spacer -->
				<div class="flex-1" />

				<!-- Desktop actions -->
				<div class="hidden items-center gap-1 sm:flex">
					<span class="mr-2 text-xs text-muted-foreground">{data.user.email}</span>

					<div class="h-5 w-px bg-border/50" />

					<button
						class="group relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
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
						class="group relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
						onclick={handleLogout}
						title="Cerrar sesión"
					>
						<svg xmlns="http://www.w3.org/2000/svg" class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/></svg>
					</button>
				</div>

				<!-- Mobile menu button -->
				<button
					class="sm:hidden rounded-lg p-2.5 text-muted-foreground hover:bg-accent hover:text-foreground"
					onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
					aria-label="Menu"
				>
					{#if mobileMenuOpen}
						<svg xmlns="http://www.w3.org/2000/svg" class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
					{:else}
						<svg xmlns="http://www.w3.org/2000/svg" class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 5h16"/><path d="M4 12h16"/><path d="M4 19h16"/></svg>
					{/if}
				</button>
			</div>

			<!-- Mobile menu -->
			{#if mobileMenuOpen}
				<div class="border-t border-border/40 bg-background/80 backdrop-blur-xl sm:hidden animate-in slide-in-from-top-2 fade-in duration-200">
					<div class="px-4 py-4 space-y-3">
						<p class="text-xs text-muted-foreground">{data.user.email}</p>
						<div class="flex gap-2">
							<button
								class="inline-flex items-center gap-1.5 rounded-lg border border-border/50 px-3 py-2 text-sm hover:bg-accent"
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
								class="inline-flex items-center gap-1.5 rounded-lg border border-border/50 px-3 py-2 text-sm hover:bg-accent"
								onclick={handleLogout}
							>
								<svg xmlns="http://www.w3.org/2000/svg" class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/></svg>
								Salir
							</button>
						</div>
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
