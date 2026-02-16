// ═══════════════════════════════════════════════════════════
// DEEP TIME PAGE — Eight Eras × Eight Lineages × 64 Mutations
// Full artifact ontology display with algorithmic canvas
// ═══════════════════════════════════════════════════════════

import { useState } from "react";
import { ERAS } from "../data/eras";
import { LINEAGES } from "../data/lineages";
import { CHARACTER_MUTATIONS, getCharacter } from "../data/characters";
import { MISSISSIPPI_IS, CREATIVE_FIGURES } from "../data/mississippi";
import { CLUSTER_MAP } from "../data/clusters";
import { PATHY_COLORS } from "../data/pathy";
import ArtCanvas from "../components/ArtCanvas";
import { useNeo4jData } from "../hooks/useNeo4jData";
import { getEras, getCreators } from "../api/neo4j";

export default function DeepTimePage({ onRunEra }) {
    const [view, setView] = useState("eras"); // eras | lineages | matrix | constants | creative
    const [selectedEraIdx, setSelectedEraIdx] = useState(null);
    const [selectedLinIdx, setSelectedLinIdx] = useState(0);
    const [openCategory, setOpenCategory] = useState("music");
    const [useLiveData, setUseLiveData] = useState(false);

    // Fetch live data from Neo4j with fallback to static data
    const { data: liveCreators, isLive: creatorsLive } = useNeo4jData(
        getCreators,
        null,
        useLiveData && view === "creative"
    );

    const era = selectedEraIdx !== null ? ERAS[selectedEraIdx] : null;

    return (
        <div className="fade-in">
            {/* Sub-navigation */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div className="nav-tabs">
                    {[
                        { id: "eras", label: "8 Eras" },
                        { id: "lineages", label: "8 Lineages" },
                        { id: "matrix", label: "Deep Time Matrix" },
                        { id: "constants", label: "Mississippi Is" },
                        { id: "creative", label: "Creative Harvest" },
                    ].map((t) => (
                        <button
                            key={t.id}
                            className={`nav-tab ${view === t.id ? "active" : ""}`}
                            onClick={() => {
                                setView(t.id);
                                setSelectedEraIdx(null);
                            }}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
                <button
                    className={`btn btn-ghost ${useLiveData ? "active" : ""}`}
                    onClick={() => setUseLiveData(!useLiveData)}
                    style={{
                        fontSize: 8,
                        padding: "6px 12px",
                        letterSpacing: 1,
                        color: useLiveData ? "var(--delta-gold)" : undefined,
                        borderColor: useLiveData ? "var(--delta-gold)" : undefined
                    }}
                >
                    {useLiveData ? "● LIVE NEO4J" : "○ STATIC DATA"}
                </button>
            </div>

            {/* ══════════ ERAS VIEW ══════════ */}
            {view === "eras" && selectedEraIdx === null && (
                <div className="fade-in">
                    <div className="epigraph" style={{ marginBottom: 28 }}>
                        Eight layers of sediment.
                        <br />
                        Each one built on the one before.
                        <br />
                        The art leaves but the soil remembers.
                    </div>

                    {/* Era Timeline */}
                    <div style={{ position: "relative" }}>
                        <div
                            style={{
                                position: "absolute",
                                left: 28,
                                top: 0,
                                bottom: 0,
                                width: 2,
                                background: `linear-gradient(to bottom, ${ERAS.map((e) => e.color).join(", ")})`,
                                borderRadius: 1,
                            }}
                        />

                        {ERAS.map((e, i) => {
                            // Get characters for this era across all lineages
                            const eraChars = Object.keys(CHARACTER_MUTATIONS).map(
                                (linId) => CHARACTER_MUTATIONS[linId][i]
                            );
                            return (
                                <div
                                    key={e.id}
                                    className="fade-in"
                                    style={{
                                        display: "flex",
                                        gap: 24,
                                        marginBottom: 16,
                                        paddingLeft: 50,
                                        position: "relative",
                                        animationDelay: `${i * 80}ms`,
                                        cursor: "pointer",
                                    }}
                                    onClick={() => setSelectedEraIdx(i)}
                                >
                                    <div
                                        style={{
                                            position: "absolute",
                                            left: 20,
                                            top: 14,
                                            width: 18,
                                            height: 18,
                                            borderRadius: "50%",
                                            background: e.color,
                                            border: `2px solid ${e.color}`,
                                            boxShadow: `0 0 12px ${e.color}30`,
                                            zIndex: 1,
                                        }}
                                    />
                                    <div
                                        className="panel"
                                        style={{ flex: 1, borderColor: `${e.color}20` }}
                                    >
                                        <div style={{ padding: "16px 20px" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <div>
                                                    <span style={{ fontSize: 9, letterSpacing: 4, color: e.color, fontFamily: "var(--font-mono)" }}>
                                                        {e.period}
                                                    </span>
                                                    <h3 style={{ fontSize: 18, fontStyle: "italic", color: "var(--delta-text)", margin: "2px 0 0" }}>
                                                        {e.name}
                                                    </h3>
                                                    <div style={{ fontSize: 10, color: "var(--delta-text-muted)", fontStyle: "italic" }}>
                                                        {e.subtitle}
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: "right" }}>
                                                    <div style={{ fontSize: 8, letterSpacing: 2, color: "var(--delta-text-faint)", textTransform: "uppercase" }}>
                                                        {e.phases.length} Phases
                                                    </div>
                                                    <div style={{ fontSize: 10, color: e.color, fontStyle: "italic" }}>
                                                        {e.phases[e.phases.length - 1].name}
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ fontSize: 10, color: "var(--delta-text-dim)", marginTop: 8, lineHeight: 1.6 }}>
                                                {e.desc.substring(0, 200)}...
                                            </div>
                                            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 8 }}>
                                                {eraChars.slice(0, 4).map((ch, j) => (
                                                    <span key={j} className="tag" style={{ borderColor: `${e.color}30`, color: e.color }}>
                                                        {ch.name}
                                                    </span>
                                                ))}
                                                {eraChars.length > 4 && (
                                                    <span className="tag">+{eraChars.length - 4}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ══════════ SELECTED ERA DETAIL ══════════ */}
            {view === "eras" && selectedEraIdx !== null && era && (
                <div className="fade-in">
                    <button
                        className="btn btn-ghost mb-md"
                        onClick={() => setSelectedEraIdx(null)}
                        style={{ fontSize: 9, padding: "6px 12px" }}
                    >
                        ← All Eras
                    </button>

                    <div
                        style={{
                            textAlign: "center",
                            padding: "24px 32px",
                            borderTop: `2px solid ${era.color}40`,
                            borderBottom: `1px solid ${era.color}20`,
                            marginBottom: 24,
                        }}
                    >
                        <div style={{ fontSize: 9, letterSpacing: 6, color: era.color, fontFamily: "var(--font-mono)" }}>
                            {era.period}
                        </div>
                        <h2 style={{ fontSize: 28, fontStyle: "italic", margin: "4px 0" }}>
                            {era.name}
                        </h2>
                        <div style={{ fontSize: 11, color: "var(--delta-text-muted)", fontStyle: "italic" }}>
                            {era.subtitle}
                        </div>
                    </div>

                    <div
                        style={{
                            fontSize: 12,
                            color: "var(--delta-text-dim)",
                            lineHeight: 1.8,
                            maxWidth: 700,
                            margin: "0 auto 28px",
                            fontStyle: "italic",
                            padding: "0 20px",
                            textAlign: "center",
                        }}
                    >
                        {era.desc}
                    </div>

                    {/* Phases */}
                    <div className="panel mb-lg" style={{ borderColor: `${era.color}30` }}>
                        <div className="panel-header" style={{ color: era.color }}>
                            Phases ({era.phases.length})
                        </div>
                        <div className="panel-body">
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                {era.phases.map((ph, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            flex: "1 1 160px",
                                            padding: "8px 12px",
                                            background: `${era.color}08`,
                                            border: `1px solid ${era.color}15`,
                                            borderRadius: 6,
                                        }}
                                    >
                                        <div style={{ fontSize: 10, color: era.color, fontWeight: 600 }}>
                                            {ph.name}
                                        </div>
                                        <div style={{ fontSize: 9, color: "var(--delta-text-muted)", fontStyle: "italic", marginTop: 2 }}>
                                            {ph.desc}
                                        </div>
                                        <div style={{ fontSize: 7, color: "var(--delta-text-ghost)", marginTop: 4 }}>
                                            Entropy: {ph.entropy[0].toFixed(2)} – {ph.entropy[1].toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Canvas */}
                    <div className="panel mb-lg">
                        <div className="panel-header">Generative Canvas — {era.name}</div>
                        <div style={{ padding: 8 }}>
                            <ArtCanvas
                                seed={era.id.length * 1337 + selectedEraIdx * 42}
                                entropy={selectedEraIdx / ERAS.length}
                                palette={[era.color, era.accent || era.color, "#8B7355", "#D4A04A", "#483D8B"]}
                                eraId={era.id}
                                width={700}
                                height={280}
                            />
                        </div>
                    </div>

                    {/* Characters across all lineages for this era */}
                    <div className="panel mb-lg">
                        <div className="panel-header">
                            Characters in {era.name} ({LINEAGES.length} Lineages)
                        </div>
                        <div className="panel-body">
                            {LINEAGES.map((lin, linIdx) => {
                                const ch = getCharacter(lin.id, selectedEraIdx);
                                if (!ch) return null;
                                return (
                                    <div
                                        key={lin.id}
                                        className="soul-card"
                                        style={{ marginBottom: 12, borderColor: `${lin.color}20` }}
                                    >
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <div>
                                                <div className="soul-name">{ch.name}</div>
                                                <div style={{ fontSize: 7, color: lin.color, letterSpacing: 2, marginTop: 1 }}>
                                                    {lin.name.toUpperCase()}
                                                </div>
                                            </div>
                                            <span style={{ fontSize: 8, color: PATHY_COLORS[ch.pathy] || "#666", fontStyle: "italic" }}>
                                                {ch.pathy}
                                            </span>
                                        </div>
                                        <div className="soul-desc">{ch.desc}</div>
                                        <div className="soul-flavor">"{ch.flavor}"</div>

                                        {/* Dominant clusters */}
                                        <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
                                            {ch.dominants.map((d) => {
                                                const cl = CLUSTER_MAP[d];
                                                return cl ? (
                                                    <span key={d} className="tag" style={{ color: cl.color, borderColor: `${cl.color}30`, fontSize: 7 }}>
                                                        {cl.short}
                                                    </span>
                                                ) : null;
                                            })}
                                            {ch.palette &&
                                                ch.palette.map((c, j) => (
                                                    <div
                                                        key={j}
                                                        style={{
                                                            width: 8,
                                                            height: 8,
                                                            borderRadius: 2,
                                                            background: c,
                                                            border: "1px solid rgba(139,115,85,0.15)",
                                                        }}
                                                    />
                                                ))}
                                        </div>

                                        {/* Artifact Ontology */}
                                        {ch.medium && (
                                            <div
                                                style={{
                                                    marginTop: 8,
                                                    paddingTop: 8,
                                                    borderTop: `1px solid ${era.color}10`,
                                                }}
                                            >
                                                <div style={{ fontSize: 7, letterSpacing: 2, color: era.color, marginBottom: 4 }}>
                                                    ARTIFACT ONTOLOGY
                                                </div>
                                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                                                    {[
                                                        { label: "Medium", val: ch.medium },
                                                        { label: "Surface", val: ch.surface },
                                                        { label: "Literacy", val: ch.literacy },
                                                        { label: "Voice", val: ch.voice },
                                                    ].map(({ label, val }) => (
                                                        <div key={label}>
                                                            <span style={{ fontSize: 6, color: "#5a5040", letterSpacing: 1 }}>
                                                                {label.toUpperCase()}
                                                            </span>
                                                            <div style={{ fontSize: 8, color: "#8a7e68", lineHeight: 1.3 }}>
                                                                {val}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                {ch.artifactTypes && (
                                                    <div style={{ marginTop: 4 }}>
                                                        <span style={{ fontSize: 6, color: "#5a5040", letterSpacing: 1 }}>
                                                            ARTIFACTS
                                                        </span>
                                                        {ch.artifactTypes.map((a, i) => (
                                                            <div
                                                                key={i}
                                                                style={{
                                                                    fontSize: 7,
                                                                    color: "#8a7e68",
                                                                    fontStyle: "italic",
                                                                    paddingLeft: 6,
                                                                    borderLeft: `1px solid ${era.color}15`,
                                                                    marginTop: 2,
                                                                    lineHeight: 1.3,
                                                                }}
                                                            >
                                                                {a}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Locations */}
                    <div className="panel mb-lg">
                        <div className="panel-header">Locations ({era.locations.length})</div>
                        <div className="panel-body">
                            {era.locations.map((loc, i) => (
                                <div
                                    key={i}
                                    style={{
                                        padding: "6px 0",
                                        borderBottom: i < era.locations.length - 1 ? "1px solid var(--delta-border-light)" : "none",
                                    }}
                                >
                                    <div style={{ fontSize: 10, color: "var(--delta-text)" }}>{loc}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════ LINEAGES VIEW ══════════ */}
            {view === "lineages" && (
                <div className="fade-in">
                    <div className="epigraph" style={{ marginBottom: 28 }}>
                        Characters die. Archetypes transmute.
                        <br />
                        Eight threads across eight eras. Sixty-four mutations.
                    </div>

                    {LINEAGES.map((lin, linIdx) => {
                        const mutations = CHARACTER_MUTATIONS[lin.id] || [];
                        return (
                            <div key={lin.id} className="panel mb-lg" style={{ borderColor: `${lin.color}20` }}>
                                <div
                                    className="panel-header"
                                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                                >
                                    <span style={{ color: lin.color }}>{lin.name}</span>
                                    <span style={{ letterSpacing: 1, fontSize: 8 }}>
                                        {lin.throughLine.substring(0, 70)}...
                                    </span>
                                </div>
                                <div className="panel-body">
                                    <div
                                        style={{
                                            fontSize: 11,
                                            color: "var(--delta-text-dim)",
                                            fontStyle: "italic",
                                            marginBottom: 16,
                                            lineHeight: 1.6,
                                        }}
                                    >
                                        "{lin.throughLine}"
                                    </div>

                                    {/* Timeline of mutations */}
                                    <div style={{ position: "relative", paddingLeft: 24 }}>
                                        <div
                                            style={{
                                                position: "absolute",
                                                left: 8,
                                                top: 0,
                                                bottom: 0,
                                                width: 2,
                                                background: lin.gradient,
                                                borderRadius: 1,
                                            }}
                                        />
                                        {mutations.map((ch, i) => {
                                            const e = ERAS[i];
                                            return (
                                                <div
                                                    key={i}
                                                    style={{
                                                        display: "flex",
                                                        gap: 12,
                                                        alignItems: "flex-start",
                                                        padding: "8px 0",
                                                        position: "relative",
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            position: "absolute",
                                                            left: -20,
                                                            top: 12,
                                                            width: 10,
                                                            height: 10,
                                                            borderRadius: "50%",
                                                            background: e?.color || lin.color,
                                                            border: `2px solid ${lin.color}`,
                                                        }}
                                                    />
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                                            <span style={{ fontSize: 11, color: lin.color, fontWeight: 600, fontFamily: "var(--font-display)", fontStyle: "italic" }}>
                                                                {ch.name}
                                                            </span>
                                                            <span style={{ fontSize: 8, color: "var(--delta-text-faint)", fontFamily: "var(--font-mono)" }}>
                                                                {e?.period}
                                                            </span>
                                                            <span style={{ fontSize: 7, color: PATHY_COLORS[ch.pathy] || "#666", fontStyle: "italic" }}>
                                                                {ch.pathy}
                                                            </span>
                                                        </div>
                                                        <div style={{ fontSize: 9, color: "var(--delta-text-muted)", fontStyle: "italic", lineHeight: 1.5 }}>
                                                            {ch.desc}
                                                        </div>
                                                        {ch.medium && (
                                                            <div style={{ fontSize: 7, color: "#5a5040", marginTop: 2 }}>
                                                                Medium: {ch.medium}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span style={{ fontSize: 14, color: "var(--delta-text-ghost)" }}>→</span>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Sediment clusters */}
                                    <div
                                        style={{
                                            marginTop: 12,
                                            paddingTop: 12,
                                            borderTop: "1px solid var(--delta-border-light)",
                                        }}
                                    >
                                        <div style={{ fontSize: 8, letterSpacing: 2, color: "var(--delta-text-faint)", marginBottom: 6, textTransform: "uppercase" }}>
                                            Ontological Sediment
                                        </div>
                                        <div style={{ display: "flex", gap: 4 }}>
                                            {lin.dominant_clusters.map((d) => {
                                                const cl = CLUSTER_MAP[d];
                                                return cl ? (
                                                    <span key={d} className="tag" style={{ color: cl.color, borderColor: `${cl.color}40` }}>
                                                        {cl.name}
                                                    </span>
                                                ) : null;
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ══════════ DEEP TIME MATRIX ══════════ */}
            {view === "matrix" && (
                <div className="fade-in">
                    <div className="epigraph" style={{ marginBottom: 16 }}>
                        All eight lineages · all eight eras · sixty-four mutations
                    </div>

                    <div style={{ overflowX: "auto" }}>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: `130px repeat(${ERAS.length}, 1fr)`,
                                gap: 0,
                                minWidth: 1100,
                            }}
                        >
                            {/* Header row */}
                            <div style={{ padding: 6 }} />
                            {ERAS.map((e, i) => (
                                <div
                                    key={e.id}
                                    style={{
                                        padding: "7px 4px",
                                        textAlign: "center",
                                        borderBottom: `2px solid ${e.color}30`,
                                        background: selectedEraIdx === i ? `${e.color}08` : undefined,
                                    }}
                                >
                                    <div style={{ fontSize: 5, letterSpacing: 1, color: e.color }}>
                                        {e.period.split("–")[0].trim()}
                                    </div>
                                    <div style={{ fontSize: 8, color: "#8a7e68", fontFamily: "'Playfair Display'", fontStyle: "italic" }}>
                                        {e.name}
                                    </div>
                                </div>
                            ))}

                            {/* Lineage rows */}
                            {LINEAGES.map((lin, linIdx) => (
                                <>
                                    <div
                                        key={`l-${lin.id}`}
                                        style={{
                                            padding: "8px 5px",
                                            borderRight: "1px solid rgba(139,115,85,0.06)",
                                            background: selectedLinIdx === linIdx ? `${lin.color}06` : undefined,
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: 8,
                                                color: selectedLinIdx === linIdx ? "#d4c8a8" : "#6a5e48",
                                                fontFamily: "'Playfair Display'",
                                                fontStyle: "italic",
                                            }}
                                        >
                                            {lin.name.replace("The ", "").replace(" Lineage", "")}
                                        </div>
                                        <div style={{ fontSize: 5, color: "#3a3020", marginTop: 1, lineHeight: 1.3 }}>
                                            {lin.throughLine.substring(0, 40)}...
                                        </div>
                                    </div>
                                    {(CHARACTER_MUTATIONS[lin.id] || []).map((ch, eraIdx) => {
                                        const e = ERAS[eraIdx];
                                        const isActive = linIdx === selectedLinIdx && eraIdx === selectedEraIdx;
                                        return (
                                            <div
                                                key={`${lin.id}-${eraIdx}`}
                                                onClick={() => {
                                                    setSelectedLinIdx(linIdx);
                                                    setSelectedEraIdx(eraIdx);
                                                    setView("eras");
                                                }}
                                                style={{
                                                    padding: "5px 4px",
                                                    cursor: "pointer",
                                                    background: isActive ? `${e.color}15` : eraIdx === selectedEraIdx ? `${e.color}05` : "transparent",
                                                    borderBottom: "1px solid rgba(139,115,85,0.04)",
                                                    borderLeft: "1px solid rgba(139,115,85,0.04)",
                                                    transition: "all 0.2s",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        fontSize: 8,
                                                        color: isActive ? "#d4c8a8" : "#8a7e68",
                                                        fontFamily: "'Playfair Display'",
                                                        fontStyle: "italic",
                                                    }}
                                                >
                                                    {ch.name}
                                                </div>
                                                <div style={{ fontSize: 5, color: "#4a4030", marginTop: 1, lineHeight: 1.2 }}>
                                                    {ch.desc.substring(0, 40)}...
                                                </div>
                                            </div>
                                        );
                                    })}
                                </>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════ MISSISSIPPI_IS CONSTANTS ══════════ */}
            {view === "constants" && (
                <div className="fade-in">
                    <div className="epigraph" style={{ marginBottom: 28 }}>
                        These are not themes. They are physics.
                        <br />
                        The river, the soil, the heat, the collision, the transmutation —<br />
                        always present, always expressed differently, always Mississippi.
                    </div>

                    {MISSISSIPPI_IS.map((c, i) => (
                        <div
                            key={c.id}
                            className="panel mb-lg fade-in"
                            style={{ borderColor: `${c.color}25`, animationDelay: `${i * 100}ms` }}
                        >
                            <div
                                style={{
                                    padding: "20px 24px",
                                    borderBottom: "1px solid var(--delta-border-light)",
                                    background: `linear-gradient(135deg, rgba(0,0,0,0.3), ${c.color}08)`,
                                }}
                            >
                                <h3 style={{ fontSize: 20, fontStyle: "italic", color: c.color, marginBottom: 4, fontWeight: 400 }}>
                                    {c.name}
                                </h3>
                                <div style={{ fontSize: 11, color: "var(--delta-text-dim)", fontStyle: "italic", lineHeight: 1.6 }}>
                                    {c.desc}
                                </div>
                            </div>
                            <div className="panel-body">
                                <div style={{ fontSize: 11, color: "var(--delta-text-muted)", lineHeight: 1.8, marginBottom: 12 }}>
                                    {c.detail}
                                </div>
                                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                                    <span style={{ fontSize: 8, letterSpacing: 2, color: "var(--delta-text-faint)", marginRight: 8, textTransform: "uppercase" }}>
                                        Weighted Clusters:
                                    </span>
                                    {c.clusters.map((d) => {
                                        const cl = CLUSTER_MAP[d];
                                        return cl ? (
                                            <span key={d} className="tag" style={{ color: cl.color, borderColor: `${cl.color}40` }}>
                                                {cl.name}
                                            </span>
                                        ) : null;
                                    })}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ══════════ CREATIVE OUTPUT VIEW ══════════ */}
            {view === "creative" && (
                <div className="fade-in">
                    <div className="epigraph" style={{ marginBottom: 28 }}>
                        More world-changing art per square mile than anywhere on earth.
                        <br />
                        Suffering is the input. Art is the output. The soil is the catalyst.
                        {creatorsLive && (
                            <>
                                <br />
                                <span style={{ color: "var(--delta-gold)", fontSize: 9, letterSpacing: 2 }}>
                                    ● LIVE DATA FROM NEO4J GRAPH
                                </span>
                            </>
                        )}
                    </div>

                    {!creatorsLive && (
                        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
                            {[
                                { id: "music", label: "Music" },
                                { id: "literature", label: "Literature" },
                                { id: "visual_art", label: "Visual Art" },
                                { id: "forms", label: "Art Forms" },
                            ].map((t) => (
                                <button
                                    key={t.id}
                                    className={`btn btn-ghost ${openCategory === t.id ? "active" : ""}`}
                                    onClick={() => setOpenCategory(t.id)}
                                    style={{
                                        color: openCategory === t.id ? "var(--delta-gold)" : undefined,
                                        borderColor: openCategory === t.id ? "var(--delta-gold)" : undefined,
                                    }}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Live Neo4j Data */}
                    {creatorsLive && liveCreators && liveCreators.length > 0 && (
                        <div>
                            {liveCreators.map((item, i) => (
                                <div
                                    key={i}
                                    className="panel mb-md fade-in"
                                    style={{ animationDelay: `${i * 60}ms` }}
                                >
                                    <div style={{ padding: "14px 18px" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <div>
                                                <span style={{ fontSize: 14, fontFamily: "var(--font-display)", fontStyle: "italic", color: "var(--delta-text)" }}>
                                                    {item.creator.name}
                                                </span>
                                                {item.creator.birth && (
                                                    <span style={{ fontSize: 9, color: "var(--delta-text-faint)", marginLeft: 10, fontFamily: "var(--font-mono)" }}>
                                                        b. {item.creator.birth}
                                                    </span>
                                                )}
                                            </div>
                                            {item.creator.form && (
                                                <span className="tag" style={{ fontSize: 7 }}>{item.creator.form}</span>
                                            )}
                                        </div>
                                        {item.birthplace && (
                                            <div style={{ fontSize: 9, color: "var(--delta-text-muted)", marginTop: 2, fontStyle: "italic" }}>
                                                {item.birthplace.name}
                                            </div>
                                        )}
                                        {item.creator.desc && (
                                            <div style={{ fontSize: 10, color: "var(--delta-text-dim)", marginTop: 8, lineHeight: 1.6 }}>
                                                {item.creator.desc}
                                            </div>
                                        )}
                                        {item.creator.legacy && (
                                            <div
                                                style={{
                                                    fontSize: 9,
                                                    color: "var(--delta-text-muted)",
                                                    marginTop: 6,
                                                    fontStyle: "italic",
                                                    paddingTop: 6,
                                                    borderTop: "1px solid var(--delta-border-light)",
                                                    lineHeight: 1.5,
                                                }}
                                            >
                                                "{item.creator.legacy}"
                                            </div>
                                        )}
                                        {item.works && item.works.length > 0 && (
                                            <div style={{ marginTop: 8 }}>
                                                <div style={{ fontSize: 7, letterSpacing: 2, color: "var(--delta-text-faint)", marginBottom: 4 }}>
                                                    WORKS ({item.works.length})
                                                </div>
                                                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                                                    {item.works.slice(0, 10).map((work, j) => (
                                                        <span key={j} className="tag" style={{ fontSize: 7 }}>
                                                            {work.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Static Data */}
                    {!creatorsLive && CREATIVE_FIGURES.filter((c) => c.category === openCategory).map((cat) => (
                        <div key={cat.category}>
                            {cat.figures.map((f, i) => (
                                <div
                                    key={i}
                                    className="panel mb-md fade-in"
                                    style={{ animationDelay: `${i * 60}ms` }}
                                >
                                    <div style={{ padding: "14px 18px" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <div>
                                                <span style={{ fontSize: 14, fontFamily: "var(--font-display)", fontStyle: "italic", color: "var(--delta-text)" }}>
                                                    {f.name}
                                                </span>
                                                <span style={{ fontSize: 9, color: "var(--delta-text-faint)", marginLeft: 10, fontFamily: "var(--font-mono)" }}>
                                                    b. {f.birth}
                                                </span>
                                            </div>
                                            <span className="tag" style={{ fontSize: 7 }}>{f.form}</span>
                                        </div>
                                        <div style={{ fontSize: 9, color: "var(--delta-text-muted)", marginTop: 2, fontStyle: "italic" }}>
                                            {f.place}
                                        </div>
                                        <div style={{ fontSize: 10, color: "var(--delta-text-dim)", marginTop: 8, lineHeight: 1.6 }}>
                                            {f.desc}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 9,
                                                color: "var(--delta-text-muted)",
                                                marginTop: 6,
                                                fontStyle: "italic",
                                                paddingTop: 6,
                                                borderTop: "1px solid var(--delta-border-light)",
                                                lineHeight: 1.5,
                                            }}
                                        >
                                            "{f.legacy}"
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
