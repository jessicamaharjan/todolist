# Todo List App

A minimal full-stack todo app with:
- a static HTML, CSS, and JavaScript frontend
- a Node.js and Express backend API
- PostgreSQL for persistence
- Dockerfiles and Docker Compose for containerized startup

## Run with Docker

1. Start Docker Desktop.
2. From this `web` folder, run:
   ```powershell
   docker compose up --build
   ```
3. Open:
   - Frontend: http://localhost:1111
   - Backend health: http://54.211.188.243:222/health
   - Todo API: http://54.211.188.243:222/api/todos

## API

- `GET /api/todos` lists todos
- `POST /api/todos` creates a todo with `{ "title": "Task name" }`
- `PATCH /api/todos/:id` updates `title` or `completed`
- `DELETE /api/todos/:id` deletes a todo

## Structure

- frontend/: static todo UI served by Nginx
- backend/: Express API and PostgreSQL setup
- docker-compose.yml: frontend, backend, and database services
