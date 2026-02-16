// ═══════════════════════════════════════════════════════════
// NEO4J CYPHER GENERATOR — Deep Time Knowledge Graph
// 8 Eras × 8 Lineages × 64 Characters × 320 Artifacts
// ═══════════════════════════════════════════════════════════

import { ERAS } from "../data/eras.js";
import { LINEAGES } from "../data/lineages.js";
import { CHARACTER_MUTATIONS, ALL_CHARACTERS } from "../data/characters.js";
import { MISSISSIPPI_IS, CREATIVE_FIGURES } from "../data/mississippi.js";
import { CLUSTERS } from "../data/clusters.js";

/**
 * Generates the complete set of Cypher statements for the deep-time knowledge graph
 */
export function generateCypher() {
    const statements = [];

    // ═══ CONSTRAINTS & INDEXES ═══
    statements.push("// ═══ CONSTRAINTS & INDEXES ═══");
    statements.push("CREATE CONSTRAINT era_id IF NOT EXISTS FOR (e:Era) REQUIRE e.id IS UNIQUE;");
    statements.push("CREATE CONSTRAINT lineage_id IF NOT EXISTS FOR (l:Lineage) REQUIRE l.id IS UNIQUE;");
    statements.push("CREATE CONSTRAINT character_id IF NOT EXISTS FOR (c:Character) REQUIRE c.id IS UNIQUE;");
    statements.push("CREATE CONSTRAINT location_id IF NOT EXISTS FOR (loc:Location) REQUIRE loc.id IS UNIQUE;");
    statements.push("CREATE CONSTRAINT cluster_id IF NOT EXISTS FOR (cl:Cluster) REQUIRE cl.id IS UNIQUE;");
    statements.push("CREATE CONSTRAINT constant_id IF NOT EXISTS FOR (k:Constant) REQUIRE k.id IS UNIQUE;");
    statements.push("CREATE CONSTRAINT figure_id IF NOT EXISTS FOR (f:CreativeFigure) REQUIRE f.id IS UNIQUE;");
    statements.push("CREATE CONSTRAINT artifact_id IF NOT EXISTS FOR (a:Artifact) REQUIRE a.id IS UNIQUE;");
    statements.push("CREATE CONSTRAINT phase_id IF NOT EXISTS FOR (p:Phase) REQUIRE p.id IS UNIQUE;");
    statements.push("CREATE INDEX era_period IF NOT EXISTS FOR (e:Era) ON (e.period);");
    statements.push("CREATE INDEX figure_category IF NOT EXISTS FOR (f:CreativeFigure) ON (f.category);");
    statements.push("CREATE INDEX artifact_era IF NOT EXISTS FOR (a:Artifact) ON (a.era);");
    statements.push("");

    // ═══ ONTOLOGICAL CLUSTERS ═══
    statements.push("// ═══ ONTOLOGICAL CLUSTERS (24) ═══");
    for (const cl of CLUSTERS) {
        statements.push(
            `CREATE (cl:Cluster {id: "${cl.id}", name: ${esc(cl.name)}, short: ${esc(cl.short)}, ` +
            `color: "${cl.color}", meta: ${esc(cl.meta)}});`
        );
    }
    statements.push("");

    // ═══ ERAS ═══
    statements.push(`// ═══ ERAS (${ERAS.length}) ═══`);
    for (const era of ERAS) {
        statements.push(
            `CREATE (e:Era {id: "${era.id}", name: ${esc(era.name)}, period: ${esc(era.period)}, ` +
            `subtitle: ${esc(era.subtitle)}, color: "${era.color}", desc: ${esc(era.desc)}});`
        );

        // Phases
        for (let pi = 0; pi < era.phases.length; pi++) {
            const ph = era.phases[pi];
            const phId = `phase_${era.id}_${pi}`;
            statements.push(
                `CREATE (p:Phase {id: "${phId}", name: ${esc(ph.name)}, desc: ${esc(ph.desc)}, ` +
                `entropyMin: ${ph.entropy[0]}, entropyMax: ${ph.entropy[1]}});`
            );
            statements.push(
                `MATCH (e:Era {id: "${era.id}"}), (p:Phase {id: "${phId}"}) CREATE (p)-[:BELONGS_TO]->(e);`
            );
        }

        // Locations (now strings in the new data)
        for (let li = 0; li < era.locations.length; li++) {
            const locName = typeof era.locations[li] === "string" ? era.locations[li] : era.locations[li].name;
            const locId = `loc_${era.id}_${slugify(locName)}`;
            statements.push(
                `MERGE (loc:Location {id: "${locId}", name: ${esc(locName)}, era: "${era.id}"});`
            );
            statements.push(
                `MATCH (e:Era {id: "${era.id}"}), (loc:Location {id: "${locId}"}) CREATE (loc)-[:EXISTS_IN]->(e);`
            );
        }

        // Bridges
        for (const bridge of era.bridges) {
            const bId = `bridge_${era.id}_${slugify(bridge)}`;
            statements.push(
                `MERGE (b:Bridge {id: "${bId}", name: ${esc(bridge)}, era: "${era.id}"});`
            );
            statements.push(
                `MATCH (e:Era {id: "${era.id}"}), (b:Bridge {id: "${bId}"}) CREATE (b)-[:ACTIVE_IN]->(e);`
            );
        }

        // Pathies
        for (const pathy of era.pathies) {
            const pId = `pathy_${era.id}_${slugify(pathy)}`;
            statements.push(
                `MERGE (pa:PathyState {id: "${pId}", name: ${esc(pathy)}, era: "${era.id}"});`
            );
            statements.push(
                `MATCH (e:Era {id: "${era.id}"}), (pa:PathyState {id: "${pId}"}) CREATE (pa)-[:FELT_IN]->(e);`
            );
        }
    }
    statements.push("");

    // ═══ ERA SUCCESSION ═══
    statements.push("// ═══ ERA SUCCESSION ═══");
    for (let i = 0; i < ERAS.length - 1; i++) {
        statements.push(
            `MATCH (a:Era {id: "${ERAS[i].id}"}), (b:Era {id: "${ERAS[i + 1].id}"}) CREATE (a)-[:SUCCEEDED_BY]->(b);`
        );
    }
    statements.push("");

    // ═══ LINEAGES ═══
    statements.push(`// ═══ LINEAGES (${LINEAGES.length}) ═══`);
    for (const lin of LINEAGES) {
        statements.push(
            `CREATE (l:Lineage {id: "${lin.id}", name: ${esc(lin.name)}, ` +
            `throughLine: ${esc(lin.throughLine)}, color: "${lin.color}"});`
        );

        // Lineage → dominant clusters
        for (const d of lin.dominant_clusters) {
            statements.push(
                `MATCH (l:Lineage {id: "${lin.id}"}), (cl:Cluster {id: "${d}"}) ` +
                `CREATE (l)-[:ACCUMULATES_SEDIMENT_IN]->(cl);`
            );
        }
    }
    statements.push("");

    // ═══ CHARACTERS (64) & ARTIFACTS (320) ═══
    statements.push(`// ═══ CHARACTERS (${ALL_CHARACTERS.length}) & ARTIFACTS ═══`);
    let artifactCount = 0;

    for (const lineageId of Object.keys(CHARACTER_MUTATIONS)) {
        const mutations = CHARACTER_MUTATIONS[lineageId];
        for (let eraIdx = 0; eraIdx < mutations.length; eraIdx++) {
            const ch = mutations[eraIdx];
            const era = ERAS[eraIdx];
            const chId = `char_${lineageId}_${era.id}`;

            // Character node with artifact ontology
            const artifactProps = ch.medium
                ? `, medium: ${esc(ch.medium)}, surface: ${esc(ch.surface)}, literacy: ${esc(ch.literacy)}, voice: ${esc(ch.voice)}`
                : "";

            statements.push(
                `CREATE (c:Character {id: "${chId}", name: ${esc(ch.name)}, ` +
                `desc: ${esc(ch.desc)}, flavor: ${esc(ch.flavor)}, pathy: "${ch.pathy}", ` +
                `lineage: "${lineageId}", era: "${era.id}"${artifactProps}});`
            );

            // Character → Era
            statements.push(
                `MATCH (c:Character {id: "${chId}"}), (e:Era {id: "${era.id}"}) CREATE (c)-[:LIVES_IN]->(e);`
            );

            // Character → Lineage
            statements.push(
                `MATCH (c:Character {id: "${chId}"}), (l:Lineage {id: "${lineageId}"}) ` +
                `CREATE (l)-[:MANIFESTS_AS {era: "${era.id}"}]->(c);`
            );

            // Character → dominant clusters
            if (ch.dominants) {
                for (const d of ch.dominants) {
                    statements.push(
                        `MATCH (c:Character {id: "${chId}"}), (cl:Cluster {id: "${d}"}) ` +
                        `CREATE (c)-[:DOMINANT_IN]->(cl);`
                    );
                }
            }

            // Character → Artifacts
            if (ch.artifactTypes) {
                for (const art of ch.artifactTypes) {
                    const artId = `art_${lineageId}_${era.id}_${artifactCount}`;
                    artifactCount++;
                    statements.push(
                        `CREATE (a:Artifact {id: "${artId}", name: ${esc(art)}, era: "${era.id}", lineage: "${lineageId}"});`
                    );
                    statements.push(
                        `MATCH (c:Character {id: "${chId}"}), (a:Artifact {id: "${artId}"}) CREATE (c)-[:PRODUCES]->(a);`
                    );
                }
            }

            // Transmutation chain: previous era mutation → this one
            if (eraIdx > 0) {
                const prevEra = ERAS[eraIdx - 1];
                const prevId = `char_${lineageId}_${prevEra.id}`;
                statements.push(
                    `MATCH (a:Character {id: "${prevId}"}), (b:Character {id: "${chId}"}) ` +
                    `CREATE (a)-[:TRANSMUTES_INTO {lineage: "${lineageId}"}]->(b);`
                );
            }
        }
    }
    statements.push("");

    // ═══ MISSISSIPPI_IS CONSTANTS ═══
    statements.push("// ═══ MISSISSIPPI_IS CONSTANTS (5) ═══");
    for (const k of MISSISSIPPI_IS) {
        statements.push(
            `CREATE (k:Constant {id: "${k.id}", name: ${esc(k.name)}, ` +
            `desc: ${esc(k.desc)}, detail: ${esc(k.detail)}, color: "${k.color}"});`
        );
        for (const cid of k.clusters) {
            statements.push(
                `MATCH (k:Constant {id: "${k.id}"}), (cl:Cluster {id: "${cid}"}) CREATE (k)-[:WEIGHTED_BY]->(cl);`
            );
        }
        for (const era of ERAS) {
            statements.push(
                `MATCH (k:Constant {id: "${k.id}"}), (e:Era {id: "${era.id}"}) CREATE (k)-[:MISSISSIPPI_IS]->(e);`
            );
        }
    }
    statements.push("");

    // ═══ CREATIVE FIGURES ═══
    statements.push("// ═══ CREATIVE FIGURES ═══");
    for (const cat of CREATIVE_FIGURES) {
        for (const f of cat.figures) {
            const fId = `fig_${slugify(f.name)}`;
            statements.push(
                `CREATE (f:CreativeFigure {id: "${fId}", name: ${esc(f.name)}, ` +
                `birth: ${esc(f.birth)}, place: ${esc(f.place)}, form: ${esc(f.form)}, ` +
                `category: "${cat.category}", desc: ${esc(f.desc)}, legacy: ${esc(f.legacy)}});`
            );
            if (f.era) {
                statements.push(
                    `MATCH (f:CreativeFigure {id: "${fId}"}), (e:Era {id: "${f.era}"}) CREATE (f)-[:CREATED_IN]->(e);`
                );
            }
            if (f.lineage) {
                statements.push(
                    `MATCH (f:CreativeFigure {id: "${fId}"}), (l:Lineage {id: "${f.lineage}"}) ` +
                    `CREATE (f)-[:BELONGS_TO_LINEAGE]->(l);`
                );
            }
        }
    }
    statements.push("");

    return statements.join("\n");
}

