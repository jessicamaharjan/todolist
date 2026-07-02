# Moonlight Cafe App

A minimal full-stack cafe app with:
- a polished frontend landing page and menu view
- a backend API for menu data and simple orders
- PostgreSQL for persistence
- Dockerfiles and Docker Compose for containerized startup

## Run with Docker

1. Start Docker Desktop.
2. From this folder, run:
   ```bash
   docker compose up --build
   ```
3. Open:
   - Frontend: http://localhost:8080
   - Backend health: http://localhost:5000/health

## Structure

- frontend/: static cafe UI
- backend/: Express API and PostgreSQL setup
- docker-compose.yml: app services
