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
    
    # Copy Python requirements
    COPY backend/requirements.txt .
    RUN pip install --no-cache-dir -r requirements.txt
    
    # Copy backend code
    COPY backend/ .
    
    # Copy the built React files from the first stage
    # They end up in /app/frontend_build
    COPY --from=build-frontend /app/frontend/build ./frontend_build
    
    # Expose port 8080 for Cloud Run
    EXPOSE 8080
    
    # By default, uvicorn runs on port 8000,
    # but Cloud Run expects the service to listen on $PORT
    ENV PORT=8080
    
    CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]