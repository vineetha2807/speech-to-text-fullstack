# Speech-to-Text Full Stack

Stack: Java 21, Spring Boot 3.5.5, Spring Data JPA, PostgreSQL, Angular standalone frontend.

## Features
- Browser microphone transcription with live interim text using Web Speech API (Chrome/Edge recommended).
- Save, list, search, edit, and delete transcription records in PostgreSQL.
- REST API with validation and CORS configuration.

> Speech engine note: this starter uses the browser Web Speech API for the live microphone experience. It is not a self-hosted/open-source speech engine and multilingual Hindi-English code-switching depends on the browser/service. To meet a strict self-hosted-engine requirement, replace `SpeechRecognition` in the Angular component with a WebSocket audio stream to a deployed Vosk/Whisper-compatible service. Vosk models are generally language-specific, so verify code-switching support before claiming it.

## Requirements
- Java 21+
- Maven 3.6.3+
- Node.js LTS and Angular CLI
- PostgreSQL 14+

## 1. PostgreSQL
Create database and user (or adjust `backend/src/main/resources/application.properties`):
```sql
CREATE DATABASE speech_to_text;
CREATE USER speech_user WITH PASSWORD 'speech_password';
GRANT ALL PRIVILEGES ON DATABASE speech_to_text TO speech_user;
```
On PostgreSQL 15+, connect to the database and grant schema permissions if needed:
```sql
GRANT ALL ON SCHEMA public TO speech_user;
```

## 2. Run backend
```powershell
cd backend
mvn spring-boot:run
```
API: `http://localhost:8080/api/transcriptions`

## 3. Create Angular shell and add provided files
In a separate terminal, from the project root:
```powershell
npm install -g @angular/cli
ng new frontend --standalone --routing=false --style=css
```
When prompted, choose no SSR. Replace `frontend/src/app/app.component.ts`, `.html`, `.css`, `frontend/src/app/app.config.ts`, and `frontend/src/environments/environment.ts` with the provided versions. If Angular CLI generated a different config path, create the environment file at that path.
Then:
```powershell
cd frontend
npm install
ng serve
```
Open `http://localhost:4200`. Allow microphone access. Use Chrome or Edge.

## REST endpoints
- `GET /api/transcriptions?search=...`
- `GET /api/transcriptions/{id}`
- `POST /api/transcriptions`
- `PUT /api/transcriptions/{id}`
- `DELETE /api/transcriptions/{id}`

## Example request
```json
{
  "title": "Meeting notes",
  "content": "आज we will review the project",
  "language": "hi-IN"
}
```

## Deploy
- PostgreSQL: Neon, Supabase, or managed PostgreSQL.
- Backend: Render, Railway, or another Java-hosting service. Set `DATABASE_URL`, `DB_USERNAME`, `DB_PASSWORD`, and `FRONTEND_ORIGIN`.
- Frontend: Vercel, Netlify, or static hosting. Set API URL in `frontend/src/environments/environment.ts` before build.
- Do not commit database passwords or API secrets. HTTPS is required for microphone access on deployed sites.
