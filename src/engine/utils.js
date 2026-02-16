// ═══════════════════════════════════════════════════════════
// UTILITY FUNCTIONS — Shared math and helpers
// ═══════════════════════════════════════════════════════════

/** Random float in [min, max) */
export const rand = (min, max) => Math.random() * (max - min) + min;

/** Pick random element from array */
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/** Clamp value to [lo, hi] */
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/** Box-Muller gaussian random */
export const gaussRand = () => {
    let u = 0, v = 0;
    while (!u) u = Math.random();
    while (!v) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

/** Simple string template: replaces {key} with vars[key] */
export const template = (str, vars) =>
    str.replace(/\{(\w+)\}/g, (_, k) => vars[k] || k);

/** Create a seeded pseudo-random number generator */
export function makeSRand(seed) {
    let s = seed;
    return () => {
        s = (s * 16807 + 0) % 2147483647;
        return (s - 1) / 2147483646;
    };
}

/** Convert hex color to [r, g, b] */
export function hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
