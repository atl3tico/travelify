# Google OAuth Setup

## 1. Google Cloud Console

1. Ve a https://console.cloud.google.com/apis/credentials
2. Crea un nuevo proyecto o selecciona uno existente
3. **OAuth consent screen**:
   - User Type: External
   - App name: Travelify
   - User support email: tu email
   - Developer contact: tu email
   - Scopes: `.../auth/userinfo.email`, `.../auth/userinfo.profile`
4. **Credentials** > Create Credentials > OAuth client ID:
   - Application type: Web application
   - Authorized redirect URIs:
     ```
     https://lkbgiceouzlitqsgozue.supabase.co/auth/v1/callback
     http://localhost:5173/auth/callback
     ```
5. Copia **Client ID** y **Client Secret**

## 2. Supabase Dashboard

1. Ve a https://supabase.com/dashboard/project/lkbgiceouzlitqsgozue/auth/providers
2. **Google** > Enable
3. Pega:
   - Client ID
   - Client Secret
4. **Site URL**: `https://travelify-psi.vercel.app`
5. **Redirect URLs**:
   ```
   https://travelify-psi.vercel.app/auth/callback
   http://localhost:5173/auth/callback
   ```
6. **Automatic linking**: ✅ Enable (vincula Google con cuentas email existentes)

## 3. Account Linking

Con "Automatic linking" activado:
- Si un usuario se registra con `email/password` y luego hace login con Google usando el **mismo email**, Supabase vincula automáticamente ambas identidades
- El usuario puede loguearse con cualquiera de los dos métodos
- Los datos del viaje se mantienen asociados a la misma cuenta

## 4. Variables de entorno (opcional)

Para desarrollo local, añade en `.env.local`:
```
GOOGLE_CLIENT_ID=tu-client-id
GOOGLE_CLIENT_SECRET=tu-client-secret
```
