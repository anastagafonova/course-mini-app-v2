const fs = require("fs");
const path = require("path");

const courseDir = path.resolve(__dirname, "..", "..", "course");
const outputDir = path.resolve(__dirname, "..", "data");
const outputPath = path.join(outputDir, "course.json");

const sourceFiles = [
  "course_structure.md",
  "module_1.md",
  "module_2.md",
  "module_3.md",
  "lessons.md",
  "materials.md"
];

let cache = null;
let lastSignature = "";
let coursePathLogged = false;

function readMd(name) {
  const p = path.join(courseDir, name);
  if (!fs.existsSync(p)) return "";
  return fs.readFileSync(p, "utf-8");
}

function parseModule(md, fallbackIndex) {
  const lines = md.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const heading = lines.find((l) => l.startsWith("#"));
  const title =
    lines.find((l) => /^title\s*:/i.test(l))?.split(":").slice(1).join(":").trim() ||
    (heading ? heading.replace(/^#+\s*/, "").trim() : `Модуль ${fallbackIndex}`);
  const description =
    lines.find((l) => /^description\s*:/i.test(l) || /^описание\s*:/i.test(l))
      ?.split(":")
      .slice(1)
      .join(":")
      .trim() || `Краткое описание модуля ${fallbackIndex}`;
  const result =
    lines.find((l) => /^result\s*:/i.test(l) || /^результат\s*:/i.test(l))
      ?.split(":")
      .slice(1)
      .join(":")
      .trim() || `Результат модуля ${fallbackIndex}`;

  return { title, description, result };
}

function parseLessons(lessonsMd, moduleId) {
  const modBlockPattern = new RegExp(`##\\s*${moduleId}[\\s\\S]*?(?=\\n##\\s*module_|$)`, "i");
  const block = lessonsMd.match(modBlockPattern)?.[0] || "";
  const lines = block
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.startsWith("-"));

  const items = lines.map((line, idx) => {
    const text = line.replace(/^-+\s*/, "");
    const parts = text.split("|").map((p) => p.trim());
    const preview = parts[1] || `Короткое превью урока ${idx + 1}`;
    const hasDescription = parts.length >= 4;
    const description = hasDescription ? parts[2] : preview;
    const videoUrl = hasDescription
      ? parts[3] || "https://www.youtube.com/embed/D3MB_EkNV5Y"
      : parts[2] || "https://www.youtube.com/embed/D3MB_EkNV5Y";

    return {
      id: `${moduleId}_lesson_${idx + 1}`,
      moduleId,
      title: parts[0] || `Урок ${idx + 1}`,
      preview,
      description,
      videoUrl
    };
  });

  return items;
}

const LESSON_1_MATERIAL_FILES = [
  "checklist-ne-vrat-sebe.pdf",
  "anketa-scenariy-zhizni.pdf",
  "checklist-chto-otrezat.pdf"
];

const LESSON_2_MATERIAL_FILES = ["checklist-ne-vrat-sebe.pdf"];

const LESSON_3_MATERIAL_FILES = ["tablica-zony-doma.pdf", "zony-doma-buduschee.pdf"];

const LESSON_4_MATERIAL_FILES = ["checklist-chto-otrezat.pdf"];

const DEFAULT_MATERIAL_FILES = ["demo.pdf", "text.md", "checklist.pdf"];

function parseMaterials(materialsMd, lessonId) {
  const re = new RegExp(`^${lessonId}\\s*:\\s*(.+)$`, "im");
  const line = materialsMd.match(re)?.[1];
  if (!line) return [];
  return line
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function resolveLessonMaterials(lessonId, materialsMd) {
  if (lessonId === "module_1_lesson_1") {
    return LESSON_1_MATERIAL_FILES;
  }
  if (lessonId === "module_1_lesson_2") {
    return LESSON_2_MATERIAL_FILES;
  }
  if (lessonId === "module_1_lesson_3") {
    return LESSON_3_MATERIAL_FILES;
  }
  if (lessonId === "module_1_lesson_4") {
    return LESSON_4_MATERIAL_FILES;
  }
  const parsed = parseMaterials(materialsMd, lessonId);
  return parsed.length ? parsed : DEFAULT_MATERIAL_FILES;
}

function fallbackCourse() {
  const modules = [];
  for (let m = 1; m <= 3; m += 1) {
    const moduleId = `module_${m}`;
    const lessons = [];
    for (let l = 1; l <= 5; l += 1) {
      const lessonId = `${moduleId}_lesson_${l}`;
      lessons.push({
        id: lessonId,
        moduleId,
        title: `Урок ${l}`,
        preview: `Короткое превью урока ${l}`,
        description: `Короткое превью урока ${l}`,
        videoUrl: "https://www.youtube.com/embed/D3MB_EkNV5Y",
        materials:
          lessonId === "module_1_lesson_1" ? LESSON_1_MATERIAL_FILES : DEFAULT_MATERIAL_FILES
      });
    }
    modules.push({
      id: moduleId,
      title: `Модуль ${m}`,
      description: `Описание модуля ${m}`,
      result: `Результат модуля ${m}`,
      lessons
    });
  }
  return { generatedAt: new Date().toISOString(), modules };
}

function sourceSignature() {
  return sourceFiles
    .map((name) => {
      const p = path.join(courseDir, name);
      if (!fs.existsSync(p)) return `${name}:missing`;
      const s = fs.statSync(p);
      return `${name}:${s.size}:${s.mtimeMs}`;
    })
    .join("|");
}

function buildCourseJson() {
  const moduleMds = [1, 2, 3].map((i) => readMd(`module_${i}.md`));
  const lessonsMd = readMd("lessons.md");
  const materialsMd = readMd("materials.md");

  const hasRealData =
    moduleMds.some((md) => md.replace(/[#\s]/g, "").length > 0) ||
    lessonsMd.replace(/[#\s]/g, "").length > 0 ||
    materialsMd.replace(/[#\s]/g, "").length > 0;

  if (!hasRealData) return fallbackCourse();

  const modules = moduleMds.map((md, idx) => {
    const moduleId = `module_${idx + 1}`;
    const meta = parseModule(md, idx + 1);
    let lessons = parseLessons(lessonsMd, moduleId);

    if (lessons.length === 0) {
      lessons = Array.from({ length: 5 }, (_, i) => ({
        id: `${moduleId}_lesson_${i + 1}`,
        moduleId,
        title: `Урок ${i + 1}`,
        preview: `Короткое превью урока ${i + 1}`,
        description: `Короткое превью урока ${i + 1}`,
        videoUrl: "https://www.youtube.com/embed/D3MB_EkNV5Y"
      }));
    }

    lessons = lessons.slice(0, 5).map((lesson) => ({
      ...lesson,
      materials: resolveLessonMaterials(lesson.id, materialsMd)
    }));

    while (lessons.length < 5) {
      const i = lessons.length + 1;
      lessons.push({
        id: `${moduleId}_lesson_${i}`,
        moduleId,
        title: `Урок ${i}`,
        preview: `Короткое превью урока ${i}`,
        description: `Короткое превью урока ${i}`,
        videoUrl: "https://www.youtube.com/embed/D3MB_EkNV5Y",
        materials: resolveLessonMaterials(`${moduleId}_lesson_${i}`, materialsMd)
      });
    }

    return {
      id: moduleId,
      title: meta.title || `Модуль ${idx + 1}`,
      description: meta.description || `Описание модуля ${idx + 1}`,
      result: meta.result || `Результат модуля ${idx + 1}`,
      lessons
    };
  });

  return { generatedAt: new Date().toISOString(), modules };
}

function getCourseData() {
  if (!coursePathLogged) {
    console.log("Course path:", courseDir);
    coursePathLogged = true;
  }

  const signature = sourceSignature();
  if (cache && signature === lastSignature) return cache;

  const next = buildCourseJson();
  const fileStats = sourceFiles.map((name) => {
    const filePath = path.join(courseDir, name);
    return `${name}:${fs.existsSync(filePath) ? "ok" : "missing"}`;
  });
  console.log("Course files:", fileStats.join(", "));

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(next, null, 2), "utf-8");
  cache = next;
  lastSignature = signature;
  return next;
}

module.exports = {
  getCourseData,
  outputPath
};

