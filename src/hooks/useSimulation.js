// ═══════════════════════════════════════════════════════════
// useSimulation — Custom hook using useReducer
// Replaces the nested-setState anti-pattern from the originals
// ═══════════════════════════════════════════════════════════

import { useReducer, useRef, useCallback, useEffect } from "react";
import { DELTA_SOULS } from "../data/characters";
import { FLOOD_PHASES, getFloodPhase } from "../data/flood-phases";
import { createCharacter, simulateGeneration, getDominantCluster } from "../engine/simulation";

// ── State Shape ──
const initialState = {
    phase: "setup",          // setup | running | paused | complete
    generation: 0,
    characters: [],
    worldState: { entropy: 0.05, phase: FLOOD_PHASES[0] },
    graphNodes: new Map(),
    graphEdges: [],
    narrative: [],
    allEvents: [],
    speed: 1200,
    selectedChar: null,
};

// ── Reducer ──
function reducer(state, action) {
    switch (action.type) {
        case "SET_SPEED":
            return { ...state, speed: action.speed };

        case "SELECT_CHAR":
            return { ...state, selectedChar: action.id };

        case "START": {
            const chars = DELTA_SOULS.map((soul, i) => createCharacter(i, soul));
            const nodes = new Map();
            chars.forEach((ch) => {
                const dominant = getDominantCluster(ch);
                nodes.set(ch.id, {
                    id: ch.id, name: ch.name, dominant, pathy: ch.dominantPathy,
                    alive: true, transformations: 0, gen: 0, connections: 0,
                    archetype: ch.archetype,
                });
            });
            return {
                ...state,
                phase: "running",
                generation: 0,
                characters: chars,
                worldState: { entropy: 0.05, phase: FLOOD_PHASES[0] },
                graphNodes: nodes,
                graphEdges: [],
                narrative: [],
                allEvents: [],
                selectedChar: null,
            };
        }

        case "PAUSE":
            return { ...state, phase: "paused" };

        case "RESUME":
            return { ...state, phase: "running" };

        case "TICK": {
            const nextGen = state.generation + 1;
            if (nextGen > 20) {
                return { ...state, phase: "complete" };
            }

            // Deep clone mutable character data
            const chars = state.characters.map((c) => ({
                ...c,
                weights: { ...c.weights },
                events: [...c.events],
                connections: [...c.connections],
                bridgeEncounters: [...c.bridgeEncounters],
                location: { ...c.location },
            }));
            const ws = { ...state.worldState };

            // Run simulation step — returns pure data
            const { events, newEdges, updatedNodes, narrativeEntry } =
                simulateGeneration(chars, ws, nextGen);

            return {
                ...state,
                generation: nextGen,
                characters: chars,
                worldState: ws,
                graphNodes: updatedNodes,
                graphEdges: [...state.graphEdges, ...newEdges],
                narrative: narrativeEntry
                    ? [...state.narrative, narrativeEntry]
                    : state.narrative,
                allEvents: [...state.allEvents, ...events],
            };
        }

        case "RESET":
            return { ...initialState };

        default:
            return state;
    }
}

// ── Hook ──
export function useSimulation() {
    const [state, dispatch] = useReducer(reducer, initialState);
    const intervalRef = useRef(null);

    // Auto-tick when running
    useEffect(() => {
        if (state.phase !== "running") {
            clearInterval(intervalRef.current);
            return;
        }
        intervalRef.current = setInterval(() => {
            dispatch({ type: "TICK" });
        }, state.speed);
        return () => clearInterval(intervalRef.current);
    }, [state.phase, state.speed]);

    // Derived values
    const aliveCount = state.characters.filter((c) => c.alive).length;
    const bridgeEvents = state.allEvents.filter(
        (e) => e.type === "bridge_collision"
    ).length;
    const allianceEvents = state.allEvents.filter(
        (e) => e.type === "alliance"
    ).length;
    const totalTransformations = state.characters.reduce(
        (s, c) => s + c.transformations, 0
    );
    const currentPhase = getFloodPhase(state.generation);

    return {
        ...state,
        dispatch,
        // Derived
        aliveCount,
        bridgeEvents,
        allianceEvents,
        totalTransformations,
        currentPhase,
        // Actions
        start: useCallback(() => dispatch({ type: "START" }), []),
        pause: useCallback(() => dispatch({ type: "PAUSE" }), []),
        resume: useCallback(() => dispatch({ type: "RESUME" }), []),
        reset: useCallback(() => dispatch({ type: "RESET" }), []),
        setSpeed: useCallback((s) => dispatch({ type: "SET_SPEED", speed: s }), []),
        selectChar: useCallback((id) => dispatch({ type: "SELECT_CHAR", id }), []),
    };
}
