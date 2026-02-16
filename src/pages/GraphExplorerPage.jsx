// ═══════════════════════════════════════════════════════════
// GRAPH EXPLORER PAGE — Browse Live Neo4j Data
// Interactive exploration of the Ontological Theatre knowledge graph
// ═══════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import {
    getGraphStats,
    searchGraph,
    getNeighbors,
    getEras,
    getLineages,
    getCreators,
    getPlaces,
    getTransmutations,
    testConnection
} from "../api/neo4j";

export default function GraphExplorerPage() {
    const [view, setView] = useState("overview"); // overview | search | explore | transmutations
    const [stats, setStats] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [selectedNode, setSelectedNode] = useState(null);
    const [neighbors, setNeighbors] = useState(null);
    const [eras, setEras] = useState([]);
    const [lineages, setLineages] = useState([]);
    const [creators, setCreators] = useState([]);
    const [places, setPlaces] = useState([]);
    const [transmutations, setTransmutations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [connected, setConnected] = useState(false);

    // Test connection on mount
    useEffect(() => {
        async function checkConnection() {
            try {
                const isConnected = await testConnection();
                setConnected(isConnected);
                if (!isConnected) {
                    setError("Failed to connect to Neo4j database");
                }
            } catch (err) {
                setConnected(false);
                setError("Neo4j connection error: " + err.message);
            }
        }
        checkConnection();
    }, []);

    // Load overview data
    useEffect(() => {
        if (view === "overview" && connected) {
            loadOverview();
        }
    }, [view, connected]);

    async function loadOverview() {
        setLoading(true);
        try {
            const [statsData, erasData, lineagesData] = await Promise.all([
                getGraphStats(),
                getEras(),
                getLineages()
            ]);
            setStats(statsData);
            setEras(erasData);
            setLineages(lineagesData);
        } catch (err) {
            setError("Failed to load overview: " + err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleSearch() {
        if (!searchQuery.trim()) return;
        
        setLoading(true);
        setError(null);
        try {
            const results = await searchGraph(searchQuery);
            setSearchResults(results);
        } catch (err) {
            setError("Search failed: " + err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleNodeClick(node) {
        setLoading(true);
        setError(null);
        try {
            // Note: This will need node.id or similar identifier from Neo4j
            // For now, we'll just set the selected node
            setSelectedNode(node);
            // In a real implementation, you'd call getNeighbors(node.id)
            // const neighborsData = await getNeighbors(node.id);
            // setNeighbors(neighborsData);
        } catch (err) {
            setError("Failed to load node details: " + err.message);
        } finally {
            setLoading(false);
        }
    }

    async function loadCreators() {
        setLoading(true);
        try {
            const data = await getCreators();
            setCreators(data);
        } catch (err) {
            setError("Failed to load creators: " + err.message);
        } finally {
            setLoading(false);
        }
    }

    async function loadPlaces() {
        setLoading(true);
        try {
            const data = await getPlaces();
            setPlaces(data);
        } catch (err) {
            setError("Failed to load places: " + err.message);
        } finally {
            setLoading(false);
        }
    }

    async function loadTransmutations() {
        setLoading(true);
        try {
            const data = await getTransmutations();
            setTransmutations(data);
        } catch (err) {
            setError("Failed to load transmutations: " + err.message);
        } finally {
            setLoading(false);
        }
    }

    if (!connected) {
        return (
            <div className="fade-in" style={{ maxWidth: 600, margin: "0 auto" }}>
                <div className="panel">
                    <div className="panel-header" style={{ color: "#8B0000" }}>
                        Neo4j Connection Error
                    </div>
                    <div className="panel-body">
                        <p style={{ color: "var(--delta-text-dim)", marginBottom: 16 }}>
                            Unable to connect to the Neo4j knowledge graph. The database may be offline
                            or there may be a network issue.
                        </p>
                        {error && (
                            <div style={{ 
                                padding: 12, 
                                background: "rgba(139,0,0,0.1)", 
                                border: "1px solid rgba(139,0,0,0.3)",
                                borderRadius: 6,
                                fontSize: 10,
                                color: "var(--delta-text-muted)",
                                fontFamily: "var(--font-mono)"
                            }}>
                                {error}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fade-in">
            {/* Navigation */}
            <div className="nav-tabs" style={{ marginBottom: 20 }}>
                {[
                    { id: "overview", label: "Overview" },
                    { id: "search", label: "Search" },
                    { id: "creators", label: "Creators" },
                    { id: "places", label: "Places" },
                    { id: "transmutations", label: "Transmutations" }
                ].map((t) => (
                    <button
                        key={t.id}
                        className={`nav-tab ${view === t.id ? "active" : ""}`}
                        onClick={() => {
                            setView(t.id);
                            if (t.id === "creators" && creators.length === 0) loadCreators();
                            if (t.id === "places" && places.length === 0) loadPlaces();
                            if (t.id === "transmutations" && transmutations.length === 0) loadTransmutations();
                        }}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Error Display */}
            {error && (
                <div className="panel mb-md" style={{ borderColor: "rgba(139,0,0,0.3)" }}>
                    <div className="panel-body" style={{ padding: 12, color: "#8B0000" }}>
                        {error}
                    </div>
                </div>
            )}

            {/* Loading Indicator */}
            {loading && (
                <div style={{ textAlign: "center", padding: 20, color: "var(--delta-text-faint)" }}>
                    Loading from Neo4j...
                </div>
            )}

            {/* ══════════ OVERVIEW ══════════ */}
            {view === "overview" && stats && (
                <div className="fade-in">
                    <div className="epigraph" style={{ marginBottom: 28 }}>
                        611 nodes · 865 edges · The Ontological Theatre in graph form
                    </div>

                    {/* Stats Grid */}
                    <div className="panel mb-lg">
                        <div className="panel-header">Graph Statistics</div>
                        <div className="panel-body">
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                <div>
                                    <div style={{ fontSize: 8, letterSpacing: 2, color: "var(--delta-text-faint)", marginBottom: 8 }}>
                                        TOTAL NODES
                                    </div>
                                    <div style={{ fontSize: 24, color: "var(--delta-gold)", fontFamily: "var(--font-mono)" }}>
                                        {stats.totalNodes}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 8, letterSpacing: 2, color: "var(--delta-text-faint)", marginBottom: 8 }}>
                                        TOTAL EDGES
                                    </div>
                                    <div style={{ fontSize: 24, color: "var(--delta-gold)", fontFamily: "var(--font-mono)" }}>
                                        {stats.totalEdges}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Node Labels */}
                    <div className="panel mb-lg">
                        <div className="panel-header">Node Types</div>
                        <div className="panel-body">
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                {stats.labels.map(({ label, nodeCount }) => (
                                    <div
                                        key={label}
                                        className="tag"
                                        style={{ padding: "8px 12px" }}
                                    >
                                        <span style={{ fontWeight: 600 }}>{label}</span>
                                        <span style={{ marginLeft: 8, color: "var(--delta-text-faint)" }}>
                                            {nodeCount}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Relationship Types */}
                    <div className="panel mb-lg">
                        <div className="panel-header">Relationship Types</div>
                        <div className="panel-body">
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                {stats.relationships.map(({ relType, count }) => (
                                    <div
                                        key={relType}
                                        className="tag"
                                        style={{ padding: "8px 12px", borderColor: "var(--delta-gold)" }}
                                    >
                                        <span style={{ fontWeight: 600, color: "var(--delta-gold)" }}>
                                            {relType}
                                        </span>
                                        <span style={{ marginLeft: 8, color: "var(--delta-text-faint)" }}>
                                            {count}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Eras */}
                    {eras.length > 0 && (
                        <div className="panel mb-lg">
                            <div className="panel-header">Eras in Graph ({eras.length})</div>
                            <div className="panel-body">
                                {eras.map(({ era, characterCount }) => (
                                    <div
                                        key={era.id}
                                        style={{
                                            padding: "10px 0",
                                            borderBottom: "1px solid var(--delta-border-light)",
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center"
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontSize: 12, fontStyle: "italic", color: "var(--delta-text)" }}>
                                                {era.name}
                                            </div>
                                            <div style={{ fontSize: 8, color: "var(--delta-text-faint)", marginTop: 2 }}>
                                                {era.period}
                                            </div>
                                        </div>
                                        <span className="tag">{characterCount} characters</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Lineages */}
                    {lineages.length > 0 && (
                        <div className="panel mb-lg">
                            <div className="panel-header">Lineages in Graph ({lineages.length})</div>
                            <div className="panel-body">
                                {lineages.map(({ lineage, characterCount }) => (
                                    <div
                                        key={lineage.id}
                                        style={{
                                            padding: "10px 0",
                                            borderBottom: "1px solid var(--delta-border-light)",
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center"
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontSize: 12, fontStyle: "italic", color: "var(--delta-text)" }}>
                                                {lineage.name}
                                            </div>
                                            <div style={{ fontSize: 9, color: "var(--delta-text-muted)", marginTop: 2, lineHeight: 1.4 }}>
                                                {lineage.throughLine?.substring(0, 100)}...
                                            </div>
                                        </div>
                                        <span className="tag">{characterCount} characters</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ══════════ SEARCH ══════════ */}
            {view === "search" && (
                <div className="fade-in">
                    <div className="panel mb-lg">
                        <div className="panel-header">Search Knowledge Graph</div>
                        <div className="panel-body">
                            <div style={{ display: "flex", gap: 8 }}>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                    placeholder="Search nodes by name, description..."
                                    style={{
                                        flex: 1,
                                        padding: "10px 14px",
                                        background: "rgba(139,115,85,0.08)",
                                        border: "1px solid var(--delta-border)",
                                        borderRadius: 6,
                                        color: "var(--delta-text)",
                                        fontSize: 12
                                    }}
                                />
                                <button className="btn btn-primary" onClick={handleSearch}>
                                    Search
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                        <div className="panel">
                            <div className="panel-header">
                                Search Results ({searchResults.length})
                            </div>
                            <div className="panel-body">
                                {searchResults.map((result, i) => (
                                    <div
                                        key={i}
                                        className="soul-card"
                                        onClick={() => handleNodeClick(result.node)}
                                        style={{ cursor: "pointer" }}
                                    >
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                            <div className="soul-name">{result.node.name || "Unnamed"}</div>
                                            <div style={{ display: "flex", gap: 4 }}>
                                                {result.labels.map(label => (
                                                    <span key={label} className="tag" style={{ fontSize: 7 }}>
                                                        {label}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        {result.node.desc && (
                                            <div className="soul-desc">{result.node.desc}</div>
                                        )}
                                        {result.node.detail && (
                                            <div style={{ fontSize: 9, color: "var(--delta-text-muted)", marginTop: 4, lineHeight: 1.5 }}>
                                                {result.node.detail.substring(0, 150)}...
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ══════════ CREATORS ══════════ */}
            {view === "creators" && (
                <div className="fade-in">
                    <div className="epigraph" style={{ marginBottom: 28 }}>
                        Real Mississippi creators from the knowledge graph
                    </div>

                    {creators.length === 0 && !loading && (
                        <div style={{ textAlign: "center", padding: 40, color: "var(--delta-text-faint)" }}>
                            No creator data found in graph
                        </div>
                    )}

                    {creators.map((item, i) => (
                        <div key={i} className="panel mb-md fade-in" style={{ animationDelay: `${i * 60}ms` }}>
                            <div className="panel-body">
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div>
                                        <span style={{ fontSize: 14, fontFamily: "var(--font-display)", fontStyle: "italic" }}>
                                            {item.creator.name}
                                        </span>
                                        {item.creator.birth && (
                                            <span style={{ fontSize: 9, color: "var(--delta-text-faint)", marginLeft: 10 }}>
                                                b. {item.creator.birth}
                                            </span>
                                        )}
                                    </div>
                                    {item.creator.form && (
                                        <span className="tag">{item.creator.form}</span>
                                    )}
                                </div>
                                {item.birthplace && (
                                    <div style={{ fontSize: 9, color: "var(--delta-text-muted)", marginTop: 4 }}>
                                        {item.birthplace.name}
                                    </div>
                                )}
                                {item.creator.desc && (
                                    <div style={{ fontSize: 10, color: "var(--delta-text-dim)", marginTop: 8, lineHeight: 1.6 }}>
                                        {item.creator.desc}
                                    </div>
                                )}
                                {item.works.length > 0 && (
                                    <div style={{ marginTop: 8 }}>
                                        <div style={{ fontSize: 7, letterSpacing: 2, color: "var(--delta-text-faint)", marginBottom: 4 }}>
                                            WORKS ({item.works.length})
                                        </div>
                                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                                            {item.works.map((work, j) => (
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

            {/* ══════════ PLACES ══════════ */}
            {view === "places" && (
                <div className="fade-in">
                    <div className="epigraph" style={{ marginBottom: 28 }}>
                        Mississippi places in the knowledge graph
                    </div>

                    {places.length === 0 && !loading && (
                        <div style={{ textAlign: "center", padding: 40, color: "var(--delta-text-faint)" }}>
                            No place data found in graph
                        </div>
                    )}

                    {places.map((item, i) => (
                        <div key={i} className="panel mb-md fade-in" style={{ animationDelay: `${i * 60}ms` }}>
                            <div className="panel-body">
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div>
                                        <span style={{ fontSize: 14, fontFamily: "var(--font-display)", fontStyle: "italic" }}>
                                            {item.place.name}
                                        </span>
                                    </div>
                                    {item.region && (
                                        <span className="tag">{item.region.name}</span>
                                    )}
                                </div>
                                {item.place.desc && (
                                    <div style={{ fontSize: 10, color: "var(--delta-text-dim)", marginTop: 8, lineHeight: 1.6 }}>
                                        {item.place.desc}
                                    </div>
                                )}
                                {item.creators.length > 0 && (
                                    <div style={{ marginTop: 8 }}>
                                        <div style={{ fontSize: 7, letterSpacing: 2, color: "var(--delta-text-faint)", marginBottom: 4 }}>
                                            CREATORS FROM HERE ({item.creators.length})
                                        </div>
                                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                                            {item.creators.map((creator, j) => (
                                                <span key={j} className="tag" style={{ fontSize: 7 }}>
                                                    {creator.name}
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

            {/* ══════════ TRANSMUTATIONS ══════════ */}
            {view === "transmutations" && (
                <div className="fade-in">
                    <div className="epigraph" style={{ marginBottom: 28 }}>
                        Cross-era character evolution — how archetypes transmute through time
                    </div>

                    {transmutations.length === 0 && !loading && (
                        <div style={{ textAlign: "center", padding: 40, color: "var(--delta-text-faint)" }}>
                            No transmutation data found in graph
                        </div>
                    )}

                    {transmutations.map((t, i) => (
                        <div
                            key={i}
                            className="panel mb-md fade-in"
                            style={{ animationDelay: `${i * 60}ms` }}
                        >
                            <div className="panel-body">
                                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 12, fontStyle: "italic", color: "var(--delta-text)" }}>
                                            {t.source.name}
                                        </div>
                                        {t.sourceEra && (
                                            <div style={{ fontSize: 8, color: "var(--delta-text-faint)", marginTop: 2 }}>
                                                {t.sourceEra.period}
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ fontSize: 20, color: "var(--delta-gold)" }}>→</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 12, fontStyle: "italic", color: "var(--delta-text)" }}>
                                            {t.target.name}
                                        </div>
                                        {t.targetEra && (
                                            <div style={{ fontSize: 8, color: "var(--delta-text-faint)", marginTop: 2 }}>
                                                {t.targetEra.period}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
