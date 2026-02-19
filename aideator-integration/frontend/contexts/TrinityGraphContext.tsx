/**
 * TrinityGraphContext
 *
 * Provides Trinity Graph API data (characters, places, sparks, garments, artifacts)
 * to all pages in the Aideator app. Wraps the Trinity Graph proxy routes at
 * /api/trinity-graph/* using the existing authenticatedFetch pattern from utils/api.ts.
 *
 * Usage:
 *   const { characters, createCharacter, collideCharacters } = useTrinityGraph();
 *
 * Provider placement in App.tsx:
 *   <WorldProvider>
 *     <TrinityGraphProvider>
 *       <ApprenticeProvider>
 *         ...
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { EFFECTIVE_API_BASE_URL, authenticatedFetch } from '../../utils/api';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/** The 50 ontological -ity/-pathy dimensions, grouped by category. */
export interface ItyPathy {
  // ── Relational Dynamics ──────────────────────────────────────────────────
  brutality: number;        // 0–100
  sensuality: number;
  volatility: number;
  empathy: number;
  loyalty: number;
  duplicity: number;
  dominance: number;
  submission: number;
  sympathy: number;
  antipathy: number;

  // ── Cognitive Architecture ────────────────────────────────────────────────
  creativity: number;
  rigidity: number;
  curiosity: number;
  certainty: number;
  adaptability: number;
  tenacity: number;
  rationality: number;
  irrationality: number;
  clarity: number;
  opacity: number;

  // ── Moral Topology ────────────────────────────────────────────────────────
  morality: number;
  amorality: number;
  integrity: number;
  duplicity2: number;  // mapped as 'moral_duplicity' in API
  altruism: number;
  selfishness: number;
  purity: number;
  corruption: number;
  honesty: number;
  deception: number;

  // ── Emotional Landscape ───────────────────────────────────────────────────
  vulnerability: number;
  stoicity: number;
  intensity: number;
  serenity: number;
  anxiety: number;
  tranquility: number;
  passion: number;
  apathy: number;
  warmth: number;
  coldness: number;

  // ── Existential Stance ────────────────────────────────────────────────────
  spirituality: number;
  materialism: number;
  idealism: number;
  pragmatism: number;
  fatalism: number;
  agency: number;
  mortality_awareness: number;
  immortality_seeking: number;
  belonging: number;
  alienation: number;
}

export type ItyPathyKey = keyof ItyPathy;

export const ITY_PATHY_DEFAULTS: ItyPathy = {
  brutality: 50, sensuality: 50, volatility: 50, empathy: 50,
  loyalty: 50, duplicity: 50, dominance: 50, submission: 50,
  sympathy: 50, antipathy: 50,
  creativity: 50, rigidity: 50, curiosity: 50, certainty: 50,
  adaptability: 50, tenacity: 50, rationality: 50, irrationality: 50,
  clarity: 50, opacity: 50,
  morality: 50, amorality: 50, integrity: 50, duplicity2: 50,
  altruism: 50, selfishness: 50, purity: 50, corruption: 50,
  honesty: 50, deception: 50,
  vulnerability: 50, stoicity: 50, intensity: 50, serenity: 50,
  anxiety: 50, tranquility: 50, passion: 50, apathy: 50,
  warmth: 50, coldness: 50,
  spirituality: 50, materialism: 50, idealism: 50, pragmatism: 50,
  fatalism: 50, agency: 50, mortality_awareness: 50,
  immortality_seeking: 50, belonging: 50, alienation: 50,
};

export interface VisualDNA {
  description?: string;
  keyVisualElements?: string[];
  colorPalette?: string[];
  species?: string;
  signatureCostume?: string;
  visualStyle?: {
    renderingStyle?: string;
    artTechnique?: string;
    lightingStyle?: string;
    lineWork?: string;
    textureDetail?: string;
    colorTreatment?: string;
    stylePrompt?: string;
  };
}

export interface Relationship {
  id: string;
  target_id: string;
  target_name: string;
  relationship_type: string;
  description?: string;
  strength?: number; // 0–100
}

