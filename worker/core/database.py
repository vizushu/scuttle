import asyncpg
import os
from typing import Optional

_pool: Optional[asyncpg.Pool] = None

async def init_db():
    """Initialize database connection pool"""
    global _pool
    
    database_url = os.getenv('NEON_DATABASE_URL')
    if not database_url:
        raise ValueError("DATABASE_URL environment variable not set")
    
    _pool = await asyncpg.create_pool(
        database_url,
        min_size=2,
        max_size=10
    )

async def get_db_connection():
    """Get a database connection from the pool"""
    if not _pool:
        await init_db()
    
    return await _pool.acquire()

async def close_db():
    """Close database connection pool"""
    global _pool
    if _pool:
        await _pool.close()
        _pool = None
