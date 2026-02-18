"""
config.py — Environment variable loading and Neo4j connection pool.
"""

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from neo4j import AsyncGraphDatabase, AsyncDriver
from pydantic_settings import BaseSettings

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    neo4j_uri: str = "neo4j+s://c779e832.databases.neo4j.io"
    neo4j_user: str = "neo4j"
    neo4j_password: str = ""
    app_env: str = "production"
    log_level: str = "INFO"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


settings = Settings()

# Module-level driver singleton
_driver: AsyncDriver | None = None


async def get_driver() -> AsyncDriver:
    """Return the module-level async Neo4j driver, initialising if needed."""
    global _driver
    if _driver is None:
        _driver = AsyncGraphDatabase.driver(
            settings.neo4j_uri,
            auth=(settings.neo4j_user, settings.neo4j_password),
            max_connection_pool_size=50,
        )
    return _driver


async def close_driver() -> None:
    """Gracefully close the Neo4j driver."""
    global _driver
    if _driver is not None:
        await _driver.close()
        _driver = None
        logger.info("Neo4j driver closed.")


@asynccontextmanager
async def get_session() -> AsyncGenerator:
    """Async context manager that yields a Neo4j session."""
    driver = await get_driver()
    async with driver.session() as session:
        yield session


# FastAPI lifespan dependency helper
async def db_session():
    """FastAPI dependency: yields a Neo4j session per request."""
    async with get_session() as session:
        yield session
