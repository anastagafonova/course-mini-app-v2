const path = require("path");
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./db");
const { getCourseData, outputPath } = require("./courseLoader");
const { createChatAnswer } = require("./aiChat");
const { getHistory, appendMessages } = require("./conversationStore");

const app = express();
const port = Number(process.env.PORT || 4000);

app.use(cors());
app.use(express.json());
app.use("/data", express.static(path.resolve(__dirname, "..", "data")));
app.use(
  "/materials",
  express.static(path.resolve(__dirname, "..", "..", "course", "materials"))
);

app.get("/", (_req, res) => {
  res.send("Backend is running");
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

function sendModules(_req, res) {
  try {
    const course = getCourseData();
    const modules = course.modules.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      result: m.result
    }));
    res.json({ generatedAt: course.generatedAt, modules });
  } catch (error) {
    console.error("Failed to load modules:", error);
    res.status(500).json({ error: "Failed to load modules" });
  }
}

app.get("/modules", sendModules);
app.get("/api/modules", sendModules);

app.get("/modules/:id", (req, res) => {
  const course = getCourseData();
  const module = course.modules.find((m) => m.id === req.params.id);
  if (!module) return res.status(404).json({ error: "Module not found" });
  return res.json(module);
});

app.get("/lessons/:id", (req, res) => {
  const course = getCourseData();
  const lesson = course.modules.flatMap((m) => m.lessons).find((l) => l.id === req.params.id);
  if (!lesson) return res.status(404).json({ error: "Lesson not found" });
  return res.json(lesson);
});

app.post("/ai/chat", async (req, res) => {
  try {
    const { userId, message } = req.body || {};

    const cleanMessage = String(message || "").trim();

    if (!cleanMessage) {
      return res.status(400).json({ error: "Message is required" });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "OPENAI_API_KEY is not configured on the server" });
    }

    const conversationUserId = userId ? String(userId) : "anonymous";

    const history = getHistory(conversationUserId);

    const answer = await createChatAnswer(cleanMessage, history);

    appendMessages(conversationUserId, cleanMessage, answer);

    return res.json({ answer });
  } catch (error) {
    console.error("AI chat error:", error);
    const detail = error?.message || "OpenAI request failed";
    return res.status(500).json({
      error: "Не удалось получить ответ от ассистента. Попробуйте ещё раз чуть позже.",
      detail
    });
  }
});

app.post("/track", (req, res) => {
  const { user_id, username, event_type, module_id = null, lesson_id = null, timestamp } = req.body;
  if (!user_id || !event_type) {
    return res.status(400).json({ error: "user_id and event_type are required" });
  }

  const ts = timestamp || new Date().toISOString();
  const normalizedUserId = String(user_id);
  db.upsertUser(normalizedUserId, username || null, ts);
  db.addProgress({
    user_id: normalizedUserId,
    username: username || null,
    event_type,
    module_id,
    lesson_id,
    timestamp: ts
  });

  return res.json({ ok: true });
});

app.get("/course.json", (_req, res) => {
  getCourseData();
  res.sendFile(outputPath);
});

app.listen(port, () => {
  getCourseData();
  console.log(`Backend started at http://localhost:${port}`);
});

