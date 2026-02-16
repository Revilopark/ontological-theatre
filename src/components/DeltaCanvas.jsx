// ═══════════════════════════════════════════════════════════
// DELTA CANVAS — Multi-style algorithmic art engine
// 5 procedural styles driven by entropy, characters, and flood phase
// ═══════════════════════════════════════════════════════════

import { useRef, useEffect } from "react";
import { makeSRand, hexToRgb } from "../engine/utils";

const STYLES = ["field", "river", "crossroads", "juke", "storm"];

export { STYLES as ART_STYLES };

export default function DeltaCanvas({
    seed = 42,
    entropy = 0.3,
    phase = null,
    palette = ["#D4A04A", "#8B7355", "#6A5ACD"],
    style = "field",
    width = 400,
    height = 300,
    label = "",
}) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        const sr = makeSRand(seed);
        const pc = () => {
            const c = palette[Math.floor(sr() * palette.length)];
            const [r, g, b] = hexToRgb(c);
            return { r, g, b, hex: c };
        };

        // Background gradient
        const bg = ctx.createLinearGradient(0, 0, 0, height);
        const bgDark = Math.floor(20 + entropy * 15);
        bg.addColorStop(0, `rgb(${bgDark}, ${bgDark - 4}, ${bgDark - 8})`);
        bg.addColorStop(1, `rgb(${bgDark - 8}, ${bgDark - 10}, ${bgDark - 5})`);
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, width, height);

        // Style dispatch
        switch (style) {
            case "field":
                drawField(ctx, sr, pc, width, height, entropy);
                break;
            case "river":
                drawRiver(ctx, sr, pc, width, height, entropy);
                break;
            case "crossroads":
                drawCrossroads(ctx, sr, pc, width, height, entropy);
                break;
            case "juke":
                drawJuke(ctx, sr, pc, width, height, entropy);
                break;
            case "storm":
                drawStorm(ctx, sr, pc, width, height, entropy);
                break;
            default:
                drawField(ctx, sr, pc, width, height, entropy);
        }

        // Label overlay
        if (label) {
            ctx.font = "italic 9px Georgia, serif";
            ctx.fillStyle = "rgba(212, 192, 168, 0.35)";
            ctx.textAlign = "left";
            ctx.fillText(label, 10, height - 10);
        }
    }, [seed, entropy, phase, palette, style, width, height, label]);

    return (
        <canvas
            ref={canvasRef}
            style={{
                width: "100%",
                height: height,
                borderRadius: 6,
                display: "block",
            }}
        />
    );
}

// ═══════ STYLE RENDERERS ═══════

function drawField(ctx, sr, pc, w, h, ent) {
    // Horizon
    const horizon = h * (0.35 + sr() * 0.15);
    const sky = ctx.createLinearGradient(0, 0, 0, horizon);
    sky.addColorStop(0, `rgba(${60 + ent * 40}, ${40 + ent * 20}, ${30}, 0.4)`);
    sky.addColorStop(1, `rgba(${40}, ${30}, ${20}, 0.2)`);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, horizon);

    // Cotton rows
    const rows = 8 + Math.floor(sr() * 6);
    for (let i = 0; i < rows; i++) {
        const y = horizon + ((h - horizon) * (i + 1)) / (rows + 1);
        const col = pc();
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x < w; x += 3) {
            ctx.lineTo(x, y + Math.sin(x * 0.03 + i) * (2 + ent * 4) + (sr() - 0.5) * 2);
        }
        ctx.strokeStyle = `rgba(${col.r}, ${col.g}, ${col.b}, ${0.15 + sr() * 0.15})`;
        ctx.lineWidth = 0.8 + sr() * 0.5;
        ctx.stroke();
    }

    // Cotton bolls
    for (let i = 0; i < 30 + ent * 40; i++) {
        const col = pc();
        const x = sr() * w, y = horizon + sr() * (h - horizon);
        const r = 1 + sr() * 2.5;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${col.r}, ${col.g}, ${col.b}, ${0.2 + sr() * 0.3})`;
        ctx.fill();
    }

    // Distant treeline
    for (let x = 0; x < w; x += 6 + sr() * 8) {
        const treeH = 10 + sr() * 20;
        ctx.fillStyle = `rgba(30, 40, 20, ${0.3 + sr() * 0.3})`;
        ctx.fillRect(x, horizon - treeH, 2 + sr() * 4, treeH);
    }
}

function drawRiver(ctx, sr, pc, w, h, ent) {
    // Multiple flowing curves
    const curves = 5 + Math.floor(sr() * 4);
    for (let i = 0; i < curves; i++) {
        const baseY = h * (0.2 + (i / curves) * 0.6);
        const col = pc();
        ctx.beginPath();
        ctx.moveTo(0, baseY);
        for (let x = 0; x < w; x += 2) {
            const y = baseY +
                Math.sin(x * 0.008 + i * 2) * (20 + ent * 30) +
                Math.sin(x * 0.02 + i * 5) * (5 + ent * 10);
            ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(${col.r}, ${col.g}, ${col.b}, ${0.1 + sr() * 0.15})`;
        ctx.lineWidth = 1 + sr() * 2 + ent * 2;
        ctx.stroke();
    }

    // Current particles
    for (let i = 0; i < 60 + ent * 80; i++) {
        const col = pc();
        const x = sr() * w, y = sr() * h;
        const len = 3 + sr() * 8 + ent * 6;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + len, y + (sr() - 0.5) * 3);
        ctx.strokeStyle = `rgba(${col.r}, ${col.g}, ${col.b}, ${0.15 + sr() * 0.2})`;
        ctx.lineWidth = 0.5 + sr();
        ctx.stroke();
    }
}

