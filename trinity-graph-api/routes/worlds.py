"""
routes/worlds.py — CRUD for World nodes.
"""

import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from neo4j import AsyncSession
from pydantic import BaseModel, Field

from config import db_session

router = APIRouter(prefix="/worlds", tags=["worlds"])


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

class WorldCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None


class WorldResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    created_at: str


class WorldDetail(WorldResponse):
    eras: List[dict] = []
    lineages: List[dict] = []
    stats: dict = {}


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("", response_model=WorldResponse, status_code=status.HTTP_201_CREATED)
async def create_world(
    body: WorldCreate,
    session: AsyncSession = Depends(db_session),
):
    world_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    result = await session.run(
        """
        CREATE (w:World {
            id: $id,
            name: $name,
            description: $description,
            created_at: $created_at
        })
        RETURN w
        """,
        id=world_id,
        name=body.name,
        description=body.description,
        created_at=now,
    )
    record = await result.single()
    if not record:
        raise HTTPException(status_code=500, detail="Failed to create world")

    node = dict(record["w"])
    return WorldResponse(**node)


@router.get("", response_model=List[WorldResponse])
async def list_worlds(session: AsyncSession = Depends(db_session)):
    result = await session.run(
        "MATCH (w:World) RETURN w ORDER BY w.created_at DESC"
    )
    records = await result.data()
    return [WorldResponse(**dict(r["w"])) for r in records]


@router.get("/{world_id}", response_model=WorldDetail)
async def get_world(world_id: str, session: AsyncSession = Depends(db_session)):
    # Fetch base world
    result = await session.run(
        "MATCH (w:World {id: $id}) RETURN w", id=world_id
    )
    record = await result.single()
    if not record:
        raise HTTPException(status_code=404, detail="World not found")

    world = dict(record["w"])

    # Fetch eras
    eras_result = await session.run(
        """
        MATCH (w:World {id: $id})-[:CONTAINS_ERA]->(e:Era)
        RETURN e ORDER BY e.start_year ASC
        """,
        id=world_id,
    )
    eras = [dict(r["e"]) for r in await eras_result.data()]

    # Fetch lineages
    lin_result = await session.run(
        """
        MATCH (w:World {id: $id})-[:HAS_LINEAGE]->(l:Lineage)
        RETURN l ORDER BY l.name ASC
        """,
        id=world_id,
    )
    lineages = [dict(r["l"]) for r in await lin_result.data()]

    # Stats
    stats_result = await session.run(
        """
        MATCH (w:World {id: $id})
        OPTIONAL MATCH (c:Character {world_id: $id})
        OPTIONAL MATCH (p:Place {world_id: $id})
        OPTIONAL MATCH (s:Spark {world_id: $id})
        OPTIONAL MATCH (a:Artifact {world_id: $id})
        RETURN
            count(DISTINCT c) AS characters,
            count(DISTINCT p) AS places,
            count(DISTINCT s) AS sparks,
            count(DISTINCT a) AS artifacts
        """,
        id=world_id,
    )
    stats_record = await stats_result.single()
    stats = dict(stats_record) if stats_record else {}

    return WorldDetail(
        **world,
        eras=eras,
        lineages=lineages,
        stats=stats,
    )


@router.delete("/{world_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_world(world_id: str, session: AsyncSession = Depends(db_session)):
    # Verify world exists
    check = await session.run(
        "MATCH (w:World {id: $id}) RETURN w.id", id=world_id
    )
    record = await check.single()
    if not record:
        raise HTTPException(status_code=404, detail="World not found")

    # Delete world and all contained nodes via world_id property
    await session.run(
        """
        MATCH (n)
        WHERE n.world_id = $id OR (n:World AND n.id = $id)
        DETACH DELETE n
        """,
        id=world_id,
    )
