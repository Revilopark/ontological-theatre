// ═══════════════════════════════════════════════════════════
// GALLERY PAGE — Living memory of generated works
// LocalStorage persistence, filtering, export
// ═══════════════════════════════════════════════════════════

import { useState, useEffect, useMemo } from "react";
import { ERAS } from "../data/eras";

const STORAGE_KEY = "ontological-theatre-gallery";

export default function GalleryPage() {
    const [items, setItems] = useState([]);
    const [filterEra, setFilterEra] = useState("all");
    const [filterType, setFilterType] = useState("all");
    const [editingId, setEditingId] = useState(null);
    const [editTitle, setEditTitle] = useState("");

    // Load from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setItems(Array.isArray(parsed) ? parsed : []);
            } catch (e) {
                console.error("Failed to parse gallery:", e);
                setItems([]);
            }
        }
    }, []);

    // Save to localStorage whenever items change
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }, [items]);

    // Filter items
    const filtered = useMemo(() => {
        return items.filter((item) => {
            if (filterEra !== "all" && item.context?.era !== filterEra) return false;
            if (filterType !== "all" && item.type !== filterType) return false;
            return true;
        });
    }, [items, filterEra, filterType]);

    // Delete item
    const deleteItem = (id) => {
        if (confirm("Delete this work? This cannot be undone.")) {
            setItems((prev) => prev.filter((item) => item.id !== id));
        }
    };

    // Toggle favorite
    const toggleFavorite = (id) => {
        setItems((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, favorited: !item.favorited } : item
            )
        );
    };

    // Start editing title
    const startEditTitle = (item) => {
        setEditingId(item.id);
        setEditTitle(item.title || "");
    };

    // Save edited title
    const saveTitle = () => {
        if (editingId) {
            setItems((prev) =>
                prev.map((item) =>
                    item.id === editingId ? { ...item, title: editTitle } : item
                )
            );
            setEditingId(null);
            setEditTitle("");
        }
    };

    // Export all as JSON
    const exportAll = () => {
        const dataStr = JSON.stringify(items, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `ontological-theatre-gallery-${Date.now()}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    // Get era object
    const getEra = (eraName) => ERAS.find((e) => e.name === eraName) || ERAS[0];

    // Sort by timestamp (newest first)
    const sorted = useMemo(() => {
        return [...filtered].sort((a, b) => b.timestamp - a.timestamp);
    }, [filtered]);

    return (
        <div className="fade-in" style={{ maxWidth: 1400, margin: "0 auto" }}>
            {/* Header */}
            <div style={{ marginBottom: 20 }}>
                <h2
                    style={{
                        fontFamily: "'Playfair Display'",
                        fontSize: 28,
                        fontWeight: 400,
                        fontStyle: "italic",
                        color: "#d4c8a8",
                        margin: "0 0 6px",
                    }}
                >
                    The Gallery
                </h2>
                <p
                    style={{
                        fontSize: 12,
                        color: "#8a7e68",
                        lineHeight: 1.7,
                        maxWidth: 750,
                        margin: "0 0 8px",
                    }}
                >
                    Memory of works generated across eight eras. The art leaves but the soil
                    remembers.
                </p>
                <div
                    style={{
                        fontSize: 10,
                        color: "#6a5e48",
                        display: "flex",
                        gap: 20,
                        alignItems: "center",
                    }}
                >
                    <span>
                        <strong style={{ color: "#d4c8a8" }}>{items.length}</strong> total works
                    </span>
                    <span>
                        <strong style={{ color: "#d4c8a8" }}>{sorted.length}</strong> displayed
                    </span>
                    <button
                        onClick={exportAll}
                        disabled={items.length === 0}
                        style={{
                            padding: "4px 12px",
                            background: "rgba(212,160,74,0.1)",
                            border: "1px solid rgba(212,160,74,0.2)",
                            borderRadius: 4,
                            color: "#d4c8a8",
                            fontSize: 9,
                            letterSpacing: 2,
                            cursor: items.length > 0 ? "pointer" : "not-allowed",
                            opacity: items.length > 0 ? 1 : 0.5,
                        }}
                    >
                        EXPORT JSON
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div
                style={{
                    display: "flex",
                    gap: 12,
                    marginBottom: 20,
                    flexWrap: "wrap",
                    alignItems: "center",
                }}
            >
                <div style={{ flex: 1, minWidth: 200 }}>
                    <label
                        style={{
                            fontSize: 7,
                            color: "#5a5040",
                            letterSpacing: 2,
                            display: "block",
                            marginBottom: 4,
                        }}
                    >
                        FILTER BY ERA
                    </label>
                    <select
                        value={filterEra}
                        onChange={(e) => setFilterEra(e.target.value)}
                        style={{
                            background: "rgba(139,115,85,0.08)",
                            border: "1px solid rgba(139,115,85,0.12)",
                            borderRadius: 5,
                            color: "#d4c8a8",
                            padding: "6px 10px",
                            fontSize: 11,
                            fontFamily: "Georgia",
                            width: "100%",
                            appearance: "none",
                            cursor: "pointer",
                        }}
                    >
                        <option value="all">All Eras</option>
                        {ERAS.map((era) => (
                            <option key={era.id} value={era.name}>
                                {era.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div style={{ flex: 1, minWidth: 200 }}>
                    <label
                        style={{
                            fontSize: 7,
                            color: "#5a5040",
                            letterSpacing: 2,
                            display: "block",
                            marginBottom: 4,
                        }}
                    >
                        FILTER BY TYPE
                    </label>
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        style={{
                            background: "rgba(139,115,85,0.08)",
                            border: "1px solid rgba(139,115,85,0.12)",
                            borderRadius: 5,
                            color: "#d4c8a8",
                            padding: "6px 10px",
                            fontSize: 11,
                            fontFamily: "Georgia",
                            width: "100%",
                            appearance: "none",
                            cursor: "pointer",
                        }}
                    >
                        <option value="all">All Types</option>
                        <option value="image">Images</option>
                        <option value="poem">Poems</option>
                        <option value="song">Songs</option>
                        <option value="prose">Prose</option>
                        <option value="spoken">Spoken Word</option>
                    </select>
                </div>
            </div>

            {/* Empty state */}
            {sorted.length === 0 && (
                <div
                    style={{
                        textAlign: "center",
                        padding: "60px 20px",
                        color: "#5a5040",
                        fontStyle: "italic",
                    }}
                >
                    {items.length === 0 ? (
                        <>
                            <div style={{ fontSize: 14, marginBottom: 8 }}>Gallery is empty</div>
                            <div style={{ fontSize: 11 }}>
                                Generate images or text in the Media Studio to begin
                            </div>
                        </>
                    ) : (
                        <>
                            <div style={{ fontSize: 14, marginBottom: 8 }}>No works match filters</div>
                            <div style={{ fontSize: 11 }}>Try adjusting era or type filters</div>
                        </>
                    )}
                </div>
            )}

            {/* Gallery grid */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                    gap: 18,
                    marginBottom: 40,
                }}
            >
                {sorted.map((item) => {
                    const era = getEra(item.context?.era);
                    const isImage = item.type === "image";
                    const isEditing = editingId === item.id;

                    return (
                        <div
                            key={item.id}
                            style={{
                                background: `${era.color}05`,
                                border: `1px solid ${era.color}12`,
                                borderRadius: 8,
                                overflow: "hidden",
                                display: "flex",
                                flexDirection: "column",
                                transition: "all 0.3s",
                            }}
                        >
                            {/* Image */}
                            {isImage && item.content?.imageUrl && (
                                <img
                                    src={item.content.imageUrl}
                                    alt={item.title || "Generated image"}
                                    style={{
                                        width: "100%",
                                        display: "block",
                                        aspectRatio: "16/9",
                                        objectFit: "cover",
                                    }}
                                />
                            )}

                            {/* Text content */}
                            {!isImage && item.content?.text && (
                                <div
                                    style={{
                                        padding: "16px 18px",
                                        fontFamily: "'EB Garamond'",
                                        fontSize: 12,
                                        lineHeight: 1.8,
                                        color: "#d4c8a8",
                                        fontStyle: "italic",
                                        maxHeight: 240,
                                        overflow: "auto",
                                        whiteSpace: "pre-wrap",
                                    }}
                                >
                                    {item.content.text.substring(0, 600)}
                                    {item.content.text.length > 600 && "..."}
                                </div>
                            )}

                            {/* Metadata */}
                            <div style={{ padding: "12px 14px", flex: 1 }}>
                                {/* Title */}
                                {isEditing ? (
                                    <div style={{ marginBottom: 8 }}>
                                        <input
                                            type="text"
                                            value={editTitle}
                                            onChange={(e) => setEditTitle(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") saveTitle();
                                                if (e.key === "Escape") {
                                                    setEditingId(null);
                                                    setEditTitle("");
                                                }
                                            }}
                                            autoFocus
                                            style={{
                                                width: "100%",
                                                background: "rgba(139,115,85,0.08)",
                                                border: `1px solid ${era.color}25`,
                                                borderRadius: 4,
                                                color: "#d4c8a8",
                                                padding: "6px 8px",
                                                fontSize: 13,
                                                fontFamily: "'Playfair Display'",
                                                fontStyle: "italic",
                                            }}
                                        />
                                        <div
                                            style={{
                                                marginTop: 4,
                                                display: "flex",
                                                gap: 6,
                                                fontSize: 9,
                                            }}
                                        >
                                            <button
                                                onClick={saveTitle}
                                                style={{
                                                    padding: "3px 8px",
                                                    background: `${era.color}15`,
                                                    border: `1px solid ${era.color}20`,
                                                    borderRadius: 3,
                                                    color: "#d4c8a8",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setEditingId(null);
                                                    setEditTitle("");
                                                }}
                                                style={{
                                                    padding: "3px 8px",
                                                    background: "rgba(139,115,85,0.08)",
                                                    border: "1px solid rgba(139,115,85,0.12)",
                                                    borderRadius: 3,
                                                    color: "#8a7e68",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        style={{
                                            fontSize: 13,
                                            color: "#d4c8a8",
                                            fontFamily: "'Playfair Display'",
                                            fontStyle: "italic",
                                            marginBottom: 8,
                                            cursor: "pointer",
                                        }}
                                        onClick={() => startEditTitle(item)}
                                        title="Click to edit title"
                                    >
                                        {item.title || `Untitled ${item.type}`}
                                        {item.favorited && (
                                            <span
                                                style={{
                                                    marginLeft: 6,
                                                    color: "#D4A04A",
                                                    fontSize: 14,
                                                }}
                                            >
                                                ★
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Context tags */}
                                <div
                                    style={{
                                        display: "flex",
                                        gap: 4,
                                        flexWrap: "wrap",
                                        marginBottom: 8,
                                        fontSize: 7,
                                        color: "#6a5e48",
                                    }}
                                >
                                    {item.context?.era && (
                                        <span
                                            style={{
                                                padding: "2px 6px",
                                                borderRadius: 3,
                                                border: `1px solid ${era.color}15`,
                                                background: `${era.color}08`,
                                            }}
                                        >
                                            {item.context.era}
                                        </span>
                                    )}
                                    {item.context?.character && (
                                        <span
                                            style={{
                                                padding: "2px 6px",
                                                borderRadius: 3,
                                                border: `1px solid ${era.color}15`,
                                            }}
                                        >
                                            {item.context.character}
                                        </span>
                                    )}
                                    {item.model && (
                                        <span
                                            style={{
                                                padding: "2px 6px",
                                                borderRadius: 3,
                                                border: "1px solid rgba(139,115,85,0.12)",
                                                fontFamily: "'JetBrains Mono', monospace",
                                            }}
                                        >
                                            {item.model}
                                        </span>
                                    )}
                                </div>

                                {/* Additional context */}
                                {item.context && (
                                    <div
                                        style={{
                                            fontSize: 8,
                                            color: "#5a5040",
                                            lineHeight: 1.4,
                                            marginBottom: 8,
                                        }}
                                    >
                                        {item.context.location && (
                                            <div>📍 {item.context.location}</div>
                                        )}
                                        {item.context.phase && (
                                            <div>🌊 {item.context.phase}</div>
                                        )}
                                        {item.context.bridge && item.context.pathy && (
                                            <div>
                                                ⚡ {item.context.bridge} × {item.context.pathy}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Actions */}
                                <div
                                    style={{
                                        display: "flex",
                                        gap: 8,
                                        marginTop: "auto",
                                        paddingTop: 8,
                                        borderTop: `1px solid ${era.color}10`,
                                    }}
                                >
                                    <button
                                        onClick={() => toggleFavorite(item.id)}
                                        style={{
                                            padding: "4px 8px",
                                            background: item.favorited
                                                ? `${era.color}15`
                                                : "rgba(139,115,85,0.08)",
                                            border: item.favorited
                                                ? `1px solid ${era.color}25`
                                                : "1px solid rgba(139,115,85,0.12)",
                                            borderRadius: 3,
                                            color: item.favorited ? "#D4A04A" : "#8a7e68",
                                            fontSize: 12,
                                            cursor: "pointer",
                                        }}
                                    >
                                        {item.favorited ? "★" : "☆"}
                                    </button>
                                    <button
                                        onClick={() => deleteItem(item.id)}
                                        style={{
                                            padding: "4px 8px",
                                            background: "rgba(139,0,0,0.08)",
                                            border: "1px solid rgba(139,0,0,0.2)",
                                            borderRadius: 3,
                                            color: "#C0392B",
                                            fontSize: 9,
                                            letterSpacing: 1,
                                            cursor: "pointer",
                                        }}
                                    >
                                        DELETE
                                    </button>
                                    <div
                                        style={{
                                            marginLeft: "auto",
                                            fontSize: 7,
                                            color: "#3a3020",
                                            alignSelf: "center",
                                        }}
                                    >
                                        {new Date(item.timestamp).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// Helper function to add items to gallery (called from MediaStudioPage)
export function addToGallery(item) {
    const STORAGE_KEY = "ontological-theatre-gallery";
    const stored = localStorage.getItem(STORAGE_KEY);
    const existing = stored ? JSON.parse(stored) : [];
    const newItem = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        ...item,
    };
    existing.push(newItem);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    return newItem;
}
