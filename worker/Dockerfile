FROM python:3.11-slim

# Install ffmpeg (required by yt-dlp)
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy worker code
COPY . ./worker/

# Expose port
EXPOSE 8000

# Run the worker
CMD ["uvicorn", "worker.main:app", "--host", "0.0.0.0", "--port", "8000"]
