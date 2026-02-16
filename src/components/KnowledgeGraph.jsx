// ═══════════════════════════════════════════════════════════
// KNOWLEDGE GRAPH — Force-directed canvas renderer
// Consolidated from all variants with flood atmosphere effects
// ═══════════════════════════════════════════════════════════

import { useRef, useEffect } from "react";
import { FLOOD_PHASES } from "../data/flood-phases";
import { PATHY_COLORS } from "../data/pathy";
import { clamp } from "../engine/utils";

export default function KnowledgeGraph({ nodes, edges, width, height, floodPhase }) {
    const canvasRef = useRef(null);
    const animRef = useRef(null);
    const positionsRef = useRef(new Map());
    const velocitiesRef = useRef(new Map());

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        const nodeArr = Array.from(nodes.values());
        const positions = positionsRef.current;
        const velocities = velocitiesRef.current;

        // Initialize new node positions on a circle
        nodeArr.forEach((n, i) => {
            if (!positions.has(n.id)) {
                const angle = (i / Math.max(nodeArr.length, 1)) * Math.PI * 2;
                const r = Math.min(width, height) * 0.28;
                positions.set(n.id, {
                    x: width / 2 + Math.cos(angle) * r + (Math.random() - 0.5) * 80,
                    y: height / 2 + Math.sin(angle) * r + (Math.random() - 0.5) * 80,
                });
                velocities.set(n.id, { vx: 0, vy: 0 });
            }
        });

        let frame = 0;

        const animate = () => {
            // Background
            ctx.fillStyle = "rgba(18, 14, 8, 0.9)";
            ctx.fillRect(0, 0, width, height);

            // Water effect during flood phases
            const phaseIdx = floodPhase ? FLOOD_PHASES.indexOf(floodPhase) : -1;
            const waterLevel = phaseIdx >= 0
                ? (phaseIdx / FLOOD_PHASES.length) * height * 0.4
                : 0;

            if (waterLevel > 0) {
                const waterGrad = ctx.createLinearGradient(0, height - waterLevel, 0, height);
                waterGrad.addColorStop(0, "rgba(30, 25, 15, 0)");
                waterGrad.addColorStop(0.3, "rgba(40, 30, 15, 0.15)");
                waterGrad.addColorStop(1, "rgba(60, 35, 10, 0.25)");
                ctx.fillStyle = waterGrad;
                ctx.fillRect(0, height - waterLevel, width, waterLevel);

                // Ripples
                for (let x = 0; x < width; x += 40) {
                    const ry = height - waterLevel + Math.sin(frame * 0.02 + x * 0.05) * 3;
                    ctx.beginPath();
                    ctx.moveTo(x, ry);
                    ctx.lineTo(x + 20, ry + Math.sin(frame * 0.03 + x * 0.08) * 2);
                    ctx.strokeStyle = "rgba(139, 115, 85, 0.15)";
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }

            frame++;

            // ── Force-directed physics ──
            nodeArr.forEach((n) => {
                const p = positions.get(n.id);
                const v = velocities.get(n.id);
                if (!p || !v) return;

                // Repulsion (Coulomb)
                nodeArr.forEach((m) => {
                    if (m.id === n.id) return;
                    const mp = positions.get(m.id);
                    if (!mp) return;
                    const dx = p.x - mp.x, dy = p.y - mp.y;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                    const force = 900 / (dist * dist);
                    v.vx += (dx / dist) * force;
                    v.vy += (dy / dist) * force;
                });

                // Attraction along edges (spring)
                edges.forEach((e) => {
                    let other = null;
                    if (e.source === n.id) other = positions.get(e.target);
                    else if (e.target === n.id) other = positions.get(e.source);
                    if (!other) return;
                    const dx = other.x - p.x, dy = other.y - p.y;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                    const force = (dist - 90) * 0.004 * (e.weight || 0.5);
                    v.vx += (dx / dist) * force;
                    v.vy += (dy / dist) * force;
                });

                // Center gravity
                v.vx += (width / 2 - p.x) * 0.0004;
                v.vy += (height / 2 - p.y) * 0.0004;

                // Damping
                v.vx *= 0.82;
                v.vy *= 0.82;
                p.x = clamp(p.x + v.vx, 40, width - 40);
                p.y = clamp(p.y + v.vy, 40, height - 40);
            });

            // ── Draw edges ──
            edges.forEach((e) => {
                const sp = positions.get(e.source);
                const tp = positions.get(e.target);
                if (!sp || !tp) return;

                ctx.beginPath();
                ctx.moveTo(sp.x, sp.y);
                ctx.lineTo(tp.x, tp.y);

                const alpha = Math.min(0.55, (e.weight || 0.3) * 0.7);
                ctx.setLineDash([]);

                if (e.type === "bridge") {
                    ctx.strokeStyle = `rgba(212, 160, 74, ${alpha})`;
                    ctx.lineWidth = 2;
                } else if (e.type === "alliance") {
                    ctx.strokeStyle = `rgba(139, 115, 85, ${alpha * 0.6})`;
                    ctx.lineWidth = 1;
                } else if (e.type === "lineage") {
                    ctx.strokeStyle = `rgba(106, 90, 205, ${alpha})`;
                    ctx.lineWidth = 1.5;
                    ctx.setLineDash([3, 5]);
                } else {
                    ctx.strokeStyle = `rgba(192, 57, 43, ${alpha * 0.4})`;
                    ctx.lineWidth = 0.7;
                }
                ctx.stroke();
                ctx.setLineDash([]);

                // Bridge label
                if (e.type === "bridge" && e.label) {
                    const mx = (sp.x + tp.x) / 2,
                        my = (sp.y + tp.y) / 2;
                    ctx.font = "italic 8px Georgia, serif";
                    ctx.fillStyle = "rgba(212, 160, 74, 0.5)";
                    ctx.textAlign = "center";
                    ctx.fillText(e.label, mx, my - 5);
                }
            });

            // ── Draw nodes ──
            nodeArr.forEach((n) => {
                const p = positions.get(n.id);
                if (!p) return;

                const r = 5 + n.transformations * 1.8 + n.connections * 0.4;
                const color = n.dominant?.color || "#8B7355";
                const pulse = Math.sin(frame * 0.025 + n.id * 1.7) * 0.12 + 0.88;

                // Glow
                const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 2.5);
                grad.addColorStop(0, color + "30");
                grad.addColorStop(1, "transparent");
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(p.x, p.y, r * 2.5, 0, Math.PI * 2);
                ctx.fill();

                // Node body
                ctx.beginPath();
                ctx.arc(p.x, p.y, r * pulse, 0, Math.PI * 2);
                ctx.fillStyle = n.alive ? color : color + "35";
                ctx.fill();

                // Dissolved mark
                if (!n.alive) {
                    ctx.strokeStyle = "rgba(139, 0, 0, 0.5)";
                    ctx.lineWidth = 1;
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(p.x - 3, p.y - 3);
                    ctx.lineTo(p.x + 3, p.y + 3);
                    ctx.moveTo(p.x + 3, p.y - 3);
                    ctx.lineTo(p.x - 3, p.y + 3);
                    ctx.strokeStyle = "rgba(139, 0, 0, 0.6)";
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }

                // Name
                ctx.font = "bold 9px 'Source Serif 4', Georgia, serif";
                ctx.fillStyle = n.alive ? "#d4c8a8" : "#5a5040";
                ctx.textAlign = "center";
                ctx.fillText(n.name, p.x, p.y + r + 13);

                // Pathy
                ctx.font = "italic 7px Georgia, serif";
                ctx.fillStyle = PATHY_COLORS[n.pathy] || "#666";
                ctx.fillText(n.pathy, p.x, p.y + r + 22);
            });

            // Phase watermark
            if (floodPhase) {
                ctx.font = "italic 11px Georgia, serif";
                ctx.fillStyle = "rgba(139, 115, 85, 0.12)";
                ctx.textAlign = "right";
                ctx.fillText(floodPhase.name, width - 16, height - 12);
            }

            animRef.current = requestAnimationFrame(animate);
        };

        animate();
        return () => cancelAnimationFrame(animRef.current);
    }, [nodes, edges, width, height, floodPhase]);

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
