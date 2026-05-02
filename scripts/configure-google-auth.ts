import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envLines = readFileSync('.env', 'utf-8').split('\n');
const env = {};
for (const line of envLines) {
	const trimmed = line.trim();
	if (trimmed && !trimmed.startsWith('#')) {
		const [key, ...rest] = trimmed.split('=');
		env[key.trim()] = rest.join('=').trim();
	}
}

const supabase = createClient(env.PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
	console.log('Configuring Google OAuth provider...\n');

	const { data, error } = await supabase.auth.admin.updateConfig({
		external: {
			google: {
				enabled: true,
				client_id: process.env.GOOGLE_CLIENT_ID || '',
				secret: process.env.GOOGLE_CLIENT_SECRET || '',
			},
		},
	});

	if (error) {
		console.error('Error:', error.message);
		console.log('\n⚠️  Configura Google OAuth manualmente en:');
		console.log('   https://supabase.com/dashboard/project/lkbgiceouzlitqsgozue/auth/providers');
	} else {
		console.log('✓ Google OAuth provider configured');
	}

	console.log('\n📋 Pasos para completar la configuración:');
	console.log('1. Ve a https://console.cloud.google.com/apis/credentials');
	console.log('2. Crea un OAuth 2.0 Client ID (Web application)');
	console.log('3. Authorized redirect URIs:');
	console.log('   https://lkbgiceouzlitqsgozue.supabase.co/auth/v1/callback');
	console.log('4. Copia Client ID y Client Secret');
	console.log('5. En Supabase Dashboard > Auth > Providers > Google:');
	console.log('   - Activa el provider');
	console.log('   - Pega Client ID y Secret');
	console.log('   - Activa "Automatic linking" para emails coincidentes');
}

main();
