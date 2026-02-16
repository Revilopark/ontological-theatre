// ═══════════════════════════════════════════════════════════
// NEO4J CLIENT — Live Knowledge Graph Queries
// Connects to Neo4j Aura instance with browser-compatible driver
// ═══════════════════════════════════════════════════════════

import neo4j from 'neo4j-driver';

// Connection configuration
const NEO4J_URI = 'neo4j+s://c779e832.databases.neo4j.io';
const NEO4J_USER = 'neo4j';
const NEO4J_PASSWORD = 'ZXOupyILxFKlLmzHsmHI9rCmC8e2dXTfyRD7SomGhPw';
const NEO4J_DATABASE = 'neo4j';

let driver = null;

/**
 * Initialize Neo4j driver (singleton pattern)
 */
function getDriver() {
    if (!driver) {
        driver = neo4j.driver(
            NEO4J_URI,
            neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD),
            {
                maxConnectionPoolSize: 50,
                connectionAcquisitionTimeout: 2 * 60 * 1000, // 2 minutes
            }
        );
    }
    return driver;
}

/**
 * Execute a Cypher query and return results
 */
async function executeQuery(cypher, params = {}) {
    const driver = getDriver();
    const session = driver.session({ database: NEO4J_DATABASE });
    
    try {
        const result = await session.run(cypher, params);
        return result.records.map(record => {
            // Convert Neo4j Record to plain JS object
            const obj = {};
            record.keys.forEach(key => {
                const value = record.get(key);
                // Handle Neo4j Integer objects
                if (value && typeof value === 'object' && 'toNumber' in value) {
                    obj[key] = value.toNumber();
                } else if (value && value.properties) {
                    // Handle Node objects
                    obj[key] = { ...value.properties, labels: value.labels };
                } else {
                    obj[key] = value;
                }
            });
            return obj;
        });
    } catch (error) {
        console.error('Neo4j query error:', error);
        throw error;
    } finally {
        await session.close();
    }
}

// ═══════════════════════════════════════════════════════════
// QUERY FUNCTIONS
// ═══════════════════════════════════════════════════════════

/**
 * Get characters by era with their artifacts
 */
export async function getCharactersByEra(eraId) {
    const cypher = `
        MATCH (e:Era {id: $eraId})-[:CONTAINS]->(c:Character)
        OPTIONAL MATCH (c)-[:PRODUCES]->(a:Artifact)
        RETURN c as character, collect(a) as artifacts
        ORDER BY c.name
    `;
    
    try {
        const results = await executeQuery(cypher, { eraId });
        return results.map(r => ({
            character: r.character,
            artifacts: r.artifacts.filter(a => a !== null)
        }));
    } catch (error) {
        console.error('Error fetching characters by era:', error);
        return [];
    }
}

/**
 * Get cross-era lineage chain (evolution of archetype)
 */
export async function getLineageChain(lineageName) {
    const cypher = `
        MATCH (l:Lineage {name: $lineageName})
        OPTIONAL MATCH (l)-[:EVOLVES_TO*]->(c:Character)
        OPTIONAL MATCH (c)-[:TRANSMUTES_INTO]->(next:Character)
        RETURN l as lineage, collect(DISTINCT c) as characters, collect(DISTINCT next) as transmutations
    `;
    
    try {
        const results = await executeQuery(cypher, { lineageName });
        if (results.length === 0) return null;
        
        return {
            lineage: results[0].lineage,
            characters: results[0].characters.filter(c => c !== null),
            transmutations: results[0].transmutations.filter(t => t !== null)
        };
    } catch (error) {
        console.error('Error fetching lineage chain:', error);
        return null;
    }
}

/**
 * Get all TRANSMUTES_INTO edges across eras
 */
export async function getTransmutations() {
    const cypher = `
        MATCH (c1:Character)-[r:TRANSMUTES_INTO]->(c2:Character)
        OPTIONAL MATCH (c1)<-[:CONTAINS]-(e1:Era)
        OPTIONAL MATCH (c2)<-[:CONTAINS]-(e2:Era)
        RETURN c1 as source, c2 as target, r as relationship, 
               e1 as sourceEra, e2 as targetEra
        ORDER BY e1.period, e2.period
    `;
    
    try {
        const results = await executeQuery(cypher);
        return results.map(r => ({
            source: r.source,
            target: r.target,
            relationship: r.relationship,
            sourceEra: r.sourceEra,
            targetEra: r.targetEra
        }));
    } catch (error) {
        console.error('Error fetching transmutations:', error);
        return [];
    }
}

/**
 * Get real Mississippi creators from the knowledge graph
 */
export async function getCreators() {
    const cypher = `
        MATCH (c:Creator)
        OPTIONAL MATCH (c)-[:BORN_IN]->(p:Place)
        OPTIONAL MATCH (c)-[:CREATED]->(w:Work)
        RETURN c as creator, p as birthplace, collect(w) as works
        ORDER BY c.birth
    `;
    
    try {
        const results = await executeQuery(cypher);
        return results.map(r => ({
            creator: r.creator,
            birthplace: r.birthplace,
            works: r.works.filter(w => w !== null)
        }));
    } catch (error) {
        console.error('Error fetching creators:', error);
        return [];
    }
}

