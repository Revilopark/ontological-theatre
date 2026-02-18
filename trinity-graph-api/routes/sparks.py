"""
routes/sparks.py — The Collision Engine.
Collides two characters at a place/time, computes convergence score,
creates a Spark node with a rich narrative prompt.
"""

import math
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from neo4j import AsyncSession
from pydantic import BaseModel, Field

from config import db_session
from schema import ITY_FIELDS, PATHY_FIELDS

router = APIRouter(prefix="/sparks", tags=["sparks"])


# ---------------------------------------------------------------------------
# Convergence maths (mirror of characters.py for standalone use)
# ---------------------------------------------------------------------------

def _cosine_similarity(a: List[float], b: List[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    mag_a = math.sqrt(sum(x ** 2 for x in a))
    mag_b = math.sqrt(sum(x ** 2 for x in b))
    if mag_a == 0 or mag_b == 0:
        return 0.0
    return dot / (mag_a * mag_b)


def _ity_values(c: dict) -> List[float]:
    return [c.get(f, 0.5) for f in ITY_FIELDS]


def _pathy_values(c: dict) -> List[float]:
    return [c.get(f, 0.5) for f in PATHY_FIELDS]


def compute_convergence(char_a: dict, char_b: dict) -> tuple[float, float, float]:
    """Returns (convergence_score, ity_score, pathy_score)."""
    a_ity, b_ity = _ity_values(char_a), _ity_values(char_b)
    n = len(ITY_FIELDS)
    ity_score = sum(a * (1 - b) + b * (1 - a) for a, b in zip(a_ity, b_ity)) / (2 * n)

    a_pathy, b_pathy = _pathy_values(char_a), _pathy_values(char_b)
    pathy_score = _cosine_similarity(a_pathy, b_pathy)

    score = ity_score * 0.6 + pathy_score * 0.4
    return round(score, 6), round(ity_score, 6), round(pathy_score, 6)


# ---------------------------------------------------------------------------
# Narrative prompt builder
# ---------------------------------------------------------------------------

def _top_n(char: dict, fields: List[str], n: int = 3) -> List[str]:
    """Return field names with the highest scores."""
    scored = [(f, char.get(f, 0.5)) for f in fields]
    return [f for f, _ in sorted(scored, key=lambda x: x[1], reverse=True)[:n]]


def build_narrative_prompt(
    char_a: dict,
    char_b: dict,
    place: Optional[dict],
    era: Optional[dict],
    convergence_score: float,
    ity_score: float,
    pathy_score: float,
) -> str:
    a_name = char_a.get("name", "Character A")
    b_name = char_b.get("name", "Character B")
    place_name = place.get("name", "an unnamed place") if place else "an undefined space"
    era_name = era.get("name", "an unspecified era") if era else "an unspecified era"

    a_top_ity = _top_n(char_a, ITY_FIELDS, 3)
    b_top_ity = _top_n(char_b, ITY_FIELDS, 3)
    a_top_pathy = _top_n(char_a, PATHY_FIELDS, 3)
    b_top_pathy = _top_n(char_b, PATHY_FIELDS, 3)

    tension_level = (
        "electric" if convergence_score > 0.75
        else "charged" if convergence_score > 0.55
        else "tentative" if convergence_score > 0.35
        else "cold"
    )

    a_bio = char_a.get("biography", "")
    b_bio = char_b.get("biography", "")
    a_visual = char_a.get("visual_description", "")
    b_visual = char_b.get("visual_description", "")

    place_desc = ""
    if place:
        sensory_parts = []
        if place.get("sensory_temperature", 0.5) > 0.7:
            sensory_parts.append("sweltering heat")
        elif place.get("sensory_temperature", 0.5) < 0.3:
            sensory_parts.append("biting cold")
        if place.get("sensory_danger", 0.5) > 0.6:
            sensory_parts.append("palpable danger")
        if place.get("sensory_possibility", 0.5) > 0.6:
            sensory_parts.append("charged with possibility")
        if sensory_parts:
            place_desc = f" The environment carries {', '.join(sensory_parts)}."

    prompt = f"""ONTOLOGICAL COLLISION EVENT

ERA: {era_name}
LOCATION: {place_name}{place_desc}
CONVERGENCE SCORE: {convergence_score:.3f} ({tension_level} encounter)
  ↳ Ontological tension (ity): {ity_score:.3f}
  ↳ Emotional resonance (pathy): {pathy_score:.3f}

COLLISION PARTICIPANTS:

{a_name.upper()}
{f'Biography: {a_bio}' if a_bio else ''}
{f'Appearance: {a_visual}' if a_visual else ''}
Dominant -ity qualities: {', '.join(a_top_ity)}
Dominant -pathy qualities: {', '.join(a_top_pathy)}

{b_name.upper()}
{f'Biography: {b_bio}' if b_bio else ''}
{f'Appearance: {b_visual}' if b_visual else ''}
Dominant -ity qualities: {', '.join(b_top_ity)}
Dominant -pathy qualities: {', '.join(b_top_pathy)}

COLLISION PROMPT:
Write a scene where {a_name} and {b_name} encounter each other in {place_name} during {era_name}. 
Their meeting is {tension_level} — shaped by the contrast between {a_name}'s {a_top_ity[0]} and {b_name}'s {b_top_ity[0]},
and a shared resonance of {a_top_pathy[0]} and {b_top_pathy[0]}.
Focus on gesture, materiality, and the unsaid. What object passes between them? 
What does each character want that the other cannot give?"""

    return prompt.strip()


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

class CollideRequest(BaseModel):
    character_a_id: str
    character_b_id: str
    place_id: Optional[str] = None
    era_id: Optional[str] = None
    world_id: Optional[str] = None


class SparkResponse(BaseModel):
    id: str
    character_a_id: str
    character_b_id: str
    place_id: Optional[str] = None
    era_id: Optional[str] = None
    world_id: Optional[str] = None
    narrative: str
    convergence_score: float
    ity_score: float
    pathy_score: float
    timestamp: str
    generated_image_url: Optional[str] = None


class SparkDetail(SparkResponse):
    character_a: Optional[dict] = None
    character_b: Optional[dict] = None
    place: Optional[dict] = None
    generated_content: List[dict] = []


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/collide", response_model=SparkResponse, status_code=status.HTTP_201_CREATED)
async def collide(
    body: CollideRequest,
    session: AsyncSession = Depends(db_session),
):
    # Fetch both characters
    char_result = await session.run(
        """
        MATCH (a:Character {id: $a_id})
        MATCH (b:Character {id: $b_id})
        RETURN a, b
        """,
        a_id=body.character_a_id,
        b_id=body.character_b_id,
    )
    char_record = await char_result.single()
    if not char_record:
        raise HTTPException(status_code=404, detail="One or both characters not found")

    char_a = dict(char_record["a"])
    char_b = dict(char_record["b"])

    # Resolve world_id
    world_id = body.world_id or char_a.get("world_id")

    # Fetch place (optional)
    place = None
    if body.place_id:
        place_result = await session.run(
            "MATCH (p:Place {id: $id}) RETURN p LIMIT 1", id=body.place_id
        )
        place_record = await place_result.single()
        if place_record:
            place = dict(place_record["p"])

    # Fetch era (optional)
    era = None
    if body.era_id:
        era_result = await session.run(
            "MATCH (e:Era {id: $id}) RETURN e LIMIT 1", id=body.era_id
        )
        era_record = await era_result.single()
        if era_record:
            era = dict(era_record["e"])

    # Compute convergence
    score, ity_score, pathy_score = compute_convergence(char_a, char_b)

    # Build narrative
    narrative = build_narrative_prompt(
        char_a, char_b, place, era, score, ity_score, pathy_score
    )

    # Create Spark node
    spark_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    spark_result = await session.run(
        """
        CREATE (s:Spark {
            id: $id,
            character_a_id: $character_a_id,
            character_b_id: $character_b_id,
            place_id: $place_id,
            era_id: $era_id,
            world_id: $world_id,
            narrative: $narrative,
            convergence_score: $convergence_score,
            ity_score: $ity_score,
            pathy_score: $pathy_score,
            timestamp: $timestamp,
            generated_image_url: null
        })
        WITH s
        MATCH (a:Character {id: $character_a_id})
        MATCH (b:Character {id: $character_b_id})
        MERGE (s)-[:INVOLVES]->(a)
        MERGE (s)-[:INVOLVES]->(b)
        WITH s
        OPTIONAL MATCH (p:Place {id: $place_id})
        FOREACH (_ IN CASE WHEN p IS NOT NULL THEN [1] ELSE [] END |
            MERGE (s)-[:OCCURS_AT]->(p)
        )
        WITH s
        OPTIONAL MATCH (e:Era {id: $era_id})
        FOREACH (_ IN CASE WHEN e IS NOT NULL THEN [1] ELSE [] END |
            MERGE (s)-[:OCCURS_IN]->(e)
        )
        RETURN s
        """,
        id=spark_id,
        character_a_id=body.character_a_id,
        character_b_id=body.character_b_id,
        place_id=body.place_id,
        era_id=body.era_id,
        world_id=world_id,
        narrative=narrative,
        convergence_score=score,
        ity_score=ity_score,
        pathy_score=pathy_score,
        timestamp=now,
    )
    spark_record = await spark_result.single()
    if not spark_record:
        raise HTTPException(status_code=500, detail="Failed to create Spark node")

    spark = dict(spark_record["s"])
    return SparkResponse(**spark)


@router.get("", response_model=List[SparkResponse])
async def list_sparks(
    world_id: Optional[str] = Query(None),
    session: AsyncSession = Depends(db_session),
):
    if world_id:
        result = await session.run(
            "MATCH (s:Spark {world_id: $world_id}) RETURN s ORDER BY s.timestamp DESC",
            world_id=world_id,
        )
    else:
        result = await session.run(
            "MATCH (s:Spark) RETURN s ORDER BY s.timestamp DESC"
        )
    records = await result.data()
    return [SparkResponse(**dict(r["s"])) for r in records]


@router.get("/{spark_id}", response_model=SparkDetail)
async def get_spark(spark_id: str, session: AsyncSession = Depends(db_session)):
    result = await session.run(
        "MATCH (s:Spark {id: $id}) RETURN s", id=spark_id
    )
    record = await result.single()
    if not record:
        raise HTTPException(status_code=404, detail="Spark not found")

    spark = dict(record["s"])

    # Characters
    char_a_result = await session.run(
        "MATCH (c:Character {id: $id}) RETURN c LIMIT 1",
        id=spark.get("character_a_id"),
    )
    ca_rec = await char_a_result.single()
    char_a = dict(ca_rec["c"]) if ca_rec else None

    char_b_result = await session.run(
        "MATCH (c:Character {id: $id}) RETURN c LIMIT 1",
        id=spark.get("character_b_id"),
    )
    cb_rec = await char_b_result.single()
    char_b = dict(cb_rec["c"]) if cb_rec else None

    # Place
    place = None
    if spark.get("place_id"):
        place_result = await session.run(
            "MATCH (p:Place {id: $id}) RETURN p LIMIT 1", id=spark["place_id"]
        )
        p_rec = await place_result.single()
        if p_rec:
            place = dict(p_rec["p"])

    # Generated content
    gc_result = await session.run(
        """
        MATCH (s:Spark {id: $id})-[:GENERATES]->(gc:GeneratedContent)
        RETURN gc ORDER BY gc.created_at DESC
        """,
        id=spark_id,
    )
    generated_content = [dict(r["gc"]) for r in await gc_result.data()]

    return SparkDetail(
        **spark,
        character_a=char_a,
        character_b=char_b,
        place=place,
        generated_content=generated_content,
    )


@router.patch("/{spark_id}/image", response_model=SparkResponse)
async def attach_image(
    spark_id: str,
    image_url: str,
    session: AsyncSession = Depends(db_session),
):
    """Attach a generated image URL to an existing Spark."""
    result = await session.run(
        """
        MATCH (s:Spark {id: $id})
        SET s.generated_image_url = $url
        RETURN s
        """,
        id=spark_id,
        url=image_url,
    )
    record = await result.single()
    if not record:
        raise HTTPException(status_code=404, detail="Spark not found")
    return SparkResponse(**dict(record["s"]))
