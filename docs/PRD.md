# Travelify — Product Requirements Document

> Spec-driven development plan for a SvelteKit travel itinerary planner with Google Maps integration.

---

## 1. Vision

Travelify lets users create trips, plan each day by adding places to visit, and generate a shareable Google Maps itinerary from the ordered list — all from a fast, installable PWA.

## 2. User Stories

### Authentication

| ID  | Story                                                                 | Priority |
| --- | --------------------------------------------------------------------- | -------- |
| A1  | As a visitor I can sign up with email/password so I can save my trips | P0       |
| A2  | As a visitor I can sign up/in with Google OAuth                       | P1       |
| A3  | As a user I can sign out                                              | P0       |
| A4  | As a user I can reset my password                                     | P2       |

### Trips

| ID  | Story                                                                                                  | Priority |
| --- | ------------------------------------------------------------------------------------------------------ | -------- |
| T1  | As a user I can create a trip with name, destination, accommodation location, start date, and end date | P0       |
| T2  | As a user I see my trips listed on a dashboard sorted by upcoming first                                | P0       |
| T3  | As a user I can edit a trip's details                                                                  | P0       |
| T4  | As a user I can delete a trip                                                                          | P0       |
| T5  | As a user I see a summary card per trip with dates, destination, and day count                         | P1       |

### Day Planning

| ID  | Story                                                                     | Priority |
| --- | ------------------------------------------------------------------------- | -------- |
| D1  | When a trip is created, days are auto-generated from the date range       | P0       |
| D2  | As a user I can navigate between days of a trip (tabs or swipe)           | P0       |
| D3  | As a user I see each day's places listed in order with a mini-map preview | P1       |

### Places

| ID  | Story                                                                                  | Priority |
| --- | -------------------------------------------------------------------------------------- | -------- |
| P1  | As a user I can search for a place using Google Places Autocomplete                    | P0       |
| P2  | As a user I can add a place to a specific day with an optional note and visit duration | P0       |
| P3  | As a user I can reorder places within a day via drag-and-drop                          | P0       |
| P4  | As a user I can remove a place from a day                                              | P0       |
| P5  | As a user I can move a place to another day                                            | P1       |
| P6  | As a user I see place photos from Google Places API                                    | P2       |

### Maps & Routes

| ID  | Story                                                                      | Priority |
| --- | -------------------------------------------------------------------------- | -------- |
| M1  | As a user I see all places for a day plotted on an interactive Google Map  | P0       |
| M2  | As a user I see a polyline route connecting places in order                | P0       |
| M3  | As a user I see route distance and estimated travel time between stops     | P1       |
| M4  | As a user I can generate a Google Maps link for the day's route            | P0       |
| M5  | As a user I can open the route in Google Maps app/web                      | P0       |
| M6  | As a user I see accommodation marked as start/end point of the daily route | P1       |

### PWA

| ID  | Story                                             | Priority |
| --- | ------------------------------------------------- | -------- |
| W1  | As a user I can install the app to my home screen | P1       |
| W2  | As a user I can view my cached trips offline      | P2       |
| W3  | As a user I see a custom offline fallback page    | P2       |

### Sharing & Export

| ID  | Story                                             | Priority |
| --- | ------------------------------------------------- | -------- |
| S1  | As a user I can share a read-only link to my trip | P2       |
| S2  | As a user I can export the itinerary as PDF       | P2       |

---

## 3. Data Model

### Supabase Auth

Managed by Supabase. Tables reference `auth.uid()` via RLS policies.

### Tables

```sql
-- trips
create table trips (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  destination text not null,
  accommodation_name text,
  accommodation_lat  double precision,
  accommodation_lng  double precision,
  start_date  date not null,
  end_date    date not null,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  constraint trip_dates_valid check (end_date >= start_date)
);

-- days (denormalised for performance — generated from trip date range)
create table days (
  id           uuid primary key default gen_random_uuid(),
  trip_id      uuid not null references trips(id) on delete cascade,
  date         date not null,
  day_index    int not null,
  notes        text default '',
  constraint unique_day_per_trip unique (trip_id, date),
  constraint day_within_trip check (
    date >= (select start_date from trips where id = trip_id)
    and date <= (select end_date from trips where id = trip_id)
  )
);

-- places
create table places (
  id               uuid primary key default gen_random_uuid(),
  day_id           uuid not null references days(id) on delete cascade,
  name             text not null,
  google_place_id  text,
  lat              double precision not null,
  lng              double precision not null,
  address          text,
  visit_duration   int default 60,          -- minutes
  order_index      int not null default 0,
  notes            text default '',
  photo_url        text,
  created_at       timestamptz default now()
);
```

