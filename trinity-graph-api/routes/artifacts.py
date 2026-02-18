"""
routes/artifacts.py — Artifact CRUD, attach to characters/eras.
"""

import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from neo4j import AsyncSession
from pydantic import BaseModel, Field

from config import db_session

router = APIRouter(prefix="/artifacts", tags=["artifacts"])


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

class ArtifactCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    world_id: str
    type: Optional[str] = None          # painting, sculpture, manuscript, etc.
    era_id: Optional[str] = None
    character_id: Optional[str] = None  # creator
    description: Optional[str] = None
    provenance: Optional[str] = None
    medium: Optional[str] = None
    technique: Optional[str] = None
    style: Optional[str] = None


class ArtifactResponse(BaseModel):
    id: str
    name: str
    world_id: str
    type: Optional[str] = None
    era_id: Optional[str] = None
    character_id: Optional[str] = None
    description: Optional[str] = None
    provenance: Optional[str] = None
    medium: Optional[str] = None
    technique: Optional[str] = None
    style: Optional[str] = None


class ArtifactDetail(ArtifactResponse):
    creator: Optional[dict] = None
    era: Optional[dict] = None
    generated_content: List[dict] = []


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("", response_model=ArtifactResponse, status_code=status.HTTP_201_CREATED)
async def create_artifact(
    body: ArtifactCreate,
    session: AsyncSession = Depends(db_session),
):
    artifact_id = str(uuid.uuid4())

    result = await session.run(
        """
        CREATE (a:Artifact {
            id: $id,
            name: $name,
            world_id: $world_id,
            type: $type,
            era_id: $era_id,
            character_id: $character_id,
            description: $description,
            provenance: $provenance,
            medium: $medium,
            technique: $technique,
            style: $style
        })
        WITH a
        OPTIONAL MATCH (c:Character {id: $character_id})
        FOREACH (_ IN CASE WHEN c IS NOT NULL THEN [1] ELSE [] END |
            MERGE (c)-[:CREATED]->(a)
        )
        WITH a
        OPTIONAL MATCH (e:Era {id: $era_id})
        FOREACH (_ IN CASE WHEN e IS NOT NULL THEN [1] ELSE [] END |
            MERGE (a)-[:FROM_ERA]->(e)
        )
        RETURN a
        """,
        id=artifact_id,
        name=body.name,
        world_id=body.world_id,
        type=body.type,
        era_id=body.era_id,
        character_id=body.character_id,
        description=body.description,
        provenance=body.provenance,
        medium=body.medium,
        technique=body.technique,
        style=body.style,
    )
    record = await result.single()
    if not record:
        raise HTTPException(status_code=500, detail="Failed to create artifact")

    return ArtifactResponse(**dict(record["a"]))


@router.get("", response_model=List[ArtifactResponse])
async def list_artifacts(
    world_id: Optional[str] = Query(None),
    era_id: Optional[str] = Query(None),
    character_id: Optional[str] = Query(None),
    session: AsyncSession = Depends(db_session),
):
    filters = []
    params = {}
    if world_id:
        filters.append("a.world_id = $world_id")
        params["world_id"] = world_id
    if era_id:
        filters.append("a.era_id = $era_id")
        params["era_id"] = era_id
    if character_id:
        filters.append("a.character_id = $character_id")
        params["character_id"] = character_id

    where = f"WHERE {' AND '.join(filters)}" if filters else ""
    result = await session.run(
        f"MATCH (a:Artifact) {where} RETURN a ORDER BY a.name",
        **params,
    )
    records = await result.data()
    return [ArtifactResponse(**dict(r["a"])) for r in records]


@router.get("/{artifact_id}", response_model=ArtifactDetail)
async def get_artifact(artifact_id: str, session: AsyncSession = Depends(db_session)):
    result = await session.run(
        "MATCH (a:Artifact {id: $id}) RETURN a", id=artifact_id
    )
    record = await result.single()
    if not record:
        raise HTTPException(status_code=404, detail="Artifact not found")

    artifact = dict(record["a"])

    # Creator
    creator_result = await session.run(
        """
        MATCH (c:Character)-[:CREATED]->(a:Artifact {id: $id})
        RETURN c.id AS id, c.name AS name LIMIT 1
        """,
        id=artifact_id,
    )
    creator_record = await creator_result.single()
    creator = dict(creator_record) if creator_record else None

    # Era
    era_result = await session.run(
        """
        MATCH (a:Artifact {id: $id})-[:FROM_ERA]->(e:Era)
        RETURN e LIMIT 1
        """,
        id=artifact_id,
    )
    era_record = await era_result.single()
    era = dict(era_record["e"]) if era_record else None

    # Generated content linked to artifact's character/place
    gc_result = await session.run(
        """
        MATCH (gc:GeneratedContent {character_id: $id})
        RETURN gc LIMIT 10
        """,
        id=artifact.get("character_id"),
    )
    generated_content = [dict(r["gc"]) for r in await gc_result.data()]

    return ArtifactDetail(
        **artifact,
        creator=creator,
        era=era,
        generated_content=generated_content,
    )


@router.delete("/{artifact_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_artifact(artifact_id: str, session: AsyncSession = Depends(db_session)):
    check = await session.run(
        "MATCH (a:Artifact {id: $id}) RETURN a.id", id=artifact_id
    )
    if not await check.single():
        raise HTTPException(status_code=404, detail="Artifact not found")
    await session.run(
        "MATCH (a:Artifact {id: $id}) DETACH DELETE a", id=artifact_id
    )
