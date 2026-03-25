/**
 * Trinity Context Engine
 * Intelligent world-aware object surfacing for all Trinity Studios
 * Version 1.0 — 2026
 */

window.TrinityContext = (function() {

  // ── Era definitions for adjacency scoring ─────────────────────
  const ERA_ANCHORS = [
    { label: 'prehistoric',  range: [-50000, -3000] },
    { label: 'ancient',      range: [-3000,  500] },
    { label: 'medieval',     range: [500,    1400] },
    { label: 'renaissance',  range: [1400,   1600] },
    { label: 'early-modern', range: [1600,   1800] },
    { label: 'industrial',   range: [1800,   1920] },
    { label: 'modern',       range: [1920,   1980] },
    { label: 'contemporary', range: [1980,   2020] },
    { label: 'near-future',  range: [2020,   2100] },
    { label: 'far-future',   range: [2100,   9999] },
  ];

  // ── Archetype suggestions by era ──────────────────────────────
  const ERA_ARCHETYPES = {
    prehistoric:  ['Shaman', 'Hunter', 'Elder', 'Gatherer', 'Warrior', 'Storyteller'],
    ancient:      ['Pharaoh', 'Slave', 'Merchant', 'Philosopher', 'Soldier', 'Priest'],
    medieval:     ['Knight', 'Peasant', 'Merchant', 'Monk', 'Witch', 'Noble'],
    renaissance:  ['Artist', 'Patron', 'Explorer', 'Scholar', 'Courtesan', 'Alchemist'],
    'early-modern':['Pioneer', 'Colonist', 'Sailor', 'Tradesperson', 'Rebel', 'Aristocrat'],
    industrial:   ['Factory Worker', 'Inventor', 'Reformer', 'Tycoon', 'Immigrant', 'Suffragette'],
    modern:       ['Revolutionary', 'Artist', 'Soldier', 'Activist', 'Celebrity', 'Scientist'],
    contemporary: ['Tech Worker', 'Activist', 'Refugee', 'Creator', 'Entrepreneur', 'Dissident'],
    'near-future':['Hacker', 'Corp Drone', 'Bioengineer', 'Climate Refugee', 'AI Liaison', 'Off-grid Survivalist'],
    'far-future': ['Post-Human', 'Archivist', 'Void Walker', 'Collective Node', 'Terraformer', 'Memory Keeper'],
  };

  // ── Place type suggestions by era ─────────────────────────────
  const ERA_PLACES = {
    prehistoric:  ['Sacred Cave', 'Hunting Ground', 'River Crossing', 'Standing Stones', 'Tribal Camp', 'Ancient Forest'],
    ancient:      ['Agora', 'Temple', 'Harbor', 'Palace', 'Marketplace', 'Necropolis'],
    medieval:     ['Castle', 'Cathedral', 'Village Square', 'Forest Path', 'Monastery', 'Tavern'],
    renaissance:  ['Studio', 'Court', 'Garden', 'Library', 'Piazza', 'Workshop'],
    'early-modern':['Frontier Settlement', 'Wharf', 'Colonial Market', 'Wilderness Trail', 'Trading Post', 'Plantation'],
    industrial:   ['Factory Floor', 'Railway Station', 'Slum', 'Department Store', 'Laboratory', 'Union Hall'],
    modern:       ['Jazz Club', 'War Front', 'Suburb', 'City Street', 'Hospital', 'Protest'],
    contemporary: ['Co-working Space', 'Airport', 'Data Center', 'Protest Square', 'Social Media HQ', 'Refugee Camp'],
    'near-future':['Arcology', 'Climate Wall', 'Neural Lab', 'Dark Web Hub', 'Sky Market', 'Underground Colony'],
    'far-future': ['Space Station', 'Dyson Sphere', 'Memory Archive', 'Void Port', 'Synthetic Biome', 'Quantum Cathedral'],
  };

  // ── Theme suggestions by ity_profile ─────────────────────────
  const ITY_THEMES = {
    resilience:    ['survival', 'endurance', 'sacrifice', 'perseverance'],
    vitality:      ['rebirth', 'passion', 'desire', 'embodiment'],
    materiality:   ['craft', 'possession', 'decay', 'inheritance'],
    authenticity:  ['identity', 'truth', 'betrayal', 'self-discovery'],
    complexity:    ['moral ambiguity', 'power', 'corruption', 'transformation'],
    creativity:    ['invention', 'expression', 'freedom', 'rebellion'],
    luminosity:    ['revelation', 'beauty', 'illusion', 'transcendence'],
    continuity:    ['memory', 'legacy', 'time', 'belonging'],
    viscosity:     ['connection', 'obligation', 'loyalty', 'entanglement'],
    spontaneity:   ['chance', 'chaos', 'discovery', 'risk'],
    interiority:   ['grief', 'longing', 'solitude', 'inner conflict'],
    reciprocity:   ['justice', 'revenge', 'forgiveness', 'exchange'],
  };

  // ── Arc recommendations ────────────────────────────────────────
  const ARC_RULES = [
    { test: p => (p.resilience||0) > 0.7 && (p.vitality||0) > 0.7,        arc: 'Survival Arc' },
    { test: p => (p.complexity||0) > 0.7 && (p.authenticity||0) > 0.7,    arc: 'Transformation Arc' },
    { test: p => (p.continuity||0) > 0.7 && (p.interiority||0) > 0.6,     arc: 'Legacy Arc' },
    { test: p => (p.luminosity||0) > 0.7 && (p.creativity||0) > 0.6,      arc: 'Revelation Arc' },
    { test: p => (p.viscosity||0) > 0.7 && (p.reciprocity||0) > 0.6,      arc: 'Connection Arc' },
    { test: p => (p.spontaneity||0) > 0.6 && (p.creativity||0) > 0.6,     arc: 'Discovery Arc' },
    { test: p => (p.materiality||0) > 0.7 && (p.continuity||0) > 0.6,     arc: 'Inheritance Arc' },
    { test: () => true,                                                      arc: 'Journey Arc' },
  ];

  // ── Helpers ───────────────────────────────────────────────────

  function parseEraYears(eraStr) {
    if (!eraStr) return null;
    const m = String(eraStr).match(/(-?\d{3,4})[^\d-]*(-?\d{3,4})?/);
    if (!m) return null;
    const start = parseInt(m[1], 10);
    const end = m[2] ? parseInt(m[2], 10) : start + 50;
    return [start, end];
  }

  function rangesOverlap(a, b) {
    return a[0] <= b[1] && b[0] <= a[1];
  }

  function eraScore(objEra, worldEra) {
    const obj = parseEraYears(objEra);
    const world = parseEraYears(worldEra);
    if (!obj || !world) return 0;
    if (rangesOverlap(obj, world)) return 1.0;
    // Adjacent? Within 100 years
    const gap = Math.min(
      Math.abs(obj[0] - world[1]),
      Math.abs(obj[1] - world[0])
    );
    if (gap <= 100) return 0.5;
    if (gap <= 300) return 0.2;
    return 0;
  }

  function jaccardSimilarity(tagsA, tagsB) {
    if (!tagsA || !tagsB || !tagsA.length || !tagsB.length) return 0;
    const setA = new Set(tagsA.map(t => String(t).toLowerCase().trim()));
    const setB = new Set(tagsB.map(t => String(t).toLowerCase().trim()));
    const intersection = [...setA].filter(t => setB.has(t)).length;
    const union = new Set([...setA, ...setB]).size;
    return union === 0 ? 0 : intersection / union;
  }

  function cosineSimilarity(profileA, profileB) {
    if (!profileA || !profileB) return 0;
    const keys = Object.keys(profileA);
    if (!keys.length) return 0;
    let dot = 0, magA = 0, magB = 0;
    for (const k of keys) {
      const a = profileA[k] || 0;
      const b = profileB[k] || 0;
      dot += a * b;
      magA += a * a;
      magB += b * b;
    }
    if (magA === 0 || magB === 0) return 0;
    return dot / (Math.sqrt(magA) * Math.sqrt(magB));
  }

  function detectEraCategory(worldEra) {
    const years = parseEraYears(worldEra);
    if (!years) return 'contemporary';
    const mid = (years[0] + years[1]) / 2;
    for (const e of ERA_ANCHORS) {
      if (mid >= e.range[0] && mid <= e.range[1]) return e.label;
    }
    return 'contemporary';
  }

  // ── Public API ────────────────────────────────────────────────

  return {

    getWorld() {
      try {
        return JSON.parse(localStorage.getItem('trinity_active_world') || 'null');
      } catch { return null; }
    },

    /**
     * Score an object's relevance to the active world.
     * object: { tags:[], era:'', archetype:'', ity_profile:{} }
     * Returns 0.0–1.0
     */
    score(object) {
      const world = this.getWorld();
      if (!world) return 0;

      // Era match (0.4 weight)
      const era = eraScore(object.era, world.era);

      // Tag overlap (0.3 weight)
      const objTags = Array.isArray(object.tags) ? object.tags
        : (object.tags ? String(object.tags).split(',') : []);
      const worldTags = Array.isArray(world.tags) ? world.tags
        : (world.tags ? String(world.tags).split(',') : []);
      const tags = jaccardSimilarity(objTags, worldTags);

      // Ity cosine (0.3 weight)
      const objIty = object.ity_profile || {};
      const worldIty = world.ity_profile || {};
      const ity = cosineSimilarity(objIty, worldIty);

      // Archetype bonus (+0.1 if archetype is in world's archetypes list)
      let arcBonus = 0;
      if (object.archetype && world.archetypes) {
        const arcList = Array.isArray(world.archetypes) ? world.archetypes
          : String(world.archetypes).split(',').map(s => s.trim());
        if (arcList.some(a => a.toLowerCase() === String(object.archetype).toLowerCase())) {
          arcBonus = 0.1;
        }
      }

      const raw = era * 0.4 + tags * 0.3 + ity * 0.3 + arcBonus;
      return Math.min(1.0, raw);
    },

    /** Sort array of objects by relevance (descending) */
    rank(objects) {
      const scored = objects.map(o => ({ obj: o, s: this.score(o) }));
      scored.sort((a, b) => b.s - a.s);
      return scored.map(x => x.obj);
    },

    /** Top N relevant items */
    top(objects, n = 6) {
      return this.rank(objects).slice(0, n);
    },

    /** Human-readable relevance reason */
    reason(object) {
      const world = this.getWorld();
      if (!world) return 'No active world';
      const reasons = [];
      const era = eraScore(object.era, world.era);
      if (era >= 1.0) reasons.push(`Era matches ${world.name}`);
      else if (era >= 0.5) reasons.push(`Near era of ${world.name}`);

      const objTags = Array.isArray(object.tags) ? object.tags
        : (object.tags ? String(object.tags).split(',') : []);
      const worldTags = Array.isArray(world.tags) ? world.tags
        : (world.tags ? String(world.tags).split(',') : []);
      const overlap = objTags.filter(t =>
        worldTags.some(wt => wt.toLowerCase().trim() === t.toLowerCase().trim())
      );
      if (overlap.length > 0) reasons.push(`Shares themes: ${overlap.slice(0, 3).join(', ')}`);

      const ity = cosineSimilarity(object.ity_profile || {}, world.ity_profile || {});
      if (ity > 0.8) reasons.push('Strong ity alignment');
      else if (ity > 0.5) reasons.push('Partial ity alignment');

      if (object.archetype && world.archetypes) {
        const arcList = Array.isArray(world.archetypes) ? world.archetypes
          : String(world.archetypes).split(',').map(s => s.trim());
        if (arcList.some(a => a.toLowerCase() === String(object.archetype).toLowerCase())) {
          reasons.push('Archetype fits this world');
        }
      }

      if (reasons.length === 0) return 'Low relevance to active world';
      return reasons.join(' · ');
    },

    /** Suggest archetypes appropriate for the active world */
    suggestArchetypes() {
      const world = this.getWorld();
      if (!world) return [];
      // Start with world's own archetypes
      let archetypes = [];
      if (world.archetypes) {
        archetypes = Array.isArray(world.archetypes)
          ? world.archetypes
          : String(world.archetypes).split(',').map(s => s.trim()).filter(Boolean);
      }
      // Fill with era-based suggestions
      const cat = detectEraCategory(world.era);
      const eraArcs = ERA_ARCHETYPES[cat] || ERA_ARCHETYPES.contemporary;
      for (const a of eraArcs) {
        if (!archetypes.includes(a) && archetypes.length < 12) archetypes.push(a);
      }
      return archetypes.slice(0, 12);
    },

    /** Suggest place types for the active world */
    suggestPlaceTypes() {
      const world = this.getWorld();
      if (!world) return [];
      const cat = detectEraCategory(world.era);
      const places = ERA_PLACES[cat] || ERA_PLACES.contemporary;
      // Customize based on geography/aesthetic tags
      return places;
    },

    /** Suggest themes for the active world */
    suggestThemes() {
      const world = this.getWorld();
      if (!world) return [];
      // Start with world's own themes
      let themes = [];
      if (world.themes) {
        themes = Array.isArray(world.themes)
          ? world.themes
          : String(world.themes).split(',').map(s => s.trim()).filter(Boolean);
      }
      // Add ity-derived themes
      const ityProfile = world.ity_profile || {};
      const sortedIty = Object.entries(ityProfile).sort((a, b) => b[1] - a[1]);
      for (const [key] of sortedIty.slice(0, 3)) {
        const derived = ITY_THEMES[key] || [];
        for (const t of derived) {
          if (!themes.includes(t) && themes.length < 12) themes.push(t);
        }
      }
      return themes.slice(0, 8);
    },

    /** Suggest arc type for the active world */
    suggestArc() {
      const world = this.getWorld();
      if (!world || !world.ity_profile) return 'Journey Arc';
      for (const rule of ARC_RULES) {
        if (rule.test(world.ity_profile)) return rule.arc;
      }
      return 'Journey Arc';
    },

    /** Detect era category (bucket name) */
    detectEraCategory,

    /** Score two characters for narrative "collision potential" */
    collisionScore(charA, charB) {
      const world = this.getWorld();
      const relA = this.score(charA);
      const relB = this.score(charB);
      const worldRelevance = (relA + relB) / 2;

      // Ity contrast = characters with opposite profiles collide better
      const ityA = charA.ity_profile || {};
      const ityB = charB.ity_profile || {};
      const similarity = cosineSimilarity(ityA, ityB);
      const contrast = 1 - similarity; // high contrast = high collision

      // Narrative tension = 60% world relevance + 40% contrast
      return worldRelevance * 0.6 + contrast * 0.4;
    },

    /** Get top N collision pairs from array of characters */
    topCollisions(characters, n = 3) {
      const pairs = [];
      for (let i = 0; i < characters.length; i++) {
        for (let j = i + 1; j < characters.length; j++) {
          pairs.push({
            a: characters[i],
            b: characters[j],
            score: this.collisionScore(characters[i], characters[j])
          });
        }
      }
      pairs.sort((x, y) => y.score - x.score);
      return pairs.slice(0, n);
    }
  };
})();