export interface TrinityCharacter {
  id: string;
  world_id: string;
  name: string;
  description?: string;
  archetype?: string;
  age?: string;
  gender?: string;
  occupation?: string;
  nationality?: string;
  backstory?: string;
  ity_pathy: ItyPathy;
  visual_dna?: VisualDNA;
  voice_description?: string;
  music_theme?: string;
  relationships?: Relationship[];
  garments?: Garment[];
  artifacts?: Artifact[];
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SensoryProfile {
  sight?: string;
  sound?: string;
  smell?: string;
  taste?: string;
  touch?: string;
  temperature?: string;
  atmosphere?: string;
}

export interface TrinityPlace {
  id: string;
  world_id: string;
  name: string;
  description?: string;
  type?: string;
  sensory?: SensoryProfile;
  inhabitants?: string[]; // character IDs
  image_url?: string;
  created_at?: string;
}

export interface Garment {
  id: string;
  character_id: string;
  name: string;
  description?: string;
  type?: string;
  material?: string;
  color?: string;
  symbolic_meaning?: string;
}

export interface Artifact {
  id: string;
  name: string;
  description?: string;
  associated_with_id?: string;
  power_level?: number; // 0–100
  origin?: string;
  symbolic_meaning?: string;
}

export interface ConvergenceAnalysis {
  character_a_id: string;
  character_b_id: string;
  convergence_score: number; // 0–1
  ity_complementarity: number; // 0–1
  pathy_cosine: number; // 0–1
  tension_points: string[];
  resonance_points: string[];
  narrative_potential?: string;
}

export interface Spark {
  id: string;
  world_id: string;
  character_a_id: string;
  character_b_id: string;
  character_a_name?: string;
  character_b_name?: string;
  place_id?: string;
  convergence_score: number;
  tension_points: string[];
  resonance_points: string[];
  narrative?: string;
  image_url?: string;
  created_at?: string;
}

export interface GraphStats {
  nodes: {
    characters: number;
    places: number;
    garments: number;
    artifacts: number;
    sparks: number;
    total: number;
  };
  relationships: {
    relates_to: number;
    converges_with: number;
    inhabits: number;
    wears: number;
    total: number;
  };
}

// ============================================================================
// CONTEXT TYPES
// ============================================================================

interface TrinityGraphState {
  // Characters keyed by worldId
  charactersByWorld: Record<string, TrinityCharacter[]>;
  // Places keyed by worldId
  placesByWorld: Record<string, TrinityPlace[]>;
  // Sparks keyed by worldId
  sparksByWorld: Record<string, Spark[]>;
  // Convergence cache keyed by "charA_charB"
  convergenceCache: Record<string, ConvergenceAnalysis>;
  // Loading states
  loadingCharacters: boolean;
  loadingPlaces: boolean;
  loadingSparks: boolean;
  // Error state
  error: string | null;
}

interface TrinityGraphContextValue extends TrinityGraphState {
  /** Create a new character in the Trinity Graph */
  createCharacter: (data: Omit<TrinityCharacter, 'id' | 'created_at' | 'updated_at'>) => Promise<TrinityCharacter>;
  /** Update an existing character */
  updateCharacter: (id: string, data: Partial<TrinityCharacter>) => Promise<TrinityCharacter>;
  /** Fetch and cache all characters for a world */
  getCharacters: (worldId: string) => Promise<TrinityCharacter[]>;
  /** Create a relationship between two characters */
  relateCharacters: (charId: string, targetId: string, type: string, description?: string, strength?: number) => Promise<void>;
  /** Get convergence analysis between two characters (cached) */
  getConvergence: (charAId: string, charBId: string) => Promise<ConvergenceAnalysis>;
  /** Collide two characters to generate a Spark */
  collideCharacters: (charAId: string, charBId: string, worldId: string, placeId?: string) => Promise<Spark>;
  /** Create a place in the Trinity Graph */
  createPlace: (data: Omit<TrinityPlace, 'id' | 'created_at'>) => Promise<TrinityPlace>;
  /** Fetch and cache all places for a world */
  getPlaces: (worldId: string) => Promise<TrinityPlace[]>;
  /** Fetch and cache all sparks for a world */
  getSparks: (worldId: string) => Promise<Spark[]>;
  /** Create a garment attached to a character */
  createGarment: (data: Omit<Garment, 'id'>) => Promise<Garment>;
  /** Create an artifact */
  createArtifact: (data: Omit<Artifact, 'id'>) => Promise<Artifact>;
  /** Ingest world content into the graph */
  ingestContent: (worldId: string, contentType: string, content: string, metadata?: Record<string, unknown>) => Promise<{ success: boolean; nodes_created: number }>;
  /** Get graph statistics */
  getWorldStats: (worldId?: string) => Promise<GraphStats>;
  /** Clear error state */
  clearError: () => void;
}

// ============================================================================
// CONTEXT
// ============================================================================

const TrinityGraphContext = createContext<TrinityGraphContextValue | null>(null);

const API = `${EFFECTIVE_API_BASE_URL}/api/trinity-graph`;

async function tgFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await authenticatedFetch(`${API}${path}`, options);

  if (!response.ok) {
    let errMsg = `Trinity Graph API error: ${response.status} ${response.statusText}`;
    try {
      const errBody = await response.json();
      errMsg = errBody?.error || errBody?.detail || errMsg;
    } catch {}
    throw new Error(errMsg);
  }

  return response.json();
}