function drawCrossroads(ctx, sr, pc, w, h, ent) {
    const cx = w / 2 + (sr() - 0.5) * 30;
    const cy = h / 2 + (sr() - 0.5) * 20;

    // Intersecting lines
    for (let i = 0; i < 2; i++) {
        const col = pc();
        const angle = i * Math.PI / 2 + (sr() - 0.5) * 0.3;
        ctx.beginPath();
        ctx.moveTo(cx - Math.cos(angle) * w, cy - Math.sin(angle) * h);
        ctx.lineTo(cx + Math.cos(angle) * w, cy + Math.sin(angle) * h);
        ctx.strokeStyle = `rgba(${col.r}, ${col.g}, ${col.b}, ${0.15 + ent * 0.15})`;
        ctx.lineWidth = 2 + ent * 3;
        ctx.stroke();
    }

    // Radiating particles at center
    for (let i = 0; i < 50 + ent * 60; i++) {
        const col = pc();
        const angle = sr() * Math.PI * 2;
        const dist = sr() * Math.min(w, h) * 0.45;
        const x = cx + Math.cos(angle) * dist;
        const y = cy + Math.sin(angle) * dist;
        const r = 1 + sr() * 3;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${col.r}, ${col.g}, ${col.b}, ${0.1 + sr() * 0.25})`;
        ctx.fill();
    }

    // Center glow
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 60 + ent * 40);
    const gc = pc();
    glow.addColorStop(0, `rgba(${gc.r}, ${gc.g}, ${gc.b}, ${0.15 + ent * 0.15})`);
    glow.addColorStop(1, "transparent");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, 60 + ent * 40, 0, Math.PI * 2);
    ctx.fill();
}

function drawJuke(ctx, sr, pc, w, h, ent) {
    // Warm interior glow
    const glow = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.6);
    const gc = pc();
    glow.addColorStop(0, `rgba(${gc.r}, ${gc.g}, ${gc.b}, ${0.08 + ent * 0.08})`);
    glow.addColorStop(1, "transparent");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    // Neon-like vertical bars
    for (let i = 0; i < 12 + ent * 8; i++) {
        const col = pc();
        const x = sr() * w;
        const barH = h * (0.3 + sr() * 0.5);
        const y = (h - barH) * sr();
        ctx.fillStyle = `rgba(${col.r}, ${col.g}, ${col.b}, ${0.06 + sr() * 0.1})`;
        ctx.fillRect(x, y, 2 + sr() * 6, barH);
    }

    // Smoke particles
    for (let i = 0; i < 40 + ent * 30; i++) {
        const x = sr() * w, y = sr() * h;
        const r = 2 + sr() * 8;
        const smoke = ctx.createRadialGradient(x, y, 0, x, y, r);
        smoke.addColorStop(0, `rgba(180, 160, 140, ${0.02 + sr() * 0.04})`);
        smoke.addColorStop(1, "transparent");
        ctx.fillStyle = smoke;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    // Sound waves emanating from a point
    const sx = w * (0.3 + sr() * 0.4), sy = h * (0.4 + sr() * 0.2);
    for (let i = 0; i < 5; i++) {
        const col = pc();
        const rr = 15 + i * 12 + ent * 8;
        ctx.beginPath();
        ctx.arc(sx, sy, rr, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${col.r}, ${col.g}, ${col.b}, ${0.08 - i * 0.01})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
    }
}

function drawStorm(ctx, sr, pc, w, h, ent) {
    // Chaotic strokes
    for (let i = 0; i < 30 + ent * 50; i++) {
        const col = pc();
        const x1 = sr() * w, y1 = sr() * h;
        const len = 20 + sr() * 60 + ent * 40;
        const angle = sr() * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x1 + Math.cos(angle) * len, y1 + Math.sin(angle) * len);
        ctx.strokeStyle = `rgba(${col.r}, ${col.g}, ${col.b}, ${0.1 + sr() * 0.2})`;
        ctx.lineWidth = 0.5 + sr() * 2;
        ctx.stroke();
    }

    // Lightning bolts (high entropy only)
    if (ent > 0.5) {
        const bolts = Math.floor(ent * 4);
        for (let b = 0; b < bolts; b++) {
            const col = pc();
            let x = sr() * w, y = 0;
            ctx.beginPath();
            ctx.moveTo(x, y);
            while (y < h) {
                x += (sr() - 0.5) * 30;
                y += 5 + sr() * 15;
                ctx.lineTo(x, y);
            }
            ctx.strokeStyle = `rgba(${col.r}, ${col.g}, ${col.b}, ${0.3 + sr() * 0.3})`;
            ctx.lineWidth = 1 + sr() * 1.5;
            ctx.stroke();
        }
    }

    // Rain
    for (let i = 0; i < 50 + ent * 100; i++) {
        const x = sr() * w, y = sr() * h;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 1, y + 4 + sr() * 6);
        ctx.strokeStyle = `rgba(150, 140, 130, ${0.08 + sr() * 0.1})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
    }
}
