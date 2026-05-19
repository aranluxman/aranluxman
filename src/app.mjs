import {
  buildMonthDays,
  calculateStats,
  filterItems,
  formatDateKey,
  getGreeting,
  parseIcsEvents,
  sanitizeFocusMinutes,
  todayKey,
} from "./planner-utils.mjs";

const STORE_KEY = "aran-life-flow-state";
const SETTINGS_KEY = "aran-life-flow-settings";
const colors = ["#ef6f75", "#95cfb7", "#efc963", "#6f3aa5", "#b99be1"];
const today = todayKey();

const defaultState = {
  items: [],
  moods: [],
  focusSessions: [],
  selectedDate: today,
  activeFilter: "all",
  monthCursor: `${today.slice(0, 7)}-01`,
};

const moods = [
  ["😵‍💫", "Overwhelmed"],
  ["😴", "Tired"],
  ["🙂", "Okay"],
  ["💪", "Productive"],
  ["🔥", "Locked In"],
];

const quotes = [
  "Small steps count. Show up once, then again.",
  "The day gets easier when the first honest task is finished.",
  "Lock in for the next 25 minutes. That is enough to change the mood.",
  "You do not need perfect energy. You need a clear next move.",
  "Future you is built by the quiet choices you make today.",
  "Start simple. Finish clean. Let momentum do its work.",
];

const words = [
  ["Sillage", "The scent that lingers in the air after someone passes by."],
  ["Eunoia", "Beautiful thinking; a well mind."],
  ["Meraki", "Doing something with soul, care, and full attention."],
  ["Areté", "Excellence through steady practice."],
  ["Komorebi", "Sunlight filtering through trees."],
];

let state = loadJson(STORE_KEY, defaultState);
let settings = loadJson(SETTINGS_KEY, {
  supabaseUrl: "https://hcvjiveloioftozvnbhe.supabase.co",
  supabaseAnonKey: "sb_publishable_DGZFZUhnMLgFpdYzcHWRmw_wqOPu2Aq",
  ownerKey: "",
  calendarUrl: "",
});
let timer = {
  secondsLeft: 25 * 60,
  durationMinutes: 25,
  intervalId: null,
};
let audioContext;
let ambientNodes;
let activeSound = "";

const els = {};

document.addEventListener("DOMContentLoaded", () => {
  bindElements();
  wireEvents();
  hydrateSettingsForm();
  render();
  const initialView = new URLSearchParams(window.location.search).get("view");
  if (["home", "tasks", "calendar", "focus"].includes(initialView)) setView(initialView);
  void syncFromSupabase();
  void importCalendar();
});

function bindElements() {
  [
    "greeting",
    "freshLine",
    "wordTerm",
    "wordDefinition",
    "quoteText",
    "moodRow",
    "doneTodayStat",
    "openTasksStat",
    "streakStat",
    "coinsStat",
    "taskFilters",
    "taskList",
    "calendarGrid",
    "monthLabel",
    "agendaTitle",
    "agendaList",
    "miniCalendar",
    "timerText",
    "customMinutesInput",
    "soundStatus",
    "composeDialog",
    "composeForm",
    "composeTitle",
    "itemTitleInput",
    "itemKindInput",
    "itemDateInput",
    "itemCategoryInput",
    "itemPriorityInput",
    "itemNotesInput",
    "settingsDialog",
    "settingsForm",
    "settingsButton",
    "syncButton",
    "syncStatus",
    "supabaseUrlInput",
    "supabaseAnonInput",
    "ownerKeyInput",
    "calendarUrlInput",
  ].forEach((id) => {
    els[id] = document.getElementById(id);
  });
}

