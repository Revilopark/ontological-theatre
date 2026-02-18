"""
routes/characters.py — Character CRUD with full -ity/-pathy properties.
"""

import math
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from neo4j import AsyncSession
from pydantic import BaseModel, Field, field_validator

from config import db_session
from schema import ITY_FIELDS, PATHY_FIELDS

router = APIRouter(prefix="/characters", tags=["characters"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _ity_defaults() -> dict:
    return {f: 0.5 for f in ITY_FIELDS}


def _pathy_defaults() -> dict:
    return {f: 0.5 for f in PATHY_FIELDS}


def _validate_score(v: Optional[float]) -> Optional[float]:
    if v is not None and not (0.0 <= v <= 1.0):
        raise ValueError("Score must be between 0.0 and 1.0")
    return v


def _build_scalar_fields(data: dict) -> dict:
    """Extract -ity/-pathy values from a flat dict, defaulting missing to 0.5."""
    out = {}
    for f in ITY_FIELDS + PATHY_FIELDS:
        out[f] = data.get(f, 0.5)
    return out


def _ity_values(char: dict) -> List[float]:
    return [char.get(f, 0.5) for f in ITY_FIELDS]


def _pathy_values(char: dict) -> List[float]:
    return [char.get(f, 0.5) for f in PATHY_FIELDS]


def _cosine_similarity(a: List[float], b: List[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    mag_a = math.sqrt(sum(x ** 2 for x in a))
    mag_b = math.sqrt(sum(x ** 2 for x in b))
    if mag_a == 0 or mag_b == 0:
        return 0.0
    return dot / (mag_a * mag_b)


def convergence_score(char_a: dict, char_b: dict) -> float:
    """
    Convergence = tension (ity complementarity) × resonance (pathy similarity).
    ity_score:   dot product of complementarity (a*(1-b) + b*(1-a))
    pathy_score: cosine similarity of pathy vectors
    """
    a_ity = _ity_values(char_a)
    b_ity = _ity_values(char_b)
    n = len(ITY_FIELDS)
    ity_score = sum(a * (1 - b) + b * (1 - a) for a, b in zip(a_ity, b_ity)) / (2 * n)

    a_pathy = _pathy_values(char_a)
    b_pathy = _pathy_values(char_b)
    pathy_score = _cosine_similarity(a_pathy, b_pathy)

    return round(ity_score * 0.6 + pathy_score * 0.4, 6)


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

class ScalarScores(BaseModel):
    # -ity fields
    materiality: float = Field(0.5, ge=0.0, le=1.0)
    vitality: float = Field(0.5, ge=0.0, le=1.0)
    interiority: float = Field(0.5, ge=0.0, le=1.0)
    criticality: float = Field(0.5, ge=0.0, le=1.0)
    connectivity: float = Field(0.5, ge=0.0, le=1.0)
    lucidity: float = Field(0.5, ge=0.0, le=1.0)
    necessity: float = Field(0.5, ge=0.0, le=1.0)
    reciprocity: float = Field(0.5, ge=0.0, le=1.0)
    totality: float = Field(0.5, ge=0.0, le=1.0)
    continuity: float = Field(0.5, ge=0.0, le=1.0)
    authenticity: float = Field(0.5, ge=0.0, le=1.0)
    luminosity: float = Field(0.5, ge=0.0, le=1.0)
    viscosity: float = Field(0.5, ge=0.0, le=1.0)
    permanence: float = Field(0.5, ge=0.0, le=1.0)
    workability: float = Field(0.5, ge=0.0, le=1.0)
    spontaneity: float = Field(0.5, ge=0.0, le=1.0)
    complexity: float = Field(0.5, ge=0.0, le=1.0)
    resilience: float = Field(0.5, ge=0.0, le=1.0)
    integrity: float = Field(0.5, ge=0.0, le=1.0)
    serendipity: float = Field(0.5, ge=0.0, le=1.0)
    clarity: float = Field(0.5, ge=0.0, le=1.0)
    certainty: float = Field(0.5, ge=0.0, le=1.0)
    sagacity: float = Field(0.5, ge=0.0, le=1.0)
    felicity: float = Field(0.5, ge=0.0, le=1.0)
    propensity: float = Field(0.5, ge=0.0, le=1.0)
    familiarity: float = Field(0.5, ge=0.0, le=1.0)
    synchronicity: float = Field(0.5, ge=0.0, le=1.0)
    ubiquity: float = Field(0.5, ge=0.0, le=1.0)
    curiosity: float = Field(0.5, ge=0.0, le=1.0)
    creativity: float = Field(0.5, ge=0.0, le=1.0)
    # -pathy fields
    empathy: float = Field(0.5, ge=0.0, le=1.0)
    sympathy: float = Field(0.5, ge=0.0, le=1.0)
    apathy: float = Field(0.5, ge=0.0, le=1.0)
    antipathy: float = Field(0.5, ge=0.0, le=1.0)
    telepathy: float = Field(0.5, ge=0.0, le=1.0)
    tactility: float = Field(0.5, ge=0.0, le=1.0)
    sensuosity: float = Field(0.5, ge=0.0, le=1.0)
    immediacy: float = Field(0.5, ge=0.0, le=1.0)
    gestural_energy: float = Field(0.5, ge=0.0, le=1.0)
    pathos: float = Field(0.5, ge=0.0, le=1.0)
    ethos: float = Field(0.5, ge=0.0, le=1.0)
    logos: float = Field(0.5, ge=0.0, le=1.0)
    nostalgia: float = Field(0.5, ge=0.0, le=1.0)
    melancholy: float = Field(0.5, ge=0.0, le=1.0)
    euphoria: float = Field(0.5, ge=0.0, le=1.0)
    anxiety: float = Field(0.5, ge=0.0, le=1.0)
    tranquility: float = Field(0.5, ge=0.0, le=1.0)
    intensity: float = Field(0.5, ge=0.0, le=1.0)
    fragility: float = Field(0.5, ge=0.0, le=1.0)
    audacity: float = Field(0.5, ge=0.0, le=1.0)


class CharacterCreate(ScalarScores):
    name: str = Field(..., min_length=1, max_length=255)
    world_id: str
    era_id: Optional[str] = None
    lineage_id: Optional[str] = None
    biography: Optional[str] = None
    visual_description: Optional[str] = None
    voice_description: Optional[str] = None


class CharacterUpdate(ScalarScores):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    era_id: Optional[str] = None
    lineage_id: Optional[str] = None
    biography: Optional[str] = None
    visual_description: Optional[str] = None
    voice_description: Optional[str] = None


class RelateRequest(BaseModel):
    target_character_id: str
    relationship_type: str = Field(..., min_length=1, max_length=100)
    weight: float = Field(0.5, ge=0.0, le=1.0)


class CharacterResponse(BaseModel):
    id: str
    name: str
    world_id: str
    era_id: Optional[str] = None
    lineage_id: Optional[str] = None
    biography: Optional[str] = None
    visual_description: Optional[str] = None
    voice_description: Optional[str] = None
    created_at: str
    # scalar scores
    materiality: float = 0.5
    vitality: float = 0.5
    interiority: float = 0.5
    criticality: float = 0.5
    connectivity: float = 0.5
    lucidity: float = 0.5
    necessity: float = 0.5
    reciprocity: float = 0.5
    totality: float = 0.5
    continuity: float = 0.5
    authenticity: float = 0.5
    luminosity: float = 0.5
    viscosity: float = 0.5
    permanence: float = 0.5
    workability: float = 0.5
    spontaneity: float = 0.5
    complexity: float = 0.5
    resilience: float = 0.5
    integrity: float = 0.5
    serendipity: float = 0.5
    clarity: float = 0.5
    certainty: float = 0.5
    sagacity: float = 0.5
    felicity: float = 0.5
    propensity: float = 0.5
    familiarity: float = 0.5
    synchronicity: float = 0.5
    ubiquity: float = 0.5
    curiosity: float = 0.5
    creativity: float = 0.5
    empathy: float = 0.5
    sympathy: float = 0.5
    apathy: float = 0.5
    antipathy: float = 0.5
    telepathy: float = 0.5
    tactility: float = 0.5
    sensuosity: float = 0.5
    immediacy: float = 0.5
    gestural_energy: float = 0.5
    pathos: float = 0.5
    ethos: float = 0.5
    logos: float = 0.5
    nostalgia: float = 0.5
    melancholy: float = 0.5
    euphoria: float = 0.5
    anxiety: float = 0.5
    tranquility: float = 0.5
    intensity: float = 0.5
    fragility: float = 0.5
    audacity: float = 0.5


class CharacterDetail(CharacterResponse):
    relationships: List[dict] = []
    garments: List[dict] = []
    artifacts: List[dict] = []
    voice_profile: Optional[dict] = None


class ConvergenceResponse(BaseModel):
    character_a_id: str
    character_b_id: str
    convergence_score: float
    ity_score: float
    pathy_score: float


# ---------------------------------------------------------------------------
# Build Cypher SET clause for all scalar properties
# ---------------------------------------------------------------------------

def _scalar_set_clause(prefix: str = "c") -> str:
    parts = [f"{prefix}.{f} = ${f}" for f in ITY_FIELDS + PATHY_FIELDS]
    return ", ".join(parts)


def _scalar_params(body) -> dict:
    return {f: getattr(body, f, 0.5) for f in ITY_FIELDS + PATHY_FIELDS}


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("", response_model=CharacterResponse, status_code=status.HTTP_201_CREATED)
async def create_character(
    body: CharacterCreate,
    session: AsyncSession = Depends(db_session),
):
    char_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    params = {
        "id": char_id,
        "name": body.name,
        "world_id": body.world_id,
        "era_id": body.era_id,
        "lineage_id": body.lineage_id,
        "biography": body.biography,
        "visual_description": body.visual_description,
        "voice_description": body.voice_description,
        "created_at": now,
    }
    params.update(_scalar_params(body))

    scalar_sets = _scalar_set_clause("c")

    result = await session.run(
        f"""
        CREATE (c:Character {{
            id: $id, name: $name,
            world_id: $world_id, era_id: $era_id, lineage_id: $lineage_id,
            biography: $biography, visual_description: $visual_description,
            voice_description: $voice_description, created_at: $created_at
        }})
        SET {scalar_sets}
        WITH c
        MATCH (w:World {{id: $world_id}})
        MERGE (c)-[:BELONGS_TO]->(w)
        WITH c
        OPTIONAL MATCH (e:Era {{id: $era_id}})
        FOREACH (_ IN CASE WHEN e IS NOT NULL THEN [1] ELSE [] END |
            MERGE (c)-[:EXISTS_IN]->(e)
        )
        WITH c
        OPTIONAL MATCH (l:Lineage {{id: $lineage_id}})
        FOREACH (_ IN CASE WHEN l IS NOT NULL THEN [1] ELSE [] END |
            MERGE (c)-[:OF_LINEAGE]->(l)
        )
        RETURN c
        """,
        **params,
    )
    record = await result.single()
    if not record:
        raise HTTPException(status_code=500, detail="Failed to create character")

    return CharacterResponse(**dict(record["c"]))


@router.get("", response_model=List[CharacterResponse])
async def list_characters(
    world_id: Optional[str] = Query(None),
    session: AsyncSession = Depends(db_session),
):
    if world_id:
        result = await session.run(
            "MATCH (c:Character {world_id: $world_id}) RETURN c ORDER BY c.name",
            world_id=world_id,
        )
    else:
        result = await session.run(
            "MATCH (c:Character) RETURN c ORDER BY c.name"
        )
    records = await result.data()
    return [CharacterResponse(**dict(r["c"])) for r in records]


@router.get("/{character_id}", response_model=CharacterDetail)
async def get_character(character_id: str, session: AsyncSession = Depends(db_session)):
    result = await session.run(
        "MATCH (c:Character {id: $id}) RETURN c", id=character_id
    )
    record = await result.single()
    if not record:
        raise HTTPException(status_code=404, detail="Character not found")

    char = dict(record["c"])

    # Relationships
    rel_result = await session.run(
        """
        MATCH (c:Character {id: $id})-[r:KNOWS]->(other:Character)
        RETURN other.id AS target_id, other.name AS target_name,
               r.relationship_type AS relationship_type, r.weight AS weight
        """,
        id=character_id,
    )
    relationships = await rel_result.data()

    # Garments
    garm_result = await session.run(
        """
        MATCH (c:Character {id: $id})-[:WEARS]->(g:Garment)
        RETURN g
        """,
        id=character_id,
    )
    garments = [dict(r["g"]) for r in await garm_result.data()]

    # Artifacts
    art_result = await session.run(
        """
        MATCH (c:Character {id: $id})-[:CREATED]->(a:Artifact)
        RETURN a
        """,
        id=character_id,
    )
    artifacts = [dict(r["a"]) for r in await art_result.data()]

    # Voice profile
    voice_result = await session.run(
        """
        MATCH (c:Character {id: $id})-[:HAS_VOICE]->(v:VoiceProfile)
        RETURN v LIMIT 1
        """,
        id=character_id,
    )
    voice_record = await voice_result.single()
    voice_profile = dict(voice_record["v"]) if voice_record else None

    return CharacterDetail(
        **char,
        relationships=relationships,
        garments=garments,
        artifacts=artifacts,
        voice_profile=voice_profile,
    )


@router.put("/{character_id}", response_model=CharacterResponse)
async def update_character(
    character_id: str,
    body: CharacterUpdate,
    session: AsyncSession = Depends(db_session),
):
    # Verify exists
    check = await session.run(
        "MATCH (c:Character {id: $id}) RETURN c.id", id=character_id
    )
    if not await check.single():
        raise HTTPException(status_code=404, detail="Character not found")

    params = {"id": character_id}
    set_parts = []

    if body.name is not None:
        set_parts.append("c.name = $name")
        params["name"] = body.name
    if body.era_id is not None:
        set_parts.append("c.era_id = $era_id")
        params["era_id"] = body.era_id
    if body.lineage_id is not None:
        set_parts.append("c.lineage_id = $lineage_id")
        params["lineage_id"] = body.lineage_id
    if body.biography is not None:
        set_parts.append("c.biography = $biography")
        params["biography"] = body.biography
    if body.visual_description is not None:
        set_parts.append("c.visual_description = $visual_description")
        params["visual_description"] = body.visual_description
    if body.voice_description is not None:
        set_parts.append("c.voice_description = $voice_description")
        params["voice_description"] = body.voice_description

    # Always update scalar fields
    scalar_parts = [f"c.{f} = ${f}" for f in ITY_FIELDS + PATHY_FIELDS]
    set_parts.extend(scalar_parts)
    params.update(_scalar_params(body))

    set_clause = ", ".join(set_parts)
    result = await session.run(
        f"MATCH (c:Character {{id: $id}}) SET {set_clause} RETURN c",
        **params,
    )
    record = await result.single()
    return CharacterResponse(**dict(record["c"]))


@router.post("/{character_id}/relate", status_code=status.HTTP_201_CREATED)
async def relate_characters(
    character_id: str,
    body: RelateRequest,
    session: AsyncSession = Depends(db_session),
):
    result = await session.run(
        """
        MATCH (a:Character {id: $from_id})
        MATCH (b:Character {id: $to_id})
        MERGE (a)-[r:KNOWS {relationship_type: $rel_type}]->(b)
        SET r.weight = $weight
        RETURN a.id AS from_id, b.id AS to_id,
               r.relationship_type AS relationship_type, r.weight AS weight
        """,
        from_id=character_id,
        to_id=body.target_character_id,
        rel_type=body.relationship_type,
        weight=body.weight,
    )
    record = await result.single()
    if not record:
        raise HTTPException(status_code=404, detail="One or both characters not found")
    return dict(record)


@router.get("/{character_id}/convergence/{other_id}", response_model=ConvergenceResponse)
async def get_convergence(
    character_id: str,
    other_id: str,
    session: AsyncSession = Depends(db_session),
):
    result = await session.run(
        """
        MATCH (a:Character {id: $a_id})
        MATCH (b:Character {id: $b_id})
        RETURN a, b
        """,
        a_id=character_id,
        b_id=other_id,
    )
    record = await result.single()
    if not record:
        raise HTTPException(status_code=404, detail="One or both characters not found")

    char_a = dict(record["a"])
    char_b = dict(record["b"])

    # Compute sub-scores for transparency
    a_ity = _ity_values(char_a)
    b_ity = _ity_values(char_b)
    n = len(ITY_FIELDS)
    ity_score = round(
        sum(a * (1 - b) + b * (1 - a) for a, b in zip(a_ity, b_ity)) / (2 * n), 6
    )
    pathy_score = round(_cosine_similarity(_pathy_values(char_a), _pathy_values(char_b)), 6)
    score = round(ity_score * 0.6 + pathy_score * 0.4, 6)

    return ConvergenceResponse(
        character_a_id=character_id,
        character_b_id=other_id,
        convergence_score=score,
        ity_score=ity_score,
        pathy_score=pathy_score,
    )
