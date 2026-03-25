/**
 * backend/server.js Additions — Trinity Graph Integration
 *
 * Add these lines to your existing server.js (or server.mjs) file.
 * The Trinity Graph routes are proxied to the external Trinity Graph API.
 *
 * NOTE: The order of these additions matters:
 *   - Import at top of file (with other imports)
 *   - Route setup after middleware, before catch-all handlers
 */

// ============================================================================
// STEP 1 — Add import at the TOP of server.js (with existing route imports)
// ============================================================================

/*
// === NEW: Trinity Graph proxy routes ===
import { setupTrinityGraphRoutes } from './routes/trinityGraph.js';
*/

// ============================================================================
// STEP 2 — Register routes in server.js
//
// Place this AFTER all middleware setup (cors, express.json(), auth middleware)
// and BEFORE any catch-all route handlers (like the SPA fallback).
//
// Example location in server.js:
//   ... (existing routes like worlds, trinity, characters) ...
//
//   // TRINITY GRAPH — add this block:
//   setupTrinityGraphRoutes(app, optionalAuth);
//
// ============================================================================

// The actual function call to paste into server.js:
//
//   setupTrinityGraphRoutes(app, optionalAuth);
//

// ============================================================================
// STEP 3 — Add environment variable to .env and .env.production
// ============================================================================

/*
# .env (development)
TRINITY_GRAPH_API_URL=https://trinity-graph-api-328246068140.us-central1.run.app

# .env.production (or wherever production env vars are set)
TRINITY_GRAPH_API_URL=https://trinity-graph-api-328246068140.us-central1.run.app
*/

// ============================================================================
// STEP 4 — Verify node-fetch is available
//
// The trinityGraph.js route file imports 'node-fetch'.
// If your server.js already uses node-fetch (or uses global fetch from Node 18+),
// update the import in trinityGraph.js accordingly:
//
// Node 18+ (global fetch):
//   Remove: import fetch from 'node-fetch';
//   The global fetch will be used automatically.
//
// Node 16 or earlier:
//   npm install node-fetch   (if not already installed)
//
// ============================================================================

// ============================================================================
// COMPLETE EXAMPLE — What server.js looks like after changes
// ============================================================================

/*
// === EXISTING imports ===
import express from 'express';
import cors from 'cors';
// ... existing route imports ...
import { setupListTrinityProjectsRoute } from './routes/trinity.js';
import { setupGenerateCharacterImageRoute } from './routes/characters.js';

// === NEW import ===
import { setupTrinityGraphRoutes } from './routes/trinityGraph.js';

const app = express();

// === EXISTING middleware ===
app.use(cors({ ... }));
app.use(express.json({ limit: '50mb' }));
// ...

// === EXISTING route setup ===
setupListTrinityProjectsRoute(app, storage, optionalAuth);
setupSaveTrinityProjectRoute(app, storage, optionalAuth);
// ... other existing routes ...

// === NEW: Trinity Graph proxy routes ===
setupTrinityGraphRoutes(app, optionalAuth);

// === EXISTING: SPA fallback (keep at end) ===
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
*/

// ============================================================================
// HEALTH CHECK — Verify the integration is working
//
// After restarting the server, hit this endpoint:
//   curl http://localhost:5001/api/trinity-graph/health
//
// Expected response:
//   { "status": "ok", "proxy": "aideator-backend", "upstream": "https://trinity-graph-api-..." }
//
// If you get a 503, the Trinity Graph API is unreachable from your backend.
// Check firewall rules and the TRINITY_GRAPH_API_URL env var.
// ============================================================================
