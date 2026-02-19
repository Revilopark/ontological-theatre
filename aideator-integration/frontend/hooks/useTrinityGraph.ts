/**
 * useTrinityGraph — Convenience hooks wrapping TrinityGraphContext
 *
 * These hooks provide ergonomic, data-focused interfaces to the Trinity Graph
 * context. They handle loading, error states, and auto-fetching on worldId changes.
 *
 * Usage:
 *   const { characters, loading, error } = useCharacters('world-123');
 *   const { convergence } = useConvergence(charA, charB);
 *   const { triggerCollision, spark, colliding } = useCollide(charA, charB, 'world-123', placeId);
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  useTrinityGraphContext,
  type ConvergenceAnalysis,
  type ItyPathy,
  type Spark,
  type TrinityCharacter,
  type TrinityPlace,
} from '../contexts/TrinityGraphContext';

// ============================================================================
// useCharacters
// ============================================================================

/**
 * Fetch and subscribe to all characters for a given worldId.
 * Auto-refetches when worldId changes.
 */
export function useCharacters(worldId: string | null | undefined) {
  const { charactersByWorld, loadingCharacters, error, getCharacters } = useTrinityGraphContext();

  const characters: TrinityCharacter[] = (worldId && charactersByWorld[worldId]) || [];
  const hasFetched = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!worldId || hasFetched.current.has(worldId)) return;
    hasFetched.current.add(worldId);
    getCharacters(worldId);
  }, [worldId, getCharacters]);

  const refetch = useCallback(() => {
    if (!worldId) return;
    hasFetched.current.delete(worldId); // clear cache flag to force re-fetch
    getCharacters(worldId);
  }, [worldId, getCharacters]);

  return {
    characters,
    loading: loadingCharacters,
    error,
    refetch,
    /** Find a character by ID from the cached list */
    getById: (id: string) => characters.find(c => c.id === id) ?? null,
    /** Find a character by name (case-insensitive) */
    getByName: (name: string) =>
      characters.find(c => c.name.toLowerCase() === name.toLowerCase()) ?? null,
  };
}

// ============================================================================
// usePlaces
// ============================================================================

/**
 * Fetch and subscribe to all places for a given worldId.
 */
export function usePlaces(worldId: string | null | undefined) {
  const { placesByWorld, loadingPlaces, error, getPlaces } = useTrinityGraphContext();

  const places: TrinityPlace[] = (worldId && placesByWorld[worldId]) || [];
  const hasFetched = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!worldId || hasFetched.current.has(worldId)) return;
    hasFetched.current.add(worldId);
    getPlaces(worldId);
  }, [worldId, getPlaces]);

  const refetch = useCallback(() => {
    if (!worldId) return;
    hasFetched.current.delete(worldId);
    getPlaces(worldId);
  }, [worldId, getPlaces]);

  return { places, loading: loadingPlaces, error, refetch };
}

// ============================================================================
// useSparks
// ============================================================================

/**
 * Fetch and subscribe to all sparks for a given worldId.
 */
export function useSparks(worldId: string | null | undefined) {
  const { sparksByWorld, loadingSparks, error, getSparks } = useTrinityGraphContext();

  const sparks: Spark[] = (worldId && sparksByWorld[worldId]) || [];
  const hasFetched = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!worldId || hasFetched.current.has(worldId)) return;
    hasFetched.current.add(worldId);
    getSparks(worldId);
  }, [worldId, getSparks]);

  const refetch = useCallback(() => {
    if (!worldId) return;
    hasFetched.current.delete(worldId);
    getSparks(worldId);
  }, [worldId, getSparks]);

  return { sparks, loading: loadingSparks, error, refetch };
}

// ============================================================================
// useConvergence
// ============================================================================

/**
 * Get (and cache) convergence analysis between two characters.
 * Automatically fetches when both charAId and charBId are provided.
 */
