<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';
	import { getSupabaseBrowserClient } from '$lib/supabase/client';
	import { goto } from '$app/navigation';

	let { children, data } = $props();

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
	<title>Travelify</title>
</svelte:head>

{#if data.user}
	<header class="border-b border-border bg-background">
		<div class="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
			<a href="/dashboard" class="text-lg font-bold tracking-tight">Travelify</a>
			<div class="flex items-center gap-4">
				<span class="text-sm text-muted-foreground">{data.user.email}</span>
				<button
					onclick={handleLogout}
					class="rounded-md bg-secondary px-3 py-1.5 text-sm text-secondary-foreground hover:bg-secondary/80"
				>
					Logout
				</button>
			</div>
		</div>
	</header>
{/if}

<main class="mx-auto max-w-5xl px-4 py-6">
	{@render children()}
</main>