function wireEvents() {
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.view));
  });

  document.querySelectorAll("[data-open-compose]").forEach((button) => {
    button.addEventListener("click", () => openCompose(button.dataset.openCompose));
  });

  document.getElementById("closeComposeButton").addEventListener("click", () => els.composeDialog.close());
  document.getElementById("closeSettingsButton").addEventListener("click", () => els.settingsDialog.close());
  document.getElementById("prevMonthButton").addEventListener("click", () => moveMonth(-1));
  document.getElementById("nextMonthButton").addEventListener("click", () => moveMonth(1));
  document.getElementById("nextQuoteButton").addEventListener("click", nextQuote);
  document.getElementById("playTimerButton").addEventListener("click", toggleTimer);
  document.getElementById("resetTimerButton").addEventListener("click", resetTimer);
  document.getElementById("finishTimerButton").addEventListener("click", finishFocusSession);
  els.settingsButton.addEventListener("click", () => els.settingsDialog.showModal());
  els.syncButton.addEventListener("click", () => syncAll());

  els.taskFilters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter]");
    if (!button) return;
    state.activeFilter = button.dataset.filter;
    persist();
    renderTasks();
  });

  document.querySelectorAll("[data-minutes]").forEach((button) => {
    button.addEventListener("click", () => {
      timer.durationMinutes = sanitizeFocusMinutes(button.dataset.minutes);
      timer.secondsLeft = timer.durationMinutes * 60;
      els.customMinutesInput.value = timer.durationMinutes;
      document.querySelectorAll("[data-minutes]").forEach((item) => item.classList.toggle("active", item === button));
      stopTimer();
      renderTimer();
    });
  });

  els.customMinutesInput.addEventListener("change", () => {
    timer.durationMinutes = sanitizeFocusMinutes(els.customMinutesInput.value);
    timer.secondsLeft = timer.durationMinutes * 60;
    els.customMinutesInput.value = timer.durationMinutes;
    document.querySelectorAll("[data-minutes]").forEach((item) => item.classList.remove("active"));
    stopTimer();
    renderTimer();
  });

  document.querySelectorAll("[data-sound]").forEach((button) => {
    button.addEventListener("click", () => toggleAmbient(button.dataset.sound, button));
  });

  els.composeForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveItemFromForm();
  });

  els.settingsForm.addEventListener("submit", (event) => {
    event.preventDefault();
    settings = {
      supabaseUrl: els.supabaseUrlInput.value.trim(),
      supabaseAnonKey: els.supabaseAnonInput.value.trim(),
      ownerKey: els.ownerKeyInput.value.trim(),
      calendarUrl: els.calendarUrlInput.value.trim(),
    };
    saveJson(SETTINGS_KEY, settings);
    els.settingsDialog.close();
    void syncAll();
  });
}

function render() {
  renderHome();
  renderMoods();
  renderStats();
  renderTasks();
  renderCalendar();
  renderMiniCalendar();
  renderTimer();
}

function renderHome() {
  const date = new Date();
  const word = words[date.getDate() % words.length];
  els.greeting.textContent = `${getGreeting(date)} 🌙`;
  els.freshLine.textContent = "Today is a fresh start 🌷";
  els.wordTerm.textContent = word[0];
  els.wordDefinition.textContent = `"${word[1]}"`;
  els.quoteText.textContent = quotes[date.getDate() % quotes.length];
}

function renderMoods() {
  const moodToday = state.moods.find((mood) => mood.entry_date === today);
  els.moodRow.replaceChildren(
    ...moods.map(([emoji, label]) => {
      const button = document.createElement("button");
      button.className = `mood-button ${moodToday?.label === label ? "active" : ""}`;
      button.type = "button";
      button.innerHTML = `<strong>${emoji}</strong><span>${label}</span>`;
      button.addEventListener("click", () => {
        state.moods = state.moods.filter((mood) => mood.entry_date !== today);
        state.moods.push({
          id: crypto.randomUUID(),
          owner_key: settings.ownerKey,
          mood: emoji,
          label,
          entry_date: today,
          created_at: new Date().toISOString(),
        });
        persist();
        renderMoods();
        void upsertSupabase("life_flow_moods", state.moods.at(-1), "owner_key,entry_date");
      });
      return button;
    }),
  );
}