export function useConvergence(
  charAId: string | null | undefined,
  charBId: string | null | undefined
) {
  const { convergenceCache, getConvergence } = useTrinityGraphContext();

  const cacheKey =
    charAId && charBId ? [charAId, charBId].sort().join('_') : null;
  const cached = cacheKey ? convergenceCache[cacheKey] : null;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!charAId || !charBId || cached) return;
    setLoading(true);
    setError(null);
    getConvergence(charAId, charBId)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [charAId, charBId, cached, getConvergence]);

  return {
    convergence: cached ?? null,
    loading,
    error,
  };
}

// ============================================================================
// useCollide
// ============================================================================

/**
 * Provides a `triggerCollision` function that collides two characters and
 * returns the resulting Spark.
 *
 * The hook manages its own local loading/error state so the UI can show
 * the collision animation independently of the global context state.
 */
export function useCollide(
  charAId: string | null | undefined,
  charBId: string | null | undefined,
  worldId: string | null | undefined,
  placeId?: string
) {
  const { collideCharacters } = useTrinityGraphContext();

  const [spark, setSpark] = useState<Spark | null>(null);
  const [colliding, setColliding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const triggerCollision = useCallback(async () => {
    if (!charAId || !charBId || !worldId) {
      setError('Two characters and a world are required for collision');
      return null;
    }

    setColliding(true);
    setError(null);
    setSpark(null);

    try {
      const result = await collideCharacters(charAId, charBId, worldId, placeId);
      setSpark(result);
      return result;
    } catch (err: any) {
      setError(err.message || 'Collision failed');
      return null;
    } finally {
      setColliding(false);
    }
  }, [charAId, charBId, worldId, placeId, collideCharacters]);

  const reset = useCallback(() => {
    setSpark(null);
    setError(null);
    setColliding(false);
  }, []);

  return { triggerCollision, spark, colliding, error, reset };
}

// ============================================================================
// useItyPathyCompute
// ============================================================================

/**
 * Client-side convergence computation using the canonical algorithm:
 *   convergence = (ity_complementarity × 0.6) + (pathy_cosine × 0.4)
 *
 * Uses only ItyPathy values already in memory — no API call.
 * Useful for live preview while a user selects characters.
 */
export function useItyPathyCompute(
  fingerA: ItyPathy | null | undefined,
  fingerB: ItyPathy | null | undefined
) {
  const result = useRef<{
    convergenceScore: number;
    ityComplementarity: number;
    pathyCosine: number;
  } | null>(null);

  if (!fingerA || !fingerB) {
    result.current = null;
    return result.current;
  }

  // All 50 keys
  const keys = Object.keys(fingerA) as (keyof ItyPathy)[];

  // ── Ity complementarity: antonym pairs average (|a - b| / 100, then 1 - avg)
  const ityPairs: [keyof ItyPathy, keyof ItyPathy][] = [
    ['brutality', 'empathy'],
    ['dominance', 'submission'],
    ['volatility', 'serenity'],
    ['duplicity', 'honesty'],
    ['selfishness', 'altruism'],
    ['corruption', 'purity'],
    ['anxiety', 'tranquility'],
    ['alienation', 'belonging'],
    ['fatalism', 'agency'],
    ['materialism', 'spirituality'],
  ];

  const ityComplementarity =
    ityPairs.reduce((sum, [k1, k2]) => {
      const diff = Math.abs(fingerA[k1] - fingerB[k2]) / 100;
      return sum + (1 - diff);
    }, 0) / ityPairs.length;

  // ── Pathy cosine similarity across all 50 dimensions
  const vecA = keys.map(k => fingerA[k]);
  const vecB = keys.map(k => fingerB[k]);

  const dot = vecA.reduce((s, v, i) => s + v * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((s, v) => s + v * v, 0));
  const magB = Math.sqrt(vecB.reduce((s, v) => s + v * v, 0));
  const pathyCosine = magA === 0 || magB === 0 ? 0 : dot / (magA * magB);

  // ── Final weighted convergence score
  const convergenceScore = ityComplementarity * 0.6 + pathyCosine * 0.4;

  result.current = { convergenceScore, ityComplementarity, pathyCosine };
  return result.current;
}
