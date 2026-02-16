// ═══════════════════════════════════════════════════════════
// DUAL ONTOLOGY PAGE — Full visualization of the -ity × -pathy framework
// Matrix view of qualities of BEING × conditions of FEELING across 8 eras
// ═══════════════════════════════════════════════════════════

import { useState, useMemo, Fragment } from "react";
import { ERAS } from "../data/eras";
import { CLUSTERS, CLUSTER_MAP, META_CATEGORIES } from "../data/clusters";
import { PATHY_STATES, PATHY_COLORS } from "../data/pathy";
import { CHARACTER_MUTATIONS } from "../data/characters";
import { LINEAGES } from "../data/lineages";

export default function DualOntologyPage() {
    const [view, setView] = useState("matrix"); // matrix | evolution | bridges | era-detail
    const [selectedEra, setSelectedEra] = useState(null);
    const [selectedCluster, setSelectedCluster] = useState(null);
    const [selectedPathy, setSelectedPathy] = useState(null);
    const [hoveredCell, setHoveredCell] = useState(null);

    // Get all characters across all lineages and eras
    const allCharacters = useMemo(() => {
        const chars = [];
        Object.keys(CHARACTER_MUTATIONS).forEach((lineageId) => {
            CHARACTER_MUTATIONS[lineageId].forEach((char, eraIdx) => {
                chars.push({
                    ...char,
                    lineageId,
                    eraId: ERAS[eraIdx].id,
                    eraIdx,
                });
            });
        });
        return chars;
    }, []);

    // Find characters that match a specific era + pathy + cluster intersection
    const findCharactersForIntersection = (eraId, pathy, clusterId) => {
        return allCharacters.filter(
            (char) =>
                char.eraId === eraId &&
                char.pathy === pathy &&
                char.dominants.includes(clusterId)
        );
    };

    // Get all clusters that appear in an era's bridges
    const getEraClusters = (era) => {
        // Era bridges are abstract qualities, but we can map them to clusters
        // For now, we'll use all clusters and show which are prominent in that era
        return CLUSTERS;
    };

    return (
        <div className="fade-in">
            {/* Header */}
            <div className="epigraph" style={{ marginBottom: 24, textAlign: "center" }}>
                The Dual Ontology:<br />
                <strong style={{ color: "var(--delta-gold)", fontSize: 14 }}>-ity</strong> (qualities of BEING) ×{" "}
                <strong style={{ color: "var(--delta-violet)", fontSize: 14 }}>-pathy</strong> (conditions of FEELING)<br />
                = Character × Story × Evolution
            </div>

            {/* Sub-navigation */}
            <div className="nav-tabs" style={{ marginBottom: 20 }}>
                {[
                    { id: "matrix", label: "Ontology Matrix" },
                    { id: "evolution", label: "Evolution View" },
                    { id: "bridges", label: "Bridges & Connections" },
                    { id: "era-detail", label: "Era Deep Dive" },
                ].map((t) => (
                    <button
                        key={t.id}
                        className={`nav-tab ${view === t.id ? "active" : ""}`}
                        onClick={() => setView(t.id)}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ══════════ MATRIX VIEW ══════════ */}
            {view === "matrix" && (
                <div className="fade-in">
                    <div style={{ fontSize: 10, color: "var(--delta-text-muted)", marginBottom: 16, textAlign: "center" }}>
                        24 Ontological Clusters × 6 Pathy States × 8 Eras = 1,152 possible intersections
                    </div>

                    {/* Era selector */}
                    <div style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 9, letterSpacing: 2, color: "var(--delta-text-faint)", marginBottom: 8 }}>
                            SELECT ERA
                        </div>
                        <div className="flex gap-sm" style={{ flexWrap: "wrap" }}>
                            {ERAS.map((era, idx) => (
                                <button
                                    key={era.id}
                                    onClick={() => setSelectedEra(era.id)}
                                    className={`nav-tab ${selectedEra === era.id ? "active" : ""}`}
                                    style={{
                                        background: selectedEra === era.id ? era.color : "transparent",
                                        borderColor: era.color,
                                        fontSize: 10,
                                        padding: "6px 12px",
                                    }}
                                >
                                    {era.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {selectedEra && (() => {
                        const era = ERAS.find((e) => e.id === selectedEra);
                        return (
                            <div className="panel fade-in">
                                <div className="panel-header" style={{ background: era.color }}>
                                    {era.name} — Ontology Matrix
                                </div>
                                <div className="panel-body">
                                    <div style={{ fontSize: 10, color: "var(--delta-text-muted)", marginBottom: 16 }}>
                                        Dominant Pathies: {era.pathies.join(", ")} · Bridges: {era.bridges.join(", ")}
                                    </div>

                                    {/* Matrix: Clusters (rows) × Pathy States (columns) */}
                                    <div style={{ overflowX: "auto" }}>
                                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9 }}>
                                            <thead>
                                                <tr>
                                                    <th style={{ 
                                                        padding: "8px 4px",
                                                        textAlign: "left",
                                                        borderBottom: "2px solid var(--delta-border)",
                                                        fontSize: 8,
                                                        color: "var(--delta-text-faint)",
                                                        position: "sticky",
                                                        left: 0,
                                                        background: "var(--delta-bg)",
                                                        zIndex: 10,
                                                    }}>
                                                        CLUSTER
                                                    </th>
                                                    {PATHY_STATES.map((pathy) => (
                                                        <th
                                                            key={pathy}
                                                            style={{
                                                                padding: "8px 4px",
                                                                textAlign: "center",
                                                                borderBottom: "2px solid var(--delta-border)",
                                                                color: PATHY_COLORS[pathy],
                                                                fontSize: 8,
                                                                letterSpacing: 1,
                                                            }}
                                                        >
                                                            {pathy.toUpperCase()}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {META_CATEGORIES.map((meta) => {
                                                    const metaClusters = CLUSTERS.filter((c) => c.meta === meta);
                                                    return (
                                                        <Fragment key={meta}>
                                                            <tr>
                                                                <td
                                                                    colSpan={PATHY_STATES.length + 1}
                                                                    style={{
                                                                        padding: "8px 4px",
                                                                        fontSize: 8,
                                                                        letterSpacing: 3,
                                                                        color: "var(--delta-text-muted)",
                                                                        borderTop: "1px solid var(--delta-border-light)",
                                                                        background: "var(--delta-bg-subtle)",
                                                                    }}
                                                                >
                                                                    {meta.toUpperCase()}
                                                                </td>
                                                            </tr>
                                                            {metaClusters.map((cluster) => (
                                                                <tr key={cluster.id}>
                                                                    <td
                                                                        style={{
                                                                            padding: "6px 4px",
                                                                            borderRight: "1px solid var(--delta-border-light)",
                                                                            position: "sticky",
                                                                            left: 0,
                                                                            background: "var(--delta-bg)",
                                                                            zIndex: 5,
                                                                        }}
                                                                    >
                                                                        <div className="flex items-center gap-sm">
                                                                            <div
                                                                                style={{
                                                                                    width: 6,
                                                                                    height: 6,
                                                                                    borderRadius: "50%",
                                                                                    background: cluster.color,
                                                                                }}
                                                                            />
                                                                            <span style={{ fontSize: 9, color: "var(--delta-text)" }}>
                                                                                {cluster.name}
                                                                            </span>
                                                                        </div>
                                                                    </td>
                                                                    {PATHY_STATES.map((pathy) => {
                                                                        const chars = findCharactersForIntersection(
                                                                            era.id,
                                                                            pathy,
                                                                            cluster.id
                                                                        );
                                                                        const cellKey = `${era.id}-${cluster.id}-${pathy}`;
                                                                        const isHovered = hoveredCell === cellKey;
                                                                        const hasChars = chars.length > 0;

                                                                        return (
                                                                            <td
                                                                                key={pathy}
                                                                                onMouseEnter={() => setHoveredCell(cellKey)}
                                                                                onMouseLeave={() => setHoveredCell(null)}
                                                                                style={{
                                                                                    padding: "6px 4px",
                                                                                    textAlign: "center",
                                                                                    background: hasChars
                                                                                        ? `linear-gradient(135deg, ${cluster.color}20, ${PATHY_COLORS[pathy]}20)`
                                                                                        : "transparent",
                                                                                    borderLeft: "1px solid var(--delta-border-ghost)",
                                                                                    cursor: hasChars ? "pointer" : "default",
                                                                                    position: "relative",
                                                                                    transition: "all 0.2s",
                                                                                    boxShadow: isHovered && hasChars
                                                                                        ? `0 0 12px ${cluster.color}40`
                                                                                        : "none",
                                                                                }}
                                                                            >
                                                                                {hasChars && (
                                                                                    <>
                                                                                        <div
                                                                                            style={{
                                                                                                fontSize: 11,
                                                                                                fontWeight: 600,
                                                                                                color: cluster.color,
                                                                                            }}
                                                                                        >
                                                                                            {chars.length}
                                                                                        </div>
                                                                                        {isHovered && (
                                                                                            <div
                                                                                                style={{
                                                                                                    position: "absolute",
                                                                                                    top: "100%",
                                                                                                    left: "50%",
                                                                                                    transform: "translateX(-50%)",
                                                                                                    marginTop: 8,
                                                                                                    background: "var(--delta-bg-panel)",
                                                                                                    border: `1px solid ${cluster.color}`,
                                                                                                    borderRadius: 4,
                                                                                                    padding: "8px 12px",
                                                                                                    minWidth: 200,
                                                                                                    zIndex: 100,
                                                                                                    boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                                                                                                    textAlign: "left",
                                                                                                }}
                                                                                            >
                                                                                                <div style={{ fontSize: 8, color: "var(--delta-text-faint)", marginBottom: 4 }}>
                                                                                                    {cluster.name} × {pathy}
                                                                                                </div>
                                                                                                {chars.map((char) => (
                                                                                                    <div
                                                                                                        key={`${char.lineageId}-${char.name}`}
                                                                                                        style={{
                                                                                                            fontSize: 9,
                                                                                                            color: "var(--delta-text)",
                                                                                                            marginBottom: 2,
                                                                                                        }}
                                                                                                    >
                                                                                                        • {char.name}
                                                                                                        <span style={{ color: "var(--delta-text-faint)", marginLeft: 4 }}>
                                                                                                            ({LINEAGES.find(l => l.id === char.lineageId)?.name})
                                                                                                        </span>
                                                                                                    </div>
                                                                                                ))}
                                                                                            </div>
                                                                                        )}
                                                                                    </>
                                                                                )}
                                                                            </td>
                                                                        );
                                                                    })}
                                                                </tr>
                                                            ))}
                                                        </Fragment>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div style={{ marginTop: 16, fontSize: 9, color: "var(--delta-text-faint)", fontStyle: "italic" }}>
                                        Each cell shows the number of characters embodying that intersection of cluster (quality of being) and pathy (condition of feeling).
                                        Hover over populated cells to see which characters manifest that combination.
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {!selectedEra && (
                        <div className="panel">
                            <div className="panel-body text-center" style={{ padding: 40 }}>
                                <div style={{ fontSize: 12, color: "var(--delta-text-muted)", fontStyle: "italic" }}>
                                    Select an era above to view its ontological matrix
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ══════════ EVOLUTION VIEW ══════════ */}
            {view === "evolution" && (
                <div className="fade-in">
                    <div className="epigraph" style={{ marginBottom: 24 }}>
                        How the same quality of BEING transforms across eight eras.<br />
                        "Connectivity" in Mound Time ≠ "Connectivity" in the Living Delta.
                    </div>

                    {/* Cluster selector */}
                    <div style={{ marginBottom: 24 }}>
                        <div style={{ fontSize: 9, letterSpacing: 2, color: "var(--delta-text-faint)", marginBottom: 12 }}>
                            SELECT A CLUSTER TO TRACK
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>
                            {CLUSTERS.map((cluster) => (
                                <button
                                    key={cluster.id}
                                    onClick={() => setSelectedCluster(cluster.id)}
                                    className={selectedCluster === cluster.id ? "active" : ""}
                                    style={{
                                        padding: "10px 12px",
                                        background: selectedCluster === cluster.id ? `${cluster.color}20` : "transparent",
                                        border: `1px solid ${cluster.color}`,
                                        borderRadius: 4,
                                        cursor: "pointer",
                                        textAlign: "left",
                                        transition: "all 0.2s",
                                    }}
                                >
                                    <div className="flex items-center gap-sm">
                                        <div
                                            style={{
                                                width: 8,
                                                height: 8,
                                                borderRadius: "50%",
                                                background: cluster.color,
                                            }}
                                        />
                                        <div>
                                            <div style={{ fontSize: 10, color: cluster.color, fontWeight: 600 }}>
                                                {cluster.name}
                                            </div>
                                            <div style={{ fontSize: 7, color: "var(--delta-text-faint)" }}>
                                                {cluster.meta}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {selectedCluster && (() => {
                        const cluster = CLUSTER_MAP[selectedCluster];
                        return (
                            <div className="panel fade-in">
                                <div className="panel-header" style={{ background: cluster.color }}>
                                    Evolution of {cluster.name} Across Eight Eras
                                </div>
                                <div className="panel-body">
                                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                        {ERAS.map((era, idx) => {
                                            const eraChars = allCharacters.filter(
                                                (char) => char.eraId === era.id && char.dominants.includes(selectedCluster)
                                            );

                                            return (
                                                <div
                                                    key={era.id}
                                                    className="fade-in"
                                                    style={{
                                                        padding: 16,
                                                        background: `linear-gradient(135deg, ${era.color}10, transparent)`,
                                                        border: `1px solid ${era.color}40`,
                                                        borderRadius: 4,
                                                        animationDelay: `${idx * 60}ms`,
                                                    }}
                                                >
                                                    <div className="flex items-start justify-between gap-md" style={{ marginBottom: 12 }}>
                                                        <div>
                                                            <div style={{ fontSize: 12, color: era.color, fontWeight: 600, marginBottom: 2 }}>
                                                                {era.name}
                                                            </div>
                                                            <div style={{ fontSize: 8, color: "var(--delta-text-muted)" }}>
                                                                {era.period}
                                                            </div>
                                                        </div>
                                                        <div style={{ fontSize: 9, color: "var(--delta-text-faint)" }}>
                                                            {eraChars.length} character{eraChars.length !== 1 ? "s" : ""}
                                                        </div>
                                                    </div>

                                                    {eraChars.length > 0 ? (
                                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                                                            {eraChars.map((char) => (
                                                                <div
                                                                    key={`${char.lineageId}-${char.name}`}
                                                                    style={{
                                                                        padding: "8px 10px",
                                                                        background: "var(--delta-bg-panel)",
                                                                        border: `1px solid ${PATHY_COLORS[char.pathy]}40`,
                                                                        borderRadius: 4,
                                                                    }}
                                                                >
                                                                    <div style={{ fontSize: 10, color: "var(--delta-text)", marginBottom: 4 }}>
                                                                        {char.name}
                                                                    </div>
                                                                    <div style={{ fontSize: 8, color: "var(--delta-text-faint)", marginBottom: 6 }}>
                                                                        {LINEAGES.find(l => l.id === char.lineageId)?.name}
                                                                    </div>
                                                                    <div className="flex items-center gap-sm">
                                                                        <div
                                                                            style={{
                                                                                width: 6,
                                                                                height: 6,
                                                                                borderRadius: "50%",
                                                                                background: PATHY_COLORS[char.pathy],
                                                                            }}
                                                                        />
                                                                        <span style={{ fontSize: 8, color: PATHY_COLORS[char.pathy] }}>
                                                                            {char.pathy}
                                                                        </span>
                                                                    </div>
                                                                    <div style={{ fontSize: 8, color: "var(--delta-text-muted)", marginTop: 6, fontStyle: "italic" }}>
                                                                        {char.flavor}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div style={{ fontSize: 9, color: "var(--delta-text-ghost)", fontStyle: "italic" }}>
                                                            No characters in this era carry {cluster.name} as a dominant quality.
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {!selectedCluster && (
                        <div className="panel">
                            <div className="panel-body text-center" style={{ padding: 40 }}>
                                <div style={{ fontSize: 12, color: "var(--delta-text-muted)", fontStyle: "italic" }}>
                                    Select a cluster above to track its evolution across all eight eras
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ══════════ BRIDGES VIEW ══════════ */}
            {view === "bridges" && (
                <div className="fade-in">
                    <div className="epigraph" style={{ marginBottom: 24 }}>
                        Bridges are abstract qualities that connect eras to each other.<br />
                        They are the transformative forces that carry meaning forward through time.
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: 16 }}>
                        {ERAS.map((era, idx) => (
                            <div
                                key={era.id}
                                className="panel fade-in"
                                style={{ animationDelay: `${idx * 80}ms` }}
                            >
                                <div className="panel-header" style={{ background: era.color }}>
                                    {era.name}
                                </div>
                                <div className="panel-body">
                                    <div style={{ fontSize: 8, color: "var(--delta-text-muted)", marginBottom: 12 }}>
                                        {era.period}
                                    </div>

                                    <div style={{ marginBottom: 16 }}>
                                        <div style={{ fontSize: 9, letterSpacing: 2, color: "var(--delta-text-faint)", marginBottom: 8 }}>
                                            BRIDGES (Qualities of Being)
                                        </div>
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                            {era.bridges.map((bridge) => (
                                                <div
                                                    key={bridge}
                                                    style={{
                                                        padding: "4px 10px",
                                                        background: `${era.color}20`,
                                                        border: `1px solid ${era.color}`,
                                                        borderRadius: 12,
                                                        fontSize: 9,
                                                        color: era.color,
                                                        fontStyle: "italic",
                                                    }}
                                                >
                                                    {bridge}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <div style={{ fontSize: 9, letterSpacing: 2, color: "var(--delta-text-faint)", marginBottom: 8 }}>
                                            PATHIES (Conditions of Feeling)
                                        </div>
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                            {era.pathies.map((pathy) => (
                                                <div
                                                    key={pathy}
                                                    className="flex items-center gap-sm"
                                                    style={{
                                                        padding: "4px 10px",
                                                        background: `${PATHY_COLORS[pathy] || "#888"}20`,
                                                        border: `1px solid ${PATHY_COLORS[pathy] || "#888"}`,
                                                        borderRadius: 12,
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            width: 6,
                                                            height: 6,
                                                            borderRadius: "50%",
                                                            background: PATHY_COLORS[pathy] || "#888",
                                                        }}
                                                    />
                                                    <span style={{ fontSize: 9, color: PATHY_COLORS[pathy] || "#888" }}>
                                                        {pathy}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {idx < ERAS.length - 1 && (
                                        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--delta-border-light)" }}>
                                            <div style={{ fontSize: 8, color: "var(--delta-text-ghost)", fontStyle: "italic" }}>
                                                ↓ Bridges forward into {ERAS[idx + 1].name}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ══════════ ERA DEEP DIVE ══════════ */}
            {view === "era-detail" && (
                <div className="fade-in">
                    <div className="epigraph" style={{ marginBottom: 24 }}>
                        Deep dive into a single era's ontological landscape.<br />
                        See how qualities of being and conditions of feeling combine in specific characters.
                    </div>

                    {/* Era selector */}
                    <div style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 9, letterSpacing: 2, color: "var(--delta-text-faint)", marginBottom: 8 }}>
                            SELECT ERA
                        </div>
                        <div className="flex gap-sm" style={{ flexWrap: "wrap" }}>
                            {ERAS.map((era) => (
                                <button
                                    key={era.id}
                                    onClick={() => setSelectedEra(era.id)}
                                    className={`nav-tab ${selectedEra === era.id ? "active" : ""}`}
                                    style={{
                                        background: selectedEra === era.id ? era.color : "transparent",
                                        borderColor: era.color,
                                        fontSize: 10,
                                        padding: "6px 12px",
                                    }}
                                >
                                    {era.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {selectedEra && (() => {
                        const era = ERAS.find((e) => e.id === selectedEra);
                        const eraChars = allCharacters.filter((char) => char.eraId === era.id);

                        // Group by pathy
                        const charsByPathy = {};
                        eraChars.forEach((char) => {
                            if (!charsByPathy[char.pathy]) {
                                charsByPathy[char.pathy] = [];
                            }
                            charsByPathy[char.pathy].push(char);
                        });

                        return (
                            <div className="fade-in">
                                <div className="panel" style={{ marginBottom: 20 }}>
                                    <div className="panel-header" style={{ background: era.color }}>
                                        {era.name} — {era.period}
                                    </div>
                                    <div className="panel-body">
                                        <div style={{ fontSize: 11, color: "var(--delta-text)", marginBottom: 12 }}>
                                            {era.subtitle}
                                        </div>
                                        <div style={{ fontSize: 10, color: "var(--delta-text-muted)", fontStyle: "italic", marginBottom: 16 }}>
                                            {era.desc}
                                        </div>

                                        <div className="grid-2" style={{ gap: 16 }}>
                                            <div>
                                                <div style={{ fontSize: 9, letterSpacing: 2, color: "var(--delta-text-faint)", marginBottom: 8 }}>
                                                    BRIDGES
                                                </div>
                                                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                                    {era.bridges.map((bridge) => (
                                                        <span
                                                            key={bridge}
                                                            style={{
                                                                fontSize: 9,
                                                                color: era.color,
                                                                fontStyle: "italic",
                                                                padding: "2px 8px",
                                                                background: `${era.color}15`,
                                                                borderRadius: 8,
                                                            }}
                                                        >
                                                            {bridge}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 9, letterSpacing: 2, color: "var(--delta-text-faint)", marginBottom: 8 }}>
                                                    PATHIES
                                                </div>
                                                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                                    {era.pathies.map((pathy) => (
                                                        <span
                                                            key={pathy}
                                                            style={{
                                                                fontSize: 9,
                                                                color: PATHY_COLORS[pathy],
                                                                padding: "2px 8px",
                                                                background: `${PATHY_COLORS[pathy]}15`,
                                                                borderRadius: 8,
                                                            }}
                                                        >
                                                            {pathy}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Characters grouped by pathy */}
                                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                    {Object.entries(charsByPathy).map(([pathy, chars]) => (
                                        <div key={pathy} className="panel">
                                            <div className="panel-header" style={{ background: PATHY_COLORS[pathy] }}>
                                                {pathy} Characters ({chars.length})
                                            </div>
                                            <div className="panel-body">
                                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
                                                    {chars.map((char) => (
                                                        <div
                                                            key={`${char.lineageId}-${char.name}`}
                                                            style={{
                                                                padding: 12,
                                                                background: `linear-gradient(135deg, ${era.color}10, ${PATHY_COLORS[pathy]}10)`,
                                                                border: `1px solid ${era.color}40`,
                                                                borderRadius: 4,
                                                            }}
                                                        >
                                                            <div style={{ fontSize: 11, color: "var(--delta-text)", marginBottom: 4, fontWeight: 600 }}>
                                                                {char.name}
                                                            </div>
                                                            <div style={{ fontSize: 8, color: "var(--delta-text-faint)", marginBottom: 8 }}>
                                                                {LINEAGES.find(l => l.id === char.lineageId)?.name}
                                                            </div>
                                                            <div style={{ fontSize: 9, color: "var(--delta-text-muted)", fontStyle: "italic", marginBottom: 8 }}>
                                                                {char.desc}
                                                            </div>
                                                            <div style={{ fontSize: 8, color: "var(--delta-text-faint)", marginBottom: 6 }}>
                                                                Dominant Clusters:
                                                            </div>
                                                            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                                                {char.dominants.map((clId) => {
                                                                    const cluster = CLUSTER_MAP[clId];
                                                                    return cluster ? (
                                                                        <div
                                                                            key={clId}
                                                                            className="flex items-center gap-sm"
                                                                            style={{
                                                                                padding: "2px 6px",
                                                                                background: `${cluster.color}20`,
                                                                                borderRadius: 6,
                                                                            }}
                                                                        >
                                                                            <div
                                                                                style={{
                                                                                    width: 4,
                                                                                    height: 4,
                                                                                    borderRadius: "50%",
                                                                                    background: cluster.color,
                                                                                }}
                                                                            />
                                                                            <span style={{ fontSize: 7, color: cluster.color }}>
                                                                                {cluster.short}
                                                                            </span>
                                                                        </div>
                                                                    ) : null;
                                                                })}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })()}

                    {!selectedEra && (
                        <div className="panel">
                            <div className="panel-body text-center" style={{ padding: 40 }}>
                                <div style={{ fontSize: 12, color: "var(--delta-text-muted)", fontStyle: "italic" }}>
                                    Select an era above to explore its ontological landscape
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
