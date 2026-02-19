# Aideator ↔ Trinity Graph API Integration Plan

**Date:** 2026-02-18  
**App:** Aideator (TrailerLab) — 247K-line React/TypeScript/Vite world-building app  
**API:** Trinity Graph API — `https://trinity-graph-api-328246068140.us-central1.run.app`  
**Database:** Neo4j via Trinity Graph API  

---

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      AIDEATOR FRONTEND                          │
│  React + TypeScript + Vite + Tailwind                           │
│                                                                 │
│  TrinityGraphContext ──► useTrinityGraph hook                   │
│  CharacterStudioPage │ SparkMakerPage │ UbiquityStudioPage       │
│  OntologicalSliders  │ ConvergenceDisplay │ CollisionAnimation   │
└──────────────────────────────┬──────────────────────────────────┘
                               │ authenticatedFetch (Firebase JWT)
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     AIDEATOR BACKEND (Express)                  │
│  localhost:5001 / production Cloud Run                          │
│                                                                 │
│  /api/trinity-graph/*  ──► trinityGraph.js (NEW proxy routes)  │
│  /api/trinity/*        ──► trinity.js (panorama, UNCHANGED)     │
│  /api/worlds/*         ──► worlds.js (GCS storage, UNCHANGED)   │
│  /api/characters/*     ──► characters.js (GCS, UNCHANGED)       │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTP proxy + Firebase JWT passthrough
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                   TRINITY GRAPH API                             │
│  https://trinity-graph-api-328246068140.us-central1.run.app     │
│                                                                 │
│  /worlds  /characters  /places  /garments  /artifacts           │
│  /sparks/collide  /ingest  /graph/stats  /graph/query           │
└──────────────────────────────┬──────────────────────────────────┘
                               │ Bolt protocol
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                         NEO4J GRAPH DB                          │
│  Nodes: Character │ Place │ Garment │ Artifact │ Spark           │
│  Rels: RELATES_TO │ CONVERGES_WITH │ INHABITS │ WEARS            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Authentication Flow

Firebase Auth tokens are already managed by `utils/api.ts`:

```
User logs in via Firebase
  → auth.currentUser.getIdToken() → JWT
  → authenticatedFetch auto-attaches: Authorization: Bearer <JWT>
  → Aideator backend verifies via Firebase Admin SDK (existing)
  → Backend proxies request to Trinity Graph API with same Authorization header
  → Trinity Graph API independently verifies the JWT against Firebase project
```

**Key:** The Trinity Graph API **must** be configured with the same Firebase project ID as Aideator. No extra auth tokens are needed — the existing `authenticatedFetch` pattern covers everything.

**Local dev (unauthenticated):** When `auth.currentUser` is null, `authenticatedFetch` sends no Authorization header. Trinity Graph API should allow unauthenticated access in dev mode (or the proxy adds a service account token).

---

## 3. Data Flow: Frontend → Backend → Trinity Graph → Neo4j

### Creating a Character

```
1. User fills Character Studio form (50 ity/pathy sliders, identity fields)
2. CharacterStudioPage calls TrinityGraphContext.createCharacter(data)
3. TrinityGraphContext calls:
   authenticatedFetch(`${API_BASE_URL}/api/trinity-graph/characters`, { method: 'POST', body })
4. Backend trinityGraph.js receives request:
   - Extracts Authorization header
   - Forwards POST to TRINITY_GRAPH_API_URL/characters
   - Returns response
5. Trinity Graph API writes Character node to Neo4j
6. Returns { id, ...characterData }
7. TrinityGraphContext updates local cache: characters[worldId].push(newChar)
8. CharacterStudioPage re-renders with saved state
```

### Spark Collision

```
1. User selects two characters in SparkMakerPage
2. Convergence score computed client-side:
   score = (ity_complementarity × 0.6) + (pathy_cosine × 0.4)
3. User triggers collision → SparkMakerPage calls TrinityGraphContext.collideCharacters(a, b, placeId)
4. POST /api/trinity-graph/sparks/collide → proxy → Trinity Graph API
5. Trinity Graph API creates Spark node, CONVERGES_WITH relationships in Neo4j
6. Returns { spark_id, narrative, convergenceScore, tensionPoints, resonancePoints }
7. Frontend triggers Gemini narrative generation via existing backend:
   POST /api/generate-text (or custom route) with spark data as context
8. Optional: Fal.ai image generation for spark visualization
9. Spark cached in TrinityGraphContext and displayed in gallery
```

---

## 4. WorldContext Extension Strategy

The existing `WorldContext` manages **GCS-backed story worlds**. Trinity Graph data is an **overlay** — it does NOT replace WorldContext but augments it.

### Current WorldData structure (GCS):
```typescript
WorldData {
  storyTitle, logline, acts[], characters: string[], realms[], ...
  generationHistory: { concept, narrativeArchitecture, sceneBriefs, ... }
}
```

### Extension approach — TrinityGraphContext alongside WorldContext:

```typescript
// In App.tsx provider tree:
<WorldProvider>          // GCS-backed story world (unchanged)
  <TrinityGraphProvider> // Neo4j-backed character graph (new)
    <ApprenticeProvider>
      <ImageProvider>
        {children}
      </ImageProvider>
    </ApprenticeProvider>
  </TrinityGraphProvider>
</WorldProvider>
```

### Cross-context linkage:

The Trinity Graph `world_id` field maps to Aideator's `worldId` (GCS). When a user opens a world:
1. `WorldContext` loads GCS data as before
2. `TrinityGraphContext` detects `currentWorldId` change and lazy-loads characters/places/sparks from Trinity Graph API for that world
3. Character names in `WorldData.characters[]` serve as the bridge — same names exist in both systems

### Data partitioning:

| Data Type | Storage | Reason |
|-----------|---------|--------|
| Story beats, scenes, acts | GCS via WorldContext | Existing, working |
| Character narrative descriptions | GCS (narrativeArchitecture) | Existing, working |
| **Character ontological fingerprint (50 ity/pathy)** | **Neo4j via Trinity Graph** | New, graph-native |
| **Character relationships graph** | **Neo4j via Trinity Graph** | New, graph-native |
| **Spark collision records** | **Neo4j via Trinity Graph** | New, graph-native |
| **Places with sensory fields** | **Neo4j via Trinity Graph** | New, graph-native |
| **Garments & Artifacts** | **Neo4j via Trinity Graph** | New, graph-native |
| Character visual references (images) | GCS (existing) | Image storage |
| World images, scene images | GCS (existing) | Image storage |
| Trinity panorama projects | GCS (existing) | Image storage |

---

## 5. Migration Path

### Phase 1 — Additive (Zero Breaking Changes)

All new Trinity Graph features are **additive**. Existing GCS routes stay intact.

- Add `/api/trinity-graph/*` proxy routes to backend
- Add `TrinityGraphContext` and `TrinityGraphProvider` to App.tsx
- Add new pages: `/character-studio`, `/spark-maker`, `/ubiquity-studio`
- Add new nav links in Header

### Phase 2 — Enrichment

Existing character workflow (GCS) gets enriched with Trinity Graph data:

- When a character image is generated (existing flow), also create/update the Trinity Graph Character node
- `DetailPage` shows convergence scores when viewing two characters
- `RealmPage` shows relationship graph overlay

### Phase 3 — Optional Deep Integration

- Trinity Graph becomes the source of truth for character data
- GCS `narrativeArchitecture.characters[]` syncs bidirectionally with Trinity Graph
- Ingest route (`POST /api/trinity-graph/ingest`) called automatically when a new world is created

---

## 6. New Backend Routes

**File:** `backend/routes/trinityGraph.js`  
**Mount:** `app.use('/api/trinity-graph', trinityGraphRouter)`

All routes are proxy routes that:
1. Add/forward the Firebase JWT Authorization header
2. Forward the request body and query params to TRINITY_GRAPH_API_URL
3. Stream the response back to the frontend
4. Handle errors consistently with existing routes

| Method | Path | Trinity Graph API Endpoint |
|--------|------|---------------------------|
| GET | /health | GET /health |
| POST | /worlds | POST /worlds |
| GET | /worlds | GET /worlds |
| GET | /worlds/:id | GET /worlds/:id |
| POST | /characters | POST /characters |
| GET | /characters?world_id=X | GET /characters?world_id=X |
| GET | /characters/:id | GET /characters/:id |
| PUT | /characters/:id | PUT /characters/:id |
| POST | /characters/:id/relate | POST /characters/:id/relate |
| GET | /characters/:id/convergence/:otherId | GET /characters/:id/convergence/:otherId |
| POST | /places | POST /places |
| GET | /places?world_id=X | GET /places?world_id=X |
| POST | /garments | POST /garments |
| POST | /artifacts | POST /artifacts |
| POST | /sparks/collide | POST /sparks/collide |
| GET | /sparks?world_id=X | GET /sparks?world_id=X |
| POST | /ingest | POST /ingest |
| GET | /graph/stats | GET /graph/stats |
| POST | /graph/query | POST /graph/query |

---

## 7. New Frontend Pages

### `/character-studio` → `CharacterStudioPage.tsx`
- Full character creation and editing studio
- All 7 tabs: Identity, Ontological Fingerprint, Relationships, Visual DNA, Voice & Music, Garments & Artifacts, Export
- Radar charts (Chart.js) for ity/pathy visualization
- D3 relationship graph
- Persists to Trinity Graph API

### `/spark-maker` → `SparkMakerPage.tsx`
- Collision chamber for two characters
- Convergence algorithm with live score
- Dramatic SVG collision animation
- Gemini narrative + Fal.ai image generation
- Spark gallery from Trinity Graph

### `/ubiquity-studio` → `UbiquityStudioPage.tsx`
- Distribution & publishing pipeline
- Revenue calculator (Chart.js)
- Audience intelligence
- Rights & royalties tracker
- Launch calendar
- Hybrid persistence: Trinity Graph + localStorage

---

## 8. New Contexts & Hooks

### `TrinityGraphContext.tsx`
- Provider wrapping all Trinity Graph state
- Manages: characters cache, places cache, sparks cache per worldId
- Exposes: createCharacter, getCharacters, updateCharacter, createPlace, collideCharacters, getConvergence, createSpark, ingestContent, getWorldStats
- Auto-refreshes when currentWorldId changes

### `useTrinityGraph.ts`
- Convenience wrappers: `useCharacters(worldId)`, `usePlaces(worldId)`, `useSparks(worldId)`
- `useConvergence(charA, charB)` — computes + caches convergence
- `useCollide(charA, charB, placeId)` — triggers collision and returns spark

---

## 9. New Reusable Components

### `OntologicalSliders.tsx`
50 -ity/-pathy sliders in 5 groups (Relational, Cognitive, Moral, Emotional, Existential), each with a dual radar chart. Used in Character Studio and Spark Maker.

### `ConvergenceDisplay.tsx`
Convergence score with color-coded arc, top 3 tension points, top 3 resonance points. Used in Spark Maker and potentially in DetailPage.

### `CollisionAnimation.tsx`
SVG-based collision chamber: breathing idle → drift-together → merge with particle burst. CSS transitions for smooth animation.

---

## 10. App.tsx Changes

Add `TrinityGraphProvider` to provider tree and add 3 new protected routes:
- `/character-studio`
- `/spark-maker`
- `/ubiquity-studio`

Add Header nav links (see `app-router-additions.tsx`).

---

## 11. Environment Variables

Add to `.env` and backend config:

```bash
# Trinity Graph API
TRINITY_GRAPH_API_URL=https://trinity-graph-api-328246068140.us-central1.run.app

# Already exists in constants.ts / .env:
VITE_API_BASE_URL=http://localhost:5001  # or production URL
```

---

## 12. Dependencies to Install

Frontend:
```bash
npm install chart.js react-chartjs-2 d3 @types/d3
# react-chartjs-2 requires chart.js as peer dep
```

These are imported from npm, not CDN, to work with Vite's module bundler.

---

## 13. Risk Assessment

| Risk | Mitigation |
|------|-----------|
| Trinity Graph API downtime | All proxy routes have try/catch, return 503 gracefully; UI shows fallback empty state |
| Firebase auth mismatch | Proxy passes JWT as-is; Trinity Graph must share Firebase project |
| Large ity/pathy payload (50 fields) | Validated on frontend before save; backend mirrors validation |
| Neo4j query latency | TrinityGraphContext caches in-memory; stale-while-revalidate pattern |
| Breaking existing GCS routes | All new routes use `/api/trinity-graph/` prefix — zero collision |
| Chart.js/D3 bundle size | Lazy-load CharacterStudioPage with React.lazy() |

---

## 14. Testing Strategy

1. **Health check:** `GET /api/trinity-graph/health` — smoke test on startup
2. **Character CRUD:** Create → Read → Update character in Jest/Supertest
3. **Spark collision:** POST two character IDs → assert convergence score 0–1
4. **Auth passthrough:** Ensure JWT is forwarded correctly in proxy
5. **Context caching:** Verify characters[] updates after createCharacter()
6. **E2E:** Playwright test for Character Studio tab navigation and save
