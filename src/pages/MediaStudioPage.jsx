// ═══════════════════════════════════════════════════════════
// MEDIA STUDIO PAGE — Full creative studio
// Era-aware multimedia generation + Gallery integration
// ═══════════════════════════════════════════════════════════

import { useState, useCallback, useMemo } from "react";
import { ERAS } from "../data/eras";
import { LINEAGES } from "../data/lineages";
import { getCharacter } from "../data/characters";
import ArtCanvas from "../components/ArtCanvas";
import { geminiImage, generateWithClaude } from "../api/generate";
import { addToGallery } from "./GalleryPage";

const GEMINI_KEY = "AIzaSyCaAOXazk3pTWQqqDT1WWruDo8vhFM29Uc";

export default function MediaStudioPage() {
    // Era and Lineage selection
    const [selEraIdx, setSelEraIdx] = useState(4); // Start at Delta Blues
    const [selLinIdx, setSelLinIdx] = useState(2); // Start at Fire (Bluesman)

    // Scene controls
    const [selPhaseIdx, setSelPhaseIdx] = useState(0);
    const [selLocIdx, setSelLocIdx] = useState(0);
    const [selBridgeIdx, setSelBridgeIdx] = useState(0);
    const [selPathyIdx, setSelPathyIdx] = useState(0);
    const [entropy, setEntropy] = useState(0.3);

    // Canvas
    const [artSeed, setArtSeed] = useState(42);

    // Generation state
    const [activePanel, setActivePanel] = useState("canvas");
    const [loading, setLoading] = useState(false);
    const [imgLoading, setImgLoading] = useState(false);
    const [error, setError] = useState(null);
    const [textResult, setTextResult] = useState(null);
    const [imageResult, setImageResult] = useState(null);
    const [imagePrompt, setImagePrompt] = useState("");
    const [saveNotice, setSaveNotice] = useState(null);

    // Current selections
    const era = ERAS[selEraIdx];
    const lineage = LINEAGES[selLinIdx];
    const character = getCharacter(lineage.id, selEraIdx);
    const phase = era.phases[selPhaseIdx];
    const location = era.locations[selLocIdx];
    const bridge = era.bridges[selBridgeIdx];
    const pathy = era.pathies[selPathyIdx];

    // Build context string for generation
    const contextStr = useMemo(() => {
        return `Character: ${character.name} — ${character.desc}. "${character.flavor}"
Era: ${era.name} (${era.period})
Location: ${location}
Phase: ${phase.name} — ${phase.desc}
Bridge: ${bridge}
State: ${pathy}
Entropy: ${entropy.toFixed(2)}
Lineage: ${lineage.name} — ${lineage.throughLine}
${
    character.medium
        ? `Medium: ${character.medium}
Surface: ${character.surface}
Literacy: ${character.literacy}
Voice: ${character.voice}
Artifacts: ${character.artifactTypes.join("; ")}`
        : ""
}
Previous: ${selEraIdx > 0 ? getCharacter(lineage.id, selEraIdx - 1).name : "Origin"}
${
    selEraIdx < ERAS.length - 1
        ? `Next: ${getCharacter(lineage.id, selEraIdx + 1).name}`
        : "This is the present"
}`;
    }, [character, era, phase, location, bridge, pathy, entropy, lineage, selEraIdx]);

    // System prompts for different text modes
    const sysPrompts = useMemo(() => {
        const poemPrompt = `Poet of Mississippi Delta deep time. Era: ${era.name} (${era.period}). ${era.desc}
Dual Ontology: -ity (BEING) × -pathy (FEELING). Character carries ancestral weight.
ONE poem, no preamble, 12-20 lines, voice specific to era.`;

        const songLabel =
            era.id === "delta" || era.id === "electric"
                ? "Delta blues. AAB 12-bar. Title, 3-4 verses, chorus, bridge. No preamble."
                : era.id === "mound"
                ? "Mississippian ceremonial chant. Rhythmic, earth/corn/water/stars. Title then sections. No preamble."
                : era.id === "nations"
                ? "Choctaw contact-era song. Old melodies adapted. Title then sections. No preamble."
                : era.id === "removal"
                ? "Enslaved spiritual/field holler. Ring shout, call-response, coded freedom. Title then sections. No preamble."
                : era.id === "reckoning"
                ? "Freedom song / protest spiritual. Gospel technique weaponized for justice. Title, verses with call-response, chorus. No preamble."
                : era.id === "writers"
                ? "Contemporary Mississippi song — Hill Country blues, country, folk, or spoken word. Rooted in place. Title, verses, chorus. No preamble."
                : "Contemporary Mississippi poem-song. Hybrid form — blues meets hip-hop meets spoken word meets gospel. Title, sections. No preamble.";

        const prosePrompt = `Narrator of Delta deep history. Era: ${era.name} (${era.period}). ${era.desc}
ONE prose fragment 150-250 words. Spare, sensory. Start in middle. No preamble.`;

        const spokenPrompt = `Spoken word performer in ${era.name} era. ${era.desc}
ONE spoken word piece, 15-25 lines. Rhythm, repetition, call-response energy. Era-specific voice. No preamble.`;

        return { poem: poemPrompt, song: songLabel, prose: prosePrompt, spoken: spokenPrompt };
    }, [era]);

    // Text generation
    const generateText = useCallback(
        async (mode) => {
            setLoading(true);
            setError(null);
            const prompt =
                mode === "poem"
                    ? sysPrompts.poem
                    : mode === "song"
                    ? sysPrompts.song
                    : mode === "spoken"
                    ? sysPrompts.spoken
                    : sysPrompts.prose;
            const result = await generateWithClaude("", prompt, contextStr);
            if (result.error) {
                setError(result.error);
            } else {
                const resultData = {
                    text: result.text,
                    mode,
                    character: character.name,
                    era: era.name,
                    phase: phase.name,
                    bridge,
                    pathy,
                };
                setTextResult(resultData);

                // Auto-save to gallery
                const savedItem = addToGallery({
                    type: mode,
                    content: { text: result.text },
                    context: {
                        era: era.name,
                        character: character.name,
                        location,
                        phase: phase.name,
                        bridge,
                        pathy,
                        entropy,
                    },
                    model: "claude-sonnet-4-20250514",
                    prompt: contextStr,
                    title: result.text.split("\n")[0].substring(0, 60),
                });

                setSaveNotice(`Saved to gallery: ${savedItem.title}`);
                setTimeout(() => setSaveNotice(null), 3000);
            }
            setLoading(false);
        },
        [sysPrompts, contextStr, character, era, phase, bridge, pathy, location, entropy]
    );

    // Image generation
    const generateImage = useCallback(
        async (type) => {
            setImgLoading(true);
            setError(null);
            setImageResult(null);

            const baseStyle = era.artStyle || "Hyper-photorealistic 8K cinematic photograph. Mississippi.";
            const prompt =
                type === "portrait"
                    ? `${baseStyle}. PORTRAIT: Close-up portrait of a person who embodies ${character.name}: ${character.desc}. At ${location} during ${phase.name}. Face shows ${pathy}. 85mm lens, f/1.8. Visible pores, sweat. No text.`
                    : type === "landscape"
                    ? `${baseStyle}. LANDSCAPE: Wide-angle of ${location} during ${phase.name}: ${phase.desc}. ${
                          entropy > 0.6
                              ? "Ominous atmosphere."
                              : entropy > 0.3
                              ? "Uneasy stillness."
                              : "Weighted calm."
                      } 24mm lens. No text.`
                    : `${baseStyle}. CINEMATIC: ${character.name} at ${location}: ${character.desc}. Tension between ${bridge} and ${pathy}. Phase: ${phase.name}. 35mm, f/2.8. No text.`;

            setImagePrompt(prompt);

            const result = await geminiImage(prompt);
            if (result.error) {
                setError(result.error + " (Try the algorithmic canvas instead)");
            } else {
                setImageResult({ url: result.imageUrl, type, prompt, model: result.model });

                // Auto-save to gallery
                const savedItem = addToGallery({
                    type: "image",
                    content: { imageUrl: result.imageUrl },
                    context: {
                        era: era.name,
                        character: character.name,
                        location,
                        phase: phase.name,
                        bridge,
                        pathy,
                        entropy,
                    },
                    model: result.model,
                    prompt,
                    title: `${character.name} — ${location}`,
                });

                setSaveNotice(`Saved to gallery: ${savedItem.title}`);
                setTimeout(() => setSaveNotice(null), 3000);
            }
            setImgLoading(false);
        },
        [character, era, phase, location, bridge, pathy, entropy]
    );

    // Save canvas to gallery
    const saveCanvas = useCallback(() => {
        const canvas = document.querySelector('canvas[data-save-canvas="true"]');
        if (!canvas) return;

        canvas.toBlob((blob) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const savedItem = addToGallery({
                    type: "image",
                    content: { imageUrl: reader.result },
                    context: {
                        era: era.name,
                        character: character.name,
                        location,
                        phase: phase.name,
                        bridge,
                        pathy,
                        entropy,
                    },
                    model: "algorithmic-canvas",
                    prompt: `Seed: ${artSeed}, Entropy: ${entropy.toFixed(2)}, Era: ${era.id}`,
                    title: `${era.name} Canvas — Seed ${artSeed}`,
                });

                setSaveNotice(`Saved canvas to gallery: ${savedItem.title}`);
                setTimeout(() => setSaveNotice(null), 3000);
            };
            reader.readAsDataURL(blob);
        });
    }, [era, character, location, phase, bridge, pathy, entropy, artSeed]);

    // Style helpers
    const selectStyle = {
        background: "rgba(139,115,85,0.06)",
        border: `1px solid ${era.color}18`,
        borderRadius: 5,
        color: "#d4c8a8",
        padding: "6px 10px",
        fontSize: 11,
        fontFamily: "Georgia",
        width: "100%",
        appearance: "none",
        cursor: "pointer",
    };

    const btn = (label, onClick, isLoading = false) => (
        <button
            onClick={onClick}
            disabled={isLoading}
            style={{
                padding: "8px 16px",
                background: isLoading
                    ? "rgba(139,115,85,0.08)"
                    : `linear-gradient(135deg,${era.color}40,${era.color}20)`,
                border: `1px solid ${era.color}25`,
                borderRadius: 5,
                color: "#d4c8a8",
                fontFamily: "'Playfair Display'",
                fontSize: 11,
                fontStyle: "italic",
                cursor: isLoading ? "wait" : "pointer",
            }}
        >
            {isLoading ? "Creating..." : label}
        </button>
    );

    const songLabel =
        era.id === "delta" || era.id === "electric"
            ? "Blues Song"
            : era.id === "mound"
            ? "Ceremonial Chant"
            : era.id === "nations"
            ? "Treaty Song"
            : era.id === "removal"
            ? "Spiritual"
            : era.id === "reckoning"
            ? "Freedom Song"
            : era.id === "writers"
            ? "Mississippi Song"
            : "Delta Hybrid";

    const poemLabel =
        era.id === "mound"
            ? "Sacred Verse"
            : era.id === "nations"
            ? "Contact Poem"
            : era.id === "removal"
            ? "Resistance Verse"
            : era.id === "reckoning"
            ? "Witness Poem"
            : era.id === "now"
            ? "Living Poem"
            : "Delta Poem";

    return (
        <div className="fade-in" style={{ maxWidth: 1400, margin: "0 auto" }}>
            {/* Save notification */}
            {saveNotice && (
                <div
                    style={{
                        position: "fixed",
                        top: 20,
                        right: 20,
                        background: "rgba(212,160,74,0.15)",
                        border: "1px solid rgba(212,160,74,0.3)",
                        borderRadius: 6,
                        padding: "10px 16px",
                        color: "#d4c8a8",
                        fontSize: 11,
                        zIndex: 1000,
                        animation: "fadeIn 0.3s",
                    }}
                >
                    ✓ {saveNotice}
                </div>
            )}

            {/* Era selector bar */}
            <div
                style={{
                    display: "flex",
                    gap: 0,
                    marginBottom: 14,
                    borderRadius: 6,
                    overflow: "hidden",
                    border: "1px solid rgba(139,115,85,0.1)",
                }}
            >
                {ERAS.map((e, i) => (
                    <div
                        key={e.id}
                        onClick={() => {
                            setSelEraIdx(i);
                            setSelPhaseIdx(0);
                            setSelLocIdx(0);
                            setTextResult(null);
                            setImageResult(null);
                        }}
                        style={{
                            flex: 1,
                            padding: "8px 4px",
                            cursor: "pointer",
                            textAlign: "center",
                            background: selEraIdx === i ? `${e.color}15` : "rgba(0,0,0,0.2)",
                            borderBottom: selEraIdx === i ? `3px solid ${e.color}` : "3px solid transparent",
                            transition: "all 0.3s",
                        }}
                    >
                        <div
                            style={{
                                fontSize: 6,
                                letterSpacing: 2,
                                color: selEraIdx === i ? e.color : "#4a4030",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {e.period.length > 20 ? e.period.split("–")[0].trim() + "–" : e.period}
                        </div>
                        <div
                            style={{
                                fontSize: 10,
                                color: selEraIdx === i ? "#d4c8a8" : "#6a5e48",
                                fontFamily: "'Playfair Display'",
                                fontStyle: "italic",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {e.name}
                        </div>
                    </div>
                ))}
            </div>

            {/* Header */}
            <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 8, letterSpacing: 5, color: era.color }}>
                    {era.subtitle.toUpperCase()}
                </div>
                <h2
                    style={{
                        fontFamily: "'Playfair Display'",
                        fontSize: 24,
                        fontWeight: 400,
                        fontStyle: "italic",
                        color: "#d4c8a8",
                        margin: "0 0 3px",
                    }}
                >
                    {era.name} — Media Studio
                </h2>
                <p
                    style={{
                        fontSize: 12,
                        color: "#8a7e68",
                        lineHeight: 1.7,
                        maxWidth: 750,
                        margin: 0,
                        fontFamily: "'EB Garamond'",
                    }}
                >
                    {era.desc}
                </p>
            </div>

            {/* Panel tabs */}
            <div style={{ display: "flex", gap: 2, marginBottom: 10 }}>
                {[
                    { id: "canvas", label: "ALGORITHMIC CANVAS" },
                    { id: "image", label: "GENERATE IMAGE" },
                    { id: "text", label: "GENERATE TEXT" },
                ].map((m) => (
                    <div
                        key={m.id}
                        onClick={() => setActivePanel(m.id)}
                        style={{
                            padding: "7px 16px",
                            fontSize: 8,
                            letterSpacing: 3,
                            cursor: "pointer",
                            color: activePanel === m.id ? era.color : "#4a4030",
                            borderBottom:
                                activePanel === m.id ? `2px solid ${era.color}` : "2px solid transparent",
                        }}
                    >
                        {m.label}
                    </div>
                ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 14 }}>
                {/* Controls sidebar */}
                <div
                    style={{
                        background: "rgba(0,0,0,0.15)",
                        border: "1px solid rgba(139,115,85,0.08)",
                        borderRadius: 8,
                        padding: 11,
                        alignSelf: "start",
                        position: "sticky",
                        top: 10,
                    }}
                >
                    <div
                        style={{
                            fontSize: 8,
                            letterSpacing: 3,
                            color: "#5a5040",
                            marginBottom: 8,
                            textAlign: "center",
                        }}
                    >
                        SCENE CONTROLS
                    </div>

                    {/* Lineage selector */}
                    <div style={{ marginBottom: 9 }}>
                        <label
                            style={{
                                fontSize: 7,
                                color: "#5a5040",
                                letterSpacing: 2,
                                display: "block",
                                marginBottom: 2,
                            }}
                        >
                            LINEAGE
                        </label>
                        <select
                            value={selLinIdx}
                            onChange={(e) => setSelLinIdx(+e.target.value)}
                            style={selectStyle}
                        >
                            {LINEAGES.map((lin, i) => (
                                <option key={lin.id} value={i} style={{ background: "#1a1408" }}>
                                    {lin.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Phase */}
                    <div style={{ marginBottom: 9 }}>
                        <label
                            style={{
                                fontSize: 7,
                                color: "#5a5040",
                                letterSpacing: 2,
                                display: "block",
                                marginBottom: 2,
                            }}
                        >
                            PHASE
                        </label>
                        <select
                            value={selPhaseIdx}
                            onChange={(e) => {
                                const idx = +e.target.value;
                                setSelPhaseIdx(idx);
                                const ph = era.phases[idx];
                                setEntropy(ph.entropy[0] + (ph.entropy[1] - ph.entropy[0]) * 0.5);
                            }}
                            style={selectStyle}
                        >
                            {era.phases.map((p, i) => (
                                <option key={i} value={i} style={{ background: "#1a1408" }}>
                                    {p.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Location */}
                    <div style={{ marginBottom: 9 }}>
                        <label
                            style={{
                                fontSize: 7,
                                color: "#5a5040",
                                letterSpacing: 2,
                                display: "block",
                                marginBottom: 2,
                            }}
                        >
                            PLACE
                        </label>
                        <select value={selLocIdx} onChange={(e) => setSelLocIdx(+e.target.value)} style={selectStyle}>
                            {era.locations.map((loc, i) => (
                                <option key={i} value={i} style={{ background: "#1a1408" }}>
                                    {loc}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Bridge */}
                    <div style={{ marginBottom: 9 }}>
                        <label
                            style={{
                                fontSize: 7,
                                color: "#5a5040",
                                letterSpacing: 2,
                                display: "block",
                                marginBottom: 2,
                            }}
                        >
                            BRIDGE
                        </label>
                        <select
                            value={selBridgeIdx}
                            onChange={(e) => setSelBridgeIdx(+e.target.value)}
                            style={selectStyle}
                        >
                            {era.bridges.map((b, i) => (
                                <option key={i} value={i} style={{ background: "#1a1408" }}>
                                    {b}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Pathy */}
                    <div style={{ marginBottom: 9 }}>
                        <label
                            style={{
                                fontSize: 7,
                                color: "#5a5040",
                                letterSpacing: 2,
                                display: "block",
                                marginBottom: 2,
                            }}
                        >
                            STATE
                        </label>
                        <select
                            value={selPathyIdx}
                            onChange={(e) => setSelPathyIdx(+e.target.value)}
                            style={selectStyle}
                        >
                            {era.pathies.map((p, i) => (
                                <option key={i} value={i} style={{ background: "#1a1408" }}>
                                    {p}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Entropy */}
                    <div style={{ marginBottom: 8 }}>
                        <label
                            style={{
                                fontSize: 7,
                                color: "#5a5040",
                                letterSpacing: 2,
                                display: "block",
                                marginBottom: 2,
                            }}
                        >
                            ENTROPY <span style={{ color: era.color }}>{entropy.toFixed(2)}</span>
                        </label>
                        <input
                            type="range"
                            min={0.05}
                            max={0.95}
                            step={0.05}
                            value={entropy}
                            onChange={(e) => setEntropy(+e.target.value)}
                            style={{ width: "100%", accentColor: era.color }}
                        />
                    </div>

                    <div style={{ height: 1, background: "rgba(139,115,85,0.06)", margin: "6px 0" }} />

                    {/* Character info */}
                    <div style={{ fontSize: 7, color: era.color, letterSpacing: 2, marginBottom: 3 }}>
                        CHARACTER
                    </div>
                    <div
                        style={{
                            fontSize: 11,
                            color: "#d4c8a8",
                            fontFamily: "'Playfair Display'",
                            fontStyle: "italic",
                            marginBottom: 4,
                        }}
                    >
                        {character.name}
                    </div>
                    <div style={{ fontSize: 9, color: "#6a5e48", lineHeight: 1.4, marginBottom: 4 }}>
                        {character.desc}
                    </div>
                    <div style={{ fontSize: 8, color: era.color, fontStyle: "italic" }}>
                        "{character.flavor}"
                    </div>
                </div>

                {/* Main content area */}
                <div>
                    {error && (
                        <div
                            style={{
                                background: "rgba(139,0,0,0.08)",
                                border: "1px solid rgba(139,0,0,0.2)",
                                borderRadius: 6,
                                padding: "8px 14px",
                                marginBottom: 10,
                                fontSize: 10,
                                color: "#C0392B",
                                lineHeight: 1.5,
                            }}
                        >
                            {error}
                            <span
                                onClick={() => setError(null)}
                                style={{ float: "right", cursor: "pointer", fontSize: 14 }}
                            >
                                ×
                            </span>
                        </div>
                    )}

                    {/* Context tags */}
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 10 }}>
                        {[era.name, character.name, location, phase.name, bridge, pathy].map((t, i) => (
                            <span
                                key={i}
                                style={{
                                    padding: "2px 6px",
                                    borderRadius: 3,
                                    border: `1px solid ${era.color}15`,
                                    fontSize: 7,
                                    color: "#8a7e68",
                                }}
                            >
                                {t}
                            </span>
                        ))}
                    </div>

                    {/* ALGORITHMIC CANVAS PANEL */}
                    {activePanel === "canvas" && (
                        <div>
                            <div style={{ fontSize: 8, letterSpacing: 3, color: "#5a5040", marginBottom: 6 }}>
                                GENERATIVE ART ENGINE
                            </div>
                            <div style={{ display: "flex", gap: 5, marginBottom: 8 }}>
                                <button
                                    onClick={() => setArtSeed(Math.floor(Math.random() * 99999))}
                                    style={{
                                        padding: "6px 14px",
                                        background: `${era.color}15`,
                                        border: `1px solid ${era.color}20`,
                                        borderRadius: 4,
                                        color: "#d4c8a8",
                                        fontSize: 10,
                                        fontStyle: "italic",
                                        cursor: "pointer",
                                    }}
                                >
                                    Random Seed
                                </button>
                                <div
                                    style={{
                                        padding: "6px 10px",
                                        background: `${era.color}08`,
                                        border: `1px solid ${era.color}12`,
                                        borderRadius: 4,
                                        color: era.color,
                                        fontSize: 10,
                                    }}
                                >
                                    Seed {artSeed}
                                </div>
                                <button
                                    onClick={saveCanvas}
                                    style={{
                                        padding: "6px 14px",
                                        background: "rgba(212,160,74,0.1)",
                                        border: "1px solid rgba(212,160,74,0.2)",
                                        borderRadius: 4,
                                        color: "#d4c8a8",
                                        fontSize: 10,
                                        cursor: "pointer",
                                        marginLeft: "auto",
                                    }}
                                >
                                    Save to Gallery
                                </button>
                            </div>
                            <div
                                style={{
                                    background: "rgba(0,0,0,0.3)",
                                    border: `1px solid ${era.color}15`,
                                    borderRadius: 8,
                                    padding: 6,
                                    marginBottom: 8,
                                }}
                            >
                                <div data-save-canvas="true">
                                    <ArtCanvas
                                        seed={artSeed + selLinIdx * 1000 + selEraIdx * 100}
                                        entropy={entropy}
                                        palette={character.palette}
                                        eraId={era.id}
                                        width={680}
                                        height={420}
                                    />
                                </div>
                            </div>
                            {/* Thumbnail variants */}
                            <div style={{ display: "flex", gap: 4 }}>
                                {[artSeed + 10, artSeed + 20, artSeed + 30, artSeed + 40].map((s) => (
                                    <div
                                        key={s}
                                        onClick={() => setArtSeed(s)}
                                        style={{
                                            cursor: "pointer",
                                            border: "1px solid rgba(139,115,85,0.08)",
                                            borderRadius: 3,
                                            overflow: "hidden",
                                            flex: 1,
                                        }}
                                    >
                                        <ArtCanvas
                                            seed={s + selLinIdx * 1000 + selEraIdx * 100}
                                            entropy={entropy}
                                            palette={character.palette}
                                            eraId={era.id}
                                            width={150}
                                            height={90}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* IMAGE GENERATION PANEL */}
                    {activePanel === "image" && (
                        <div>
                            <div style={{ fontSize: 8, letterSpacing: 3, color: "#5a5040", marginBottom: 6 }}>
                                PHOTOREALISTIC IMAGE GENERATION · GEMINI
                            </div>
                            <div style={{ display: "flex", gap: 5, marginBottom: 14, flexWrap: "wrap" }}>
                                {btn("Portrait", () => generateImage("portrait"), imgLoading)}
                                {btn("Landscape", () => generateImage("landscape"), imgLoading)}
                                {btn("Cinematic Scene", () => generateImage("cinematic"), imgLoading)}
                            </div>

                            {imgLoading && (
                                <div
                                    style={{
                                        textAlign: "center",
                                        padding: 30,
                                        color: "#5a5040",
                                        fontStyle: "italic",
                                        fontSize: 11,
                                    }}
                                >
                                    Gemini rendering photorealism...
                                </div>
                            )}

                            {imageResult && (
                                <div
                                    style={{
                                        background: "rgba(0,0,0,0.3)",
                                        border: `1px solid ${era.color}15`,
                                        borderRadius: 8,
                                        padding: 6,
                                        marginBottom: 14,
                                    }}
                                >
                                    <img
                                        src={imageResult.url}
                                        alt=""
                                        style={{ width: "100%", borderRadius: 6, display: "block" }}
                                    />
                                    <div
                                        style={{
                                            fontSize: 7,
                                            color: "#3a3020",
                                            padding: "8px 6px 4px",
                                            letterSpacing: 1,
                                        }}
                                    >
                                        {imageResult.model.toUpperCase()} · {character.name} · {era.name} ·{" "}
                                        {phase.name}
                                    </div>
                                    {imagePrompt && (
                                        <div
                                            style={{
                                                fontSize: 8,
                                                color: "#5a5040",
                                                padding: "4px 6px",
                                                fontStyle: "italic",
                                                lineHeight: 1.4,
                                            }}
                                        >
                                            Prompt: {imagePrompt}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* TEXT GENERATION PANEL */}
                    {activePanel === "text" && (
                        <div>
                            <div style={{ fontSize: 8, letterSpacing: 3, color: "#5a5040", marginBottom: 6 }}>
                                TEXT GENERATION · CLAUDE SONNET 4
                            </div>
                            <div style={{ display: "flex", gap: 5, marginBottom: 14, flexWrap: "wrap" }}>
                                {btn(poemLabel, () => generateText("poem"), loading)}
                                {btn(songLabel, () => generateText("song"), loading)}
                                {btn("Prose Fragment", () => generateText("prose"), loading)}
                                {btn("Spoken Word", () => generateText("spoken"), loading)}
                            </div>

                            {textResult && (
                                <div
                                    style={{
                                        background: `${era.color}05`,
                                        border: `1px solid ${era.color}12`,
                                        borderRadius: 8,
                                        padding: "18px 22px",
                                        marginBottom: 16,
                                    }}
                                >
                                    <div
                                        style={{
                                            fontFamily: "'EB Garamond'",
                                            fontSize: 13,
                                            lineHeight: 1.9,
                                            color: "#d4c8a8",
                                            whiteSpace: "pre-wrap",
                                            fontStyle: "italic",
                                        }}
                                    >
                                        {textResult.text.split("\n").map((line, i) => {
                                            const isSection = line.startsWith("[") || line.startsWith("(");
                                            const isTitle = i === 0 && line.length < 60;
                                            return (
                                                <div
                                                    key={i}
                                                    style={{
                                                        color: isSection
                                                            ? era.color
                                                            : isTitle
                                                            ? "#d4c8a8"
                                                            : undefined,
                                                        fontSize: isTitle ? 15 : isSection ? 9 : undefined,
                                                        fontWeight: isTitle ? 600 : undefined,
                                                        fontStyle: isTitle
                                                            ? "normal"
                                                            : isSection
                                                            ? "normal"
                                                            : undefined,
                                                        letterSpacing: isSection ? 3 : isTitle ? 1 : undefined,
                                                        marginTop: isSection ? 12 : 0,
                                                        fontFamily: isTitle
                                                            ? "'Playfair Display'"
                                                            : undefined,
                                                    }}
                                                >
                                                    {line || "\u00A0"}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div
                                        style={{
                                            marginTop: 12,
                                            paddingTop: 6,
                                            borderTop: `1px solid ${era.color}10`,
                                            fontSize: 7,
                                            color: "#3a3020",
                                            letterSpacing: 2,
                                        }}
                                    >
                                        {textResult.character} · {textResult.era} · {textResult.phase} ·{" "}
                                        {textResult.bridge} · {textResult.pathy} · CLAUDE SONNET 4
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Artifact Ontology Display */}
                    {character.medium && (
                        <div
                            style={{
                                marginTop: 14,
                                background: "rgba(0,0,0,0.15)",
                                border: `1px solid ${era.color}12`,
                                borderRadius: 6,
                                padding: "10px 12px",
                            }}
                        >
                            <div
                                style={{
                                    fontSize: 8,
                                    letterSpacing: 3,
                                    color: era.color,
                                    marginBottom: 8,
                                }}
                            >
                                ARTIFACT ONTOLOGY
                            </div>
                            {[
                                { label: "MEDIUM", val: character.medium },
                                { label: "SURFACE", val: character.surface },
                                { label: "LITERACY", val: character.literacy },
                                { label: "VOICE", val: character.voice },
                            ].map(({ label, val }) => (
                                <div key={label} style={{ marginBottom: 5 }}>
                                    <span style={{ fontSize: 7, color: "#5a5040", letterSpacing: 2 }}>
                                        {label}
                                    </span>
                                    <div
                                        style={{
                                            fontSize: 10,
                                            color: "#8a7e68",
                                            lineHeight: 1.4,
                                            fontFamily: "'EB Garamond'",
                                        }}
                                    >
                                        {val}
                                    </div>
                                </div>
                            ))}
                            {character.artifactTypes && (
                                <div style={{ marginTop: 6 }}>
                                    <span style={{ fontSize: 7, color: "#5a5040", letterSpacing: 2 }}>
                                        ARTIFACTS
                                    </span>
                                    {character.artifactTypes.map((a, i) => (
                                        <div
                                            key={i}
                                            style={{
                                                fontSize: 9,
                                                color: "#8a7e68",
                                                lineHeight: 1.4,
                                                fontFamily: "'EB Garamond'",
                                                fontStyle: "italic",
                                                paddingLeft: 8,
                                                borderLeft: `1px solid ${era.color}15`,
                                                marginTop: 3,
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
            </div>
        </div>
    );
}
