// ═══════════════════════════════════════════════════════════
// SIMULATION PAGE — The Crossroads
// Agent-based simulation with Knowledge Graph visualization
// ═══════════════════════════════════════════════════════════

import { useState } from "react";
import { DELTA_SOULS } from "../data/characters";
import { PATHY_COLORS } from "../data/pathy";
import { CLUSTERS } from "../data/clusters";
import KnowledgeGraph from "../components/KnowledgeGraph";
import { getDominantCluster } from "../engine/simulation";
import { useNeo4jData } from "../hooks/useNeo4jData";
import { getPlaces } from "../api/neo4j";

export default function SimulationPage({ sim }) {
    const [showLivePlaces, setShowLivePlaces] = useState(false);

    // Fetch live places from Neo4j
    const { data: livePlaces, isLive: placesLive } = useNeo4jData(
        getPlaces,
        null,
        showLivePlaces
    );
    const {
        phase, generation, characters, worldState, currentPhase,
        graphNodes, graphEdges, narrative, allEvents,
        speed, aliveCount, bridgeEvents, allianceEvents, totalTransformations,
        start, pause, resume, reset, setSpeed,
    } = sim;

    // ── SETUP ──
    if (phase === "setup") {
        return (
            <div style={{ maxWidth: 600, margin: "0 auto" }} className="fade-in">
                {/* Epigraph */}
                <div className="epigraph">
                    The river knows what's coming.<br />
                    The people at the crossroads don't — not yet.<br />
                    But the music knows. The music always knows.
                </div>

                {/* Cast */}
                <div className="panel mb-lg">
                    <div className="panel-header text-center">The Souls of Clarksdale</div>
                    <div className="panel-body">
                        <div className="grid-2">
                            {DELTA_SOULS.map((soul, i) => (
                                <div key={i} className="soul-card">
                                    <div className="soul-name">{soul.name}</div>
                                    <div className="soul-desc">{soul.desc}</div>
                                    <div className="soul-flavor">{soul.flavor}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Speed */}
                <div className="panel mb-lg">
                    <div className="panel-header text-center">Tempo</div>
                    <div className="panel-body">
                        <div className="flex gap-sm">
                            {[
                                { label: "SLOW BLUES", v: 2000 },
                                { label: "STEADY GROOVE", v: 1200 },
                                { label: "JUMP BLUES", v: 500 },
                            ].map((s) => (
                                <button
                                    key={s.v}
                                    className={`nav-tab ${speed === s.v ? "active" : ""}`}
                                    onClick={() => setSpeed(s.v)}
                                    style={{ fontSize: 9 }}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <button className="btn btn-primary" onClick={start}>
                    Meet Me at the Crossroads
                </button>
            </div>
        );
    }

    // ── RUNNING / PAUSED / COMPLETE ──
    return (
        <div className="fade-in">
            {/* Phase Banner */}
            <div className="phase-banner">
                <span className="phase-name" style={{ color: currentPhase?.color }}>
                    {currentPhase?.name}
                </span>
                <span className="phase-desc">{currentPhase?.desc}</span>
            </div>

            {/* Status Bar */}
            <div className="status-bar">
                <div className="flex gap-lg">
                    <div className="status-metric">
                        <div className="label">Year</div>
                        <div className="value">{1925 + Math.floor(generation * 0.1)}</div>
                        <div className="sub">Gen {generation}/20</div>
                    </div>
                    <div className="status-metric">
                        <div className="label">Souls</div>
                        <div className="value" style={{ color: "#6B8E23" }}>{aliveCount}</div>
                    </div>
                    <div className="status-metric">
                        <div className="label">Bridges</div>
                        <div className="value" style={{ color: "#D4A04A" }}>{bridgeEvents}</div>
                    </div>
                    <div className="status-metric">
                        <div className="label">River</div>
                        <div
                            className="value"
                            style={{ color: worldState.entropy > 0.6 ? "#8B0000" : "#8B7355" }}
                        >
                            {worldState.entropy > 0.7
                                ? "RISING"
                                : worldState.entropy > 0.4
                                    ? "SWELLING"
                                    : "LOW"}
                        </div>
                    </div>
                </div>
                <div className="flex gap-sm">
                    {phase === "running" && (
                        <button className="btn btn-ghost" onClick={pause}>PAUSE</button>
                    )}
                    {phase === "paused" && (
                        <button className="btn btn-ghost" onClick={resume}>RESUME</button>
                    )}
                </div>
            </div>

            {/* Progress */}
            <div className="progress-bar">
                <div className="fill" style={{ width: `${(generation / 20) * 100}%` }} />
            </div>

            {/* Main Grid */}
            <div className="grid-main">
                {/* Knowledge Graph */}
                <div className="panel">
                    <div className="panel-header">
                        Knowledge Graph {phase === "complete" && "— Final State"}
                    </div>
                    <KnowledgeGraph
                        nodes={graphNodes}
                        edges={graphEdges}
                        width={640}
                        height={460}
                        floodPhase={currentPhase}
                    />
                    <div className="legend">
                        {[
                            { color: "rgba(212, 160, 74, 0.8)", label: "Bridge" },
                            { color: "rgba(139, 115, 85, 0.6)", label: "Alliance" },
                            { color: "rgba(106, 90, 205, 0.7)", label: "Lineage" },
                            { color: "rgba(192, 57, 43, 0.5)", label: "Tension" },
                        ].map((l) => (
                            <div key={l.label} className="legend-item">
                                <div className="legend-line" style={{ background: l.color }} />
                                <span className="legend-label">{l.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Panel */}
                <div className="flex flex-col gap-md">
                    {/* Narrative Feed */}
                    <div className="panel flex-1" style={{ display: "flex", flexDirection: "column" }}>
                        <div className="panel-header">Narrative Feed</div>
                        <div className="narrative-feed">
                            {narrative
                                .slice()
                                .reverse()
                                .map((n, i) => (
                                    <NarrativeEntry key={i} entry={n} />
                                ))}
                            {narrative.length === 0 && (
                                <div style={{ color: "var(--delta-text-ghost)", fontSize: 10, paddingTop: 12 }}>
                                    Awaiting first generation...
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Character Roster */}
                    <div className="panel">
                        <div className="panel-header">Characters ({characters.length})</div>
                        <div style={{ padding: "4px 12px", maxHeight: 200, overflowY: "auto" }}>
                            {characters.map((ch) => {
                                const dominant = getDominantCluster(ch);
                                return (
                                    <div key={ch.id} className={`character-row ${ch.alive ? "" : "dead"}`}>
                                        <div
                                            className="character-dot"
                                            style={{
                                                background: dominant.color,
                                                boxShadow: ch.alive ? `0 0 6px ${dominant.color}40` : "none",
                                            }}
                                        />
                                        <span className="character-name">{ch.name}</span>
                                        <span className="character-meta">{dominant.short}</span>
                                        <span
                                            className="character-meta"
                                            style={{ color: PATHY_COLORS[ch.dominantPathy] || "#666" }}
                                        >
                                            {ch.dominantPathy.slice(0, 3)}
                                        </span>
                                        {ch.transformations > 0 && (
                                            <span className="character-meta" style={{ color: "#D4A04A" }}>
                                                ×{ch.transformations}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── COMPLETE: Summary ── */}
            {phase === "complete" && (
                <div className="summary-panel fade-in">
                    <div className="summary-title">Simulation Complete — 20 Generations</div>
                    <div className="grid-6">
                        {[
                            { label: "Characters Born", val: characters.length },
                            { label: "Survived", val: aliveCount },
                            { label: "Dissolved", val: characters.length - aliveCount },
                            { label: "Bridge Events", val: bridgeEvents },
                            { label: "Alliances", val: allianceEvents },
                            { label: "Transformations", val: totalTransformations },
                        ].map((s) => (
                            <div key={s.label} className="summary-stat">
                                <div className="stat-value">{s.val}</div>
                                <div className="stat-label">{s.label}</div>
                            </div>
                        ))}
                    </div>
                    <div className="text-center mt-lg">
                        <button className="btn btn-ghost" onClick={reset}>
                            New Simulation
                        </button>
                        <button 
                            className={`btn btn-ghost ml-md ${showLivePlaces ? "active" : ""}`}
                            onClick={() => setShowLivePlaces(!showLivePlaces)}
                            style={{
                                color: showLivePlaces ? "var(--delta-gold)" : undefined,
                                borderColor: showLivePlaces ? "var(--delta-gold)" : undefined
                            }}
                        >
                            {showLivePlaces ? "Hide" : "Show"} Mississippi Places (Neo4j)
                        </button>
                    </div>
                </div>
            )}

            {/* ── MISSISSIPPI PLACES FROM NEO4J ── */}
            {phase === "complete" && placesLive && livePlaces && livePlaces.length > 0 && (
                <div className="panel fade-in mt-lg">
                    <div className="panel-header">
                        Mississippi Places from Knowledge Graph
                        <span style={{ marginLeft: 12, color: "var(--delta-gold)", fontSize: 8, letterSpacing: 2 }}>
                            ● LIVE NEO4J DATA
                        </span>
                    </div>
                    <div className="panel-body">
                        <div className="grid-2">
                            {livePlaces.slice(0, 12).map((item, i) => (
                                <div
                                    key={i}
                                    className="soul-card"
                                >
                                    <div className="soul-name">{item.place.name}</div>
                                    {item.region && (
                                        <div style={{ fontSize: 7, color: "var(--delta-text-faint)", marginTop: 2 }}>
                                            {item.region.name}
                                        </div>
                                    )}
                                    {item.place.desc && (
                                        <div className="soul-desc">{item.place.desc}</div>
                                    )}
                                    {item.creators && item.creators.length > 0 && (
                                        <div style={{ marginTop: 6 }}>
                                            <div style={{ fontSize: 7, letterSpacing: 2, color: "var(--delta-text-faint)", marginBottom: 3 }}>
                                                CREATORS ({item.creators.length})
                                            </div>
                                            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                                                {item.creators.slice(0, 5).map((creator, j) => (
                                                    <span key={j} className="tag" style={{ fontSize: 6 }}>
                                                        {creator.name}
                                                    </span>
                                                ))}
                                                {item.creators.length > 5 && (
                                                    <span className="tag" style={{ fontSize: 6 }}>
                                                        +{item.creators.length - 5}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Narrative Entry Component ──
function NarrativeEntry({ entry }) {
    const { gen, event, phase, entropy } = entry;
    return (
        <div className="narrative-entry">
            <span className="gen-tag">G{gen}</span>
            <span className="tag" style={{ marginRight: 6 }}>{phase}</span>

            {event.type === "bridge_collision" && (
                <>
                    <span style={{ color: "#D4A04A" }}>{event.a}</span>
                    {" & "}
                    <span style={{ color: "#D4A04A" }}>{event.b}</span>
                    {" collide through "}
                    <span style={{ color: "#DAA520" }}>{event.bridge}</span>
                    <span style={{ color: "var(--delta-text-faint)" }}> (τ={event.tension})</span>
                    {event.narr && <span className="narr-text">"{event.narr}"</span>}
                </>
            )}

            {event.type === "dissolution" && (
                <>
                    <span style={{ color: "#8B0000" }}>{event.char}</span>
                    <span> dissolves</span>
                    {event.narr && <span className="narr-text">"{event.narr}"</span>}
                </>
            )}

            {event.type === "emergence" && (
                <>
                    <span style={{ color: "#6A5ACD" }}>{event.char}</span>
                    {" emerges from "}
                    <span style={{ color: "var(--delta-text-dim)" }}>
                        {event.parents?.join(" × ")}
                    </span>
                    {event.narr && <span className="narr-text">"{event.narr}"</span>}
                </>
            )}

            {event.type === "alliance" && (
                <>
                    <span style={{ color: "#6B8E23" }}>{event.a}</span>
                    {" aligns with "}
                    <span style={{ color: "#6B8E23" }}>{event.b}</span>
                </>
            )}

            {event.type === "tension" && (
                <>
                    <span style={{ color: "var(--delta-text-dim)" }}>{event.a}</span>
                    {" ↔ "}
                    <span style={{ color: "var(--delta-text-dim)" }}>{event.b}</span>
                    <span style={{ color: "var(--delta-text-faint)" }}> tension {event.tension}</span>
                </>
            )}
        </div>
    );
}