// ═══ HELPERS ═══

function esc(s) {
    if (s === undefined || s === null) return '""';
    return `"${String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n")}"`;
}

function slugify(s) {
    return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/(^_|_$)/g, "");
}

/**
 * Summary statistics for the generated graph
 */
export function graphStats() {
    let nodes = 0;
    let edges = 0;

    // Clusters
    nodes += CLUSTERS.length; // 24

    // Eras
    nodes += ERAS.length;
    edges += ERAS.length - 1; // SUCCEEDED_BY

    // Phases
    let phaseCount = 0;
    for (const era of ERAS) {
        phaseCount += era.phases.length;
        edges += era.phases.length; // BELONGS_TO
    }
    nodes += phaseCount;

    // Locations
    let locCount = 0;
    for (const era of ERAS) {
        locCount += era.locations.length;
        edges += era.locations.length; // EXISTS_IN
    }
    nodes += locCount;

    // Characters & Artifacts
    let charCount = 0;
    let artifactTotal = 0;
    for (const lineageId of Object.keys(CHARACTER_MUTATIONS)) {
        const mutations = CHARACTER_MUTATIONS[lineageId];
        charCount += mutations.length;
        for (let i = 0; i < mutations.length; i++) {
            const ch = mutations[i];
            edges++; // LIVES_IN
            edges++; // MANIFESTS_AS
            edges += (ch.dominants || []).length; // DOMINANT_IN
            const artCount = (ch.artifactTypes || []).length;
            artifactTotal += artCount;
            edges += artCount * 2; // CREATE + PRODUCES
            if (i > 0) edges++; // TRANSMUTES_INTO
        }
    }
    nodes += charCount;
    nodes += artifactTotal;

    // Lineages
    nodes += LINEAGES.length;
    for (const lin of LINEAGES) {
        edges += lin.dominant_clusters.length; // ACCUMULATES_SEDIMENT_IN
    }

    // Constants
    nodes += MISSISSIPPI_IS.length;
    for (const k of MISSISSIPPI_IS) {
        edges += k.clusters.length;
        edges += ERAS.length;
    }

    // Creative figures
    let figCount = 0;
    for (const cat of CREATIVE_FIGURES) {
        figCount += cat.figures.length;
        for (const f of cat.figures) {
            if (f.era) edges++;
            if (f.lineage) edges++;
        }
    }
    nodes += figCount;

    return {
        nodes,
        edges,
        breakdown: {
            clusters: CLUSTERS.length,
            eras: ERAS.length,
            phases: phaseCount,
            locations: locCount,
            characters: charCount,
            artifacts: artifactTotal,
            lineages: LINEAGES.length,
            constants: MISSISSIPPI_IS.length,
            creativeFigures: figCount,
        },
    };
}
