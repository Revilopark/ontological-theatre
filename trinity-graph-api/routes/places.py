"""
routes/places.py — Environment/Place CRUD with sensory properties.
"""

import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from neo4j import AsyncSession
from pydantic import BaseModel, Field

from config import db_session

router = APIRouter(prefix="/places", tags=["places"])


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

class PlaceCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    world_id: str
    era_id: Optional[str] = None
    description: Optional[str] = None
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)
    # Sensory properties (0.0-1.0)
    sensory_temperature: float = Field(0.5, ge=0.0, le=1.0)
    sensory_sound: float = Field(0.5, ge=0.0, le=1.0)
    sensory_smell: float = Field(0.5, ge=0.0, le=1.0)
    sensory_light: float = Field(0.5, ge=0.0, le=1.0)
    sensory_danger: float = Field(0.5, ge=0.0, le=1.0)
    sensory_possibility: float = Field(0.5, ge=0.0, le=1.0)
    historical_layers: Optional[str] = None


class PlaceResponse(BaseModel):
    id: str
    name: str
    world_id: str
    era_id: Optional[str] = None
    description: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    sensory_temperature: float = 0.5
    sensory_sound: float = 0.5
    sensory_smell: float = 0.5
    sensory_light: float = 0.5
    sensory_danger: float = 0.5
    sensory_possibility: float = 0.5
    historical_layers: Optional[str] = None


class PlaceDetail(PlaceResponse):
    characters_present: List[dict] = []
    sparks: List[dict] = []


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("", response_model=PlaceResponse, status_code=status.HTTP_201_CREATED)
async def create_place(
    body: PlaceCreate,
    session: AsyncSession = Depends(db_session),
):
    place_id = str(uuid.uuid4())

    result = await session.run(
        """
        CREATE (p:Place {
            id: $id,
            name: $name,
            world_id: $world_id,
            era_id: $era_id,
            description: $description,
            latitude: $latitude,
            longitude: $longitude,
            sensory_temperature: $sensory_temperature,
            sensory_sound: $sensory_sound,
            sensory_smell: $sensory_smell,
            sensory_light: $sensory_light,
            sensory_danger: $sensory_danger,
            sensory_possibility: $sensory_possibility,
            historical_layers: $historical_layers
        })
        WITH p
        OPTIONAL MATCH (e:Era {id: $era_id})
        FOREACH (_ IN CASE WHEN e IS NOT NULL THEN [1] ELSE [] END |
            MERGE (p)-[:LOCATED_IN]->(e)
        )
        RETURN p
        """,
        id=place_id,
        name=body.name,
        world_id=body.world_id,
        era_id=body.era_id,
        description=body.description,
        latitude=body.latitude,
        longitude=body.longitude,
        sensory_temperature=body.sensory_temperature,
        sensory_sound=body.sensory_sound,
        sensory_smell=body.sensory_smell,
        sensory_light=body.sensory_light,
        sensory_danger=body.sensory_danger,
        sensory_possibility=body.sensory_possibility,
        historical_layers=body.historical_layers,
    )
    record = await result.single()
    if not record:
        raise HTTPException(status_code=500, detail="Failed to create place")

    return PlaceResponse(**dict(record["p"]))


@router.get("", response_model=List[PlaceResponse])
async def list_places(
    world_id: Optional[str] = Query(None),
    session: AsyncSession = Depends(db_session),
):
    if world_id:
        result = await session.run(
            "MATCH (p:Place {world_id: $world_id}) RETURN p ORDER BY p.name",
            world_id=world_id,
        )
    else:
        result = await session.run("MATCH (p:Place) RETURN p ORDER BY p.name")
    records = await result.data()
    return [PlaceResponse(**dict(r["p"])) for r in records]


@router.get("/{place_id}", response_model=PlaceDetail)
async def get_place(place_id: str, session: AsyncSession = Depends(db_session)):
    result = await session.run(
        "MATCH (p:Place {id: $id}) RETURN p", id=place_id
    )
    record = await result.single()
    if not record:
        raise HTTPException(status_code=404, detail="Place not found")

    place = dict(record["p"])

    # Characters located here
    chars_result = await session.run(
        """
        MATCH (c:Character)-[:LOCATED_AT]->(p:Place {id: $id})
        RETURN c.id AS id, c.name AS name, c.world_id AS world_id
        """,
        id=place_id,
    )
    characters_present = await chars_result.data()

    # Sparks that occurred here
    sparks_result = await session.run(
        """
        MATCH (s:Spark {place_id: $id})
        RETURN s.id AS id, s.character_a_id AS character_a_id,
               s.character_b_id AS character_b_id,
               s.convergence_score AS convergence_score,
               s.timestamp AS timestamp
        ORDER BY s.timestamp DESC
        """,
        id=place_id,
    )
    sparks = await sparks_result.data()

    return PlaceDetail(
        **place,
        characters_present=characters_present,
        sparks=sparks,
    )
