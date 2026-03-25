/**
 * Trinity Graph API Proxy Routes
 * Proxies requests from the Aideator backend to the external Trinity Graph API.
 *
 * Mount in server.js:
 *   import { setupTrinityGraphRoutes } from './routes/trinityGraph.js';
 *   setupTrinityGraphRoutes(app, optionalAuth);
 *
 * All routes forward Firebase JWT Authorization headers so the Trinity Graph API
 * can independently verify the caller. Error handling follows the same pattern
 * as the existing trinity.js and characters.js routes.
 *
 * Env var: TRINITY_GRAPH_API_URL (default: https://trinity-graph-api-328246068140.us-central1.run.app)
 */

import fetch from 'node-fetch'; // already a dep via existing routes

const TRINITY_GRAPH_API_URL =
  process.env.TRINITY_GRAPH_API_URL ||
  'https://trinity-graph-api-328246068140.us-central1.run.app';

/**
 * Build the set of headers to forward to the Trinity Graph API.
 * Always passes through Authorization (Firebase JWT) and Content-Type.
 */
function buildForwardHeaders(req) {
  const headers = { 'Content-Type': 'application/json' };
  if (req.headers.authorization) {
    headers['Authorization'] = req.headers.authorization;
  }
  // Forward user-agent so Trinity Graph can log the source
  if (req.headers['user-agent']) {
    headers['X-Forwarded-User-Agent'] = req.headers['user-agent'];
  }
  headers['X-Forwarded-For'] = req.ip || 'unknown';
  return headers;
}

/**
 * Generic proxy helper — forwards a request to the Trinity Graph API and
 * streams the JSON response back to the Express res object.
 *
 * @param {string} method  HTTP method
 * @param {string} path    Path relative to TRINITY_GRAPH_API_URL (e.g. '/characters')
 * @param {object} headers Forwarded headers
 * @param {object|null} body  Request body (for POST/PUT), null for GET/DELETE
 * @param {object} res     Express response object
 */
async function proxyToTrinityGraph(method, path, headers, body, res) {
  const url = `${TRINITY_GRAPH_API_URL}${path}`;

  console.log(`🔗 Trinity Graph proxy: ${method} ${url}`);

  try {
    const fetchOptions = {
      method,
      headers,
    };

    if (body !== null && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(url, fetchOptions);

    // Read body regardless of status so we can forward error messages
    let data;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { message: text };
    }

    if (!response.ok) {
      console.error(`❌ Trinity Graph API error ${response.status} for ${method} ${path}:`, data);
      return res.status(response.status).json({
        error: data?.detail || data?.message || 'Trinity Graph API request failed',
        status: response.status,
        upstream: 'trinity-graph',
      });
    }

    console.log(`✅ Trinity Graph proxy success: ${method} ${path} → ${response.status}`);
    return res.status(response.status).json(data);
  } catch (err) {
    console.error(`❌ Trinity Graph proxy network error for ${method} ${path}:`, err);
    return res.status(503).json({
      error: 'Trinity Graph API is unreachable',
      details: err.message,
      upstream: 'trinity-graph',
    });
  }
}

/**
 * Build query string from Express req.query, preserving all params.
 */