function renderStats() {
  const stats = calculateStats(state.items, state.focusSessions, today);
  els.doneTodayStat.textContent = stats.doneToday;
  els.openTasksStat.textContent = stats.openTasks;
  els.streakStat.textContent = `${stats.streakDays}d`;
  els.coinsStat.textContent = stats.coins;
}

function renderTasks() {
  els.taskFilters.querySelectorAll("[data-filter]").forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === state.activeFilter);
  });

  const tasks = filterItems(state.items, state.activeFilter, today).sort(sortItems);
  if (!tasks.length) {
    els.taskList.innerHTML = `
      <article class="empty-state">
        <strong>No tasks yet</strong>
        <p>Add what you need to complete today or keep a long-term to-do for later.</p>
        <button class="primary-button" type="button" data-empty-add>Add your first task</button>
      </article>
    `;
    els.taskList.querySelector("[data-empty-add]").addEventListener("click", () => openCompose("daily_task"));
    return;
  }

  els.taskList.replaceChildren(
    ...tasks.map((item) => {
      const row = document.createElement("article");
      row.className = `task-item ${item.completed ? "completed" : ""}`;
      row.style.borderLeftColor = item.color || colorFor(item.category);
      row.innerHTML = `
        <button class="task-check" type="button" aria-label="Toggle ${escapeHtml(item.title)}"></button>
        <div>
          <p class="task-title">${escapeHtml(item.title)}</p>
          <div class="task-meta">${escapeHtml(item.category || "Personal")} · ${item.duration_minutes || 30}min${item.due_date ? ` · ${item.due_date}` : ""}</div>
        </div>
        <div class="task-actions">
          <span aria-hidden="true">♧</span>
          <button class="icon-button" type="button" aria-label="Delete task">×</button>
        </div>
      `;
      row.querySelector(".task-check").addEventListener("click", () => toggleItem(item.id));
      row.querySelector(".icon-button").addEventListener("click", () => deleteItem(item.id));
      return row;
    }),
  );
}

function renderCalendar() {
  const cursor = new Date(`${state.monthCursor}T00:00:00`);
  const monthDays = buildMonthDays(cursor.getFullYear(), cursor.getMonth());
  const formatter = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" });
  els.monthLabel.textContent = formatter.format(cursor);

  els.calendarGrid.replaceChildren(
    ...monthDays.map((day) => {
      const items = itemsForDate(day.key);
      const button = document.createElement("button");
      button.className = [
        "calendar-day",
        day.isCurrentMonth ? "" : "outside",
        day.key === today ? "today" : "",
        day.key === state.selectedDate ? "selected" : "",
        items.length ? "has-items" : "",
      ]
        .filter(Boolean)
        .join(" ");
      button.type = "button";
      button.innerHTML = `${day.dayNumber}${items.length ? '<span class="event-dot"></span>' : ""}`;
      button.addEventListener("click", () => {
        state.selectedDate = day.key;
        persist();
        renderCalendar();
      });
      return button;
    }),
  );

  const selected = new Date(`${state.selectedDate}T00:00:00`);
  els.agendaTitle.textContent =
    state.selectedDate === today
      ? "Today"
      : selected.toLocaleDateString("en", { weekday: "long", month: "short", day: "numeric" });

  const agenda = itemsForDate(state.selectedDate);
  els.agendaList.innerHTML = agenda.length
    ? agenda
        .map(
          (item) => `
            <div class="agenda-item">
              <strong>${escapeHtml(item.title)}</strong>
              <div class="task-meta">${escapeHtml(item.category || "Calendar")} · ${item.duration_minutes || 30}min</div>
            </div>
          `,
        )
        .join("")
    : `<div class="agenda-item"><strong>Open day</strong><div class="task-meta">No calendar items yet.</div></div>`;
}