### RLS Policies

Every table: `USING (user_id = auth.uid())` or join through `trips.user_id`. No public read access.

### Indexes

```sql
create index idx_trips_user on trips(user_id);
create index idx_days_trip on days(trip_id);
create index idx_places_day on places(day_id);
create index idx_places_order on places(day_id, order_index);
```

---

## 4. Route Generation Logic

For a given day:

1. Fetch all places ordered by `order_index`.
2. If the trip has accommodation coordinates, prepend and append them as start/end waypoints.
3. Build a Google Maps Directions API request with waypoints in order.
4. The route polyline, legs (distance + duration), and total are rendered on the map.
5. A "Open in Google Maps" link is generated using the Maps URL API:
   `https://www.google.com/maps/dir/?api=1&origin=...&destination=...&waypoints=...&travelmode=walking`

---

## 5. File & Route Structure

```
src/
├── app.css
├── app.html
├── app.d.ts
├── lib/
│   ├── components/
│   │   ├── ui/                   ← shadcn-svelte components
│   │   ├── layout/
│   │   │   ├── Navbar.svelte
│   │   │   ├── Sidebar.svelte
│   │   │   └── AppShell.svelte
│   │   ├── trip/
│   │   │   ├── TripCard.svelte
│   │   │   ├── TripForm.svelte
│   │   │   └── TripList.svelte
│   │   ├── day/
│   │   │   ├── DayTabs.svelte
│   │   │   └── DayView.svelte
│   │   ├── place/
│   │   │   ├── PlaceCard.svelte
│   │   │   ├── PlaceSearch.svelte
│   │   │   └── PlaceList.svelte
│   │   └── map/
│   │       ├── TripMap.svelte
│   │       └── RouteMap.svelte
│   ├── hooks/                    ← shared Svelte hooks
│   ├── utils.ts
│   ├── supabase/
│   │   ├── client.ts             ← browser Supabase client
│   │   ├── server.ts             ← server Supabase client
│   │   └── schema.ts             ← generated types from Supabase
│   ├── stores/
│   │   └── auth.ts
│   └── types/
│       └── index.ts              ← Trip, Day, Place, etc.
├── routes/
│   ├── +layout.svelte            ← AppShell (navbar + auth state)
│   ├── +layout.server.ts         ← load session
│   ├── +page.svelte              ← Landing or redirect to dashboard
│   ├── auth/
│   │   ├── login/+page.svelte
│   │   ├── signup/+page.svelte
│   │   ├── callback/+server.ts   ← OAuth callback
│   │   └── logout/+server.ts
│   ├── (app)/                    ← protected routes group
│   │   ├── +layout.svelte        ← auth guard
│   │   ├── +layout.server.ts     ← redirect if not logged in
│   │   ├── dashboard/
│   │   │   └── +page.svelte      ← trip list
│   │   └── trips/
│   │       └── [id]/
│   │           ├── +page.svelte  ← trip detail (days + map)
│   │           ├── +page.server.ts
│   │           └── edit/
│   │               └── +page.svelte
│   └── api/
│       └── google/
│           └── places/
│               └── +server.ts    ← proxy Places Autocomplete
└── params/
    └── id.ts
```

---

## 6. API Endpoints (SvelteKit Server)

