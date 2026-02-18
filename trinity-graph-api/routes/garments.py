"""
routes/garments.py — Garment nodes, attached to characters.
"""

import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from neo4j import AsyncSession
from pydantic import BaseModel, Field

from config import db_session

router = APIRouter(prefix="/garments", tags=["garments"])


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

class GarmentCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    character_id: str
    fabric: Optional[str] = None
    weight_gsm: Optional[float] = Field(None, ge=0)
    drape_coefficient: Optional[float] = Field(None, ge=0.0, le=1.0)
    stretch_pct: Optional[float] = Field(None, ge=0.0, le=500.0)
    cost_per_meter: Optional[float] = Field(None, ge=0)
    description: Optional[str] = None
    # Scalar aesthetics
    materiality: float = Field(0.5, ge=0.0, le=1.0)
    luminosity: float = Field(0.5, ge=0.0, le=1.0)
    tactility: float = Field(0.5, ge=0.0, le=1.0)
    sensuosity: float = Field(0.5, ge=0.0, le=1.0)


class GarmentResponse(BaseModel):
    id: str
    name: str
    character_id: str
    fabric: Optional[str] = None
    weight_gsm: Optional[float] = None
    drape_coefficient: Optional[float] = None
    stretch_pct: Optional[float] = None
    cost_per_meter: Optional[float] = None
    description: Optional[str] = None
    materiality: float = 0.5
    luminosity: float = 0.5
    tactility: float = 0.5
    sensuosity: float = 0.5


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("", response_model=GarmentResponse, status_code=status.HTTP_201_CREATED)
async def create_garment(
    body: GarmentCreate,
    session: AsyncSession = Depends(db_session),
):
    # Verify character exists
    check = await session.run(
        "MATCH (c:Character {id: $id}) RETURN c.id", id=body.character_id
    )
    if not await check.single():
        raise HTTPException(status_code=404, detail="Character not found")

    garment_id = str(uuid.uuid4())

    result = await session.run(
        """
        MATCH (c:Character {id: $character_id})
        CREATE (g:Garment {
            id: $id,
            name: $name,
            character_id: $character_id,
            fabric: $fabric,
            weight_gsm: $weight_gsm,
            drape_coefficient: $drape_coefficient,
            stretch_pct: $stretch_pct,
            cost_per_meter: $cost_per_meter,
            description: $description,
            materiality: $materiality,
            luminosity: $luminosity,
            tactility: $tactility,
            sensuosity: $sensuosity
        })
        MERGE (c)-[:WEARS]->(g)
        RETURN g
        """,
        id=garment_id,
        name=body.name,
        character_id=body.character_id,
        fabric=body.fabric,
        weight_gsm=body.weight_gsm,
        drape_coefficient=body.drape_coefficient,
        stretch_pct=body.stretch_pct,
        cost_per_meter=body.cost_per_meter,
        description=body.description,
        materiality=body.materiality,
        luminosity=body.luminosity,
        tactility=body.tactility,
        sensuosity=body.sensuosity,
    )
    record = await result.single()
    if not record:
        raise HTTPException(status_code=500, detail="Failed to create garment")

    return GarmentResponse(**dict(record["g"]))


@router.get("", response_model=List[GarmentResponse])
async def list_garments(
    character_id: Optional[str] = Query(None),
    session: AsyncSession = Depends(db_session),
):
    if character_id:
        result = await session.run(
            "MATCH (g:Garment {character_id: $character_id}) RETURN g ORDER BY g.name",
            character_id=character_id,
        )
    else:
        result = await session.run("MATCH (g:Garment) RETURN g ORDER BY g.name")
    records = await result.data()
    return [GarmentResponse(**dict(r["g"])) for r in records]


@router.get("/{garment_id}", response_model=GarmentResponse)
async def get_garment(garment_id: str, session: AsyncSession = Depends(db_session)):
    result = await session.run(
        "MATCH (g:Garment {id: $id}) RETURN g", id=garment_id
    )
    record = await result.single()
    if not record:
        raise HTTPException(status_code=404, detail="Garment not found")
    return GarmentResponse(**dict(record["g"]))


@router.delete("/{garment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_garment(garment_id: str, session: AsyncSession = Depends(db_session)):
    check = await session.run(
        "MATCH (g:Garment {id: $id}) RETURN g.id", id=garment_id
    )
    if not await check.single():
        raise HTTPException(status_code=404, detail="Garment not found")
    await session.run(
        "MATCH (g:Garment {id: $id}) DETACH DELETE g", id=garment_id
    )
