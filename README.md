Telegram Mini App Course MVP

MVP for Telegram Mini App course with data source from /course/*.md.

Architecture





course/ — editable content source (markdown files).



backend/ — Node.js + Express API, markdown parser, in-memory analytics tracking.



frontend/ — React Mini App UI (modules, lessons, lesson screen).



bot/ — Telegram bot with web_app button.

Backend parses course/*.md and regenerates backend/data/course.json automatically when source files change (checked by mtime/size signature).

Project structure

content-system/
  course/
    course_structure.md
    module_1.md
    module_2.md
    module_3.md
    lessons.md
    materials.md
  backend/
    src/
      server.js
      db.js
      courseLoader.js
    data/
      course.json (auto)
    package.json
    .env.example
  frontend/
    src/
      main.jsx
      App.jsx
      styles.css
    index.html
    package.json
    vite.config.js
    .env.example
  bot/
    index.js
    package.json
    .env.example

API





GET /modules



GET /modules/:id



GET /lessons/:id



POST /track

Track payload example:

{
  "user_id": "123456",
  "username": "alex",
  "event_type": "open_lesson",
  "module_id": "module_1",
  "lesson_id": "module_1_lesson_1",
  "timestamp": "2026-04-28T00:00:00.000Z"
}

How to edit course content via /course

1) Module metadata

Use module_1.md, module_2.md, module_3.md:

# Module 1
Title: Your module title
Description: Your module description
Result: Your module result

2) Lessons

Use lessons.md blocks:

## module_1
- Lesson title | Lesson preview | https://www.youtube.com/embed/VIDEO_ID

3) Materials

Use materials.md:

module_1_lesson_1: demo.pdf, text.md, checklist.pdf

After editing markdown, just refresh frontend page. Backend picks up changes and rebuilds course.json.

Replace demo content with real content





Update titles/descriptions/results in module_*.md.



Replace lesson lines in lessons.md for each module_1..module_3.



Replace file names in materials.md by lesson id.



Replace placeholder video URLs with real embed URLs.

Local run

Backend

cd backend
npm install
cp .env.example .env
npm run dev

Frontend

cd frontend
npm install
cp .env.example .env
npm run dev

Bot

cd bot
npm install
cp .env.example .env
npm start

Set WEB_APP_URL in bot/.env to deployed frontend URL.

Storage mode

Current MVP uses in-memory storage for users/progress events, so backend starts on Windows without native module build.





users collection (in memory)



progress collection (in memory)

If backend restarts, analytics data is reset.

Deploy (simple)

Backend





Deploy to Render/Railway/Fly.io as Node service.



Set env vars: PORT, FRONTEND_ORIGIN.

Frontend





Deploy frontend to Vercel/Netlify.



Set VITE_API_URL to deployed backend URL.

Bot





Deploy bot as Node worker (Railway/Render).



Set BOT_TOKEN and WEB_APP_URL.

Notes





Telegram user is read from window.Telegram.WebApp.initDataUnsafe.user.



In local browser (outside Telegram), frontend falls back to demo user.



Events tracked: enter_app, open_module, open_lesson.
