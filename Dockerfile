# --- Step 1: Build the React frontend ---
FROM node:18 AS build-frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# --- Step 2: Build the final image with Python + FastAPI ---
FROM python:3.12-slim AS prod
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy Python requirements and install
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Create necessary directories with proper permissions
RUN mkdir -p static/video static/audio \
    && chmod -R 777 static

# Copy backend code
COPY backend/ .

# Copy the built React files
COPY --from=build-frontend /app/frontend/build ./frontend_build

# Set proper permissions
RUN chmod -R 777 /app

# Expose port 8080 for Cloud Run
EXPOSE 8080

# By default, uvicorn runs on port 8000,
# but Cloud Run expects the service to listen on $PORT
ENV PORT=8080

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]