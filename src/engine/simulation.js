// ═══════════════════════════════════════════════════════════
// SIMULATION ENGINE — The heart of Ontological Theatre
// Refactored: clean separation, no nested setState
// ═══════════════════════════════════════════════════════════

import { CLUSTERS } from "../data/clusters";
import { BRIDGES } from "../data/bridges";
import { PATHY_STATES } from "../data/pathy";
import { LOCATIONS } from "../data/locations";
import { getFloodPhase } from "../data/flood-phases";
import { EXTRA_NAMES } from "../data/characters";
import {
    BRIDGE_NARRATIVES,
    DISSOLUTION_NARRATIVES,
    EMERGENCE_NARRATIVES,
    EMERGENCE_ORIGINS,
    EMERGENCE_DETAILS,
} from "../data/narratives";
import { rand, pick, clamp, gaussRand, template } from "./utils";

// ── Character Factory ──

export function createCharacter(id, soul) {
    const weights = {};
    CLUSTERS.forEach((c) => {
        weights[c.id] = soul.dominants.includes(c.id)
            ? rand(0.6, 1.0)
            : rand(0.05, 0.35);
    });
    return {
        id,
        name: soul.name,
        archetype: soul.archetype,
        desc: soul.desc,
        flavor: soul.flavor,
        palette: soul.palette || [],
        weights,
        dominantPathy: soul.pathy,
        alive: true,
        generation: 0,
        events: [],
        connections: [],
        transformations: 0,
        bridgeEncounters: [],
        location: pick(LOCATIONS),
    };
}

// ── Tension ──

export function computeTension(char1, char2) {
    let tension = 0;
    CLUSTERS.forEach((c) => {
        tension += Math.abs((char1.weights[c.id] || 0) - (char2.weights[c.id] || 0));
    });
    return tension / CLUSTERS.length;
}

// ── Bridge Trigger ──

export function triggerBridge(char, bridge, gen) {
    const shift = gaussRand() * 0.15;
    CLUSTERS.filter(() => Math.random() > 0.6).forEach((c) => {
        char.weights[c.id] = clamp(char.weights[c.id] + shift, 0, 1);
    });
    char.transformations++;
    char.bridgeEncounters.push({ bridge, gen });
    char.events.push({ gen, type: "bridge", detail: bridge });
    if (Math.random() > 0.6) {
        char.dominantPathy = pick(PATHY_STATES);
        char.events.push({ gen, type: "pathy_shift", detail: char.dominantPathy });
    }
}

// ── Get Dominant Cluster ──

export function getDominantCluster(char) {
    return CLUSTERS.reduce(
        (best, c) => ((char.weights[c.id] || 0) > (char.weights[best.id] || 0) ? c : best),
        CLUSTERS[0]
    );
}

// ── Main Simulation Step ──
// Returns { events, updatedNodes } without mutating React state directly