function renderMiniCalendar() {
  const clone = document.createElement("div");
  clone.innerHTML = `
    <div class="calendar-toolbar">
      <span></span>
      <strong>${els.monthLabel?.textContent || ""}</strong>
      <span></span>
    </div>
    <div class="weekday-row"><span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span></div>
    <div class="calendar-grid">${Array.from(els.calendarGrid?.children || [])
      .map((child) => child.outerHTML)
      .join("")}</div>
  `;
  clone.querySelectorAll("button").forEach((button) => button.setAttribute("tabindex", "-1"));
  els.miniCalendar.replaceChildren(clone);
}

function renderTimer() {
  const minutes = Math.floor(timer.secondsLeft / 60);
  const seconds = timer.secondsLeft % 60;
  els.timerText.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  document.getElementById("playTimerButton").textContent = timer.intervalId ? "Ⅱ" : "▷";
}

function setView(view) {
  document.querySelectorAll(".nav-item").forEach((button) => button.classList.toggle("active", button.dataset.view === view));
  document.querySelectorAll(".view").forEach((section) => section.classList.remove("active"));
  document.getElementById(`${view}View`).classList.add("active");
  if (view === "focus") renderMiniCalendar();
}

function openCompose(kind) {
  els.composeForm.reset();
  els.itemKindInput.value = kind;
  els.itemDateInput.value = kind === "long_term" ? "" : state.selectedDate || today;
  els.itemCategoryInput.value = kind === "calendar_event" ? "Calendar" : "School";
  els.composeTitle.textContent =
    kind === "long_term" ? "Add long-term to-do" : kind === "calendar_event" ? "Add calendar item" : "Add daily task";
  els.composeDialog.showModal();
  els.itemTitleInput.focus();
}

function saveItemFromForm() {
  const kind = els.itemKindInput.value;
  const item = {
    id: crypto.randomUUID(),
    owner_key: settings.ownerKey,
    kind,
    title: els.itemTitleInput.value.trim(),
    notes: els.itemNotesInput.value.trim(),
    category: els.itemCategoryInput.value,
    priority: els.itemPriorityInput.value,
    due_date: els.itemDateInput.value || null,
    scheduled_at: kind === "calendar_event" && els.itemDateInput.value ? `${els.itemDateInput.value}T12:00:00.000Z` : null,
    duration_minutes: 30,
    completed: false,
    color: colorFor(els.itemCategoryInput.value),
    source: "manual",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  state.items.unshift(item);
  persist();
  els.composeDialog.close();
  render();
  void upsertSupabase("life_flow_items", item);
}

function toggleItem(id) {
  const item = state.items.find((candidate) => candidate.id === id);
  if (!item) return;
  item.completed = !item.completed;
  item.updated_at = new Date().toISOString();
  persist();
  render();
  void upsertSupabase("life_flow_items", item);
}

function deleteItem(id) {
  state.items = state.items.filter((item) => item.id !== id);
  persist();
  render();
  void deleteSupabaseItem(id);
}

function moveMonth(direction) {
  const cursor = new Date(`${state.monthCursor}T00:00:00`);
  cursor.setMonth(cursor.getMonth() + direction);
  state.monthCursor = formatDateKey(cursor);
  persist();
  renderCalendar();
  renderMiniCalendar();
}

function nextQuote() {
  const currentIndex = quotes.indexOf(els.quoteText.textContent);
  els.quoteText.textContent = quotes[(currentIndex + 1) % quotes.length];
}

function toggleTimer() {
  if (timer.intervalId) {
    stopTimer();
    renderTimer();
    return;
  }

  timer.intervalId = window.setInterval(() => {
    timer.secondsLeft -= 1;
    if (timer.secondsLeft <= 0) {
      finishFocusSession();
    }
    renderTimer();
  }, 1000);
  renderTimer();
}

function resetTimer() {
  stopTimer();
  timer.secondsLeft = timer.durationMinutes * 60;
  renderTimer();
}

function finishFocusSession() {
  stopTimer();
  playAlarm();
  const session = {
    id: crypto.randomUUID(),
    owner_key: settings.ownerKey,
    minutes: timer.durationMinutes,
    completed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };
  state.focusSessions.unshift(session);
  timer.secondsLeft = timer.durationMinutes * 60;
  persist();
  renderStats();
  renderTimer();
  void upsertSupabase("life_flow_focus_sessions", session);
}

function stopTimer() {
  if (timer.intervalId) window.clearInterval(timer.intervalId);
  timer.intervalId = null;
}

async function getAudioContext() {
  audioContext ||= new AudioContext();
  if (audioContext.state === "suspended") await audioContext.resume();
  return audioContext;
}

async function toggleAmbient(sound, button) {
  const context = await getAudioContext();
  if (activeSound === sound) {
    stopAmbient();
    setSoundStatus("Sound off");
    button.classList.remove("active-sound");
    return;
  }

  stopAmbient();
  activeSound = sound;
  document.querySelectorAll("[data-sound]").forEach((item) => item.classList.toggle("active-sound", item === button));
  ambientNodes = createAmbientSound(context, sound);
  setSoundStatus(`${button.innerText.trim()} playing`);
}

function createAmbientSound(context, sound) {
  const master = context.createGain();
  master.gain.value = sound === "library" ? 0.035 : 0.055;
  master.connect(context.destination);

  if (sound === "rain") return createRain(context, master);
  if (sound === "cafe") return createCafe(context, master);
  return createLibrary(context, master);
}

function createRain(context, master) {
  const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
  const noise = context.createBufferSource();
  const filter = context.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 950;
  noise.buffer = buffer;
  noise.loop = true;
  noise.connect(filter).connect(master);
  noise.start();
  return { sources: [noise], master };
}

function createCafe(context, master) {
  const sources = [220, 277, 330].map((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.value = 0.012 + index * 0.004;
    oscillator.connect(gain).connect(master);
    oscillator.start();
    return oscillator;
  });
  return { sources, master };
}

function createLibrary(context, master) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "triangle";
  oscillator.frequency.value = 174;
  gain.gain.value = 0.02;
  oscillator.connect(gain).connect(master);
  oscillator.start();
  return { sources: [oscillator], master };
}

