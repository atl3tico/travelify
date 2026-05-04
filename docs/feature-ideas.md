# Feature ideas

Basado en análisis de competidores (Layla.ai) y observaciones propias.

---

## Alta prioridad

### Chat AI integrado

Asistente conversacional que entiende el contexto del viaje y permite modificarlo con lenguaje natural:
- "Añade 2 restaurantes con terraza en París"
- "Haz este viaje más barato"
- "Sustituye el hotel por uno de 4 estrellas"
- "Añade actividades para niños pequeños"

**Estado actual**: Ya existe `/api/place-info` para autocompletar — escalable a un endpoint de chat con contexto del viaje completo.
**Esfuerzo**: Alto (backend + UI de chat + streaming).

### Vista multi-segmento / multi-ciudad

Timeline visual mostrando transiciones entre ciudades:
```
Madrid ─── Disneyland (10-13 May) ─── París (13-16 May) ─── Madrid
```

Cada segmento con su alojamiento, intro generada por IA y actividades agrupadas.
**Estado actual**: Travelify solo soporta 1 destino por viaje. Las accommodations ya son multi-registro.
**Esfuerzo**: Alto (schema + UI + lógica de segmentos).

## Media prioridad

### Tarjeta resumen del viaje

Widget compacto al inicio: "7 días · 2 ciudades · 34 lugares · 2 alojamientos · 320€ estimado".
**Estado actual**: Datos dispersos en la UI — fácil de componer.
**Esfuerzo**: Bajo.

### Títulos temáticos por día generados por IA

Cada día con un título descriptivo tipo "Magia en los parques Disney" o "París monumental y museos".
**Estado actual**: Columna `title` ya existe en `days`, solo falta generarlo.
**Esfuerzo**: Bajo (1 endpoint de IA + UI).

### Búsqueda de hoteles con ratings

Buscar alojamientos con rating, nº de reviews, amenities y precios — integrado en el modal de alojamiento.
**Estado actual**: Tabla `accommodations` existe, sin integración de búsqueda externa.
**Esfuerzo**: Medio (Google Places Hotel API o Booking API).

### Chips de acciones rápidas

Botones sugeridos tipo "Buscar restaurantes locales", "Añadir atracción cerca", "Sugerir actividades para niños" que actúan como shortcuts.
**Esfuerzo**: Bajo (UI + queries predefinidas).

### Descripciones generadas para experiencias

IA que explica por qué cada lugar es relevante para el perfil del viajero (familia, pareja, aventura...).
**Estado actual**: `/api/place-info` ya autocompleta descripciones. Falta personalizar por perfil de viajero.
**Esfuerzo**: Bajo (extender endpoint existente).

## Baja prioridad / Plus

### Versiones del viaje

Historial de cambios del itinerario con posibilidad de restaurar versiones anteriores y "Copiar viaje".
**Esfuerzo**: Medio (tabla de versiones + diffs).

### Compartir viaje

Generar link público de solo lectura o descargar como PDF/imagen.
**Esfuerzo**: Medio (Ruta pública + generación de PDF).

### Viajes relacionados

Recomendar viajes similares basados en destino, duración o perfil de viajero.
**Esfuerzo**: Alto (requiere más usuarios/datos + algoritmo de similitud).

### Alquiler de coches / Transportes entre ciudades

Añadir coche de alquiler, tren o bus como medio de transporte entre segmentos del viaje.
**Esfuerzo**: Medio (extender modelo de transports).

### Texto intro por ciudad/región

Párrafo generado por IA al inicio de cada segmento describiendo la zona y qué esperar.
**Esfuerzo**: Bajo (1 prompt de IA por segmento).