/**
 * Get Mississippi places from the knowledge graph
 */
export async function getPlaces() {
    const cypher = `
        MATCH (p:Place)
        OPTIONAL MATCH (p)<-[:BORN_IN]-(c:Creator)
        OPTIONAL MATCH (p)-[:LOCATED_IN]->(r:Region)
        RETURN p as place, collect(DISTINCT c) as creators, r as region
        ORDER BY p.name
    `;
    
    try {
        const results = await executeQuery(cypher);
        return results.map(r => ({
            place: r.place,
            creators: r.creators.filter(c => c !== null),
            region: r.region
        }));
    } catch (error) {
        console.error('Error fetching places:', error);
        return [];
    }
}

/**
 * Full-text search across all nodes
 */
export async function searchGraph(query) {
    // Try multiple search strategies
    const cypher = `
        CALL {
            MATCH (n)
            WHERE toLower(n.name) CONTAINS toLower($query)
               OR toLower(coalesce(n.desc, '')) CONTAINS toLower($query)
               OR toLower(coalesce(n.detail, '')) CONTAINS toLower($query)
            RETURN n, labels(n) as nodeLabels, 1 as relevance
            LIMIT 20
            UNION
            MATCH (n)
            WHERE any(label IN labels(n) WHERE toLower(label) CONTAINS toLower($query))
            RETURN n, labels(n) as nodeLabels, 0.5 as relevance
            LIMIT 10
        }
        RETURN n as node, nodeLabels, relevance
        ORDER BY relevance DESC, n.name
        LIMIT 50
    `;
    
    try {
        const results = await executeQuery(cypher, { query });
        return results.map(r => ({
            node: r.node,
            labels: r.nodeLabels,
            relevance: r.relevance
        }));
    } catch (error) {
        console.error('Error searching graph:', error);
        return [];
    }
}

/**
 * Get neighboring nodes for graph exploration
 */
export async function getNeighbors(nodeId, depth = 1) {
    const cypher = `
        MATCH (n)
        WHERE id(n) = $nodeId
        CALL {
            WITH n
            MATCH path = (n)-[r*1..${depth}]-(neighbor)
            RETURN neighbor, r, relationships(path) as rels
            LIMIT 100
        }
        RETURN n as central, 
               collect(DISTINCT neighbor) as neighbors,
               collect(DISTINCT rels) as relationships
    `;
    
    try {
        const results = await executeQuery(cypher, { nodeId: neo4j.int(nodeId) });
        if (results.length === 0) return null;
        
        return {
            central: results[0].central,
            neighbors: results[0].neighbors.filter(n => n !== null),
            relationships: results[0].relationships.flat().filter(r => r !== null)
        };
    } catch (error) {
        console.error('Error fetching neighbors:', error);
        return null;
    }
}

/**
 * Get graph statistics
 */
export async function getGraphStats() {
    const cypher = `
        MATCH (n)
        WITH labels(n) as labels, count(n) as count
        UNWIND labels as label
        RETURN label, sum(count) as nodeCount
        ORDER BY nodeCount DESC
    `;
    
    try {
        const labelCounts = await executeQuery(cypher);
        
        const edgeCypher = `
            MATCH ()-[r]->()
            RETURN type(r) as relType, count(r) as count
            ORDER BY count DESC
        `;
        const edgeCounts = await executeQuery(edgeCypher);
        
        return {
            labels: labelCounts,
            relationships: edgeCounts,
            totalNodes: labelCounts.reduce((sum, l) => sum + l.nodeCount, 0),
            totalEdges: edgeCounts.reduce((sum, e) => sum + e.count, 0)
        };
    } catch (error) {
        console.error('Error fetching graph stats:', error);
        return null;
    }
}

/**
 * Get all eras with character counts
 */
export async function getEras() {
    const cypher = `
        MATCH (e:Era)
        OPTIONAL MATCH (e)-[:CONTAINS]->(c:Character)
        RETURN e as era, count(c) as characterCount
        ORDER BY e.period
    `;
    
    try {
        const results = await executeQuery(cypher);
        return results.map(r => ({
            era: r.era,
            characterCount: r.characterCount
        }));
    } catch (error) {
        console.error('Error fetching eras:', error);
        return [];
    }
}

/**
 * Get all lineages
 */
export async function getLineages() {
    const cypher = `
        MATCH (l:Lineage)
        OPTIONAL MATCH (l)-[:EVOLVES_TO]->(c:Character)
        RETURN l as lineage, count(c) as characterCount
        ORDER BY l.name
    `;
    
    try {
        const results = await executeQuery(cypher);
        return results.map(r => ({
            lineage: r.lineage,
            characterCount: r.characterCount
        }));
    } catch (error) {
        console.error('Error fetching lineages:', error);
        return [];
    }
}

/**
 * Test connection
 */
export async function testConnection() {
    try {
        const result = await executeQuery('RETURN 1 as test');
        return result.length > 0 && result[0].test === 1;
    } catch (error) {
        console.error('Connection test failed:', error);
        return false;
    }
}

/**
 * Close driver connection
 */
export async function closeConnection() {
    if (driver) {
        await driver.close();
        driver = null;
    }
}

// Export driver for advanced usage
export { getDriver };