function stopAmbient() {
  if (!ambientNodes) return;
  ambientNodes.sources.forEach((source) => {
    try {
      source.stop();
    } catch {
      // The source may already be stopped by the browser.
    }
  });
  ambientNodes.master.disconnect();
  ambientNodes = null;
  activeSound = "";
  document.querySelectorAll("[data-sound]").forEach((button) => button.classList.remove("active-sound"));
}

async function playAlarm() {
  const context = await getAudioContext();
  const now = context.currentTime;
  [0, 0.22, 0.44].forEach((offset) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, now + offset);
    oscillator.frequency.exponentialRampToValueAtTime(660, now + offset + 0.16);
    gain.gain.setValueAtTime(0.0001, now + offset);
    gain.gain.exponentialRampToValueAtTime(0.18, now + offset + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.18);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(now + offset);
    oscillator.stop(now + offset + 0.2);
  });
}

function setSoundStatus(message) {
  els.soundStatus.textContent = message;
}

async function syncAll() {
  await syncFromSupabase();
  await syncToSupabase();
  await importCalendar();
}

async function syncFromSupabase() {
  if (!canSync()) {
    setSyncStatus("Local mode");
    return;
  }

  try {
    setSyncStatus("Syncing from Supabase...");
    const [items, moodsList, focusSessions] = await Promise.all([
      supabaseFetch("life_flow_items?select=*&order=created_at.desc"),
      supabaseFetch("life_flow_moods?select=*&order=created_at.desc"),
      supabaseFetch("life_flow_focus_sessions?select=*&order=completed_at.desc"),
    ]);

    state = {
      ...state,
      items: mergeById(state.items, items),
      moods: mergeById(state.moods, moodsList),
      focusSessions: mergeById(state.focusSessions, focusSessions),
    };
    persist();
    render();
    setSyncStatus("Synced");
  } catch (error) {
    setSyncStatus(`Sync paused: ${error.message}`);
  }
}

