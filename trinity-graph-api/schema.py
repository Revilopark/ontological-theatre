"""
schema.py — Unified Cypher schema: constraints and indexes for all node types.
"""

from typing import List

# ---------------------------------------------------------------------------
# Constraints — uniqueness guarantees on :id property
# ---------------------------------------------------------------------------
CONSTRAINTS: List[str] = [
    "CREATE CONSTRAINT world_id_unique IF NOT EXISTS FOR (n:World) REQUIRE n.id IS UNIQUE",
    "CREATE CONSTRAINT era_id_unique IF NOT EXISTS FOR (n:Era) REQUIRE n.id IS UNIQUE",
    "CREATE CONSTRAINT lineage_id_unique IF NOT EXISTS FOR (n:Lineage) REQUIRE n.id IS UNIQUE",
    "CREATE CONSTRAINT character_id_unique IF NOT EXISTS FOR (n:Character) REQUIRE n.id IS UNIQUE",
    "CREATE CONSTRAINT place_id_unique IF NOT EXISTS FOR (n:Place) REQUIRE n.id IS UNIQUE",
    "CREATE CONSTRAINT garment_id_unique IF NOT EXISTS FOR (n:Garment) REQUIRE n.id IS UNIQUE",
    "CREATE CONSTRAINT artifact_id_unique IF NOT EXISTS FOR (n:Artifact) REQUIRE n.id IS UNIQUE",
    "CREATE CONSTRAINT spark_id_unique IF NOT EXISTS FOR (n:Spark) REQUIRE n.id IS UNIQUE",
    "CREATE CONSTRAINT generated_content_id_unique IF NOT EXISTS FOR (n:GeneratedContent) REQUIRE n.id IS UNIQUE",
    "CREATE CONSTRAINT voice_profile_id_unique IF NOT EXISTS FOR (n:VoiceProfile) REQUIRE n.id IS UNIQUE",
]

# ---------------------------------------------------------------------------
# Indexes — for fast filtering by world_id, era_id, etc.
# ---------------------------------------------------------------------------
INDEXES: List[str] = [
    "CREATE INDEX era_world_idx IF NOT EXISTS FOR (n:Era) ON (n.world_id)",
    "CREATE INDEX lineage_world_idx IF NOT EXISTS FOR (n:Lineage) ON (n.world_id)",
    "CREATE INDEX character_world_idx IF NOT EXISTS FOR (n:Character) ON (n.world_id)",
    "CREATE INDEX character_era_idx IF NOT EXISTS FOR (n:Character) ON (n.era_id)",
    "CREATE INDEX character_lineage_idx IF NOT EXISTS FOR (n:Character) ON (n.lineage_id)",
    "CREATE INDEX place_world_idx IF NOT EXISTS FOR (n:Place) ON (n.world_id)",
    "CREATE INDEX place_era_idx IF NOT EXISTS FOR (n:Place) ON (n.era_id)",
    "CREATE INDEX garment_character_idx IF NOT EXISTS FOR (n:Garment) ON (n.character_id)",
    "CREATE INDEX artifact_world_idx IF NOT EXISTS FOR (n:Artifact) ON (n.world_id)",
    "CREATE INDEX artifact_era_idx IF NOT EXISTS FOR (n:Artifact) ON (n.era_id)",
    "CREATE INDEX artifact_character_idx IF NOT EXISTS FOR (n:Artifact) ON (n.character_id)",
    "CREATE INDEX spark_world_idx IF NOT EXISTS FOR (n:Spark) ON (n.world_id)",
    "CREATE INDEX spark_era_idx IF NOT EXISTS FOR (n:Spark) ON (n.era_id)",
    "CREATE INDEX generated_content_spark_idx IF NOT EXISTS FOR (n:GeneratedContent) ON (n.spark_id)",
    "CREATE INDEX generated_content_character_idx IF NOT EXISTS FOR (n:GeneratedContent) ON (n.character_id)",
    "CREATE INDEX voice_profile_character_idx IF NOT EXISTS FOR (n:VoiceProfile) ON (n.character_id)",
]

# ---------------------------------------------------------------------------
# All -ity and -pathy field names (canonical ordering used throughout)
# ---------------------------------------------------------------------------
ITY_FIELDS: List[str] = [
    "materiality", "vitality", "interiority", "criticality", "connectivity",
    "lucidity", "necessity", "reciprocity", "totality", "continuity",
    "authenticity", "luminosity", "viscosity", "permanence", "workability",
    "spontaneity", "complexity", "resilience", "integrity", "serendipity",
    "clarity", "certainty", "sagacity", "felicity", "propensity",
    "familiarity", "synchronicity", "ubiquity", "curiosity", "creativity",
]

PATHY_FIELDS: List[str] = [
    "empathy", "sympathy", "apathy", "antipathy", "telepathy",
    "tactility", "sensuosity", "immediacy", "gestural_energy", "pathos",
    "ethos", "logos", "nostalgia", "melancholy", "euphoria",
    "anxiety", "tranquility", "intensity", "fragility", "audacity",
]

ALL_SCALAR_FIELDS = ITY_FIELDS + PATHY_FIELDS


async def init_schema(session) -> dict:
    """
    Run all constraint and index CREATE statements against Neo4j.
    Returns a summary dict with counts of applied statements.
    """
    results = {"constraints": [], "indexes": [], "errors": []}

    for stmt in CONSTRAINTS:
        try:
            await session.run(stmt)
            results["constraints"].append(stmt.split("FOR")[0].strip())
        except Exception as e:
            results["errors"].append({"statement": stmt, "error": str(e)})

    for stmt in INDEXES:
        try:
            await session.run(stmt)
            results["indexes"].append(stmt.split("FOR")[0].strip())
        except Exception as e:
            results["errors"].append({"statement": stmt, "error": str(e)})

    return {
        "constraints_applied": len(results["constraints"]),
        "indexes_applied": len(results["indexes"]),
        "errors": results["errors"],
    }
