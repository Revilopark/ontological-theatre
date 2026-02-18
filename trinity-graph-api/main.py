"""
main.py — Unified Trinity Graph API
FastAPI service that connects to Neo4j Aura and provides a single brain
for all Ontological Theatre tools.
"""

import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import get_driver, close_driver, settings
from schema import init_schema, ITY_FIELDS, PATHY_FIELDS

# Route modules
from routes.worlds import router as worlds_router
from routes.characters import router as characters_router
from routes.places import router as places_router
from routes.garments import router as garments_router
from routes.artifacts import router as artifacts_router
from routes.sparks import router as sparks_router
from routes.graph import router as graph_router
from routes.ingest import router as ingest_router
from routes.eras import router as eras_router

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
)
logger = logging.getLogger("trinity")


# ---------------------------------------------------------------------------
# Lifespan — startup / shutdown
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Trinity Graph API starting up…")
    # Verify Neo4j connectivity
    try:
        driver = await get_driver()
        await driver.verify_connectivity()
        logger.info("✓ Neo4j connection verified: %s", settings.neo4j_uri)
    except Exception as e:
        logger.error("✗ Neo4j connection failed: %s", e)
        # Don't crash — let health endpoint surface the error

    yield

    logger.info("Trinity Graph API shutting down…")
    await close_driver()


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Trinity Graph API",
    description=(
        "The unified brain for all Ontological Theatre tools. "
        "Connects to Neo4j Aura and exposes CRUD + collision engine endpoints "
        "for Worlds, Characters, Places, Garments, Artifacts, Sparks, and generated content."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ---------------------------------------------------------------------------
# CORS — permissive for now; lock down origins in production
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

app.include_router(worlds_router)
app.include_router(eras_router)          # /eras, /lineages, /voice-profiles
app.include_router(characters_router)
app.include_router(places_router)
app.include_router(garments_router)
app.include_router(artifacts_router)
app.include_router(sparks_router)
app.include_router(graph_router)
app.include_router(ingest_router)


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.get("/health", tags=["meta"])
async def health():
    """Liveness + Neo4j connectivity probe."""
    try:
        driver = await get_driver()
        await driver.verify_connectivity()
        db_ok = True
        db_error = None
    except Exception as e:
        db_ok = False
        db_error = str(e)

    status_code = 200 if db_ok else 503
    return JSONResponse(
        status_code=status_code,
        content={
            "status": "ok" if db_ok else "degraded",
            "neo4j": "connected" if db_ok else f"error: {db_error}",
            "neo4j_uri": settings.neo4j_uri,
            "version": "1.0.0",
        },
    )


# ---------------------------------------------------------------------------
# Schema initialisation
# ---------------------------------------------------------------------------

@app.post("/schema/init", tags=["meta"])
async def schema_init():
    """
    Idempotent — run once (or any time) to create all constraints and indexes.
    Safe to call multiple times thanks to IF NOT EXISTS clauses.
    """
    from config import get_session
    async with get_session() as session:
        result = await init_schema(session)
    return {
        "message": "Schema initialised",
        **result,
        "ity_fields": len(ITY_FIELDS),
        "pathy_fields": len(PATHY_FIELDS),
    }


# ---------------------------------------------------------------------------
# Root
# ---------------------------------------------------------------------------

@app.get("/", tags=["meta"])
async def root():
    return {
        "name": "Trinity Graph API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
        "schema_init": "POST /schema/init",
        "endpoints": {
            "worlds": "/worlds",
            "eras": "/eras",
            "lineages": "/lineages",
            "characters": "/characters",
            "places": "/places",
            "garments": "/garments",
            "artifacts": "/artifacts",
            "sparks": "/sparks",
            "spark_collide": "POST /sparks/collide",
            "graph_query": "POST /graph/query",
            "graph_stats": "GET /graph/stats",
            "graph_export": "GET /graph/export/{world_id}",
            "ingest": "POST /ingest",
            "voice_profiles": "/voice-profiles",
        },
    }