export function simulateGeneration(characters, worldState, gen) {
    const events = [];
    const newEdges = [];
    const phase = getFloodPhase(gen);

    // Update world entropy toward phase target
    const targetEntropy = rand(phase.entropyRange[0], phase.entropyRange[1]);
    worldState.entropy = worldState.entropy * 0.6 + targetEntropy * 0.4;
    worldState.phase = phase;

    // Flood pressure shifts all characters
    const pressure = worldState.entropy;
    characters.forEach((ch) => {
        if (!ch.alive) return;
        ch.weights.phs = clamp(ch.weights.phs + pressure * 0.02, 0, 1);
        ch.weights.stc = clamp(ch.weights.stc + pressure * 0.025, 0, 1);
        ch.weights.ems = clamp(ch.weights.ems + pressure * 0.015, 0, 1);
        ch.weights.clf = clamp(ch.weights.clf + pressure * 0.02, 0, 1);
        ch.weights.ced = clamp(ch.weights.ced - pressure * 0.01, 0, 1);
        ch.weights.fau = clamp(ch.weights.fau + pressure * 0.015, 0, 1);

        // Location drift
        if (Math.random() > 0.65) ch.location = pick(LOCATIONS);
    });

    const alive = characters.filter((c) => c.alive);

    // ── Character Encounters ──
    for (let i = 0; i < alive.length; i++) {
        for (let j = i + 1; j < alive.length; j++) {
            const coLocated = alive[i].location.name === alive[j].location.name;
            const encounterChance = coLocated ? 0.7 : 0.3;
            if (Math.random() > encounterChance) continue;

            const a = alive[i],
                b = alive[j];
            const tension = computeTension(a, b);

            if (tension > 0.3) {
                const bridgeChance = tension * worldState.entropy * 1.2;
                if (Math.random() < bridgeChance) {
                    const bridge = pick(BRIDGES);
                    triggerBridge(a, bridge, gen);
                    triggerBridge(b, bridge, gen);

                    const narr = template(pick(BRIDGE_NARRATIVES[bridge]), {
                        a: a.name,
                        b: b.name,
                    });
                    events.push({
                        gen,
                        type: "bridge_collision",
                        a: a.name,
                        b: b.name,
                        bridge,
                        tension: tension.toFixed(2),
                        narr,
                        location: a.location.name,
                    });
                    newEdges.push({
                        source: a.id,
                        target: b.id,
                        type: "bridge",
                        label: bridge,
                        gen,
                        weight: tension,
                    });
                } else {
                    events.push({
                        gen,
                        type: "tension",
                        a: a.name,
                        b: b.name,
                        tension: tension.toFixed(2),
                        location: a.location.name,
                    });
                    newEdges.push({
                        source: a.id,
                        target: b.id,
                        type: "tension",
                        gen,
                        weight: tension * 0.4,
                    });
                }
            } else if (tension < 0.18) {
                if (!a.connections.includes(b.id)) a.connections.push(b.id);
                if (!b.connections.includes(a.id)) b.connections.push(a.id);
                events.push({
                    gen,
                    type: "alliance",
                    a: a.name,
                    b: b.name,
                    location: a.location.name,
                });
                newEdges.push({
                    source: a.id,
                    target: b.id,
                    type: "alliance",
                    gen,
                    weight: 0.7,
                });
            }

            // Dissolution — increases dramatically with flood
            if (worldState.entropy > 0.5 && Math.random() < worldState.entropy * 0.08) {
                const victim = Math.random() > 0.5 ? a : b;
                if (victim.alive) {
                    victim.alive = false;
                    const narr = template(pick(DISSOLUTION_NARRATIVES), {
                        char: victim.name,
                    });
                    events.push({ gen, type: "dissolution", char: victim.name, narr });
                }
            }
        }
    }

    // ── Emergence ──
    if (gen > 2 && gen < 18 && alive.length < 14 && Math.random() > 0.55) {
        const parent1 = pick(alive);
        const parent2 = pick(alive.filter((c) => c.id !== parent1.id));
        if (parent2) {
            const newName = pick(
                EXTRA_NAMES.filter((n) => !characters.find((c) => c.name === n))
            );
            if (newName) {
                const child = {
                    id: characters.length,
                    name: newName,
                    archetype: "emergent",
                    desc: "Born from the Delta's need",
                    flavor: "",
                    palette: [...(parent1.palette || []).slice(0, 3), ...(parent2.palette || []).slice(0, 2)],
                    weights: {},
                    dominantPathy: pick(PATHY_STATES),
                    alive: true,
                    generation: gen,
                    events: [],
                    connections: [],
                    transformations: 0,
                    bridgeEncounters: [],
                    location: pick(LOCATIONS),
                };
                CLUSTERS.forEach((c) => {
                    child.weights[c.id] = clamp(
                        (parent1.weights[c.id] + parent2.weights[c.id]) / 2 +
                        gaussRand() * 0.12,
                        0,
                        1
                    );
                });
                characters.push(child);
                const narr = template(pick(EMERGENCE_NARRATIVES), {
                    char: newName,
                    origin: pick(EMERGENCE_ORIGINS),
                    detail: pick(EMERGENCE_DETAILS),
                });
                events.push({
                    gen,
                    type: "emergence",
                    char: newName,
                    parents: [parent1.name, parent2.name],
                    narr,
                });
                newEdges.push({
                    source: parent1.id,
                    target: child.id,
                    type: "lineage",
                    gen,
                    weight: 0.85,
                });
                newEdges.push({
                    source: parent2.id,
                    target: child.id,
                    type: "lineage",
                    gen,
                    weight: 0.85,
                });
            }
        }
    }

    // ── Build Updated Graph Nodes ──
    const updatedNodes = new Map();
    characters.forEach((ch) => {
        const dominant = getDominantCluster(ch);
        updatedNodes.set(ch.id, {
            id: ch.id,
            name: ch.name,
            dominant,
            pathy: ch.dominantPathy,
            alive: ch.alive,
            transformations: ch.transformations,
            gen: ch.generation,
            connections: ch.connections.length,
            archetype: ch.archetype,
        });
    });

    // ── Priority narrative event ──
    const priority =
        events.find((e) => e.type === "bridge_collision") ||
        events.find((e) => e.type === "dissolution") ||
        events.find((e) => e.type === "emergence") ||
        events[0];

    let narrativeEntry = null;
    if (priority) {
        narrativeEntry = {
            gen,
            event: priority,
            phase: phase.name,
            entropy: worldState.entropy.toFixed(2),
            alive: alive.filter((c) => c.alive).length,
        };
    }

    return { events, newEdges, updatedNodes, narrativeEntry, phase };
}