async function syncToSupabase() {
  if (!canSync()) return;
  setSyncStatus("Saving to Supabase...");
  await Promise.all([
    ...state.items.map((item) => upsertSupabase("life_flow_items", item)),
    ...state.moods.map((mood) => upsertSupabase("life_flow_moods", mood, "owner_key,entry_date")),
    ...state.focusSessions.map((session) => upsertSupabase("life_flow_focus_sessions", session)),
  ]);
  setSyncStatus("Saved");
}

async function importCalendar() {
  if (!settings.calendarUrl) return;
  try {
    const response = await fetch(`/api/calendar?url=${encodeURIComponent(settings.calendarUrl)}`);
    if (!response.ok) throw new Error("calendar unavailable");
    const icsText = await response.text();
    const imported = parseIcsEvents(icsText).map((item) => ({ ...item, owner_key: settings.ownerKey }));
    const existingIds = new Set(state.items.map((item) => item.id));
    const fresh = imported.filter((item) => !existingIds.has(item.id));
    if (!fresh.length) return;
    state.items = [...fresh, ...state.items];
    persist();
    render();
  } catch {
    setSyncStatus("Calendar import skipped");
  }
}

async function upsertSupabase(table, row, onConflict = "id") {
  if (!canSync()) return;
  await supabaseFetch(`${table}?on_conflict=${encodeURIComponent(onConflict)}`, {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify({ ...row, owner_key: settings.ownerKey }),
  });
}

async function deleteSupabaseItem(id) {
  if (!canSync()) return;
  await supabaseFetch(`life_flow_items?id=eq.${id}`, { method: "DELETE" });
}

async function supabaseFetch(path, options = {}) {
  const url = `${settings.supabaseUrl.replace(/\/$/, "")}/rest/v1/${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      apikey: settings.supabaseAnonKey,
      Authorization: `Bearer ${settings.supabaseAnonKey}`,
      "Content-Type": "application/json",
      "x-owner-key": settings.ownerKey,
      ...(options.headers || {}),
    },
  });
  if (!response.ok) throw new Error(await response.text());
  if (response.status === 204) return null;
  return response.json();
}

function canSync() {
  return Boolean(settings.supabaseUrl && settings.supabaseAnonKey && settings.ownerKey);
}

function hydrateSettingsForm() {
  els.supabaseUrlInput.value = settings.supabaseUrl;
  els.supabaseAnonInput.value = settings.supabaseAnonKey;
  els.ownerKeyInput.value = settings.ownerKey;
  els.calendarUrlInput.value = settings.calendarUrl;
}

function setSyncStatus(message) {
  els.syncStatus.textContent = message;
}

function itemsForDate(dateKey) {
  return state.items.filter((item) => item.due_date === dateKey || String(item.scheduled_at || "").slice(0, 10) === dateKey);
}

function sortItems(a, b) {
  return Number(a.completed) - Number(b.completed) || priorityWeight(b.priority) - priorityWeight(a.priority);
}

function priorityWeight(priority) {
  return { high: 3, medium: 2, low: 1 }[priority] || 0;
}

function colorFor(value = "") {
  let total = 0;
  for (const char of value) total += char.charCodeAt(0);
  return colors[total % colors.length];
}

function persist() {
  saveJson(STORE_KEY, state);
}

function loadJson(key, fallback) {
  try {
    return { ...fallback, ...JSON.parse(localStorage.getItem(key) || "{}") };
  } catch {
    return fallback;
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function mergeById(local, remote) {
  const merged = new Map(local.map((item) => [item.id, item]));
  remote.forEach((item) => merged.set(item.id, item));
  return [...merged.values()];
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    }[char];
  });
}