| Method                                                                                                     | Route                      | Purpose                                                      |
| ---------------------------------------------------------------------------------------------------------- | -------------------------- | ------------------------------------------------------------ |
| GET                                                                                                        | `/api/google/places?q=...` | Proxy Google Places Autocomplete (keeps API key server-side) |
| POST                                                                                                       | `/auth/callback`           | Supabase OAuth callback                                      |
| POST                                                                                                       | `/auth/logout`             | Sign out                                                     |
| Standard CRUD is handled via Supabase client directly — no custom API routes needed. RLS handles security. |

---

## 7. External Services

| Service               | Usage                         | Key location                                                                             |
| --------------------- | ----------------------------- | ---------------------------------------------------------------------------------------- |
| Supabase Auth         | Email/password + Google OAuth | `SUPABASE_URL`, `SUPABASE_ANON_KEY` (public) + `SUPABASE_SERVICE_ROLE_KEY` (server only) |
| Supabase Postgres     | All data                      | Same keys                                                                                |
| Google Maps JS API    | Interactive map display       | `PUBLIC_GOOGLE_MAPS_API_KEY`                                                             |
| Google Places API     | Place search/autocomplete     | Server-proxied                                                                           |
| Google Directions API | Route calculation             | Server-side via `SUPABASE_SERVICE_ROLE_KEY` env                                          |

---

## 8. Phases & Milestones

### Phase 0 — Project Scaffold ✅

- [x] SvelteKit project with TypeScript
- [x] Tailwind CSS v4 + shadcn-svelte (zinc theme)
- [x] Supabase client packages
- [x] Google Maps loader
- [x] PWA package
- [x] ESLint + Prettier
- [x] Agent skills docs

### Phase 1 — Auth (P0) ✅

**Spec:** Users can sign up, log in, and log out. Protected routes redirect to login.

- [x] Supabase project setup (browser + server clients, env vars)
- [x] `src/lib/supabase/client.ts` — browser client
- [x] `src/hooks.server.ts` — SSR session handling + cookie management
- [x] Auth pages: `/auth/login`, `/auth/signup` (with "check your email" flow)
- [x] OAuth callback route `/auth/callback`
- [x] Layout server load: attach session to `locals`
- [x] Protected route group `(app)/` with auth guard redirect
- [x] Navbar shows email + logout button
- [x] Custom SMTP via Resend for email delivery

**Verified:**

- [x] Unauthenticated visit to `/dashboard` redirects to `/auth/login`
- [x] Sign up → confirm email → login → redirect to dashboard
- [x] Logout clears session

### Phase 2 — Trips CRUD (P0) ✅

**Spec:** Users can create, list, edit, and delete trips. Creating a trip auto-generates days.

- [x] Supabase tables: `trips`, `days`, `places` (with RLS + indexes)
- [x] DB trigger: auto-generate days on trip insert
- [x] `/dashboard` page — trip list with cards (upcoming badge, day count)
- [x] Create trip page `/trips/new`
- [x] Edit trip page `/trips/[id]/edit`
- [x] Delete trip with confirmation
- [x] Redirect `/` → `/auth/login` or `/dashboard`

**Verified:**

- [x] Create trip "Weekend in Madrid" → 4 days auto-generated
- [x] Dashboard shows trip card with dates and destination
- [x] Edit and delete work

### Phase 3 — Day Planning + Places (P0) ✅

**Spec:** Users navigate days, search places, add/reorder/remove them.

- [x] Trip detail page `/trips/[id]` with day tabs
- [x] Place search component with Google Places Autocomplete (debounced, proxied)
- [x] Place Details API for coordinates (lat/lng)
- [x] Add place to day: name, lat/lng, address, duration, notes
- [x] Place list per day with numbered markers
- [x] Remove place from day
- [x] Drag-and-drop reorder (order_index)
- [x] API endpoint `/api/google/places` (autocomplete + details)

**Verified:**

- [x] Search "Museo del Prado" → suggestions appear
- [x] Select place → coordinates fetched → add to day
- [x] Places (1) counter updates
- [x] Remove place works

### Phase 4 — Maps & Routes (P0) ✅

**Spec:** Each day's places are plotted on a map with a route polyline. Users can open the route in Google Maps.

