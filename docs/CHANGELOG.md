# Changelog

## 2026-05-02

### Features

- [x] Redistribución de actividades entre días seleccionados
  - **Qué hace**: Selecciona 2+ días, redistribuye todas sus actividades por proximidad geográfica (k-means clustering con balanceo). Evita días con 2 cosas vs otros con 10
  - **Algoritmo**: K-means en lat/lng → balanceo moviendo items de clusters sobrecargados a subcargados → ordena por `order_index` dentro de cada cluster
  - **Files**: `src/routes/(app)/trips/[id]/+page.server.ts`, `src/routes/(app)/trips/[id]/+page.svelte`

- [x] Botón "Abrir en Google Maps" en cada actividad
  - **Qué hace**: Abre Google Maps con las coordenadas del lugar en una nueva pestaña
  - **Files**: `src/routes/(app)/trips/[id]/+page.svelte`

- [x] Clima por día en las pestañas de días
  - **Qué hace**: Muestra icono del clima y temperatura mín/máx para cada día del viaje usando Open-Meteo API (gratis, sin API key)
  - **Files**: `src/routes/(app)/trips/[id]/+page.server.ts`, `src/routes/(app)/trips/[id]/+page.svelte`, `src/routes/api/weather/+server.ts`

- [x] Presupuesto estimado del viaje
  - **Qué hace**: Campo `estimated_cost` en cada actividad, total mostrado en la barra de stats. Input en el modal de actividad.
  - **Migration**: `supabase/migrations/007_add_estimated_cost.sql` (needs manual run)
  - **Files**: `src/routes/(app)/trips/[id]/+page.server.ts`, `src/routes/(app)/trips/[id]/+page.svelte`, `src/lib/components/place/PlaceModal.svelte`

### Bugs

- [x] `api/place-info` retorna 200 con campo descripción vacío
  - **Causa**: Solo consultaba Wikipedia; la mayoría de lugares no tienen artículo
  - **Fix**: Usa Google Places (editorial_summary → reviews) como fuente principal, Wikipedia como fallback. Devuelve `plus_code`
  - **Files**: `src/routes/api/place-info/+server.ts`, `src/lib/components/place/PlaceModal.svelte`, `src/lib/components/place/PlaceSearch.svelte`, `src/routes/(app)/trips/[id]/+page.server.ts`, `src/routes/api/google/places/+server.ts`

- [x] Modal de editar actividad muestra selector de "Día" duplicado
  - **Causa**: El bloque del día aparecía tanto en `{#if isEdit}` como en `{#if isEdit || selectedDetails}`
  - **Fix**: Eliminado el duplicado del bloque `isEdit`
  - **Files**: `src/lib/components/place/PlaceModal.svelte`

- [x] Al editar actividad no aparece botón "Sugerir día"
  - **Causa**: Condición `{#if selectedDetails && days.length > 1}` — en modo edición `selectedDetails` es `null`
  - **Fix**: Cambiado a `{#if (isEdit || selectedDetails) && days.length > 1}`. `suggestDay()` ahora usa `place?.lat/lng` como fallback y excluye el lugar actual del cálculo
  - **Files**: `src/lib/components/place/PlaceModal.svelte`

- [x] Descripciones de lugares salen en inglés
  - **Causa**: Google Places devuelve `editorial_summary` siempre en inglés
  - **Fix**: Prioridad: 1) Wikipedia español, 2) Google Places + traducción MyMemory, 3) Wikipedia inglés + traducción. Usa `api.mymemory.translated.net` (gratis, sin API key)
  - **Files**: `src/routes/api/place-info/+server.ts`
