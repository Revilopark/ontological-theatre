"""
routes/ingest.py — Feedback loop: ingest generated content back as nodes.
Supports images, audio, text, and other generated artefacts.
"""

import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from neo4j import AsyncSession
from pydantic import BaseModel, Field, HttpUrl

from config import db_session

router = APIRouter(prefix="/ingest", tags=["ingest"])


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

class IngestCreate(BaseModel):
    type: str = Field(..., description="image | audio | text | video | other")
    url: str = Field(..., description="URL of the generated asset")
    prompt: Optional[str] = None
    source_tool: Optional[str] = None          # e.g. 'fal-ai/flux', 'elevenlabs', 'gpt-4o'
    spark_id: Optional[str] = None             # if generated from a Spark
    character_id: Optional[str] = None         # primary depicted character
    place_id: Optional[str] = None             # depicted place
    # Feedback loop targets
    feedback_character_ids: Optional[List[str]] = Field(
        default=None,
        description="Character IDs to add FEEDBACK_TO edges to"
    )
    depicts_character_ids: Optional[List[str]] = Field(
        default=None,
        description="Character IDs to add DEPICTS edges to"
    )


class IngestResponse(BaseModel):
    id: str
    type: str
    url: str
    prompt: Optional[str] = None
    source_tool: Optional[str] = None
    spark_id: Optional[str] = None
    character_id: Optional[str] = None
    place_id: Optional[str] = None
    created_at: str
    feedback_edges_created: int = 0
    depicts_edges_created: int = 0


class GeneratedContentResponse(BaseModel):
    id: str
    type: str
    url: str
    prompt: Optional[str] = None
    source_tool: Optional[str] = None
    spark_id: Optional[str] = None
    character_id: Optional[str] = None
    place_id: Optional[str] = None
    created_at: str


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("", response_model=IngestResponse, status_code=status.HTTP_201_CREATED)
async def ingest_content(
    body: IngestCreate,
    session: AsyncSession = Depends(db_session),
):
    """
    Create a GeneratedContent node and wire it into the graph:
    - Link to source Spark via [:GENERATES] (from Spark → GC)
    - Link to depicted characters via [:DEPICTS]
    - Link to feedback characters via [:FEEDBACK_TO]
    """
    content_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    # Create the GeneratedContent node
    gc_result = await session.run(
        """
        CREATE (gc:GeneratedContent {
            id: $id,
            type: $type,
            url: $url,
            prompt: $prompt,
            source_tool: $source_tool,
            spark_id: $spark_id,
            character_id: $character_id,
            place_id: $place_id,
            created_at: $created_at
        })
        RETURN gc
        """,
        id=content_id,
        type=body.type,
        url=body.url,
        prompt=body.prompt,
        source_tool=body.source_tool,
        spark_id=body.spark_id,
        character_id=body.character_id,
        place_id=body.place_id,
        created_at=now,
    )
    gc_record = await gc_result.single()
    if not gc_record:
        raise HTTPException(status_code=500, detail="Failed to create GeneratedContent node")

    # Link to Spark (Spark -[:GENERATES]-> GeneratedContent)
    if body.spark_id:
        await session.run(
            """
            MATCH (s:Spark {id: $spark_id})
            MATCH (gc:GeneratedContent {id: $gc_id})
            MERGE (s)-[:GENERATES]->(gc)
            """,
            spark_id=body.spark_id,
            gc_id=content_id,
        )

    # Link to Place (GeneratedContent -[:DEPICTS_PLACE]-> Place)
    if body.place_id:
        await session.run(
            """
            MATCH (p:Place {id: $place_id})
            MATCH (gc:GeneratedContent {id: $gc_id})
            MERGE (gc)-[:DEPICTS_PLACE]->(p)
            """,
            place_id=body.place_id,
            gc_id=content_id,
        )

    # :DEPICTS edges
    depicts_count = 0
    if body.depicts_character_ids:
        for char_id in body.depicts_character_ids:
            dep_result = await session.run(
                """
                MATCH (c:Character {id: $char_id})
                MATCH (gc:GeneratedContent {id: $gc_id})
                MERGE (gc)-[:DEPICTS]->(c)
                RETURN c.id
                """,
                char_id=char_id,
                gc_id=content_id,
            )
            if await dep_result.single():
                depicts_count += 1

    # :FEEDBACK_TO edges — the feedback loop
    feedback_count = 0
    if body.feedback_character_ids:
        for char_id in body.feedback_character_ids:
            fb_result = await session.run(
                """
                MATCH (c:Character {id: $char_id})
                MATCH (gc:GeneratedContent {id: $gc_id})
                MERGE (gc)-[:FEEDBACK_TO]->(c)
                RETURN c.id
                """,
                char_id=char_id,
                gc_id=content_id,
            )
            if await fb_result.single():
                feedback_count += 1

    return IngestResponse(
        id=content_id,
        type=body.type,
        url=body.url,
        prompt=body.prompt,
        source_tool=body.source_tool,
        spark_id=body.spark_id,
        character_id=body.character_id,
        place_id=body.place_id,
        created_at=now,
        feedback_edges_created=feedback_count,
        depicts_edges_created=depicts_count,
    )


@router.get("", response_model=List[GeneratedContentResponse])
async def list_generated_content(
    spark_id: Optional[str] = None,
    character_id: Optional[str] = None,
    source_tool: Optional[str] = None,
    session: AsyncSession = Depends(db_session),
):
    """List GeneratedContent nodes with optional filters."""
    filters = []
    params = {}
    if spark_id:
        filters.append("gc.spark_id = $spark_id")
        params["spark_id"] = spark_id
    if character_id:
        filters.append("gc.character_id = $character_id")
        params["character_id"] = character_id
    if source_tool:
        filters.append("gc.source_tool = $source_tool")
        params["source_tool"] = source_tool

    where = f"WHERE {' AND '.join(filters)}" if filters else ""
    result = await session.run(
        f"MATCH (gc:GeneratedContent) {where} RETURN gc ORDER BY gc.created_at DESC",
        **params,
    )
    records = await result.data()
    return [GeneratedContentResponse(**dict(r["gc"])) for r in records]


@router.get("/{content_id}", response_model=GeneratedContentResponse)
async def get_generated_content(
    content_id: str,
    session: AsyncSession = Depends(db_session),
):
    result = await session.run(
        "MATCH (gc:GeneratedContent {id: $id}) RETURN gc", id=content_id
    )
    record = await result.single()
    if not record:
        raise HTTPException(status_code=404, detail="GeneratedContent not found")
    return GeneratedContentResponse(**dict(record["gc"]))


@router.get("/character/{character_id}/feedback", response_model=List[GeneratedContentResponse])
async def get_character_feedback(
    character_id: str,
    session: AsyncSession = Depends(db_session),
):
    """
    Return all GeneratedContent that has a FEEDBACK_TO edge pointing to this character.
    This is the closed feedback loop — content generated *about* the character
    flows back *to* the character.
    """
    result = await session.run(
        """
        MATCH (gc:GeneratedContent)-[:FEEDBACK_TO]->(c:Character {id: $id})
        RETURN gc ORDER BY gc.created_at DESC
        """,
        id=character_id,
    )
    records = await result.data()
    return [GeneratedContentResponse(**dict(r["gc"])) for r in records]
