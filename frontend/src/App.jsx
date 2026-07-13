import { useEffect, useMemo, useRef, useState } from "react";
import brandLogo from "../../assets/brand/logo/logo.svg/Frame 11.svg";
import brandMark from "../../assets/brand/logo/logo.svg/Frame 13.svg";
import { BROADCASTS, resolveEmbedUrl } from "./data/broadcasts";

const API_URL = import.meta.env.VITE_API_URL || "https://gusi-mini-app.onrender.com";

function getTgUser() {
  const tg = window.Telegram?.WebApp;
  tg?.ready();
  tg?.expand();
  const user = tg?.initDataUnsafe?.user;
  if (user?.id) {
    return { user_id: String(user.id), username: user.username || "" };
  }
  return { user_id: "demo-user", username: "demo" };
}

async function trackEvent(payload) {
  try {
    await fetch(`${API_URL}/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, timestamp: new Date().toISOString() })
    });
  } catch (e) {
    console.error("track error", e);
  }
}

const VIEW_HOME = "home";
const VIEW_COURSE = "course";
const VIEW_AI = "ai";
const VIEW_BROADCASTS = "broadcasts";

/** true — показываем рабочий AI-chat. false — временная заглушка. */
const AI_CHAT_ENABLED = true;

const AI_STUB_FEATURES = [
  "разбирать планировки",
  "проверять решения",
  "избегать ошибок при строительстве",
  "экономить бюджет и нервы"
];

const AI_STARTERS = [
  "Хочу дом, но не понимаю, какую площадь выбрать",
  "Хочу дом 180 м² — это нормально или перебор?",
  "У меня семья из 4 человек. Помоги определить разумную площадь дома",
  "Проверь мою идею планировки и скажи, где ошибки",
  "Помоги составить ТЗ архитектору",
  "Хочу дом “с запасом”. Это хорошая идея или я переплачиваю?"
];

const UNLOCKED_MODULE_ID = "module_1";
const UNLOCKED_LESSON_COUNT = 4;

function getLessonNumber(lessonId) {
  const match = String(lessonId).match(/_lesson_(\d+)$/);
  return match ? Number(match[1]) : 0;
}

const LESSON_1_OUTCOMES = [
  "Поймете, что такое «сценарий жизни» и почему он важнее красивой картинки.",
  "Получите чек-лист «Не врать себе» и проверите себя, знаете ли ответы на первые ключевые вопросы, которые разбирает эксперт.",
  "Ответите на вопросы: кто реально будет жить в доме, что вас бесит в текущем жилье, для чего вам дом."
];

const LESSON_1_HOMEWORK = [
  "Напишите 3 вещи, которые вы делаете ежедневно дома в обычный день, и где это происходит.",
  "Ответьте на вопросы анкеты «Сценарий жизни»: кто реально будет жить в доме, что вас бесит в текущем жилье, для чего вам дом."
];

const LESSON_2_OUTCOMES = [
  "Поймёте, почему «абстрактная семья» не помогает в проектировании, а только мешает, и что важно перечислять всех, кто реально будет жить в доме — постоянно и временно.",
  "Превратите поимённый список людей в конкретные требования к дому (кабинет, спальни, зоны для няни, гостей, родителей).",
  "Увидите на примере семьи Гусевых, как рождаются требования без единого слова про «красивый фасад»."
];

const LESSON_2_HOMEWORK = [
  "Выпишите всех, кто будет жить в доме постоянно, и всех, кто будет приезжать регулярно — поимённо, с возрастом и частотой приездов.",
  "Напротив каждого имени напишите, какое требование к дому из этого следует: кабинет; спальня на первом этаже; зона для няни; тишина; свет; хранение; или любые другие реальные требования, которые появляются из сценария жизни этого человека."
];

const LESSON_3_OUTCOMES = [
  "Увидите на примерах, как неправильная планировка убивает бюджет и нервы.",
  "Научитесь расписывать свой обычный день по часам и превращать его в требования к дому."
];

const LESSON_3_HOMEWORK = [
  "Нарисуйте на планировке вашего дома сценарии движения семьи в будний и выходной день разными цветами и найдите конфликты до начала строительства.",
  "Заполните таблицу «Зоны дома под ваш день» два раза: как сейчас; как хотите в новом доме. Укажите: где завтракаете; где работаете; где отдыхаете; где храните вещи; где разуваетесь; где ужинаете; где спите. Также распишите, что делает каждый член семьи и гости в разное время суток в будний и выходной день.",
  "Сравните оба варианта. Разница между ними и станет основой будущего проекта дома."
];

const LESSON_4_OUTCOMES = [
  "Разберёте три составляющие дома: обязательное, желаемое и красивое — и поймёте, в каком порядке их реализовывать.",
  "Узнаете, почему чрезмерная кастомизация под себя может сделать дом неликвидным и как это влияет на возможность его дальнейшей продажи.",
  "Получите чек-лист «Что отрезать без потери качества» и отметите, от чего готовы отказаться уже сейчас."
];

const LESSON_4_HOMEWORK = [
  "Отметьте в чек-листе «Что отрезать без потери качества», от чего вы готовы отказаться.",
  "Вернитесь к таблице «Зоны дома под ваш день» и отметьте элементы цветом:\n\n• красным — обязательное;\n• жёлтым — желаемое;\n• зелёным — красивое."
];

const LESSON_1_MATERIALS = [
  { file: "checklist-ne-vrat-sebe.pdf", label: "Чек-лист «Не врать себе»" },
  { file: "anketa-scenariy-zhizni.pdf", label: "Анкета «Сценарий жизни»" },
  { file: "checklist-chto-otrezat.pdf", label: "Чек-лист «Что отрезать без потери качества»" }
];

const LESSON_2_MATERIALS = [
  { file: "checklist-ne-vrat-sebe.pdf", label: "Чек-лист «Не врать себе»" }
];

const LESSON_3_MATERIALS = [
  { file: "tablica-zony-doma.pdf", label: "Таблица «Зоны дома под ваш день» (шаблон)" },
  { file: "zony-doma-buduschee.pdf", label: "Пример заполнения таблицы «Зоны дома под ваш день»" }
];

const LESSON_4_MATERIALS = [
  { file: "checklist-chto-otrezat.pdf", label: "Чек-лист «Что отрезать без потери качества»" }
];

const LESSON_CONTENT = {
  module_1_lesson_1: { outcomes: LESSON_1_OUTCOMES, homework: LESSON_1_HOMEWORK },
  module_1_lesson_2: { outcomes: LESSON_2_OUTCOMES, homework: LESSON_2_HOMEWORK },
  module_1_lesson_3: {
    outcomes: LESSON_3_OUTCOMES,
    homework: LESSON_3_HOMEWORK,
    homeworkTitle: "После урока (домашнее задание)"
  },
  module_1_lesson_4: {
    outcomes: LESSON_4_OUTCOMES,
    homework: LESSON_4_HOMEWORK,
    homeworkTitle: "После урока — домашнее задание"
  }
};

function getLessonContent(lessonId) {
  return LESSON_CONTENT[lessonId] || null;
}

function getMaterialUrl(lessonId, fileName) {
  const match = lessonId.match(/^module_(\d+)_lesson_(\d+)$/);
  if (!match) return "#";
  return `${API_URL}/materials/module_${match[1]}/lesson_${match[2]}/${encodeURIComponent(fileName)}`;
}

function getLessonMaterials(lesson) {
  if (lesson.id === "module_1_lesson_1") {
    return LESSON_1_MATERIALS;
  }
  if (lesson.id === "module_1_lesson_2") {
    return LESSON_2_MATERIALS;
  }
  if (lesson.id === "module_1_lesson_3") {
    return LESSON_3_MATERIALS;
  }
  if (lesson.id === "module_1_lesson_4") {
    return LESSON_4_MATERIALS;
  }
  return (lesson.materials || []).map((file) => ({ file, label: file }));
}

function isModuleLocked(module) {
  return module.id !== UNLOCKED_MODULE_ID;
}

function isLessonLocked(lesson, moduleId) {
  if (moduleId !== UNLOCKED_MODULE_ID) {
    return true;
  }
  return getLessonNumber(lesson.id) > UNLOCKED_LESSON_COUNT;
}

function LockIcon() {
  return (
    <svg className="card__lock" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 11V8a5 5 0 0 1 10 0v3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <rect x="5" y="11" width="14" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export default function App() {
  const user = useMemo(() => getTgUser(), []);
  const [viewMode, setViewMode] = useState(VIEW_HOME);
  const [modules, setModules] = useState([]);
  const [currentModule, setCurrentModule] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [aiMessages, setAiMessages] = useState([]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [currentBroadcast, setCurrentBroadcast] = useState(null);
  const aiMessagesEndRef = useRef(null);

  function goHome() {
    setViewMode(VIEW_HOME);
    setCurrentModule(null);
    setCurrentLesson(null);
    setCurrentBroadcast(null);
  }

  function openCourse() {
    setViewMode(VIEW_COURSE);
    setCurrentModule(null);
    setCurrentLesson(null);
    setCurrentBroadcast(null);
  }

  function openBroadcasts() {
    setViewMode(VIEW_BROADCASTS);
    setCurrentModule(null);
    setCurrentLesson(null);
    setCurrentBroadcast(null);
  }

  useEffect(() => {
    if (!AI_CHAT_ENABLED || viewMode !== VIEW_AI) return;
    aiMessagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [aiMessages, aiLoading, viewMode]);

  async function sendAiMessage(rawMessage) {
    const message = String(rawMessage || "").trim();
    if (!message || aiLoading) return;

    setAiError("");
    setAiLoading(true);
    setAiMessages((prev) => [...prev, { role: "user", text: message }]);
    setAiInput("");

    try {
      const res = await fetch(`${API_URL}/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.user_id, message })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      if (!data.answer) {
        throw new Error("Пустой ответ от ассистента");
      }
      setAiMessages((prev) => [...prev, { role: "assistant", text: data.answer }]);
    } catch (e) {
      setAiError(e.message || "Не удалось получить ответ от ассистента");
    } finally {
      setAiLoading(false);
    }
  }

  function handleAiSubmit(event) {
    event.preventDefault();
    sendAiMessage(aiInput);
  }

  useEffect(() => {
    async function loadModules() {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`${API_URL}/modules`);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        setModules(data.modules || []);
        trackEvent({ ...user, event_type: "enter_app" });
      } catch (e) {
        setError(`Не удалось загрузить модули: ${e.message}`);
      } finally {
        setLoading(false);
      }
    }
    loadModules();
  }, [user]);

  async function openModule(moduleId) {
    try {
      setError("");
      const res = await fetch(`${API_URL}/modules/${moduleId}`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      setCurrentModule(data);
      setCurrentLesson(null);
      trackEvent({ ...user, event_type: "open_module", module_id: moduleId });
    } catch (e) {
      setError(`Не удалось открыть модуль: ${e.message}`);
    }
  }

  async function openLesson(lessonId) {
    try {
      setError("");
      const res = await fetch(`${API_URL}/lessons/${lessonId}`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      setCurrentLesson(data);
      trackEvent({
        ...user,
        event_type: "open_lesson",
        module_id: data.moduleId,
        lesson_id: lessonId
      });
    } catch (e) {
      setError(`Не удалось открыть урок: ${e.message}`);
    }
  }

  return (
    <div className="app">
      {viewMode === VIEW_HOME && (
        <section className="home-screen">
          <header className="home-header">
            <img className="brand-logo" src={brandLogo} alt="Два гуся" width={280} height={280} />
            <p className="home-subtitle">Выберите, с чего начать</p>
          </header>

          <div className="home-actions">
            <button type="button" className="home-action home-action--primary" onClick={openCourse}>
              <span className="home-action__label">Смотреть курс по стройке</span>
              <span className="home-action__hint">Модули, уроки и материалы</span>
            </button>
            <button type="button" className="home-action" onClick={() => setViewMode(VIEW_AI)}>
              <span className="home-action__label">Задать вопрос ИИ-агенту</span>
              <span className="home-action__hint">Персональный помощник по стройке</span>
            </button>
            <button type="button" className="home-action" onClick={openBroadcasts}>
              <span className="home-action__label">Записи эфиров</span>
              <span className="home-action__hint">Прошедшие эфиры с приглашёнными экспертами клуба</span>
            </button>
          </div>
        </section>
      )}

      {viewMode === VIEW_AI && !AI_CHAT_ENABLED && (
        <section className="content-section ai-screen">
          <button type="button" className="back" onClick={goHome}>
            ← На главную
          </button>

          <header className="screen-intro">
            <img className="brand-mark" src={brandMark} alt="" width={40} height={40} aria-hidden="true" />
            <h1 className="section-title">Персональный ИИ-ассистент по стройке</h1>
          </header>

          <div className="ai-card">
            <p className="ai-lead">
              Скоро здесь появится ваш персональный ИИ-агент, который поможет:
            </p>
            <ul className="ai-list">
              {AI_STUB_FEATURES.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {viewMode === VIEW_AI && AI_CHAT_ENABLED && (
        <section className="content-section ai-screen ai-chat">
          <button type="button" className="back" onClick={goHome}>
            ← На главную
          </button>

          <header className="ai-chat__header">
            <img className="brand-mark" src={brandMark} alt="" width={40} height={40} aria-hidden="true" />
            <div>
              <h1 className="section-title ai-chat__title">ИИ-ассистент по стройке</h1>
              <p className="ai-chat__subtitle">
                Задайте вопрос по площади, планировке, зонированию и сценариям жизни
              </p>
            </div>
          </header>

          {aiMessages.length === 0 && (
            <div className="ai-starters">
              {AI_STARTERS.map((starter) => (
                <button
                  type="button"
                  key={starter}
                  className="ai-starter"
                  disabled={aiLoading}
                  onClick={() => sendAiMessage(starter)}
                >
                  {starter}
                </button>
              ))}
            </div>
          )}

          <div className="ai-chat__messages">
            {aiMessages.map((item, index) => (
              <div
                key={`${item.role}-${index}`}
                className={`ai-message ai-message--${item.role}`}
              >
                <p>{item.text}</p>
              </div>
            ))}
            {aiLoading && (
              <div className="ai-message ai-message--assistant ai-message--loading">
                <p>Ассистент думает...</p>
              </div>
            )}
            <div ref={aiMessagesEndRef} />
          </div>

          {aiError && <p className="state-text state-text--error">{aiError}</p>}

          <form className="ai-chat__composer" onSubmit={handleAiSubmit}>
            <textarea
              className="ai-chat__input"
              rows={2}
              placeholder="Напишите ваш вопрос..."
              value={aiInput}
              disabled={aiLoading}
              onChange={(event) => setAiInput(event.target.value)}
            />
            <button type="submit" className="ai-chat__send" disabled={aiLoading || !aiInput.trim()}>
              Отправить
            </button>
          </form>
        </section>
      )}

      {viewMode === VIEW_BROADCASTS && !currentBroadcast && (
        <section className="content-section broadcasts-screen">
          <button type="button" className="back" onClick={goHome}>
            ← На главную
          </button>
          <header className="screen-intro">
            <img className="brand-mark" src={brandMark} alt="" width={40} height={40} aria-hidden="true" />
            <h1 className="section-title">Записи эфиров</h1>
          </header>
          <p className="section-subtitle">
            В этом разделе собраны записи прошедших эфиров клуба «Два гуся». Выберите интересующую тему и откройте запись эфира для просмотра.
          </p>
          <div className="card-list">
            {BROADCASTS.map((broadcast) => (
              <button
                type="button"
                className="card card--broadcast"
                key={broadcast.id}
                onClick={() => setCurrentBroadcast(broadcast)}
              >
                <h3>{broadcast.title}</h3>
                <div className="broadcast-card__meta">
                  <span>{broadcast.date}</span>
                  <span>{broadcast.speakers}</span>
                </div>
                <p>{broadcast.previewDescription || broadcast.description}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {viewMode === VIEW_BROADCASTS && currentBroadcast && (
        <section className="content-section broadcasts-screen">
          <button type="button" className="back" onClick={() => setCurrentBroadcast(null)}>
            ← Назад к эфирам
          </button>
          <h2 className="section-title">{currentBroadcast.title}</h2>
          <div className="broadcast-detail__meta">
            <p>
              <span className="broadcast-detail__label">Дата</span>
              {currentBroadcast.date}
            </p>
            <p>
              <span className="broadcast-detail__label">Спикеры</span>
              {currentBroadcast.speakers}
            </p>
          </div>
          <p className="section-subtitle broadcast-detail__description">{currentBroadcast.description}</p>

          {resolveEmbedUrl(currentBroadcast.videoUrl) ? (
            <div className="video-wrap">
              <iframe
                title={currentBroadcast.title}
                src={resolveEmbedUrl(currentBroadcast.videoUrl)}
                allow="autoplay; encrypted-media; fullscreen; picture-in-picture; screen-wake-lock"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="video-wrap video-wrap--placeholder">
              <div className="video-placeholder">
                <span className="video-placeholder__icon" aria-hidden="true">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                    <path
                      d="M10 8.5v7l6-3.5-6-3.5z"
                      fill="currentColor"
                    />
                  </svg>
                </span>
                <p className="video-placeholder__text">Запись скоро появится</p>
              </div>
            </div>
          )}
        </section>
      )}

      {viewMode === VIEW_COURSE && (
        <>
          <header className="app-header">
            <div className="app-header__brand">
              <img className="brand-mark" src={brandMark} alt="" width={40} height={40} aria-hidden="true" />
              <div>
                <h1 className="app-title">Онлайн-курс</h1>
                <p className="app-user">
                  <span className="app-user__label">Пользователь</span>
                  <strong>{user.username || user.user_id}</strong>
                </p>
              </div>
            </div>
          </header>

          {loading && <p className="state-text">Загрузка...</p>}
          {!loading && error && <p className="state-text state-text--error">{error}</p>}

          {!loading && !currentModule && (
            <section className="content-section">
              <button type="button" className="back" onClick={goHome}>
                ← На главную
              </button>
              <h2 className="section-title">Модули</h2>
              <div className="card-list">
                {modules.map((module) => {
                  const locked = isModuleLocked(module);
                  const cardClass = `card card--module${locked ? " card--locked" : ""}`;

                  if (locked) {
                    return (
                      <div className={cardClass} key={module.id} aria-disabled="true">
                        <div className="card__head">
                          <h3>{module.title}</h3>
                          <span className="card__status">
                            <LockIcon />
                            <span className="card__badge">Скоро</span>
                          </span>
                        </div>
                        <p>{module.description}</p>
                        <small>Результат: {module.result}</small>
                      </div>
                    );
                  }

                  return (
                    <button type="button" className={cardClass} key={module.id} onClick={() => openModule(module.id)}>
                      <h3>{module.title}</h3>
                      <p>{module.description}</p>
                      <small>Результат: {module.result}</small>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {currentModule && !currentLesson && (
            <section className="content-section">
              <button className="back" onClick={() => setCurrentModule(null)}>
                ← Назад к модулям
              </button>
              <h2 className="section-title">{currentModule.title}</h2>
              <p className="section-subtitle">{currentModule.description}</p>
              <div className="card-list">
                {currentModule.lessons.map((lesson) => {
                  const locked = isLessonLocked(lesson, currentModule.id);
                  const cardClass = `card card--lesson${locked ? " card--locked" : ""}`;

                  if (locked) {
                    return (
                      <div className={cardClass} key={lesson.id} aria-disabled="true">
                        <div className="card__head">
                          <h3>{lesson.title}</h3>
                          <span className="card__status">
                            <LockIcon />
                            <span className="card__badge">Скоро</span>
                          </span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <button type="button" className={cardClass} key={lesson.id} onClick={() => openLesson(lesson.id)}>
                      <h3>{lesson.title}</h3>
                      <p>{lesson.preview}</p>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {currentLesson && (
            <section className="content-section">
              <button className="back" onClick={() => setCurrentLesson(null)}>
                ← Назад к урокам
              </button>
              <h2 className="section-title">{currentLesson.title}</h2>
              <p className="section-subtitle">
                {currentLesson.description || currentLesson.preview}
              </p>

              {getLessonContent(currentLesson.id) && (
                <div className="lesson-outcomes">
                  <h3 className="section-title section-title--small">Что вы сделаете в этом уроке:</h3>
                  <ol className="lesson-outcomes__list">
                    {getLessonContent(currentLesson.id).outcomes.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ol>
                </div>
              )}

              <div className="video-wrap">
                <iframe
                  title={currentLesson.title}
                  src={currentLesson.videoUrl}
                  allow="autoplay; encrypted-media; fullscreen; picture-in-picture; screen-wake-lock"
                  allowFullScreen
                />
              </div>

              {getLessonContent(currentLesson.id) && (
                <div className="lesson-homework">
                  <h3 className="section-title section-title--small">
                    {getLessonContent(currentLesson.id).homeworkTitle || "Домашнее задание:"}
                  </h3>
                  <ul className="lesson-homework__list">
                    {getLessonContent(currentLesson.id).homework.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              <h3 className="section-title section-title--small">Материалы</h3>
              <ul className="materials-list">
                {getLessonMaterials(currentLesson).map((material) => (
                  <li key={material.file}>
                    <a
                      className="materials-list__link"
                      href={getMaterialUrl(currentLesson.id, material.file)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {material.label}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}

