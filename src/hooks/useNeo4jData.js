// ═══════════════════════════════════════════════════════════
// useNeo4jData Hook — Fetch from Neo4j with fallback to static data
// ═══════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';

/**
 * Hook to fetch data from Neo4j with fallback to static data
 * 
 * @param {Function} neo4jFetcher - Async function that fetches from Neo4j
 * @param {any} staticData - Static fallback data
 * @param {boolean} enabled - Whether to attempt Neo4j fetch
 * @returns {Object} { data, loading, error, isLive }
 */
export function useNeo4jData(neo4jFetcher, staticData, enabled = true) {
    const [data, setData] = useState(staticData);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isLive, setIsLive] = useState(false);

    useEffect(() => {
        if (!enabled || !neo4jFetcher) {
            setData(staticData);
            setIsLive(false);
            return;
        }

        let cancelled = false;

        async function fetchData() {
            setLoading(true);
            setError(null);

            try {
                const result = await neo4jFetcher();
                
                if (!cancelled) {
                    // Only use Neo4j data if we got something useful
                    if (result && (Array.isArray(result) ? result.length > 0 : true)) {
                        setData(result);
                        setIsLive(true);
                    } else {
                        // Fall back to static data if Neo4j returns empty
                        setData(staticData);
                        setIsLive(false);
                    }
                }
            } catch (err) {
                console.warn('Neo4j fetch failed, using static data:', err);
                if (!cancelled) {
                    setError(err.message);
                    setData(staticData);
                    setIsLive(false);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        fetchData();

        return () => {
            cancelled = true;
        };
    }, [enabled]);

    return { data, loading, error, isLive };
}
