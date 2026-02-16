// ═══════════════════════════════════════════════════════════
// STORYBOARD PAGE — The Spark Moments
// Key interactions that changed Mississippi's ontology
// Generative AI storyboards with image + text creation
// ═══════════════════════════════════════════════════════════

import { useState, useCallback, useRef, useEffect } from "react";
import { STORYBOARDS, STORYBOARDS_BY_ERA } from "../data/storyboards";
import { ERA_MAP } from "../data/eras";
import { GENERATED_ART } from "../data/generated-art";

const GEMINI_KEY = localStorage.getItem("gemini_key") || "";
const GEMINI_IMAGE_MODELS = [
  "gemini-2.5-flash-image",
  "gemini-2.0-flash-exp-image-generation",
];
const GEMINI_TEXT_MODEL = "gemini-2.0-flash";

// ── Gemini Image Gen ──
async function geminiImage(prompt) {
  for (const model of GEMINI_IMAGE_MODELS) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
          }),
        }
      );
      if (!res.ok) continue;
      const data = await res.json();
      const parts = data.candidates?.[0]?.content?.parts || [];
      const img = parts.find((p) => p.inlineData);
      if (img) return `data:${img.inlineData.mimeType};base64,${img.inlineData.data}`;
    } catch (e) { continue; }
  }
  return null;
}

// ── Gemini Text Gen ──
async function geminiText(prompt) {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TEXT_MODEL}:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        }),
      }
    );
    if (!res.ok) return "Generation failed";
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
  } catch (e) {
    return `Error: ${e.message}`;
  }
}

// ── Seeded Random for Canvas ──
function makeSr(seed) { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }

// ── Mini Canvas for storyboard panels ──
function PanelCanvas({ seed, color, w, h }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d"), dpr = window.devicePixelRatio || 1;
    c.width = w * dpr; c.height = h * dpr; ctx.scale(dpr, dpr);
    const r = makeSr(seed);
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "#0a0804"); bg.addColorStop(1, "#0d0a06");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    // Dramatic scene composition — diagonal energy
    for (let i = 0; i < 120; i++) {
      const x1 = r() * w, y1 = r() * h;
      const angle = Math.PI * 0.3 + r() * 0.4;
      const len = 20 + r() * 80;
      ctx.beginPath(); ctx.moveTo(x1, y1);
      ctx.lineTo(x1 + Math.cos(angle) * len, y1 + Math.sin(angle) * len);
      ctx.strokeStyle = color + (r() > 0.7 ? "20" : "0a");
      ctx.lineWidth = 0.5 + r() * 2; ctx.stroke();
    }
    // Focal glow
    const cx = w * (0.3 + r() * 0.4), cy = h * (0.3 + r() * 0.4);
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 60 + r() * 40);
    glow.addColorStop(0, color + "25"); glow.addColorStop(1, "transparent");
    ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);
    // Grain
    const id = ctx.getImageData(0, 0, c.width, c.height), d = id.data;
    for (let i = 0; i < d.length; i += 4) { const n = (r() - 0.5) * 6; d[i] += n; d[i+1] += n; d[i+2] += n; }
    ctx.putImageData(id, 0, 0);
  }, [seed, color, w, h]);
  return <canvas ref={ref} style={{ width: w, height: h, borderRadius: 4, display: "block" }} />;
}

// ── Gallery Storage ──
function saveToGallery(item) {
  try {
    const gallery = JSON.parse(localStorage.getItem("ontological-theatre-gallery") || "[]");
    gallery.unshift(item);
    localStorage.setItem("ontological-theatre-gallery", JSON.stringify(gallery));
  } catch (e) { /* localStorage full or unavailable */ }
}

