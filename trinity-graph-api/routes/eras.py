"""
routes/eras.py — Era and Lineage CRUD (supporting types for World).
"""

import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from neo4j import AsyncSession
from pydantic import BaseModel, Field

from config import db_session

router = APIRouter(tags=["eras & lineages"])


# ---------------------------------------------------------------------------
# ERA models
# ---------------------------------------------------------------------------

class EraCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    world_id: str
    start_year: Optional[int] = None
    end_year: Optional[int] = None
    description: Optional[str] = None


class EraResponse(BaseModel):
    id: str
    name: str
    world_id: str
    start_year: Optional[int] = None
    end_year: Optional[int] = None
    description: Optional[str] = None


# ---------------------------------------------------------------------------
# LINEAGE models
# ---------------------------------------------------------------------------

class LineageCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    world_id: str
    archetype: Optional[str] = None
    description: Optional[str] = None


class LineageResponse(BaseModel):
    id: str
    name: str
    world_id: str
    archetype: Optional[str] = None
    description: Optional[str] = None


# ---------------------------------------------------------------------------
# ERA endpoints
# ---------------------------------------------------------------------------

@router.post("/eras", response_model=EraResponse, status_code=status.HTTP_201_CREATED)
async def create_era(body: EraCreate, session: AsyncSession = Depends(db_session)):
    era_id = str(uuid.uuid4())

    result = await session.run(
        """
        CREATE (e:Era {
            id: $id, name: $name, world_id: $world_id,
            start_year: $start_year, end_year: $end_year, description: $description
        })
        WITH e
        MATCH (w:World {id: $world_id})
        MERGE (w)-[:CONTAINS_ERA]->(e)
        RETURN e
        """,
        id=era_id,
        name=body.name,
        world_id=body.world_id,
        start_year=body.start_year,
        end_year=body.end_year,
        description=body.description,
    )
    record = await result.single()
    if not record:
        raise HTTPException(status_code=500, detail="Failed to create era")
    return EraResponse(**dict(record["e"]))


@router.get("/eras", response_model=List[EraResponse])
async def list_eras(
    world_id: Optional[str] = Query(None),
    session: AsyncSession = Depends(db_session),
):
    if world_id:
        result = await session.run(
            "MATCH (e:Era {world_id: $world_id}) RETURN e ORDER BY e.start_year",
            world_id=world_id,
        )
    else:
        result = await session.run("MATCH (e:Era) RETURN e ORDER BY e.name")
    records = await result.data()
    return [EraResponse(**dict(r["e"])) for r in records]


@router.get("/eras/{era_id}", response_model=EraResponse)
async def get_era(era_id: str, session: AsyncSession = Depends(db_session)):
    result = await session.run("MATCH (e:Era {id: $id}) RETURN e", id=era_id)
    record = await result.single()
    if not record:
        raise HTTPException(status_code=404, detail="Era not found")
    return EraResponse(**dict(record["e"]))