// ============================================================================
// PROVIDER
// ============================================================================

export const TrinityGraphProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<TrinityGraphState>({
    charactersByWorld: {},
    placesByWorld: {},
    sparksByWorld: {},
    convergenceCache: {},
    loadingCharacters: false,
    loadingPlaces: false,
    loadingSparks: false,
    error: null,
  });

  // Track in-flight requests to prevent duplicate fetches
  const inflight = useRef<Set<string>>(new Set());

  // ── Characters ──────────────────────────────────────────────────────────────

  const getCharacters = useCallback(async (worldId: string): Promise<TrinityCharacter[]> => {
    const key = `chars:${worldId}`;
    if (inflight.current.has(key)) {
      // Return cached if available
      return state.charactersByWorld[worldId] || [];
    }

    inflight.current.add(key);
    setState(s => ({ ...s, loadingCharacters: true, error: null }));

    try {
      const data = await tgFetch<{ characters: TrinityCharacter[] }>(
        `/characters?world_id=${encodeURIComponent(worldId)}`
      );
      const characters = data.characters || [];
      setState(s => ({
        ...s,
        charactersByWorld: { ...s.charactersByWorld, [worldId]: characters },
        loadingCharacters: false,
      }));
      return characters;
    } catch (err: any) {
      setState(s => ({ ...s, loadingCharacters: false, error: err.message }));
      return [];
    } finally {
      inflight.current.delete(key);
    }
  }, [state.charactersByWorld]);

  const createCharacter = useCallback(async (
    data: Omit<TrinityCharacter, 'id' | 'created_at' | 'updated_at'>
  ): Promise<TrinityCharacter> => {
    const char = await tgFetch<TrinityCharacter>('/characters', {
      method: 'POST',
      body: JSON.stringify({ ...data, ity_pathy: data.ity_pathy || ITY_PATHY_DEFAULTS }),
      headers: { 'Content-Type': 'application/json' },
    });

    setState(s => {
      const existing = s.charactersByWorld[data.world_id] || [];
      return {
        ...s,
        charactersByWorld: {
          ...s.charactersByWorld,
          [data.world_id]: [...existing, char],
        },
      };
    });

    return char;
  }, []);

  const updateCharacter = useCallback(async (
    id: string,
    data: Partial<TrinityCharacter>
  ): Promise<TrinityCharacter> => {
    const updated = await tgFetch<TrinityCharacter>(`/characters/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
    });

    setState(s => {
      const worldId = data.world_id || updated.world_id;
      if (!worldId) return s;
      const chars = s.charactersByWorld[worldId] || [];
      return {
        ...s,
        charactersByWorld: {
          ...s.charactersByWorld,
          [worldId]: chars.map(c => (c.id === id ? { ...c, ...updated } : c)),
        },
      };
    });

    return updated;
  }, []);

  const relateCharacters = useCallback(async (
    charId: string,
    targetId: string,
    type: string,
    description?: string,
    strength?: number
  ): Promise<void> => {
    await tgFetch(`/characters/${charId}/relate`, {
      method: 'POST',
      body: JSON.stringify({ target_id: targetId, relationship_type: type, description, strength }),
      headers: { 'Content-Type': 'application/json' },
    });
  }, []);

  // ── Convergence ─────────────────────────────────────────────────────────────

  const getConvergence = useCallback(async (
    charAId: string,
    charBId: string
  ): Promise<ConvergenceAnalysis> => {
    // Normalize key order so A↔B == B↔A
    const cacheKey = [charAId, charBId].sort().join('_');
    const cached = state.convergenceCache[cacheKey];
    if (cached) return cached;

    const data = await tgFetch<ConvergenceAnalysis>(
      `/characters/${charAId}/convergence/${charBId}`
    );

    setState(s => ({
      ...s,
      convergenceCache: { ...s.convergenceCache, [cacheKey]: data },
    }));

    return data;
  }, [state.convergenceCache]);

  // ── Collision ───────────────────────────────────────────────────────────────

  const collideCharacters = useCallback(async (
    charAId: string,
    charBId: string,
    worldId: string,
    placeId?: string
  ): Promise<Spark> => {
    const spark = await tgFetch<Spark>('/sparks/collide', {
      method: 'POST',
      body: JSON.stringify({
        character_a_id: charAId,
        character_b_id: charBId,
        world_id: worldId,
        place_id: placeId,
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    setState(s => {
      const existing = s.sparksByWorld[worldId] || [];
      return {
        ...s,
        sparksByWorld: {
          ...s.sparksByWorld,
          [worldId]: [spark, ...existing],
        },
      };
    });

    return spark;
  }, []);

  // ── Places ──────────────────────────────────────────────────────────────────

  const getPlaces = useCallback(async (worldId: string): Promise<TrinityPlace[]> => {
    const key = `places:${worldId}`;
    if (inflight.current.has(key)) return state.placesByWorld[worldId] || [];

    inflight.current.add(key);
    setState(s => ({ ...s, loadingPlaces: true }));

    try {
      const data = await tgFetch<{ places: TrinityPlace[] }>(
        `/places?world_id=${encodeURIComponent(worldId)}`
      );
      const places = data.places || [];
      setState(s => ({
        ...s,
        placesByWorld: { ...s.placesByWorld, [worldId]: places },
        loadingPlaces: false,
      }));
      return places;
    } catch (err: any) {
      setState(s => ({ ...s, loadingPlaces: false, error: err.message }));
      return [];
    } finally {
      inflight.current.delete(key);
    }
  }, [state.placesByWorld]);

  const createPlace = useCallback(async (
    data: Omit<TrinityPlace, 'id' | 'created_at'>
  ): Promise<TrinityPlace> => {
    const place = await tgFetch<TrinityPlace>('/places', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
    });

    setState(s => {
      const existing = s.placesByWorld[data.world_id] || [];
      return {
        ...s,
        placesByWorld: { ...s.placesByWorld, [data.world_id]: [...existing, place] },
      };
    });

    return place;
  }, []);

  // ── Sparks ──────────────────────────────────────────────────────────────────

  const getSparks = useCallback(async (worldId: string): Promise<Spark[]> => {
    const key = `sparks:${worldId}`;
    if (inflight.current.has(key)) return state.sparksByWorld[worldId] || [];

    inflight.current.add(key);
    setState(s => ({ ...s, loadingSparks: true }));

    try {
      const data = await tgFetch<{ sparks: Spark[] }>(
        `/sparks?world_id=${encodeURIComponent(worldId)}`
      );
      const sparks = data.sparks || [];
      setState(s => ({
        ...s,
        sparksByWorld: { ...s.sparksByWorld, [worldId]: sparks },
        loadingSparks: false,
      }));
      return sparks;
    } catch (err: any) {
      setState(s => ({ ...s, loadingSparks: false, error: err.message }));
      return [];
    } finally {
      inflight.current.delete(key);
    }
  }, [state.sparksByWorld]);

  // ── Garments & Artifacts ────────────────────────────────────────────────────

  const createGarment = useCallback(async (data: Omit<Garment, 'id'>): Promise<Garment> => {
    return tgFetch<Garment>('/garments', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
    });
  }, []);

  const createArtifact = useCallback(async (data: Omit<Artifact, 'id'>): Promise<Artifact> => {
    return tgFetch<Artifact>('/artifacts', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
    });
  }, []);

  // ── Ingest ──────────────────────────────────────────────────────────────────

  const ingestContent = useCallback(async (
    worldId: string,
    contentType: string,
    content: string,
    metadata?: Record<string, unknown>
  ) => {
    return tgFetch<{ success: boolean; nodes_created: number }>('/ingest', {
      method: 'POST',
      body: JSON.stringify({ world_id: worldId, content_type: contentType, content, metadata }),
      headers: { 'Content-Type': 'application/json' },
    });
  }, []);

  // ── Stats ───────────────────────────────────────────────────────────────────

  const getWorldStats = useCallback(async (worldId?: string): Promise<GraphStats> => {
    const qs = worldId ? `?world_id=${encodeURIComponent(worldId)}` : '';
    return tgFetch<GraphStats>(`/graph/stats${qs}`);
  }, []);

  // ── Utilities ────────────────────────────────────────────────────────────────

  const clearError = useCallback(() => {
    setState(s => ({ ...s, error: null }));
  }, []);

  // ── Context value (stable reference via useMemo) ─────────────────────────────

  const value = useMemo<TrinityGraphContextValue>(() => ({
    ...state,
    createCharacter,
    updateCharacter,
    getCharacters,
    relateCharacters,
    getConvergence,
    collideCharacters,
    createPlace,
    getPlaces,
    getSparks,
    createGarment,
    createArtifact,
    ingestContent,
    getWorldStats,
    clearError,
  }), [
    state,
    createCharacter, updateCharacter, getCharacters, relateCharacters,
    getConvergence, collideCharacters, createPlace, getPlaces, getSparks,
    createGarment, createArtifact, ingestContent, getWorldStats, clearError,
  ]);

  return (
    <TrinityGraphContext.Provider value={value}>
      {children}
    </TrinityGraphContext.Provider>
  );
};

// ============================================================================
// HOOK
// ============================================================================

export function useTrinityGraphContext(): TrinityGraphContextValue {
  const ctx = useContext(TrinityGraphContext);
  if (!ctx) {
    throw new Error('useTrinityGraphContext must be used within a TrinityGraphProvider');
  }
  return ctx;
}
