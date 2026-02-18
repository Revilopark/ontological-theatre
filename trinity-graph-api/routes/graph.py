"""
routes/graph.py — Raw Cypher query endpoint, graph stats, full world export.
"""

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from neo4j import AsyncSession
from pydantic import BaseModel, Field

from config import db_session

router = APIRouter(prefix="/graph", tags=["graph"])

# Node labels we expose in stats/export
NODE_LABELS = [
    "World", "Era", "Lineage", "Character", "Place",
    "Garment", "Artifact", "Spark", "GeneratedContent", "VoiceProfile",
]

# Relationship types
REL_TYPES = [
    "CONTAINS_ERA", "HAS_LINEAGE", "BELONGS_TO", "EXISTS_IN", "OF_LINEAGE",
    "LOCATED_AT", "WEARS", "CREATED", "HAS_VOICE", "KNOWS",
    "INVOLVES", "OCCURS_AT", "OCCURS_IN", "GENERATES", "DEPICTS", "FEEDBACK_TO",
]

# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

class CypherRequest(BaseModel):
    query: str = Field(..., description="Read-only Cypher query (MATCH/RETURN only)")
    params: Dict[str, Any] = Field(default_factory=dict)


class CypherResponse(BaseModel):
    columns: List[str]
    rows: List[Dict[str, Any]]
    row_count: int


class GraphStats(BaseModel):
    nodes: Dict[str, int]
    relationships: Dict[str, int]
    total_nodes: int
    total_relationships: int


# ---------------------------------------------------------------------------
# Safety guard: only allow read-only queries
# ---------------------------------------------------------------------------

_FORBIDDEN_KEYWORDS = {
    "CREATE", "MERGE", "DELETE", "DETACH", "SET", "REMOVE",
    "DROP", "CALL", "LOAD", "FOREACH",
}


def _is_readonly(query: str) -> bool:
    upper = query.upper()
    for kw in _FORBIDDEN_KEYWORDS:
        # Simple keyword check — sufficient for our guard layer
        if f" {kw} " in upper or upper.startswith(kw + " ") or f"\n{kw} " in upper:
            return False
    return True


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/query", response_model=CypherResponse)
async def run_query(
    body: CypherRequest,
    session: AsyncSession = Depends(db_session),
):
    """Execute a read-only Cypher query against the graph."""
    if not _is_readonly(body.query):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only read-only queries (MATCH/RETURN) are permitted via this endpoint.",
        )
    try:
        result = await session.run(body.query, **body.params)
        keys = result.keys()
        rows = []
        async for record in result:
            row = {}
            for k in keys:
                v = record[k]
                # Serialise Neo4j node/rel objects to plain dicts
                if hasattr(v, "_properties"):
                    row[k] = dict(v)
                elif isinstance(v, (list, tuple)):
                    row[k] = [
                        dict(i) if hasattr(i, "_properties") else i for i in v
                    ]
                else:
                    row[k] = v
            rows.append(row)

        return CypherResponse(columns=list(keys), rows=rows, row_count=len(rows))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Query error: {str(e)}")


@router.get("/stats", response_model=GraphStats)
async def graph_stats(session: AsyncSession = Depends(db_session)):
    """Return node and relationship counts by type."""
    node_counts: Dict[str, int] = {}
    for label in NODE_LABELS:
        result = await session.run(f"MATCH (n:{label}) RETURN count(n) AS cnt")
        record = await result.single()
        node_counts[label] = record["cnt"] if record else 0

    rel_counts: Dict[str, int] = {}
    for rel in REL_TYPES:
        result = await session.run(f"MATCH ()-[r:{rel}]->() RETURN count(r) AS cnt")
        record = await result.single()
        rel_counts[rel] = record["cnt"] if record else 0

    return GraphStats(
        nodes=node_counts,
        relationships=rel_counts,
        total_nodes=sum(node_counts.values()),
        total_relationships=sum(rel_counts.values()),
    )


@router.get("/export/{world_id}")
async def export_world(world_id: str, session: AsyncSession = Depends(db_session)):
    """
    Full JSON export of a world — all nodes and relationships.
    Returns a self-contained snapshot suitable for import or archival.
    """
    # Verify world exists
    check = await session.run(
        "MATCH (w:World {id: $id}) RETURN w", id=world_id
    )
    world_record = await check.single()
    if not world_record:
        raise HTTPException(status_code=404, detail="World not found")

    world = dict(world_record["w"])

    async def fetch_nodes(label: str, filter_key: str) -> List[dict]:
        result = await session.run(
            f"MATCH (n:{label} {{{filter_key}: $wid}}) RETURN n",
            wid=world_id,
        )
        return [dict(r["n"]) for r in await result.data()]

    eras = await fetch_nodes("Era", "world_id")
    lineages = await fetch_nodes("Lineage", "world_id")
    characters = await fetch_nodes("Character", "world_id")
    places = await fetch_nodes("Place", "world_id")
    artifacts = await fetch_nodes("Artifact", "world_id")
    sparks = await fetch_nodes("Spark", "world_id")

    # Garments (linked via character_id; characters filtered by world)
    char_ids = [c["id"] for c in characters]
    garments: List[dict] = []
    if char_ids:
        garm_result = await session.run(
            "MATCH (g:Garment) WHERE g.character_id IN $ids RETURN g",
            ids=char_ids,
        )
        garments = [dict(r["g"]) for r in await garm_result.data()]

    # Generated content linked to sparks
    spark_ids = [s["id"] for s in sparks]
    generated_content: List[dict] = []
    if spark_ids:
        gc_result = await session.run(
            "MATCH (gc:GeneratedContent) WHERE gc.spark_id IN $ids RETURN gc",
            ids=spark_ids,
        )
        generated_content = [dict(r["gc"]) for r in await gc_result.data()]

    # KNOWS relationships within the world
    relationships: List[dict] = []
    if char_ids:
        rel_result = await session.run(
            """
            MATCH (a:Character)-[r:KNOWS]->(b:Character)
            WHERE a.world_id = $wid AND b.world_id = $wid
            RETURN a.id AS from_id, b.id AS to_id,
                   r.relationship_type AS relationship_type,
                   r.weight AS weight
            """,
            wid=world_id,
        )
        relationships = await rel_result.data()

    return {
        "world": world,
        "eras": eras,
        "lineages": lineages,
        "characters": characters,
        "places": places,
        "artifacts": artifacts,
        "garments": garments,
        "sparks": sparks,
        "generated_content": generated_content,
        "relationships": relationships,
        "meta": {
            "exported_at": __import__("datetime").datetime.now(
                __import__("datetime").timezone.utc
            ).isoformat(),
            "node_counts": {
                "eras": len(eras),
                "lineages": len(lineages),
                "characters": len(characters),
                "places": len(places),
                "artifacts": len(artifacts),
                "garments": len(garments),
                "sparks": len(sparks),
                "generated_content": len(generated_content),
            },
        },
    }
