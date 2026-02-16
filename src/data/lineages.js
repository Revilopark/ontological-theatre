// ═══════════════════════════════════════════════════════════
// LINEAGES — Eight threads across eight eras
// 64 total character mutations
// Each lineage is a through-line of identity transformation
// ═══════════════════════════════════════════════════════════

import { CHARACTER_MUTATIONS } from "./characters.js";

export const LINEAGES = [
    {
        id: "spider",
        name: "The Weaver Lineage",
        throughLine: "Knowledge that cannot be destroyed — only hidden, translated, and passed hand to hand in the dark",
        color: "#6A5ACD",
        gradient: "linear-gradient(135deg, #483D8B, #6A5ACD, #8B7BCB)",
        dominant_clusters: ["som", "clf", "pra"],
        mutations: CHARACTER_MUTATIONS.spider,
    },
    {
        id: "river",
        name: "The River Voice Lineage",
        throughLine: "The one who reads the water and translates it for the people — whether as prophecy, treaty, sermon, or song",
        color: "#483D8B",
        gradient: "linear-gradient(135deg, #2E1A47, #483D8B, #6A5ACD)",
        dominant_clusters: ["moe", "coe", "som"],
        mutations: CHARACTER_MUTATIONS.river,
    },
    {
        id: "fire",
        name: "The Fire Keeper Lineage",
        throughLine: "The one who carries the dangerous gift — knowledge that burns, beauty that costs, art that changes everything it touches",
        color: "#C17817",
        gradient: "linear-gradient(135deg, #8B0000, #C17817, #DAA520)",
        dominant_clusters: ["ccc", "bea", "ems"],
        mutations: CHARACTER_MUTATIONS.fire,
    },
    {
        id: "earth",
        name: "The Earth Shaper Lineage",
        throughLine: "The builder — of mounds, of nations, of levees, of the physical world that tries and fails to contain the river",
        color: "#704214",
        gradient: "linear-gradient(135deg, #3B1F0B, #704214, #A0522D)",
        dominant_clusters: ["phs", "atf", "mas"],
        mutations: CHARACTER_MUTATIONS.earth,
    },
    {
        id: "corn",
        name: "The Corn Mother Lineage",
        throughLine: "The one who feeds — whose labor sustains everything, whose body is the economy, who is never credited and never free",
        color: "#6B8E23",
        gradient: "linear-gradient(135deg, #3B5323, #6B8E23, #A8C256)",
        dominant_clusters: ["inc", "grd", "pid"],
        mutations: CHARACTER_MUTATIONS.corn,
    },
    {
        id: "star",
        name: "The Star Watcher Lineage",
        throughLine: "The one who sees what's coming — who navigates by what others cannot perceive",
        color: "#6A5ACD",
        gradient: "linear-gradient(135deg, #483D8B, #6A5ACD, #F5F0E8)",
        dominant_clusters: ["inu", "som", "fau"],
        mutations: CHARACTER_MUTATIONS.star,
    },
    {
        id: "birth",
        name: "The Birth Keeper Lineage",
        throughLine: "The threshold guardian — present at every arrival and departure, holding the door between worlds",
        color: "#C19A6B",
        gradient: "linear-gradient(135deg, #8B7355, #C19A6B, #D4C8A8)",
        dominant_clusters: ["pra", "ems", "inc"],
        mutations: CHARACTER_MUTATIONS.birth,
    },
    {
        id: "power",
        name: "The Power Holder Lineage",
        throughLine: "Authority that transforms — from sacred stewardship to colonial extraction to economic domination",
        color: "#704214",
        gradient: "linear-gradient(135deg, #3B1F0B, #704214, #DAA520)",
        dominant_clusters: ["poi", "ace", "sod"],
        mutations: CHARACTER_MUTATIONS.power,
    },
];

export const LINEAGE_MAP = Object.fromEntries(LINEAGES.map((l) => [l.id, l]));

// Helper to get all characters for a lineage across all eras
export function getLineageMutations(lineageId) {
    const lineage = LINEAGE_MAP[lineageId];
    return lineage?.mutations || [];
}

// Helper to get a specific character from a lineage by era index
export function getLineageCharacter(lineageId, eraIndex) {
    const mutations = getLineageMutations(lineageId);
    return mutations[eraIndex] || null;
}

// Helper to get all lineages with their complete mutation chains
export function getAllLineagesWithMutations() {
    return LINEAGES.map(lineage => ({
        ...lineage,
        characterCount: lineage.mutations?.length || 0,
    }));
}