function buildQueryString(query) {
  const params = new URLSearchParams(query);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

// ============================================================================
// ROUTE SETUP
// ============================================================================

export function setupTrinityGraphRoutes(app, optionalAuth) {
  // ────────────────────────────────────────────────────────────────────────────
  // HEALTH
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * GET /api/trinity-graph/health
   * Check Trinity Graph API availability. No auth required.
   */
  app.get('/api/trinity-graph/health', async (req, res) => {
    try {
      const response = await fetch(`${TRINITY_GRAPH_API_URL}/health`);
      const data = await response.json().catch(() => ({ status: 'unknown' }));
      return res.status(response.ok ? 200 : 503).json({
        ...data,
        proxy: 'aideator-backend',
        upstream: TRINITY_GRAPH_API_URL,
      });
    } catch (err) {
      return res.status(503).json({
        status: 'unreachable',
        error: err.message,
        upstream: TRINITY_GRAPH_API_URL,
      });
    }
  });

  // ────────────────────────────────────────────────────────────────────────────
  // WORLDS
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * POST /api/trinity-graph/worlds
   * Create a new world node in the Trinity Graph.
   * Body: { world_id, name, description?, genre? }
   */
  app.post('/api/trinity-graph/worlds', optionalAuth, async (req, res) => {
    const userId = req.user?.uid || 'local-user';
    console.log(`🌍 Creating Trinity Graph world for user: ${userId}`);
    const headers = buildForwardHeaders(req);
    return proxyToTrinityGraph('POST', '/worlds', headers, req.body, res);
  });

  /**
   * GET /api/trinity-graph/worlds
   * List all worlds accessible to the current user.
   */
  app.get('/api/trinity-graph/worlds', optionalAuth, async (req, res) => {
    const headers = buildForwardHeaders(req);
    const qs = buildQueryString(req.query);
    return proxyToTrinityGraph('GET', `/worlds${qs}`, headers, null, res);
  });

  /**
   * GET /api/trinity-graph/worlds/:id
   * Get a specific world node.
   */
  app.get('/api/trinity-graph/worlds/:id', optionalAuth, async (req, res) => {
    const headers = buildForwardHeaders(req);
    return proxyToTrinityGraph('GET', `/worlds/${req.params.id}`, headers, null, res);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // CHARACTERS
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * POST /api/trinity-graph/characters
   * Create a new character with optional ity/pathy ontological fingerprint.
   * Body: { world_id, name, description?, ity_pathy?: { brutality, sensuality, ... } }
   */
  app.post('/api/trinity-graph/characters', optionalAuth, async (req, res) => {
    const userId = req.user?.uid || 'local-user';
    console.log(`👤 Creating Trinity Graph character for user: ${userId}`);

    if (!req.body.world_id || !req.body.name) {
      return res.status(400).json({ error: 'world_id and name are required' });
    }

    const headers = buildForwardHeaders(req);
    return proxyToTrinityGraph('POST', '/characters', headers, req.body, res);
  });

  /**
   * GET /api/trinity-graph/characters?world_id=X
   * List all characters in a world.
   */
  app.get('/api/trinity-graph/characters', optionalAuth, async (req, res) => {
    const headers = buildForwardHeaders(req);
    const qs = buildQueryString(req.query);
    return proxyToTrinityGraph('GET', `/characters${qs}`, headers, null, res);
  });

  /**
   * GET /api/trinity-graph/characters/:id
   * Get a specific character by ID.
   */
  app.get('/api/trinity-graph/characters/:id', optionalAuth, async (req, res) => {
    const headers = buildForwardHeaders(req);
    return proxyToTrinityGraph('GET', `/characters/${req.params.id}`, headers, null, res);
  });

  /**
   * PUT /api/trinity-graph/characters/:id
   * Update an existing character's fields or ity/pathy fingerprint.
   * Body: Partial<Character>
   */
  app.put('/api/trinity-graph/characters/:id', optionalAuth, async (req, res) => {
    const headers = buildForwardHeaders(req);
    return proxyToTrinityGraph('PUT', `/characters/${req.params.id}`, headers, req.body, res);
  });

  /**
   * POST /api/trinity-graph/characters/:id/relate
   * Create a relationship between two characters.
   * Body: { target_id, relationship_type, description?, strength? }
   */
  app.post('/api/trinity-graph/characters/:id/relate', optionalAuth, async (req, res) => {
    if (!req.body.target_id || !req.body.relationship_type) {
      return res.status(400).json({ error: 'target_id and relationship_type are required' });
    }
    const headers = buildForwardHeaders(req);
    return proxyToTrinityGraph(
      'POST',
      `/characters/${req.params.id}/relate`,
      headers,
      req.body,
      res
    );
  });

  /**
   * GET /api/trinity-graph/characters/:id/convergence/:otherId
   * Get convergence score and analysis between two characters.
   */
  app.get('/api/trinity-graph/characters/:id/convergence/:otherId', optionalAuth, async (req, res) => {
    const headers = buildForwardHeaders(req);
    return proxyToTrinityGraph(
      'GET',
      `/characters/${req.params.id}/convergence/${req.params.otherId}`,
      headers,
      null,
      res
    );
  });

  // ────────────────────────────────────────────────────────────────────────────
  // PLACES
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * POST /api/trinity-graph/places
   * Create a new place with sensory fields.
   * Body: { world_id, name, description?, sensory: { sight, sound, smell, taste, touch } }
   */
  app.post('/api/trinity-graph/places', optionalAuth, async (req, res) => {
    if (!req.body.world_id || !req.body.name) {
      return res.status(400).json({ error: 'world_id and name are required' });
    }
    const headers = buildForwardHeaders(req);
    return proxyToTrinityGraph('POST', '/places', headers, req.body, res);
  });

  /**
   * GET /api/trinity-graph/places?world_id=X
   * List all places in a world.
   */
  app.get('/api/trinity-graph/places', optionalAuth, async (req, res) => {
    const headers = buildForwardHeaders(req);
    const qs = buildQueryString(req.query);
    return proxyToTrinityGraph('GET', `/places${qs}`, headers, null, res);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // GARMENTS & ARTIFACTS
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * POST /api/trinity-graph/garments
   * Create a garment and associate with a character.
   * Body: { character_id, name, description?, type?, material?, symbolic_meaning? }
   */
  app.post('/api/trinity-graph/garments', optionalAuth, async (req, res) => {
    if (!req.body.character_id || !req.body.name) {
      return res.status(400).json({ error: 'character_id and name are required' });
    }
    const headers = buildForwardHeaders(req);
    return proxyToTrinityGraph('POST', '/garments', headers, req.body, res);
  });

  /**
   * POST /api/trinity-graph/artifacts
   * Create an artifact and associate with a character or place.
   * Body: { name, description?, associated_with_id?, power_level?, origin? }
   */
  app.post('/api/trinity-graph/artifacts', optionalAuth, async (req, res) => {
    if (!req.body.name) {
      return res.status(400).json({ error: 'name is required' });
    }
    const headers = buildForwardHeaders(req);
    return proxyToTrinityGraph('POST', '/artifacts', headers, req.body, res);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // SPARKS
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * POST /api/trinity-graph/sparks/collide
   * Collide two characters to generate a Spark.
   * Body: { character_a_id, character_b_id, place_id?, world_id }
   * Returns: { spark_id, convergence_score, tension_points[], resonance_points[], narrative }
   */
  app.post('/api/trinity-graph/sparks/collide', optionalAuth, async (req, res) => {
    const { character_a_id, character_b_id } = req.body;
    if (!character_a_id || !character_b_id) {
      return res.status(400).json({ error: 'character_a_id and character_b_id are required' });
    }
    const headers = buildForwardHeaders(req);
    return proxyToTrinityGraph('POST', '/sparks/collide', headers, req.body, res);
  });

  /**
   * GET /api/trinity-graph/sparks?world_id=X
   * List all sparks for a world.
   */
  app.get('/api/trinity-graph/sparks', optionalAuth, async (req, res) => {
    const headers = buildForwardHeaders(req);
    const qs = buildQueryString(req.query);
    return proxyToTrinityGraph('GET', `/sparks${qs}`, headers, null, res);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // INGEST
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * POST /api/trinity-graph/ingest
   * Ingest a full world document (script, treatment, etc.) into the graph.
   * Body: { world_id, content_type, content, metadata? }
   */
  app.post('/api/trinity-graph/ingest', optionalAuth, async (req, res) => {
    const { world_id, content } = req.body;
    if (!world_id || !content) {
      return res.status(400).json({ error: 'world_id and content are required' });
    }
    const userId = req.user?.uid || 'local-user';
    console.log(`📥 Trinity Graph ingest for world ${world_id}, user: ${userId}`);
    const headers = buildForwardHeaders(req);
    return proxyToTrinityGraph('POST', '/ingest', headers, req.body, res);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // GRAPH UTILITIES
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * GET /api/trinity-graph/graph/stats
   * Get graph statistics (node counts, relationship counts, etc.).
   */
  app.get('/api/trinity-graph/graph/stats', optionalAuth, async (req, res) => {
    const headers = buildForwardHeaders(req);
    const qs = buildQueryString(req.query);
    return proxyToTrinityGraph('GET', `/graph/stats${qs}`, headers, null, res);
  });

  /**
   * POST /api/trinity-graph/graph/query
   * Execute an arbitrary Cypher query (admin/power users only).
   * Body: { query: string, params?: object }
   */
  app.post('/api/trinity-graph/graph/query', optionalAuth, async (req, res) => {
    if (!req.body.query) {
      return res.status(400).json({ error: 'query is required' });
    }
    const headers = buildForwardHeaders(req);
    return proxyToTrinityGraph('POST', '/graph/query', headers, req.body, res);
  });

  console.log('✅ Trinity Graph proxy routes registered at /api/trinity-graph/*');
}
