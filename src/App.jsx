// ═══════════════════════════════════════════════════════════
// ONTOLOGICAL THEATRE — Main Application
// Dual Morpho-Semantic Simulation × Delta Blues Mythology
// Deep Time: 8 Eras × 8 Lineages × 64 Mutations
// ═══════════════════════════════════════════════════════════

import { useState } from "react";
import { useSimulation } from "./hooks/useSimulation";
import SimulationPage from "./pages/SimulationPage";
import MediaStudioPage from "./pages/MediaStudioPage";
import OntologyPage from "./pages/OntologyPage";
import DeepTimePage from "./pages/DeepTimePage";
import StoryboardPage from "./pages/StoryboardPage";
import GalleryPage from "./pages/GalleryPage";
import GraphExplorerPage from "./pages/GraphExplorerPage";

const MODES = [
    { id: "simulation", label: "The Crossroads" },
    { id: "deeptime", label: "Deep Time" },
    { id: "graph", label: "Graph Explorer" },
    { id: "storyboards", label: "Spark Moments" },
    { id: "studio", label: "Media Studio" },
    { id: "gallery", label: "Gallery" },
    { id: "ontology", label: "Ontology" },
];

export default function App() {
    const [mode, setMode] = useState("simulation");
    const sim = useSimulation();

    return (
        <div className="app-container">
            {/* ── Header ── */}
            <header style={{ textAlign: "center", marginBottom: 24, position: "relative" }}>
                <div
                    style={{
                        fontSize: 9,
                        letterSpacing: 8,
                        color: "var(--delta-text-faint)",
                        fontFamily: "var(--font-body)",
                    }}
                >
                    DUAL ONTOLOGY ENGINE
                </div>
                <h1
                    style={{
                        fontFamily: "var(--font-display)",
                        fontSize: 32,
                        fontWeight: 400,
                        fontStyle: "italic",
                        color: "var(--delta-text)",
                        margin: "4px 0",
                        letterSpacing: 1,
                    }}
                >
                    Ontological Theatre
                </h1>
                <div
                    style={{
                        fontSize: 11,
                        color: "var(--delta-text-muted)",
                        fontStyle: "italic",
                    }}
                >
                    {mode === "deeptime"
                        ? "Mississippi Delta — 1000 BCE to Present"
                        : mode === "studio"
                            ? "Eight Eras × Eight Lineages × Generative Art"
                            : mode === "gallery"
                                ? "Memory of Works Generated Across Eight Eras"
                                : "Clarksdale, Mississippi — 1925"}
                </div>
                <div
                    style={{
                        fontSize: 9,
                        color: "var(--delta-text-faint)",
                        marginTop: 2,
                    }}
                >
                    {mode === "deeptime"
                        ? "The Art Leaves but the Soil Remembers"
                        : mode === "studio"
                            ? "Claude Text · Gemini Image · Algorithmic Canvas"
                            : mode === "gallery"
                                ? "The Soil Remembers"
                                : "Before the Great Flood"}
                </div>
            </header>

            {/* ── Navigation ── */}
            <nav className="nav-tabs">
                {MODES.map((m) => (
                    <button
                        id={`mode-${m.id}`}
                        key={m.id}
                        className={`nav-tab ${mode === m.id ? "active" : ""}`}
                        onClick={() => setMode(m.id)}
                    >
                        {m.label}
                    </button>
                ))}
            </nav>

            {/* ── Pages ── */}
            {mode === "simulation" && <SimulationPage sim={sim} />}
            {mode === "deeptime" && (
                <DeepTimePage
                    onRunEra={(era) => {
                        console.log("Run era:", era.id);
                        setMode("simulation");
                    }}
                />
            )}
            {mode === "graph" && <GraphExplorerPage />}
            {mode === "storyboards" && <StoryboardPage />}
            {mode === "studio" && <MediaStudioPage />}
            {mode === "gallery" && <GalleryPage />}
            {mode === "ontology" && <OntologyPage />}

            {/* ── Footer ── */}
            <footer
                style={{
                    textAlign: "center",
                    padding: "32px 0 16px",
                    marginTop: 48,
                    borderTop: "1px solid var(--delta-border-light)",
                }}
            >
                <div style={{ fontSize: 8, letterSpacing: 4, color: "var(--delta-text-ghost)" }}>
                    ONTOLOGICAL THEATRE — 8 ERAS · 8 LINEAGES · 64 MUTATIONS · 320 ARTIFACTS
                </div>
                <div style={{ fontSize: 8, color: "var(--delta-text-ghost)", marginTop: 4 }}>
                    -ity (what it IS) × -pathy (what it FEELS) → Emergent Narrative
                </div>
            </footer>
        </div>
    );
}
