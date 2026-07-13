# Telegram Mini App MVP

Актуальная структура проекта:

```text
mini-app/
  backend/
  frontend/
  bot/
  course/
  README.md
```

## Что внутри

- `backend` — API, парсинг markdown-курса, генерация `course.json`, in-memory трекинг.
- `frontend` — React Mini App (модули → уроки → урок).
- `bot` — Telegram bot с кнопкой открытия Mini App.
- `course` — исходные markdown-файлы курса (`course_structure.md`, `module_1..3.md`, `lessons.md`, `materials.md`).

## Важно по данным курса

Backend читает данные только из `mini-app/course` (путь относительно `backend`: `../course`).
Никаких абсолютных путей и старых путей проекта не используется.

## Local run

Все команды ниже выполняются из корня `mini-app` в отдельных терминалах.

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

```bash
cd bot
npm install
cp .env.example .env
npm start
```

## ENV

### Backend

Файл: `backend/.env`

```env
PORT=4000
FRONTEND_ORIGIN=http://localhost:5173
```

### Frontend

Файл: `frontend/.env`

```env
VITE_API_URL=http://localhost:4000
```

### Bot

Файл: `bot/.env`

```env
BOT_TOKEN=your_telegram_bot_token
WEB_APP_URL=https://your-mini-app-domain.example
```

`WEB_APP_URL` читается из `.env`, в коде нет захардкоженных localhost URL.

## API

- `GET /modules`
- `GET /modules/:id`
- `GET /lessons/:id`
- `POST /track`
Deployment trigger update.

