<script lang="ts">
	import { getSupabaseBrowserClient } from '$lib/supabase/client';
	import { goto } from '$app/navigation';

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

<div class="flex min-h-[80vh] items-center justify-center">
	<div class="w-full max-w-sm space-y-6">
		{#if emailSent}
			<div class="text-center space-y-4">
				<div class="text-4xl">✉️</div>
				<h1 class="text-2xl font-bold">Check your email</h1>
				<p class="text-sm text-muted-foreground">
					We sent a confirmation link to <strong>{email}</strong>. Click it to verify your account.
				</p>
				<a
					href="/auth/login"
					class="inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
				>
					Go to Sign in
				</a>
			</div>
		{:else}
			<div class="text-center">
				<h1 class="text-2xl font-bold">Create account</h1>
				<p class="mt-1 text-sm text-muted-foreground">Start planning your trips</p>
			</div>

			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleSignup();
				}}
				class="space-y-4"
			>
				{#if error}
					<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
				{/if}

				<div class="space-y-2">
					<label for="email" class="text-sm font-medium">Email</label>
					<input
						id="email"
						type="email"
						bind:value={email}
						required
						class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
					/>
				</div>

				<div class="space-y-2">
					<label for="password" class="text-sm font-medium">Password</label>
					<input
						id="password"
						type="password"
						bind:value={password}
						required
						minlength="6"
						class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
					/>
				</div>

				<button
					type="submit"
					disabled={loading}
					class="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
				>
					{loading ? 'Creating account...' : 'Sign up'}
				</button>
			</form>

			<p class="text-center text-sm text-muted-foreground">
				Already have an account?
				<a href="/auth/login" class="text-primary underline hover:text-primary/80">Sign in</a>
			</p>
		{/if}
	</div>
</div>
