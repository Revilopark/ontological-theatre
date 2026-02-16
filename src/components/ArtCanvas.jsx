// ═══════════════════════════════════════════════════════════
// ART CANVAS — Era-specific generative art
// Ported from v3, adapted for React component architecture
// Each era has unique visual algorithms
// ═══════════════════════════════════════════════════════════

import { useRef, useEffect } from "react";

// Seeded random number generator
function makeSr(seed) {
    let s = seed;
    return () => {
        s = (s * 16807) % 2147483647;
        return (s - 1) / 2147483646;
    };
}

export default function ArtCanvas({ seed, entropy, palette, eraId, width = 680, height = 420 }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        const dpr = window.devicePixelRatio || 1;

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        const r = makeSr(seed);
        const pc = () => palette[Math.floor(r() * palette.length)];

        // Background gradient
        const bg = ctx.createLinearGradient(0, 0, 0, height);
        bg.addColorStop(0, "#0a0804");
        bg.addColorStop(1, "#0d0a06");
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, width, height);

        // Era-specific algorithms
        if (eraId === "mound") {
            // Mound era: earthen mounds + star patterns
            for (let i = 0; i < 5; i++) {
                const mx = r() * width;
                const mw = 60 + r() * 120;
                const mh = 40 + r() * 80;
                const g = ctx.createRadialGradient(mx, height, 0, mx, height - mh, mw);
                g.addColorStop(0, pc() + "20");
                g.addColorStop(1, "transparent");
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.ellipse(mx, height, mw, mh, 0, Math.PI, 0);
                ctx.fill();
            }
            // Stars
            for (let i = 0; i < 80; i++) {
                ctx.fillStyle = "#F5F0E8" + (r() > 0.8 ? "30" : "10");
                ctx.beginPath();
                ctx.arc(r() * width, r() * height * 0.5, 0.5 + r() * 2, 0, Math.PI * 2);
                ctx.fill();
            }
            // Cosmogram
            const cx = width / 2;
            const cy = height * 0.3;
            for (let i = 0; i < 8; i++) {
                const a = (i / 8) * Math.PI * 2;
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                for (let s = 0; s < 12; s++) {
                    ctx.lineTo(
                        cx + Math.cos(a + Math.sin(s) * 0.2) * s * 18,
                        cy + Math.sin(a + Math.cos(s) * 0.2) * s * 18
                    );
                }
                ctx.strokeStyle = pc() + "14";
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }
        } else if (eraId === "nations") {
            // Nations era: two cultures colliding
            for (let i = 0; i < 200; i++) {
                const side = r() > 0.5;
                ctx.fillStyle = (side ? palette[0] : palette[2]) + "12";
                ctx.beginPath();
                ctx.arc(
                    side ? width * 0.5 + r() * width * 0.5 : r() * width * 0.5,
                    r() * height,
                    3 + r() * 12,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
            }
            // Contact zone
            const g = ctx.createLinearGradient(width * 0.4, 0, width * 0.6, 0);
            g.addColorStop(0, palette[0] + "15");
            g.addColorStop(0.5, "#F5F0E820");
            g.addColorStop(1, palette[2] + "15");
            ctx.fillStyle = g;
            ctx.fillRect(width * 0.4, 0, width * 0.2, height);
        } else if (eraId === "removal") {
            // Removal era: forced paths, trauma
            for (let i = 0; i < 300; i++) {
                let x = r() * width * 0.2;
                let y = height * 0.3 + r() * height * 0.4;
                ctx.beginPath();
                ctx.moveTo(x, y);
                for (let s = 0; s < 50; s++) {
                    x += 2 + r() * 4;
                    y += (r() - 0.5) * 6;
                    ctx.lineTo(x, y);
                }
                ctx.strokeStyle = pc() + "08";
                ctx.lineWidth = 0.5 + r();
                ctx.stroke();
            }
            // Blood spots
            for (let i = 0; i < 15; i++) {
                const g = ctx.createRadialGradient(
                    r() * width,
                    r() * height,
                    0,
                    r() * width,
                    r() * height,
                    20 + r() * 40
                );
                g.addColorStop(0, palette[1] + "15");
                g.addColorStop(1, "transparent");
                ctx.fillStyle = g;
                ctx.fillRect(0, 0, width, height);
            }
        } else if (eraId === "delta") {
            // Delta blues era: flow fields, river motion
            const res = 14;
            const cols = Math.ceil(width / res);
            const rows = Math.ceil(height / res);
            const field = [];
            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < cols; x++) {
                    const nx = x * 0.05 + seed * 0.001;
                    const ny = y * 0.05;
                    field.push((Math.sin(nx * 3 + ny * 2) + Math.cos(nx - ny * 4)) * Math.PI * entropy);
                }
            }
            for (let i = 0; i < 400; i++) {
                let px = r() * width;
                let py = r() * height;
                ctx.beginPath();
                ctx.moveTo(px, py);
                for (let s = 0; s < 40; s++) {
                    const col = Math.floor(px / res);
                    const row = Math.floor(py / res);
                    if (col >= 0 && col < cols && row >= 0 && row < rows) {
                        const a = field[row * cols + col];
                        px += Math.cos(a) * 1.5;
                        py += Math.sin(a) * 1.5;
                        ctx.lineTo(px, py);
                    } else break;
                }
                ctx.strokeStyle = pc() + "0a";
                ctx.lineWidth = 0.5 + r();
                ctx.stroke();
            }
        } else if (eraId === "electric") {
            // Electric era: amplified waves radiating from center
            const cx = width / 2;
            const cy = height / 2;
            for (let i = 0; i < 200; i++) {
                const a = r() * Math.PI * 2;
                const d = 20 + r() * Math.max(width, height) * 0.6;
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                const steps = 20 + r() * 30;
                for (let s = 0; s < steps; s++) {
                    const sd = (d * s) / steps;
                    const wave = Math.sin(s * 0.8 + r() * 3) * 8 * entropy;
                    ctx.lineTo(cx + Math.cos(a) * sd + wave, cy + Math.sin(a) * sd + wave);
                }
                ctx.strokeStyle = pc() + "0a";
                ctx.lineWidth = 0.5 + r() * 1.5;
                ctx.stroke();
            }
            // Electric glow
            const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 60);
            glow.addColorStop(0, palette[0] + "30");
            glow.addColorStop(1, "transparent");
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(cx, cy, 60, 0, Math.PI * 2);
            ctx.fill();
        } else if (eraId === "reckoning") {
            // Reckoning era: fractured, sharp angles, tension
            for (let i = 0; i < 150; i++) {
                const x1 = r() * width;
                const y1 = r() * height;
                const x2 = x1 + (r() - 0.5) * 100;
                const y2 = y1 + (r() - 0.5) * 100;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.strokeStyle = pc() + (entropy > 0.5 ? "15" : "0a");
                ctx.lineWidth = 0.5 + r() * 2;
                ctx.stroke();
            }
            // Blood spots
            for (let i = 0; i < 10; i++) {
                const g = ctx.createRadialGradient(
                    r() * width,
                    r() * height,
                    0,
                    r() * width,
                    r() * height,
                    10 + r() * 30
                );
                g.addColorStop(0, "#8B000020");
                g.addColorStop(1, "transparent");
                ctx.fillStyle = g;
                ctx.fillRect(0, 0, width, height);
            }
        } else if (eraId === "writers") {
            // Writers era: layered text-like horizontal lines, bookish
            for (let i = 0; i < 400; i++) {
                const y = r() * height;
                const x = r() * width * 0.3;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + 50 + r() * 200, y + (r() - 0.5) * 2);
                ctx.strokeStyle = pc() + "08";
                ctx.lineWidth = 0.5 + r();
                ctx.stroke();
            }
            // Page edges
            for (let i = 0; i < 5; i++) {
                const px = width * (0.2 + r() * 0.6);
                ctx.beginPath();
                ctx.moveTo(px, 0);
                ctx.lineTo(px, height);
                ctx.strokeStyle = palette[0] + "06";
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }
        } else if (eraId === "now") {
            // Now era: digital noise + organic flow — the collision of old and new
            const res = 12;
            const cols = Math.ceil(width / res);
            const rows = Math.ceil(height / res);
            const field = [];
            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < cols; x++) {
                    const nx = x * 0.04 + seed * 0.001;
                    const ny = y * 0.04;
                    field.push(
                        (Math.sin(nx * 4 + ny * 3) + Math.cos(nx * 1.5 - ny * 2.5)) * Math.PI * entropy
                    );
                }
            }
            for (let i = 0; i < 300; i++) {
                let px = r() * width;
                let py = r() * height;
                ctx.beginPath();
                ctx.moveTo(px, py);
                for (let s = 0; s < 35; s++) {
                    const col = Math.floor(px / res);
                    const row = Math.floor(py / res);
                    if (col >= 0 && col < cols && row >= 0 && row < rows) {
                        const a = field[row * cols + col];
                        px += Math.cos(a) * 1.5;
                        py += Math.sin(a) * 1.5;
                        ctx.lineTo(px, py);
                    } else break;
                }
                ctx.strokeStyle = pc() + "0c";
                ctx.lineWidth = 0.5 + r() * 1.5;
                ctx.stroke();
            }
            // Digital glitch rectangles
            for (let i = 0; i < 20; i++) {
                ctx.fillStyle = pc() + "08";
                ctx.fillRect(r() * width, r() * height, r() * 40 + 5, r() * 3 + 1);
            }
        }

        // Grain overlay for all eras
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const noise = (r() - 0.5) * 8;
            data[i] += noise;
            data[i + 1] += noise;
            data[i + 2] += noise;
        }
        ctx.putImageData(imageData, 0, 0);
    }, [seed, entropy, palette, eraId, width, height]);

    return (
        <canvas
            ref={canvasRef}
            style={{
                width: width,
                height: height,
                borderRadius: 6,
                display: "block",
            }}
        />
    );
}
