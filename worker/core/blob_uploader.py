import os
import httpx
import logging

logger = logging.getLogger(__name__)

async def upload_to_blob(data: bytes, filename: str, content_type: str = "audio/mpeg") -> str:
    """Upload file to Vercel Blob storage"""
    blob_token = os.getenv('BLOB_READ_WRITE_TOKEN')
    if not blob_token:
        raise ValueError("BLOB_READ_WRITE_TOKEN environment variable not set")
    
    # Vercel Blob upload endpoint
    upload_url = f"https://blob.vercel-storage.com/{filename}"
    
    async with httpx.AsyncClient() as client:
        response = await client.put(
            upload_url,
            content=data,
            headers={
                "Authorization": f"Bearer {blob_token}",
                "Content-Type": content_type,
                "x-content-type": content_type,
            },
            timeout=300.0  # 5 minute timeout for large files
        )
        
        if response.status_code != 200:
            raise Exception(f"Failed to upload to blob: {response.text}")
        
        result = response.json()
        blob_url = result.get('url')
        
        logger.info(f"Uploaded {filename} to blob: {blob_url}")
        
        return blob_url
