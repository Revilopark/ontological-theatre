// ═══════════════════════════════════════════════════════════
// ONTOLOGY PAGE — Reference view of the dual ontology framework
// ═══════════════════════════════════════════════════════════

import { CLUSTERS, META_CATEGORIES } from "../data/clusters";
import { BRIDGES } from "../data/bridges";
import { PATHY_STATES, PATHY_COLORS } from "../data/pathy";

export default function OntologyPage() {
    return (
        <div className="fade-in" style={{ maxWidth: 800, margin: "0 auto" }}>
            {/* Intro */}
            <div className="epigraph" style={{ marginBottom: 32 }}>
                Every soul operates on two axes:<br />
                <strong style={{ color: "var(--delta-gold)" }}>-ity</strong> — qualities of Being (what something <em>is</em>)<br />
                <strong style={{ color: "var(--delta-violet)" }}>-pathy</strong> — modes of Feeling (how beings <em>relate</em>)
            </div>

            {/* Clusters by Meta-Category */}
            <div className="panel mb-lg">
                <div className="panel-header">24 Ontological Clusters</div>
                <div className="panel-body">
                    {META_CATEGORIES.map((meta) => {
                        const clusters = CLUSTERS.filter((c) => c.meta === meta);
                        return (
                            <div key={meta} style={{ marginBottom: 20 }}>
                                <div
                                    style={{
                                        fontSize: 10,
                                        letterSpacing: 4,
                                        color: "var(--delta-text-muted)",
                                        marginBottom: 10,
                                        textTransform: "uppercase",
                                        borderBottom: "1px solid var(--delta-border-light)",
                                        paddingBottom: 6,
                                    }}
                                >
                                    {meta} ({clusters.length})
                                </div>
                                <div className="grid-2" style={{ gap: 8 }}>
                                    {clusters.map((c) => (
                                        <div
                                            key={c.id}
                                            className="flex items-center gap-sm"
                                            style={{ padding: "6px 10px" }}
                                        >
                                            <div
                                                style={{
                                                    width: 10,
                                                    height: 10,
                                                    borderRadius: "50%",
                                                    background: c.color,
                                                    boxShadow: `0 0 8px ${c.color}30`,
                                                    flexShrink: 0,
                                                }}
                                            />
                                            <div style={{ flex: 1 }}>
                                                <span style={{ fontSize: 11, color: "var(--delta-text)" }}>
                                                    {c.name}
                                                </span>
                                                <span
                                                    style={{
                                                        fontSize: 8,
                                                        color: "var(--delta-text-faint)",
                                                        marginLeft: 6,
                                                        fontFamily: "var(--font-mono)",
                                                    }}
                                                >
                                                    {c.short}
                                                </span>
                                            </div>
                                            <span
                                                style={{
                                                    fontSize: 7,
                                                    color: c.color,
                                                    fontFamily: "var(--font-mono)",
                                                }}
                                            >
                                                {c.id}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Bridges */}
            <div className="grid-2 mb-lg" style={{ gap: 16 }}>
                <div className="panel">
                    <div className="panel-header">8 Bridges (-ity Axis)</div>
                    <div className="panel-body">
                        {BRIDGES.map((b, i) => (
                            <div
                                key={b}
                                style={{
                                    padding: "8px 0",
                                    borderBottom:
                                        i < BRIDGES.length - 1
                                            ? "1px solid var(--delta-border-light)"
                                            : "none",
                                    fontSize: 12,
                                    color: "var(--delta-gold)",
                                    fontStyle: "italic",
                                }}
                            >
                                {b}
                            </div>
                        ))}
                        <p
                            style={{
                                fontSize: 9,
                                color: "var(--delta-text-faint)",
                                fontStyle: "italic",
                                marginTop: 12,
                            }}
                        >
                            Bridges are transformative qualities that connect characters
                            through shared experience. When tension between two souls exceeds
                            a threshold, a bridge event fires — mutating their ontological
                            weights.
                        </p>
                    </div>
                </div>

                <div className="panel">
                    <div className="panel-header">6 Pathy States (-pathy Axis)</div>
                    <div className="panel-body">
                        {PATHY_STATES.map((p, i) => (
                            <div
                                key={p}
                                className="flex items-center gap-sm"
                                style={{
                                    padding: "8px 0",
                                    borderBottom:
                                        i < PATHY_STATES.length - 1
                                            ? "1px solid var(--delta-border-light)"
                                            : "none",
                                }}
                            >
                                <div
                                    style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: "50%",
                                        background: PATHY_COLORS[p],
                                    }}
                                />
                                <span
                                    style={{
                                        fontSize: 12,
                                        color: PATHY_COLORS[p],
                                        fontStyle: "italic",
                                    }}
                                >
                                    {p}
                                </span>
                            </div>
                        ))}
                        <p
                            style={{
                                fontSize: 9,
                                color: "var(--delta-text-faint)",
                                fontStyle: "italic",
                                marginTop: 12,
                            }}
                        >
                            Each character carries a dominant pathy state that colors how
                            they perceive and relate. Bridge encounters can trigger pathy
                            mutations — a character gripped by Apathy may crack open into
                            Empathy, or spiral into Antipathy.
                        </p>
                    </div>
                </div>
            </div>

            {/* Framework diagram */}
            <div className="panel">
                <div className="panel-header text-center">
                    The Dual Ontology Framework
                </div>
                <div className="panel-body text-center" style={{ padding: "32px" }}>
                    <div style={{ fontSize: 10, color: "var(--delta-text-faint)", marginBottom: 20 }}>
                        24 CLUSTERS × 8 BRIDGES × 6 PATHY STATES = 1,152 possible character configurations per generation
                    </div>
                    <div className="flex items-center justify-between" style={{ maxWidth: 400, margin: "0 auto" }}>
                        <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 28, fontFamily: "var(--font-display)", fontStyle: "italic", color: "var(--delta-gold)" }}>-ity</div>
                            <div style={{ fontSize: 9, color: "var(--delta-text-muted)", marginTop: 4 }}>What it IS</div>
                        </div>
                        <div style={{ fontSize: 24, color: "var(--delta-text-ghost)" }}>×</div>
                        <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 28, fontFamily: "var(--font-display)", fontStyle: "italic", color: "var(--delta-violet)" }}>-pathy</div>
                            <div style={{ fontSize: 9, color: "var(--delta-text-muted)", marginTop: 4 }}>What it FEELS</div>
                        </div>
                        <div style={{ fontSize: 24, color: "var(--delta-text-ghost)" }}>→</div>
                        <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 28, fontFamily: "var(--font-display)", fontStyle: "italic", color: "var(--delta-text)" }}>Story</div>
                            <div style={{ fontSize: 9, color: "var(--delta-text-muted)", marginTop: 4 }}>Emergent</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
