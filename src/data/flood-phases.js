// ═══════════════════════════════════════════════════════════
// FLOOD PHASES — The river is a character
// 6 phases across 20 generations, modeling the 1927 Great Flood
// ═══════════════════════════════════════════════════════════

export const FLOOD_PHASES = [
    { gen: [1, 3], name: "DRY SEASON", desc: "Cotton high, river low, music in the air", entropyRange: [0.05, 0.15], color: "#D4A04A" },
    { gen: [4, 7], name: "FIRST RAINS", desc: "The Sunflower starts to rise", entropyRange: [0.15, 0.30], color: "#8B7355" },
    { gen: [8, 11], name: "THE RIVER REMEMBERS", desc: "Old-timers say they've seen this before", entropyRange: [0.30, 0.50], color: "#6B5B3E" },
    { gen: [12, 15], name: "LEVEE WATCH", desc: "Sandbags and prayer — neither is enough", entropyRange: [0.50, 0.70], color: "#704214" },
    { gen: [16, 18], name: "THE BREAKING", desc: "Water finds every crack", entropyRange: [0.70, 0.85], color: "#8B0000" },
    { gen: [19, 20], name: "THE GREAT FLOOD", desc: "The Mississippi takes what it wants", entropyRange: [0.85, 1.00], color: "#3B1F0B" },
];

export function getFloodPhase(gen) {
    return FLOOD_PHASES.find(p => gen >= p.gen[0] && gen <= p.gen[1]) || FLOOD_PHASES[0];
}
