<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import logo from '$lib/assets/logo.jpg';
	import '../app.css';
	import { getSupabaseBrowserClient } from '$lib/supabase/client';
	import { goto } from '$app/navigation';
	import { Toaster } from '$lib/sonner';
	import { toggleMode, mode, ModeWatcher } from 'mode-watcher';
	import { Button } from '$lib/button';
	import SunIcon from '@lucide/svelte/icons/sun';
	import MoonIcon from '@lucide/svelte/icons/moon';
	import LogOutIcon from '@lucide/svelte/icons/log-out';
	import MenuIcon from '@lucide/svelte/icons/menu';
	import XIcon from '@lucide/svelte/icons/x';

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
		<header class="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div class="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
				<a href="/dashboard" class="flex items-center gap-2">
					<img src={logo} alt="TRAVELy" class="h-7 w-auto" />
				</a>

				<div class="hidden items-center gap-2 sm:flex">
					<span class="text-sm text-muted-foreground">{data.user.email}</span>
					<Button variant="ghost" size="icon" onclick={toggleMode} title="Cambiar modo oscuro">
						{#if mode.current === 'dark'}
							<SunIcon class="size-4" />
						{:else}
							<MoonIcon class="size-4" />
						{/if}
					</Button>
					<Button variant="ghost" size="icon" onclick={handleLogout} title="Cerrar sesión">
						<LogOutIcon class="size-4" />
					</Button>
				</div>

				<button
					class="sm:hidden rounded-md p-2.5 hover:bg-accent min-h-11 min-w-11 flex items-center justify-center"
					onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
				>
					{#if mobileMenuOpen}
						<XIcon class="size-5" />
					{:else}
						<MenuIcon class="size-5" />
					{/if}
				</button>
			</div>

			{#if mobileMenuOpen}
				<div class="border-t border-border bg-background px-4 py-3 sm:hidden">
					<p class="mb-3 text-sm text-muted-foreground">{data.user.email}</p>
					<div class="flex gap-2">
						<Button variant="outline" size="sm" onclick={toggleMode}>
							{#if mode.current === 'dark'}<SunIcon class="size-4" />{:else}<MoonIcon class="size-4" />{/if}
							Tema
						</Button>
						<Button variant="outline" size="sm" onclick={handleLogout}>
							<LogOutIcon class="size-4" />
							Salir
						</Button>
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
