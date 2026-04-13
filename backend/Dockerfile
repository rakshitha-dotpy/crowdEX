FROM python:3.9-slim

WORKDIR /app

# Install system dependencies required for OpenCV
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage Docker cache
COPY requirements.txt .

# Install python dependencies
# We use --no-cache-dir to keep image small, though it's a tradeoff with build time
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Set upload directory environment variable
ENV UPLOAD_DIR=/app/uploads

# Expose port (Cloud Run / Render usually expect 8080 or configurable)
ENV PORT=8000
EXPOSE 8000

# Command to run the application
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port $PORT"]