@router.delete("/eras/{era_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_era(era_id: str, session: AsyncSession = Depends(db_session)):
    check = await session.run("MATCH (e:Era {id: $id}) RETURN e.id", id=era_id)
    if not await check.single():
        raise HTTPException(status_code=404, detail="Era not found")
    await session.run("MATCH (e:Era {id: $id}) DETACH DELETE e", id=era_id)


# ---------------------------------------------------------------------------
# LINEAGE endpoints
# ---------------------------------------------------------------------------

@router.post("/lineages", response_model=LineageResponse, status_code=status.HTTP_201_CREATED)
async def create_lineage(body: LineageCreate, session: AsyncSession = Depends(db_session)):
    lin_id = str(uuid.uuid4())

    result = await session.run(
        """
        CREATE (l:Lineage {
            id: $id, name: $name, world_id: $world_id,
            archetype: $archetype, description: $description
        })
        WITH l
        MATCH (w:World {id: $world_id})
        MERGE (w)-[:HAS_LINEAGE]->(l)
        RETURN l
        """,
        id=lin_id,
        name=body.name,
        world_id=body.world_id,
        archetype=body.archetype,
        description=body.description,
    )
    record = await result.single()
    if not record:
        raise HTTPException(status_code=500, detail="Failed to create lineage")
    return LineageResponse(**dict(record["l"]))


@router.get("/lineages", response_model=List[LineageResponse])
async def list_lineages(
    world_id: Optional[str] = Query(None),
    session: AsyncSession = Depends(db_session),
):
    if world_id:
        result = await session.run(
            "MATCH (l:Lineage {world_id: $world_id}) RETURN l ORDER BY l.name",
            world_id=world_id,
        )
    else:
        result = await session.run("MATCH (l:Lineage) RETURN l ORDER BY l.name")
    records = await result.data()
    return [LineageResponse(**dict(r["l"])) for r in records]


@router.get("/lineages/{lineage_id}", response_model=LineageResponse)
async def get_lineage(lineage_id: str, session: AsyncSession = Depends(db_session)):
    result = await session.run("MATCH (l:Lineage {id: $id}) RETURN l", id=lineage_id)
    record = await result.single()
    if not record:
        raise HTTPException(status_code=404, detail="Lineage not found")
    return LineageResponse(**dict(record["l"]))


@router.delete("/lineages/{lineage_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lineage(lineage_id: str, session: AsyncSession = Depends(db_session)):
    check = await session.run("MATCH (l:Lineage {id: $id}) RETURN l.id", id=lineage_id)
    if not await check.single():
        raise HTTPException(status_code=404, detail="Lineage not found")
    await session.run("MATCH (l:Lineage {id: $id}) DETACH DELETE l", id=lineage_id)


# ---------------------------------------------------------------------------
# VOICE PROFILE endpoints
# ---------------------------------------------------------------------------

class VoiceProfileCreate(BaseModel):
    character_id: str
    timbre: Optional[str] = None
    pitch: Optional[str] = None
    accent: Optional[str] = None
    speech_pattern: Optional[str] = None
    elevenlabs_voice_id: Optional[str] = None


class VoiceProfileResponse(BaseModel):
    id: str
    character_id: str
    timbre: Optional[str] = None
    pitch: Optional[str] = None
    accent: Optional[str] = None
    speech_pattern: Optional[str] = None
    elevenlabs_voice_id: Optional[str] = None


@router.post("/voice-profiles", response_model=VoiceProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_voice_profile(
    body: VoiceProfileCreate,
    session: AsyncSession = Depends(db_session),
):
    # Verify character
    check = await session.run(
        "MATCH (c:Character {id: $id}) RETURN c.id", id=body.character_id
    )
    if not await check.single():
        raise HTTPException(status_code=404, detail="Character not found")

    vp_id = str(uuid.uuid4())
    result = await session.run(
        """
        MATCH (c:Character {id: $character_id})
        MERGE (c)-[:HAS_VOICE]->(vp:VoiceProfile {character_id: $character_id})
        ON CREATE SET vp.id = $id, vp.timbre = $timbre, vp.pitch = $pitch,
                      vp.accent = $accent, vp.speech_pattern = $speech_pattern,
                      vp.elevenlabs_voice_id = $elevenlabs_voice_id
        ON MATCH SET  vp.timbre = $timbre, vp.pitch = $pitch,
                      vp.accent = $accent, vp.speech_pattern = $speech_pattern,
                      vp.elevenlabs_voice_id = $elevenlabs_voice_id
        RETURN vp
        """,
        id=vp_id,
        character_id=body.character_id,
        timbre=body.timbre,
        pitch=body.pitch,
        accent=body.accent,
        speech_pattern=body.speech_pattern,
        elevenlabs_voice_id=body.elevenlabs_voice_id,
    )
    record = await result.single()
    if not record:
        raise HTTPException(status_code=500, detail="Failed to create voice profile")
    return VoiceProfileResponse(**dict(record["vp"]))


@router.get("/voice-profiles/{character_id}", response_model=VoiceProfileResponse)
async def get_voice_profile(character_id: str, session: AsyncSession = Depends(db_session)):
    result = await session.run(
        "MATCH (vp:VoiceProfile {character_id: $id}) RETURN vp LIMIT 1",
        id=character_id,
    )
    record = await result.single()
    if not record:
        raise HTTPException(status_code=404, detail="Voice profile not found")
    return VoiceProfileResponse(**dict(record["vp"]))
