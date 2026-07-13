const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");

const aiDir = path.resolve(__dirname, "..", "..", "ai");
const knowledgeDir = path.join(aiDir, "knowledge");
const systemPromptPath = path.join(aiDir, "system-prompt.md");
const AI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const MAX_KNOWLEDGE_CHARS = 120000;

let cachedPromptBundle = null;
let cachedPromptMtime = 0;

function readTextFile(filePath) {
  try {
    return fs.readFileSync(filePath, "utf-8").trim();
  } catch {
    return "";
  }
}

function collectKnowledgeFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectKnowledgeFiles(fullPath, files);
      continue;
    }
    if (/\.(md|txt)$/i.test(entry.name) && entry.name.toLowerCase() !== "readme.md") {
      files.push(fullPath);
    }
  }
  return files.sort();
}

function loadKnowledgeContext() {
  const files = collectKnowledgeFiles(knowledgeDir);
  if (files.length === 0) return "";

  const chunks = [];
  let total = 0;

  for (const filePath of files) {
    const content = readTextFile(filePath);
    if (!content) continue;
    const relative = path.relative(knowledgeDir, filePath).replace(/\\/g, "/");
    const block = `### ${relative}\n\n${content}`;
    if (total + block.length > MAX_KNOWLEDGE_CHARS) break;
    chunks.push(block);
    total += block.length;
  }

  if (chunks.length === 0) return "";
  return `\n\n## Knowledge Base\n\n${chunks.join("\n\n---\n\n")}`;
}

function getPromptBundleSignature() {
  const parts = [systemPromptPath];
  const knowledgeFiles = collectKnowledgeFiles(knowledgeDir);
  for (const filePath of knowledgeFiles) {
    if (fs.existsSync(filePath)) {
      parts.push(`${filePath}:${fs.statSync(filePath).mtimeMs}`);
    }
  }
  return parts.join("|");
}

function buildInstructions() {
  const signature = getPromptBundleSignature();
  if (cachedPromptBundle && signature === cachedPromptMtime) {
    return cachedPromptBundle;
  }

  const systemPrompt = readTextFile(systemPromptPath);
  const knowledge = loadKnowledgeContext();
  const instructions = `${systemPrompt}${knowledge}`.trim();

  cachedPromptBundle = instructions || "Ты — ИИ-ассистент по площади и планировке частного дома.";
  cachedPromptMtime = signature;
  return cachedPromptBundle;
}

function extractAnswer(response) {
  if (response?.output_text) {
    return String(response.output_text).trim();
  }

  const output = response?.output;
  if (!Array.isArray(output)) return "";

  const texts = [];
  for (const item of output) {
    if (item?.type !== "message" || !Array.isArray(item.content)) continue;
    for (const part of item.content) {
      if (part?.type === "output_text" && part.text) {
        texts.push(part.text);
      }
    }
  }

  return texts.join("\n").trim();
}

async function createChatAnswer(message, history = []) {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const instructions = buildInstructions();

  const input = [
    ...history.map((item) => ({
      role: item.role,
      content: item.content
    })),
    {
      role: "user",
      content: message
    }
  ];

  const response = await client.responses.create({
    model: AI_MODEL,
    instructions,
    input
  });

  const answer = extractAnswer(response);
  if (!answer) {
    throw new Error("Пустой ответ от модели");
  }

  return answer;
}

module.exports = {
  createChatAnswer,
  buildInstructions
};
