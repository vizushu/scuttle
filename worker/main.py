import asyncio
import os
import logging
from fastapi import FastAPI
from contextlib import asynccontextmanager
from worker.core.download_processor import DownloadProcessor
from worker.core.database import init_db

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

processor: DownloadProcessor = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    global processor
    
    # Initialize database connection
    await init_db()
    
    # Start the download processor
    processor = DownloadProcessor()
    asyncio.create_task(processor.start())
    logger.info("Download processor started")
    
    yield
    
    # Cleanup
    if processor:
        await processor.stop()
    logger.info("Download processor stopped")

app = FastAPI(
    title="Scuttle Download Worker",
    description="Background worker for processing yt-dlp downloads",
    version="1.0.0",
    lifespan=lifespan
)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "processor_running": processor.is_running if processor else False
    }

@app.get("/stats")
async def get_stats():
    """Get worker statistics"""
    if not processor:
        return {"error": "Processor not initialized"}
    
    return await processor.get_stats()

@app.post("/process-now")
async def trigger_processing():
    """Manually trigger download processing"""
    if not processor:
        return {"error": "Processor not initialized"}
    
    asyncio.create_task(processor.process_pending_downloads())
    return {"message": "Processing triggered"}