export default function StoryboardPage() {
  const [selEra, setSelEra] = useState(null);
  const [selStory, setSelStory] = useState(null);
  const [genImages, setGenImages] = useState({});
  const [genTexts, setGenTexts] = useState({});
  const [busyImg, setBusyImg] = useState({});
  const [busyTxt, setBusyTxt] = useState({});
  const [expandedPanel, setExpandedPanel] = useState(null);

  const story = selStory ? STORYBOARDS.find((s) => s.id === selStory) : null;
  const era = story ? ERA_MAP[story.era] : null;
  const eraColor = era?.color || era?.accent || "#D4A04A";

  const allEras = [...new Set(STORYBOARDS.map((s) => s.era))];

  const doGenImage = useCallback(async (storyId, panelIdx, prompt) => {
    const key = `${storyId}-${panelIdx}`;
    setBusyImg((p) => ({ ...p, [key]: true }));
    const url = await geminiImage(prompt);
    if (url) {
      setGenImages((p) => ({ ...p, [key]: url }));
      saveToGallery({
        id: crypto.randomUUID(), type: "image",
        content: { imageUrl: url },
        context: { storyboard: storyId, panel: panelIdx },
        model: "gemini-2.0-flash", prompt,
        timestamp: Date.now(), title: `Storyboard: ${STORYBOARDS.find(s=>s.id===storyId)?.title} — Panel ${panelIdx+1}`,
      });
    }
    setBusyImg((p) => ({ ...p, [key]: false }));
  }, []);

  const doGenSceneText = useCallback(async (storyId) => {
    const s = STORYBOARDS.find((sb) => sb.id === storyId);
    if (!s) return;
    setBusyTxt((p) => ({ ...p, [storyId]: true }));
    const text = await geminiText(s.textPrompt);
    setGenTexts((p) => ({ ...p, [storyId]: text }));
    saveToGallery({
      id: crypto.randomUUID(), type: "prose",
      content: { text },
      context: { storyboard: storyId, era: s.era, bridge: s.bridge, pathy: s.pathy },
      model: "gemini-2.0-flash", prompt: s.textPrompt,
      timestamp: Date.now(), title: `Scene: ${s.title}`,
    });
    setBusyTxt((p) => ({ ...p, [storyId]: false }));
  }, []);

  const doGenFullImage = useCallback(async (storyId) => {
    const s = STORYBOARDS.find((sb) => sb.id === storyId);
    if (!s) return;
    const key = `${storyId}-full`;
    setBusyImg((p) => ({ ...p, [key]: true }));
    const url = await geminiImage(s.imagePrompt);
    if (url) {
      setGenImages((p) => ({ ...p, [key]: url }));
      saveToGallery({
        id: crypto.randomUUID(), type: "image",
        content: { imageUrl: url },
        context: { storyboard: storyId, era: s.era },
        model: "gemini-2.0-flash", prompt: s.imagePrompt,
        timestamp: Date.now(), title: `${s.title} — Hero Image`,
      });
    }
    setBusyImg((p) => ({ ...p, [key]: false }));
  }, []);

  // ── OVERVIEW ──
  if (!selStory) {
    return (
      <div className="fade-in">
        <div className="epigraph" style={{ marginBottom: 24 }}>
          History is not what happened.<br />
          History is what someone decided to do next.<br />
          <span style={{ fontSize: 9, color: "var(--delta-text-ghost)" }}>— These are the moments of decision</span>
        </div>

        {/* Era filter */}
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 20 }}>
          <button className={`nav-tab ${!selEra ? "active" : ""}`} onClick={() => setSelEra(null)} style={{ fontSize: 10 }}>All Eras</button>
          {allEras.map((eId) => {
            const e = ERA_MAP[eId];
            return e ? (
              <button key={eId} className={`nav-tab ${selEra === eId ? "active" : ""}`}
                onClick={() => setSelEra(eId)} style={{ fontSize: 10, borderColor: e.color + "40" }}>
                {e.name}
              </button>
            ) : null;
          })}
        </div>

        {/* Storyboard cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340, 1fr))", gap: 14 }}>
          {STORYBOARDS.filter((s) => !selEra || s.era === selEra).map((s) => {
            const e = ERA_MAP[s.era];
            const c = e?.color || "#D4A04A";
            return (
              <div key={s.id} onClick={() => setSelStory(s.id)}
                style={{
                  background: `${c}08`, border: `1px solid ${c}20`, borderRadius: 8,
                  padding: "16px 18px", cursor: "pointer", transition: "all 0.3s",
                }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 6 }}>
                  <div style={{ fontSize: 7, letterSpacing: 3, color: c }}>{e?.name?.toUpperCase() || s.era.toUpperCase()}</div>
                  <div style={{ fontSize: 9, color: "var(--delta-text-ghost)" }}>{s.year}</div>
                </div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 16, fontStyle: "italic", color: "var(--delta-text)", marginBottom: 6 }}>{s.title}</div>
                <div style={{ fontSize: 10, color: "var(--delta-text-muted)", lineHeight: 1.5, marginBottom: 8 }}>{s.interaction.substring(0, 150)}...</div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {s.characters.map((ch, i) => (
                    <span key={i} style={{ fontSize: 7, padding: "2px 5px", borderRadius: 3, border: `1px solid ${c}20`, color: "var(--delta-text-muted)" }}>{ch}</span>
                  ))}
                  <span style={{ fontSize: 7, padding: "2px 5px", borderRadius: 3, background: `${c}15`, color: c }}>{s.bridge}</span>
                  <span style={{ fontSize: 7, padding: "2px 5px", borderRadius: 3, background: `${c}10`, color: c, fontStyle: "italic" }}>{s.pathy}</span>
                </div>
                <div style={{ fontSize: 8, color: "var(--delta-text-ghost)", marginTop: 6 }}>{s.storyboardPanels.length} panels</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── SINGLE STORYBOARD ──
  const fullImgKey = `${story.id}-full`;
  
  // Check for pre-generated art
  const pregenArt = GENERATED_ART[story.id];
  const showPregenImage = !genImages[fullImgKey] && pregenArt?.image;
  const showPregenText = !genTexts[story.id] && pregenArt?.text;

  return (
    <div className="fade-in">
      {/* Back */}
      <button onClick={() => { setSelStory(null); setExpandedPanel(null); }}
        style={{ background: "none", border: "none", color: eraColor, fontSize: 11, cursor: "pointer", marginBottom: 12, fontStyle: "italic" }}>
        ← All Storyboards
      </button>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 7, letterSpacing: 5, color: eraColor }}>{era?.name?.toUpperCase()} · {story.year}</div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 400, fontStyle: "italic", color: "var(--delta-text)", margin: "4px 0" }}>{story.title}</h2>
        <div style={{ fontSize: 10, color: "var(--delta-text-ghost)" }}>{story.location}</div>
      </div>

      {/* Characters + Context */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        <div style={{ background: `${eraColor}06`, border: `1px solid ${eraColor}12`, borderRadius: 8, padding: 14 }}>
          <div style={{ fontSize: 7, letterSpacing: 3, color: eraColor, marginBottom: 6 }}>CHARACTERS</div>
          {story.characters.map((ch, i) => (
            <div key={i} style={{ fontSize: 11, color: "var(--delta-text)", fontFamily: "var(--font-display)", fontStyle: "italic", marginBottom: 2 }}>{ch}</div>
          ))}
          <div style={{ marginTop: 10, display: "flex", gap: 6 }}>
            <div style={{ padding: "3px 8px", borderRadius: 4, background: `${eraColor}15`, fontSize: 9, color: eraColor }}>{story.bridge}</div>
            <div style={{ padding: "3px 8px", borderRadius: 4, background: `${eraColor}10`, fontSize: 9, color: eraColor, fontStyle: "italic" }}>{story.pathy}</div>
          </div>
        </div>
        <div style={{ background: "rgba(0,0,0,0.15)", border: "1px solid rgba(139,115,85,0.08)", borderRadius: 8, padding: 14 }}>
          <div style={{ fontSize: 7, letterSpacing: 3, color: "var(--delta-text-ghost)", marginBottom: 6 }}>THE INTERACTION</div>
          <div style={{ fontSize: 11, color: "var(--delta-text-muted)", lineHeight: 1.6 }}>{story.interaction}</div>
        </div>
      </div>

      {/* Before / Spark / After */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr 1fr", gap: 10, marginBottom: 20 }}>
        {[
          { label: "BEFORE", text: story.before, bg: "rgba(139,115,85,0.04)" },
          { label: "THE SPARK", text: story.spark, bg: `${eraColor}08` },
          { label: "AFTER", text: story.after, bg: "rgba(139,115,85,0.04)" },
        ].map(({ label, text, bg }) => (
          <div key={label} style={{ background: bg, border: `1px solid ${eraColor}10`, borderRadius: 6, padding: "10px 12px" }}>
            <div style={{ fontSize: 7, letterSpacing: 3, color: label === "THE SPARK" ? eraColor : "var(--delta-text-ghost)", marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 10, color: "var(--delta-text-muted)", lineHeight: 1.5 }}>{text}</div>
          </div>
        ))}
      </div>

      {/* Hero Image Generation */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontSize: 8, letterSpacing: 3, color: eraColor }}>HERO IMAGE</div>
          <button onClick={() => doGenFullImage(story.id)} disabled={busyImg[fullImgKey]}
            style={{ padding: "6px 14px", background: busyImg[fullImgKey] ? "rgba(139,115,85,0.08)" : `linear-gradient(135deg,${eraColor}40,${eraColor}20)`, border: `1px solid ${eraColor}25`, borderRadius: 5, color: "var(--delta-text)", fontSize: 10, fontStyle: "italic", cursor: busyImg[fullImgKey] ? "wait" : "pointer" }}>
            {busyImg[fullImgKey] ? "Generating..." : (genImages[fullImgKey] || showPregenImage ? "Regenerate" : "Generate Hero Image")}
          </button>
        </div>
        {(genImages[fullImgKey] || showPregenImage) ? (
          <div style={{ background: "rgba(0,0,0,0.3)", border: `1px solid ${eraColor}15`, borderRadius: 8, padding: 6, marginBottom: 8 }}>
            <img src={genImages[fullImgKey] || pregenArt.image} alt="" style={{ width: "100%", borderRadius: 6, display: "block" }} />
            <div style={{ fontSize: 7, color: "var(--delta-text-ghost)", padding: "6px 6px 4px", letterSpacing: 1 }}>
              GEMINI · {story.title} · {era?.name} {!genImages[fullImgKey] && showPregenImage ? " · PRE-GENERATED" : ""}
            </div>
          </div>
        ) : (
          <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 8, overflow: "hidden" }}>
            <PanelCanvas seed={story.id.length * 1000 + 42} color={eraColor} w={800} h={350} />
          </div>
        )}
      </div>

      {/* Scene Text Generation */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontSize: 8, letterSpacing: 3, color: eraColor }}>SCENE · GEMINI</div>
          <button onClick={() => doGenSceneText(story.id)} disabled={busyTxt[story.id]}
            style={{ padding: "6px 14px", background: busyTxt[story.id] ? "rgba(139,115,85,0.08)" : `linear-gradient(135deg,${eraColor}40,${eraColor}20)`, border: `1px solid ${eraColor}25`, borderRadius: 5, color: "var(--delta-text)", fontSize: 10, fontStyle: "italic", cursor: busyTxt[story.id] ? "wait" : "pointer" }}>
            {busyTxt[story.id] ? "Writing..." : (genTexts[story.id] || showPregenText ? "Regenerate" : "Generate Scene")}
          </button>
        </div>
        {(genTexts[story.id] || showPregenText) && (
          <div style={{ background: `${eraColor}05`, border: `1px solid ${eraColor}12`, borderRadius: 8, padding: "18px 22px" }}>
            <div style={{ fontFamily: "var(--font-body)", fontSize: 13, lineHeight: 1.9, color: "var(--delta-text)", whiteSpace: "pre-wrap", fontStyle: "italic" }}>
              {genTexts[story.id] || pregenArt?.text}
            </div>
            <div style={{ marginTop: 10, fontSize: 7, color: "var(--delta-text-ghost)", letterSpacing: 2 }}>
              GEMINI · {story.bridge} · {story.pathy} {!genTexts[story.id] && showPregenText ? " · PRE-GENERATED" : ""}
            </div>
          </div>
        )}
      </div>

      {/* Storyboard Panels */}
      <div style={{ fontSize: 8, letterSpacing: 3, color: eraColor, marginBottom: 10 }}>STORYBOARD PANELS</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10, marginBottom: 20 }}>
        {story.storyboardPanels.map((p, i) => {
          const imgKey = `${story.id}-${i}`;
          return (
            <div key={i} style={{
              background: expandedPanel === i ? `${eraColor}10` : "rgba(0,0,0,0.15)",
              border: `1px solid ${expandedPanel === i ? eraColor + "30" : "rgba(139,115,85,0.08)"}`,
              borderRadius: 8, overflow: "hidden", cursor: "pointer",
            }} onClick={() => setExpandedPanel(expandedPanel === i ? null : i)}>
              
              {/* Panel image or canvas */}
              {genImages[imgKey] ? (
                <img src={genImages[imgKey]} alt="" style={{ width: "100%", display: "block", borderRadius: "8px 8px 0 0" }} />
              ) : (
                <PanelCanvas seed={story.id.length * 100 + i * 37 + 7} color={eraColor} w={340} h={180} />
              )}

              <div style={{ padding: "10px 12px" }}>
                <div style={{ fontSize: 7, letterSpacing: 2, color: eraColor, marginBottom: 3 }}>PANEL {i + 1} · {p.shot}</div>
                <div style={{ fontSize: 10, color: "var(--delta-text-muted)", lineHeight: 1.4, marginBottom: 6 }}>{p.desc}</div>

                {expandedPanel === i && (
                  <div style={{ marginTop: 6 }}>
                    <button onClick={(e) => { e.stopPropagation(); doGenImage(story.id, i, `${story.imagePrompt.replace("No text.", "")} Specific framing: ${p.shot}. Scene: ${p.desc}. No text.`); }}
                      disabled={busyImg[imgKey]}
                      style={{ padding: "5px 12px", background: `${eraColor}20`, border: `1px solid ${eraColor}20`, borderRadius: 4, color: "var(--delta-text)", fontSize: 9, fontStyle: "italic", cursor: busyImg[imgKey] ? "wait" : "pointer" }}>
                      {busyImg[imgKey] ? "Rendering..." : "Generate Panel Image"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Artifact */}
      <div style={{ background: `${eraColor}06`, border: `1px solid ${eraColor}15`, borderRadius: 8, padding: "12px 16px", marginBottom: 16 }}>
        <div style={{ fontSize: 7, letterSpacing: 3, color: eraColor, marginBottom: 4 }}>KEY ARTIFACT</div>
        <div style={{ fontSize: 12, color: "var(--delta-text)", fontFamily: "var(--font-display)", fontStyle: "italic" }}>{story.artifact}</div>
      </div>
    </div>
  );
}
