# Terra AI

Terra AI is a soil and land analysis web app for restoration-focused workflows. Users sign in, upload field images, and receive AI-generated observations, recommendations, and crop suggestions from one simple interface.

## What it does

- Authenticates users with Supabase
- Accepts field and soil image uploads
- Sends uploaded images to the backend analysis endpoint
- Uses Gemini to generate structured land and soil insights
- Shows recent analysis history in a dashboard

## Project structure

```text
M-restore/
  backend/
    .env
    database/
      supabase-schema.sql
      supabase-setup.sql
    scripts/
      update-supabase-config.js
      update-supabase-credentials.js
    server.js
  frontend/
    assets/
      hero-background.png
    scripts/
      supabase.js
    styles/
      theme.css
    dashboard.html
    index.html
    login.html
    signup.html
    upload.html
  package.json
  package-lock.json
  .gitignore
```

## Stack

- Frontend: HTML, Tailwind CSS
- Backend: Node.js, Express
- Auth and database: Supabase
- AI analysis: Google Gemini

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Create `backend/.env`:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
GOOGLE_GEMINI_API_KEY=your_gemini_api_key
PORT=3000
NODE_ENV=development
```

3. Run the SQL in `backend/database/supabase-setup.sql` inside your Supabase SQL editor.

4. Start the app:

```bash
npm start
```

The backend serves the frontend at `http://localhost:3000`.

## Current status

- Project reorganized into clear `frontend/` and `backend/` folders
- Rebranded from the old app name to `Terra AI`
- Frontend refreshed into a more production-ready product UI
- Shared styling extracted into `frontend/styles/theme.css`
- Local secrets ignored through `.gitignore`

## Next step

Deployment is next. This repo now reflects the working project structure we should ship.