- [x] `RouteMap.svelte` — Google Map with markers for each place
- [x] Route polyline via Google Directions API (walking mode)
- [x] Route info panel: total distance, travel time, stop count
- [x] "Open in Google Maps" button (generates Maps URL)
- [x] Accommodation as start/end waypoint when coordinates available
- [x] Responsive: map on the right (desktop)

**Tests:**

- [ ] Map renders with correct markers
- [ ] Route polyline connects stops in order
- [ ] "Open in Google Maps" link has correct waypoints

### Phase 5 — PWA + Offline (P1)

**Spec:** App is installable. Cached trips are viewable offline.

- [ ] `vite.config.ts` — configure `@vite-pwa/sveltekit`
- [ ] Service worker precaches app shell + static assets
- [ ] Runtime cache for Supabase API responses (stale-while-revalidate)
- [ ] Custom offline fallback page
- [ ] Web app manifest (name, icons, theme color, display standalone)
- [ ] App icons (192x192, 512x512)

**Tests:**

- [ ] Lighthouse PWA audit passes
- [ ] Offline: cached dashboard renders

### Phase 6 — Polish & Vercel Deploy (P0)

**Spec:** App is deployed to Vercel with proper env vars and adapter.

- [ ] Install `@sveltejs/adapter-vercel`
- [ ] Update `svelte.config.js` to use Vercel adapter
- [ ] Configure Vercel project: env vars, framework preset
- [ ] Loading skeletons on data-fetching pages
- [ ] Error boundaries and toast notifications
- [ ] Responsive design pass (mobile-first)
- [ ] Dark mode support (already in CSS variables)
- [ ] SEO meta tags + Open Graph

### Phase 7 — Nice-to-haves (P2)

- [ ] Share trip via read-only link (public row in `trips` + separate RLS policy)
- [ ] Export itinerary as PDF
- [ ] Place photos from Google Places API
- [ ] Multiple accommodation stops per trip
- [ ] Collaborative trip editing

---

## 9. Design Decisions (ADRs)

| ADR | Decision                          | Rationale                                                        |
| --- | --------------------------------- | ---------------------------------------------------------------- |
| 001 | Supabase over custom auth + DB    | BaaS reduces boilerplate; RLS handles security; SSR auth support |
| 002 | Google Maps over Leaflet/MapLibre | Native Google Maps integration + route sharing requirement       |
| 003 | Denormalised `days` table         | Avoid computing date ranges on every read; simpler queries       |
| 004 | Server-proxied Places API         | Keeps API key off the client; enables rate limiting              |
| 005 | `@sveltejs/adapter-vercel`        | Deployment target; edge SSR support                              |
| 006 | shadcn-svelte + Tailwind v4       | Copy-paste components, full control, no abstraction tax          |
| 007 | PWA with stale-while-revalidate   | Offline viewing without complex sync logic                       |

---

## 10. Non-Functional Requirements

| Concern                  | Target                                          |
| ------------------------ | ----------------------------------------------- |
| Lighthouse Performance   | > 90                                            |
| Lighthouse Accessibility | > 95                                            |
| First Contentful Paint   | < 1.5s                                          |
| Time to Interactive      | < 3s                                            |
| Bundle size (initial)    | < 150KB gzipped                                 |
| Max trip duration        | 30 days                                         |
| Max places per day       | 20                                              |
| Browser support          | Last 2 versions (Chrome, Firefox, Safari, Edge) |

---

## 11. Environment Variables

```env
# Public (browser)
PUBLIC_GOOGLE_MAPS_API_KEY=...
PUBLIC_SUPABASE_URL=...
PUBLIC_SUPABASE_ANON_KEY=...

# Server only (never exposed to browser)
SUPABASE_SERVICE_ROLE_KEY=...
GOOGLE_PLACES_API_KEY=...         # server-proxied
```

---

## 12. Commands Reference

| Command           | Purpose                           |
| ----------------- | --------------------------------- |
| `npm run dev`     | Start dev server                  |
| `npm run build`   | Production build                  |
| `npm run preview` | Preview production build          |
| `npm run check`   | TypeScript + Svelte type checking |
| `npm run lint`    | ESLint + Prettier check           |
| `npm run format`  | Auto-format with Prettier         |
