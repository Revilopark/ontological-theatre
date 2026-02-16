// ═══════════════════════════════════════════════════════════
// API CLIENTS — Text & Image Generation
// Claude for text, Gemini for images + text fallback
// ═══════════════════════════════════════════════════════════

// Gemini model fallback chain for image generation
const GEMINI_IMAGE_MODELS = [
    "gemini-2.5-flash-image-preview",
    "gemini-2.5-flash-image",
    "gemini-2.0-flash-exp-image-generation",
];

// ── Anthropic Claude ──

export async function generateWithClaude(apiKey, systemPrompt, userPrompt) {
    try {
        const headers = {
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01",
            "anthropic-dangerous-direct-browser-access": "true",
        };
        if (apiKey) headers["x-api-key"] = apiKey;

        const res = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers,
            body: JSON.stringify({
                model: "claude-sonnet-4-20250514",
                max_tokens: 1200,
                system: systemPrompt,
                messages: [{ role: "user", content: userPrompt }],
            }),
        });
        if (!res.ok) {
            const err = await res.text();
            return { error: `Claude API ${res.status}: ${err}` };
        }
        const data = await res.json();
        return { text: data.content?.map(b => b.text || "").join("\n") || "No output" };
    } catch (e) {
        return { error: e.message };
    }
}

// ── Google Gemini (Text) ──

export async function geminiText(apiKey, systemPrompt, userPrompt) {
    try {
        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    system_instruction: { parts: [{ text: systemPrompt }] },
                    contents: [{ parts: [{ text: userPrompt }] }],
                    generationConfig: { temperature: 0.9, maxOutputTokens: 1500 },
                }),
            }
        );
        if (!res.ok) {
            const err = await res.text();
            return { error: `Gemini ${res.status}: ${err}` };
        }
        const data = await res.json();
        return {
            text: data.candidates?.[0]?.content?.parts?.[0]?.text || "No output",
        };
    } catch (e) {
        return { error: e.message };
    }
}

// ── Google Gemini (Image) — tries multiple models ──

export async function geminiImage(apiKey, prompt) {
    for (const model of GEMINI_IMAGE_MODELS) {
        try {
            const res = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [
                            {
                                role: "user",
                                parts: [{ text: prompt }],
                            },
                        ],
                        generationConfig: {
                            responseModalities: ["TEXT", "IMAGE"],
                        },
                    }),
                }
            );
            if (!res.ok) continue;
            const data = await res.json();
            if (data.error) continue;
            const parts = data.candidates?.[0]?.content?.parts || [];
            const imgPart = parts.find((p) => p.inlineData);
            if (imgPart) {
                return {
                    imageUrl: `data:${imgPart.inlineData.mimeType};base64,${imgPart.inlineData.data}`,
                    caption: parts.find((p) => p.text)?.text || "",
                };
            }
        } catch (e) {
            continue;
        }
    }
    return { error: "Gemini image generation unavailable (CORS or model limit). Use the algorithmic canvas instead." };
}

// ── Prompt Builders ──

export function buildContext(char, location, phase, bridge, pathy, entropy) {
    return `Character: ${char.name} — ${char.desc}. "${char.flavor}"
Location: ${location}
Flood Phase: ${phase.name} — ${phase.desc}
Bridge (-ity quality): ${bridge}
Dominant -pathy: ${pathy}
World entropy: ${entropy.toFixed(2)} (${
        entropy > 0.7
            ? "the flood is nearly here"
            : entropy > 0.4
                ? "the river is rising, tension builds"
                : "relative calm, but something stirs"
    }).`;
}

export const SYS_BLUES = `You are a Delta blues poet writing in Clarksdale, Mississippi in 1925, before the Great Flood of 1927. You write in the tradition of the Delta oral poets — raw, rhythmic, grounded in the physical landscape of the Mississippi Delta. Your voice carries the weight of cotton fields, the Sunflower River, the crossroads at Highways 61 and 49, juke joints, levees, and the coming flood.

You write within the Dual Ontology framework: every poem operates on two axes:
- The "-ity" axis: qualities of BEING (what something IS — integrity, clarity, resilience, authenticity)
- The "-pathy" axis: modes of FEELING (how beings relate — empathy, sympathy, apathy, antipathy)

Write ONE complete song with:
- A title
- 3-4 verses in AAB blues form
- A repeated chorus (2-3 lines)
- One bridge section

No preamble. Format with [Verse 1], [Chorus], [Bridge] headers. Keep it raw, rhythmic, singable. Write like someone picking cotton by day and playing guitar by night.`;

export const SYS_SPOKEN = `You are a spoken word performer at a juke joint in Clarksdale, Mississippi, 1925. Blues rhythm, preacher cadence, field holler energy.

Write ONE spoken word piece. 15-25 lines. Use repetition, call-and-response patterns, rhythm breaks. Written for the voice, not the page. No preamble.`;
