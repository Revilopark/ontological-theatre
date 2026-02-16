// ═══════════════════════════════════════════════════════════
// 24 ONTOLOGICAL CLUSTERS — The taxonomy of being
// Grouped into 4 meta-categories: Cognition, Affect, Material, Temporal
// ═══════════════════════════════════════════════════════════

export const CLUSTERS = [
    // ── Cognition (8) ──
    { id: "som", name: "States of Mind", meta: "Cognition", color: "#D4A04A", short: "SoM" },
    { id: "ccc", name: "Creative Capacities", meta: "Cognition", color: "#C17817", short: "CrC" },
    { id: "inu", name: "Intelligence & Understanding", meta: "Cognition", color: "#8B7355", short: "InU" },
    { id: "lea", name: "Learning & Acquisition", meta: "Cognition", color: "#A0855B", short: "LeA" },
    { id: "atf", name: "Attention & Focus", meta: "Cognition", color: "#6B5B3E", short: "AtF" },
    { id: "ced", name: "Certainty & Doubt", meta: "Cognition", color: "#9B8E6E", short: "CeD" },
    { id: "ace", name: "Achievement & Excellence", meta: "Cognition", color: "#BFA66A", short: "AcE" },
    { id: "diu", name: "Diversity & Unity", meta: "Cognition", color: "#C4956A", short: "DiU" },

    // ── Affect (9) ──
    { id: "inc", name: "Interpersonal Connection", meta: "Affect", color: "#C0392B", short: "InC" },
    { id: "ems", name: "Emotional States", meta: "Affect", color: "#8B0000", short: "EmS" },
    { id: "pid", name: "Personal Identity", meta: "Affect", color: "#D4A04A", short: "PId" },
    { id: "moe", name: "Moral & Ethical", meta: "Affect", color: "#DAA520", short: "MoE" },
    { id: "sod", name: "Social Dynamics", meta: "Affect", color: "#A0522D", short: "SoD" },
    { id: "fau", name: "Freedom & Autonomy", meta: "Affect", color: "#CD853F", short: "FrA" },
    { id: "poi", name: "Power & Influence", meta: "Affect", color: "#704214", short: "PoI" },
    { id: "coe", name: "Communication", meta: "Affect", color: "#B8860B", short: "CoE" },
    { id: "bea", name: "Beauty & Aesthetics", meta: "Affect", color: "#C19A6B", short: "BeA" },

    // ── Material (5) ──
    { id: "phs", name: "Physical States", meta: "Material", color: "#556B2F", short: "PhS" },
    { id: "mas", name: "Material & Sensory", meta: "Material", color: "#4A5D23", short: "MaS" },
    { id: "grd", name: "Growth & Development", meta: "Material", color: "#6B8E23", short: "GrD" },
    { id: "stc", name: "Stability & Change", meta: "Material", color: "#3B5323", short: "StC" },
    { id: "pra", name: "Presence & Absence", meta: "Material", color: "#4F6D3A", short: "PrA" },

    // ── Temporal (2) ──
    { id: "clf", name: "Chance, Luck & Fate", meta: "Temporal", color: "#6A5ACD", short: "CLF" },
    { id: "tid", name: "Time & Duration", meta: "Temporal", color: "#483D8B", short: "TiD" },
];

// Quick lookup map: id → cluster
export const CLUSTER_MAP = Object.fromEntries(CLUSTERS.map(c => [c.id, c]));

// Meta-categories
export const META_CATEGORIES = ["Cognition", "Affect", "Material", "Temporal"];
