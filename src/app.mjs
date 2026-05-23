import {
  buildMonthDays,
  calculateSleepMinutes,
  calculateStats,
  countSessionsForDate,
  filterItems,
  formatDisplayDate,
  formatSleepDuration,
  formatDateKey,
  getGreeting,
  getGreetingEmoji,
  getHomeSubtitle,
  getSleepSummary,
  isSleepDurationValid,
  MAX_SLEEP_MINUTES,
  parseIcsEvents,
  sanitizeFocusMinutes,
  todayKey,
} from "./planner-utils.mjs";

const STORE_KEY = "aran-life-flow-state";
const SETTINGS_KEY = "aran-life-flow-settings";
const colors = ["#6366f1", "#8b5cf6", "#f59e0b", "#10b981", "#f43f5e"];
const today = todayKey();
const todayMonth = () => `${todayKey().slice(0, 7)}-01`;
const starterTasks = [
  {
    id: "0b7c7939-4a28-4d4e-8e96-b4d3a78ff101",
    kind: "daily_task",
    title: "Tell guidance about website and how I am not taking summer school",
    notes: "",
    category: "School",
    priority: "high",
    due_date: today,
    scheduled_at: "",
    duration_minutes: 30,
    completed: false,
    color: colors[0],
    source: "manual",
    created_at: `${today}T09:00:00.000Z`,
  },
  {
    id: "f47ba22f-b0db-4d3d-853d-a3091caaaf20",
    kind: "daily_task",
    title: "Work on science culminating",
    notes: "",
    category: "School",
    priority: "high",
    due_date: today,
    scheduled_at: "",
    duration_minutes: 45,
    completed: false,
    color: colors[2],
    source: "manual",
    created_at: `${today}T09:05:00.000Z`,
  },
];

const defaultState = {
  items: starterTasks,
  moods: [],
  focusSessions: [],
  sleepEntries: [],
  starterTasksSeeded: true,
  selectedDate: todayKey(),
  activeFilter: "today",
  monthCursor: todayMonth(),
  focusedTaskId: "",
};

const quotes = [
  "Small steps count. Show up once, then again.",
  "The day gets easier when the first honest task is finished.",
  "Lock in for the next 25 minutes. That is enough to change the mood.",
  "You do not need perfect energy. You need a clear next move.",
  "Future you is built by the quiet choices you make today.",
  "Start simple. Finish clean. Let momentum do its work.",
  "Do the first five minutes. The rest can meet you there.",
  "One finished task beats ten perfect plans.",
  "Make the next move small enough that you cannot dodge it.",
  "Your focus is a muscle. Train it gently and often.",
  "You are allowed to begin before you feel ready.",
  "Clean effort today gives tomorrow more room.",
  "Choose the task that makes everything else lighter.",
  "The win is not feeling motivated. The win is starting anyway.",
  "Take one lap around the problem, then take one real step.",
  "Consistency is quiet. That is why it works.",
  "A clear desk is nice. A clear next action is better.",
  "You can reset the day at any minute.",
  "Do not wait for a perfect mood to do useful work.",
  "Finish the little thing. It will change the whole room.",
  "Give one task your full attention and watch the day open up.",
  "Tiny progress still counts as proof.",
  "Do it badly for two minutes. Then make it better.",
  "Momentum likes motion, not speeches.",
  "Your future is built in boring, brave minutes.",
  "Lock in now so you can relax properly later.",
  "A little discipline gives you a lot of freedom.",
  "The next right action is enough.",
  "Make it simple. Make it done.",
  "One calm hour can rescue the whole afternoon.",
  "Energy follows action more often than action follows energy.",
  "Done is a door. Walk through it.",
  "You are not behind. You are here, and here is workable.",
  "Start where your feet are.",
  "Every finished task is a vote for the person you are becoming.",
  "A calm pace can still be a powerful pace.",
  "Start now. Confidence can catch up.",
  "The best comeback is a quiet restart.",
  "Less scrolling, more becoming.",
  "Win the next ten minutes.",
];

const coachSuggestions = [
  "Start with {task}. Put 25 minutes on the clock and only worry about the first step.",
  "{task} is the move. Clear your desk, start focus mode, and make one visible piece of progress.",
  "Your best next move is {task}. Keep it simple: open the work, set the timer, and begin.",
  "Pick {task} before the day gets noisy. One focused block is enough to change the pace.",
  "Do {task} first, then reward yourself with a short break. Clean effort, clean reset.",
];

const arcadeBoosts = [
  "Quest: finish one task before opening a distraction.",
  "Combo move: 25 minutes of focus, then mark one task done.",
  "Power-up: write the first sentence or first line, even if it is rough.",
  "Boss round: do the task you keep avoiding for only 10 minutes.",
  "Clean streak: finish something small, then tidy the next action.",
  "Focus sprint: start the timer and leave your phone across the room.",
  "Planner bonus: add a due date to anything that feels vague.",
  "Sleep bonus: protect bedtime tonight so tomorrow starts easier.",
];

let state = refreshDailyState(ensureStarterTasks(loadJson(STORE_KEY, defaultState)));
let settings = ensureSettings(
  loadJson(SETTINGS_KEY, {
    supabaseUrl: "https://hcvjiveloioftozvnbhe.supabase.co",
    supabaseAnonKey: "sb_publishable_DGZFZUhnMLgFpdYzcHWRmw_wqOPu2Aq",
    ownerKey: "",
    calendarUrl: "",
    sleepGoalHours: 8,
    lightMode: false,
    plannerSubtitle: "Personal planner",
  }),
);

let timer = {
  secondsLeft: 25 * 60,
  durationMinutes: 25,
  intervalId: null,
};
let audioContext;
let arcadeBoostOffset = 0;

const els = {};

document.addEventListener("DOMContentLoaded", () => {
  bindElements();
  wireEvents();
  hydrateSettingsForm();
  applySettings();
  render();
  const initialView = new URLSearchParams(window.location.search).get("view");
  if (["home", "tasks", "calendar", "sleep", "focus", "arcade"].includes(initialView)) setView(initialView);
  persist();
  void syncFromSupabase();
  void importCalendar();
});

function bindElements() {
  [
    "greeting",
    "currentDateText",
    "freshLine",
    "quoteText",
    "coachText",
    "coachButton",
    "doneTodayStat",
    "openTasksStat",
    "streakStat",
    "coinsStat",
    "taskFilters",
    "taskList",
    "quickTaskForm",
    "quickTaskInput",
    "quickTaskExpandButton",
    "quickTaskExtra",
    "quickTaskDate",
    "quickTaskCategory",
    "quickTaskPriority",
    "quickTaskNotes",
    "todayButton",
    "calendarGrid",
    "monthLabel",
    "agendaTitle",
    "agendaList",
    "arcadeCoins",
    "arcadeBoost",
    "arcadeBoostButton",
    "focusTaskSelect",
    "sessionsTodayText",
    "timerText",
    "customMinutesInput",
    "addSleepButton",
    "sleepGoalInput",
    "sleepDialog",
    "sleepForm",
    "sleepDateInput",
    "sleptAtInput",
    "wokeAtInput",
    "sleepError",
    "latestSleepStat",
    "latestSleepContext",
    "averageSleepStat",
    "averageSleepContext",
    "sleepChart",
    "sleepHint",
    "sleepList",
    "composeDialog",
    "composeForm",
    "composeTitle",
    "editingItemIdInput",
    "advancedFields",
    "toggleAdvancedButton",
    "itemTitleInput",
    "itemKindInput",
    "itemDateInput",
    "itemCategoryInput",
    "itemPriorityInput",
    "itemNotesInput",
    "settingsDialog",
    "settingsForm",
    "settingsButton",
    "brandHomeButton",
    "sidebarSubtitle",
    "syncButton",
    "syncStatus",
    "syncBanner",
    "syncBannerText",
    "supabaseUrlInput",
    "supabaseAnonInput",
    "ownerKeyInput",
    "plannerSubtitleInput",
    "lightModeInput",
    "calendarUrlInput",
  ].forEach((id) => {
    els[id] = document.getElementById(id);
  });
}

function wireEvents() {
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.view));
  });

  els.brandHomeButton.addEventListener("click", () => setView("home"));

  document.querySelectorAll("[data-open-compose]").forEach((button) => {
    button.addEventListener("click", () => openCompose(button.dataset.openCompose));
  });

  document.getElementById("closeComposeButton").addEventListener("click", () => els.composeDialog.close());
  document.getElementById("closeSleepButton").addEventListener("click", () => els.sleepDialog.close());
  document.getElementById("closeSettingsButton").addEventListener("click", () => els.settingsDialog.close());
  document.getElementById("prevMonthButton").addEventListener("click", () => moveMonth(-1));
  document.getElementById("nextMonthButton").addEventListener("click", () => moveMonth(1));
  els.todayButton.addEventListener("click", goToToday);
  document.getElementById("nextQuoteButton").addEventListener("click", nextQuote);
  els.coachButton.addEventListener("click", renderCoach);
  els.arcadeBoostButton.addEventListener("click", () => {
    arcadeBoostOffset += 1;
    renderArcadeBoost();
  });
  document.getElementById("playTimerButton").addEventListener("click", toggleTimer);
  document.getElementById("resetTimerButton").addEventListener("click", resetTimer);
  document.getElementById("finishTimerButton").addEventListener("click", finishFocusSession);
  els.settingsButton.addEventListener("click", () => els.settingsDialog.showModal());
  els.syncButton.addEventListener("click", () => syncAll());
  els.addSleepButton.addEventListener("click", openSleepDialog);
  els.toggleAdvancedButton.addEventListener("click", () => setAdvancedFields(els.advancedFields.hidden));
  els.itemKindInput.addEventListener("change", () => {
    if (els.itemKindInput.value === "calendar_event") setAdvancedFields(true);
  });
  els.sleepGoalInput.addEventListener("change", () => {
    settings.sleepGoalHours = clampSleepGoal(els.sleepGoalInput.value);
    els.sleepGoalInput.value = settings.sleepGoalHours;
    saveJson(SETTINGS_KEY, settings);
    renderSleep();
  });

  els.focusTaskSelect.addEventListener("change", () => {
    state.focusedTaskId = els.focusTaskSelect.value;
    persist();
  });

  document.querySelectorAll("[data-toggle-secret]").forEach((button) => {
    button.addEventListener("click", () => toggleSecret(button));
  });

  els.taskFilters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter]");
    if (!button) return;
    state.activeFilter = button.dataset.filter;
    persist();
    renderTasks();
  });

  els.quickTaskForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveQuickTask();
  });

  els.quickTaskExpandButton.addEventListener("click", () => {
    const expanded = els.quickTaskExtra.classList.toggle("open");
    els.quickTaskExtra.hidden = !expanded;
    els.quickTaskExpandButton.setAttribute("aria-expanded", String(expanded));
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

  els.composeForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveItemFromForm();
  });

  els.sleepForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveSleepFromForm();
  });

  els.settingsForm.addEventListener("submit", (event) => {
    event.preventDefault();
    settings = {
      supabaseUrl: els.supabaseUrlInput.value.trim(),
      supabaseAnonKey: els.supabaseAnonInput.value.trim(),
      ownerKey: els.ownerKeyInput.value.trim() || settings.ownerKey || createOwnerKey(),
      calendarUrl: els.calendarUrlInput.value.trim(),
      plannerSubtitle: els.plannerSubtitleInput.value.trim() || "Personal planner",
      lightMode: els.lightModeInput.checked,
      sleepGoalHours: clampSleepGoal(els.sleepGoalInput.value || settings.sleepGoalHours),
    };
    els.ownerKeyInput.value = settings.ownerKey;
    saveJson(SETTINGS_KEY, settings);
    applySettings();
    els.settingsDialog.close();
    void syncAll();
  });
}

function render() {
  renderHome();
  renderCoach();
  renderStats();
  renderTasks();
  renderCalendar();
  renderSleep();
  renderFocusTasks();
  renderArcade();
  renderTimer();
  refreshIcons();
}

function renderHome() {
  const date = new Date();
  els.greeting.textContent = `${getGreeting(date)} ${getGreetingEmoji(date)}`;
  els.currentDateText.textContent = formatDisplayDate(date);
  els.freshLine.textContent = getHomeSubtitle(date);
  els.quoteText.textContent = quotes[date.getDate() % quotes.length];
}

function renderCoach() {
  const today = todayKey();
  const nextTask = getNextOpenTask(today);
  const taskTitle = nextTask?.title || "one small task";
  const sessions = countSessionsForDate(state.focusSessions, today);
  const sleepSummary = getSleepSummary(state.sleepEntries, settings.sleepGoalHours * 60);
  const template = coachSuggestions[(new Date().getDate() + sessions) % coachSuggestions.length];
  const sleepLine =
    sleepSummary.averageMinutes && sleepSummary.averageMinutes < sleepSummary.goalMinutes
      ? ` Your sleep average is ${formatSleepDuration(sleepSummary.averageMinutes)}, so keep tonight calmer.`
      : "";
  els.coachText.textContent = `${template.replace("{task}", taskTitle)}${sleepLine}`;
}

function renderStats() {
  const today = todayKey();
  const stats = calculateStats(state.items, state.focusSessions, today);
  els.doneTodayStat.textContent = stats.doneToday;
  els.openTasksStat.textContent = stats.openTasks;
  els.streakStat.textContent = stats.streakDays ? String(stats.streakDays) : "—";
  els.coinsStat.textContent = stats.coins;
}

function renderArcade() {
  const stats = calculateStats(state.items, state.focusSessions, todayKey());
  els.arcadeCoins.textContent = String(stats.coins);
  renderArcadeBoost();
}

function renderArcadeBoost() {
  const today = todayKey();
  const stats = calculateStats(state.items, state.focusSessions, today);
  const completedToday = state.items.filter((item) => item.completed && item.due_date === today).length;
  const index =
    (stats.coins + completedToday + countSessionsForDate(state.focusSessions, today) + arcadeBoostOffset) %
    arcadeBoosts.length;
  els.arcadeBoost.textContent = arcadeBoosts[index];
}

function renderTasks() {
  const today = todayKey();
  els.taskFilters.querySelectorAll("[data-filter]").forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === state.activeFilter);
  });

  const tasks = filterItems(state.items, state.activeFilter, today).sort(sortItems);
  if (!tasks.length) {
    els.taskList.innerHTML = `
      <article class="empty-state">
        <strong>No tasks yet</strong>
        <p>Type something above and hit enter to add it instantly.</p>
      </article>
    `;
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
          <p class="task-title"></p>
          <div class="task-meta"></div>
        </div>
        <div class="task-actions">
          <button class="icon-button" type="button" data-edit-task aria-label="Edit task" title="Edit task"><i data-lucide="pencil"></i></button>
          <button class="icon-button" type="button" data-delete-task aria-label="Delete task" title="Delete task"><i data-lucide="trash-2"></i></button>
        </div>
      `;
      row.querySelector(".task-title").textContent = item.title;
      row.querySelector(".task-meta").textContent = `${item.category || "Personal"}${item.priority === "high" ? " · High" : ""}${item.due_date ? ` · ${formatTaskDate(item.due_date)}` : ""}`;
      row.querySelector(".task-check").addEventListener("click", () => toggleItem(item.id));
      row.querySelector("[data-edit-task]").addEventListener("click", () => openCompose(item.kind, item));
      row.querySelector("[data-delete-task]").addEventListener("click", () => deleteItem(item.id));
      return row;
    }),
  );
  refreshIcons();
}

function renderCalendar() {
  const today = todayKey();
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

  const agenda = itemsForDate(state.selectedDate).sort((a, b) =>
    String(a.scheduled_at || "").localeCompare(String(b.scheduled_at || "")),
  );
  els.agendaList.innerHTML = agenda.length
    ? agenda
        .map(
          (item) => `
            <div class="agenda-item">
              <strong>${escapeHtml(item.title)}</strong>
              <div class="task-meta">${escapeHtml(item.category || "Calendar")}${item.scheduled_at ? ` · ${formatTime(item.scheduled_at)}` : ""}</div>
            </div>
          `,
        )
        .join("")
    : `<div class="agenda-item empty"><strong>Open day</strong><div class="task-meta">Nothing scheduled.</div></div>`;
}

function renderSleep() {
  const goalHours = clampSleepGoal(settings.sleepGoalHours);
  const summary = getSleepSummary(state.sleepEntries, goalHours * 60);
  els.sleepGoalInput.value = goalHours;
  els.latestSleepStat.textContent = formatSleepDuration(summary.latestMinutes);
  els.averageSleepStat.textContent = formatSleepDuration(summary.averageMinutes);
  els.latestSleepContext.textContent = summary.latestMinutes ? `${summary.latestPercent}% of goal` : "No data yet";
  els.averageSleepContext.textContent = summary.averageMinutes ? `${summary.averagePercent}% of goal` : "No data yet";
  els.sleepHint.textContent = summary.points.length
    ? `Goal: ${formatSleepDuration(summary.goalMinutes)} per night.`
    : "Add your first sleep log to start the graph.";

  if (!summary.points.length) {
    els.sleepChart.innerHTML = `
      <article class="empty-state compact">
        <strong>No sleep yet</strong>
        <p>Add the date, bedtime, and wake time.</p>
      </article>
    `;
    els.sleepList.replaceChildren();
    return;
  }

  els.sleepChart.replaceChildren(
    ...summary.points.map((point) => {
      const bar = document.createElement("div");
      bar.className = "sleep-bar";
      bar.innerHTML = `
        <span class="sleep-bar-fill" style="height: ${point.percent}%"></span>
        <strong>${point.label}</strong>
        <small>${new Date(`${point.date}T00:00:00`).toLocaleDateString("en", { weekday: "short" })}</small>
      `;
      return bar;
    }),
  );

  const sorted = [...state.sleepEntries].sort((a, b) => String(b.sleep_date).localeCompare(String(a.sleep_date)));
  els.sleepList.replaceChildren(
    ...sorted.slice(0, 6).map((entry) => {
      const row = document.createElement("article");
      row.className = "sleep-row";
      const minutes = Number(entry.minutes) || calculateSleepMinutes(entry.slept_at, entry.woke_at);
      row.innerHTML = `
        <div>
          <strong>${new Date(`${entry.sleep_date}T00:00:00`).toLocaleDateString("en", {
            month: "short",
            day: "numeric",
          })}</strong>
          <span>${formatTime(entry.slept_at)} – ${formatTime(entry.woke_at)}</span>
        </div>
        <b>${formatSleepDuration(minutes)}</b>
        <button class="icon-button" type="button" aria-label="Delete sleep entry"><i data-lucide="trash-2"></i></button>
      `;
      row.querySelector("button").addEventListener("click", () => deleteSleepEntry(entry.id));
      return row;
    }),
  );
  refreshIcons();
}

function renderFocusTasks() {
  const focusable = state.items.filter((item) => !item.completed && (item.kind === "daily_task" || item.kind === "long_term"));
  els.focusTaskSelect.replaceChildren(
    new Option(focusable.length ? "Pick a task" : "No open tasks yet", ""),
    ...focusable.map((item) => new Option(item.title, item.id)),
  );
  if (state.focusedTaskId && focusable.some((item) => item.id === state.focusedTaskId)) {
    els.focusTaskSelect.value = state.focusedTaskId;
  }
  els.sessionsTodayText.textContent = `Sessions today: ${countSessionsForDate(state.focusSessions, todayKey())}`;
}

function renderTimer() {
  const minutes = Math.floor(timer.secondsLeft / 60);
  const seconds = timer.secondsLeft % 60;
  els.timerText.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const ring = document.getElementById("timerRingFill");
  if (ring) {
    const total = Math.max(1, timer.durationMinutes * 60);
    const progress = Math.min(1, Math.max(0, timer.secondsLeft / total));
    const circumference = 2 * Math.PI * 100;
    ring.style.strokeDasharray = String(circumference);
    ring.style.strokeDashoffset = String(circumference * (1 - progress));
  }
  const playButton = document.getElementById("playTimerButton");
  playButton.innerHTML = timer.intervalId ? '<i data-lucide="pause"></i>' : '<i data-lucide="play"></i>';
  playButton.setAttribute("aria-label", timer.intervalId ? "Pause" : "Start");
  playButton.title = timer.intervalId ? "Pause" : "Start";
  refreshIcons();
}

function setView(view) {
  const switchView = () => {
    document.querySelectorAll(".nav-item").forEach((button) => button.classList.toggle("active", button.dataset.view === view));
    const current = document.querySelector(".view.active");
    const next = document.getElementById(`${view}View`);
    if (!next) return;
    if (current === next) return;
    if (current) current.classList.remove("active");
    next.classList.add("active");
    refreshIcons();
  };

  if (document.startViewTransition) {
    document.startViewTransition(switchView);
    return;
  }

  switchView();
}

function openCompose(kind, item = null) {
  els.composeForm.reset();
  const effectiveKind = item?.kind || kind;
  els.editingItemIdInput.value = item?.id || "";
  els.itemKindInput.value = effectiveKind;
  els.itemTitleInput.value = item?.title || "";
  els.itemDateInput.value = item?.due_date || (effectiveKind === "long_term" ? "" : todayKey());
  els.itemCategoryInput.value = item?.category || (effectiveKind === "calendar_event" ? "Calendar" : "School");
  els.itemPriorityInput.value = item?.priority || "medium";
  els.itemNotesInput.value = item?.notes || "";
  els.composeTitle.textContent =
    item ? "Edit item" : effectiveKind === "long_term" ? "Add long-term to-do" : effectiveKind === "calendar_event" ? "Add calendar item" : "Add daily task";
  setAdvancedFields(Boolean(item || effectiveKind === "calendar_event"));
  els.composeDialog.showModal();
  els.itemTitleInput.focus();
}

function setAdvancedFields(show) {
  els.advancedFields.hidden = !show;
  document.querySelectorAll("[data-advanced-field]").forEach((field) => {
    field.hidden = !show;
  });
  els.toggleAdvancedButton.textContent = show ? "Less options" : "More options";
  els.toggleAdvancedButton.setAttribute("aria-expanded", String(show));
}

function saveQuickTask() {
  const title = els.quickTaskInput.value.trim();
  if (!title) return;
  const expanded = els.quickTaskExtra.classList.contains("open");
  const category = expanded ? els.quickTaskCategory.value : "Personal";
  const item = {
    id: crypto.randomUUID(),
    owner_key: settings.ownerKey,
    kind: "daily_task",
    title,
    notes: expanded ? els.quickTaskNotes.value.trim() : "",
    category,
    priority: expanded ? els.quickTaskPriority.value : "medium",
    due_date: expanded ? (els.quickTaskDate.value || todayKey()) : todayKey(),
    scheduled_at: null,
    duration_minutes: 30,
    completed: false,
    color: colorFor(category),
    source: "manual",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  state.items = [item, ...state.items];
  persist();
  els.quickTaskForm.reset();
  els.quickTaskExtra.classList.remove("open");
  els.quickTaskExtra.hidden = true;
  els.quickTaskExpandButton.setAttribute("aria-expanded", "false");
  render();
  void upsertSupabase("life_flow_items", item);
}

function saveItemFromForm() {
  const kind = els.itemKindInput.value;
  const editingId = els.editingItemIdInput.value;
  const existing = state.items.find((item) => item.id === editingId);
  const item = {
    id: existing?.id || crypto.randomUUID(),
    owner_key: settings.ownerKey,
    kind,
    title: els.itemTitleInput.value.trim(),
    notes: els.itemNotesInput.value.trim(),
    category: els.itemCategoryInput.value,
    priority: els.itemPriorityInput.value,
    due_date: els.itemDateInput.value || null,
    scheduled_at: kind === "calendar_event" && els.itemDateInput.value ? `${els.itemDateInput.value}T12:00:00.000Z` : null,
    duration_minutes: existing?.duration_minutes || 30,
    completed: existing?.completed || false,
    color: existing?.color || colorFor(els.itemCategoryInput.value),
    source: existing?.source || "manual",
    created_at: existing?.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  state.items = editingId ? state.items.map((candidate) => (candidate.id === editingId ? item : candidate)) : [item, ...state.items];
  persist();
  els.composeDialog.close();
  render();
  void upsertSupabase("life_flow_items", item);
}

function openSleepDialog() {
  els.sleepForm.reset();
  els.sleepError.hidden = true;
  const today = todayKey();
  const tomorrow = new Date(`${today}T00:00:00`);
  tomorrow.setDate(tomorrow.getDate() + 1);
  els.sleepDateInput.value = today;
  els.sleptAtInput.value = `${today}T22:30`;
  els.wokeAtInput.value = `${formatDateKey(tomorrow)}T06:30`;
  els.sleepDialog.showModal();
  els.sleptAtInput.focus();
}

function saveSleepFromForm() {
  const sleptAt = els.sleptAtInput.value;
  const wokeAt = els.wokeAtInput.value;
  const minutes = calculateSleepMinutes(sleptAt, wokeAt);
  if (!minutes) {
    showSleepError("That doesn't look right — wake time should be after bedtime.");
    return;
  }
  if (!isSleepDurationValid(minutes)) {
    const hours = (minutes / 60).toFixed(1);
    showSleepError(`Not valid: ${hours} hours is over the ${MAX_SLEEP_MINUTES / 60}-hour limit. Double-check your times and try again.`);
    return;
  }
  els.sleepError.hidden = true;

  const entry = {
    id: crypto.randomUUID(),
    owner_key: settings.ownerKey,
    sleep_date: els.sleepDateInput.value,
    slept_at: sleptAt,
    woke_at: wokeAt,
    minutes,
    created_at: new Date().toISOString(),
  };

  state.sleepEntries = [entry, ...state.sleepEntries.filter((candidate) => candidate.sleep_date !== entry.sleep_date)];
  persist();
  els.sleepDialog.close();
  renderSleep();
  void upsertSupabase("life_flow_sleep_entries", entry, "owner_key,sleep_date");
}

function showSleepError(message) {
  els.sleepError.textContent = message;
  els.sleepError.hidden = false;
}

function deleteSleepEntry(id) {
  state.sleepEntries = state.sleepEntries.filter((entry) => entry.id !== id);
  persist();
  renderSleep();
  if (canSync()) void supabaseFetch(`life_flow_sleep_entries?id=eq.${id}`, { method: "DELETE" });
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
}

function goToToday() {
  const today = todayKey();
  state.selectedDate = today;
  state.monthCursor = `${today.slice(0, 7)}-01`;
  persist();
  renderCalendar();
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
  void playAlarm();
  const session = {
    id: crypto.randomUUID(),
    owner_key: settings.ownerKey,
    minutes: timer.durationMinutes,
    task_id: state.focusedTaskId || null,
    completed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };
  state.focusSessions.unshift(session);
  timer.secondsLeft = timer.durationMinutes * 60;
  persist();
  renderStats();
  renderFocusTasks();
  renderCoach();
  renderArcade();
  renderTimer();
  void upsertSupabase("life_flow_focus_sessions", session);
}

function stopTimer() {
  if (timer.intervalId) window.clearInterval(timer.intervalId);
  timer.intervalId = null;
}

async function playAlarm() {
  try {
    audioContext ||= new AudioContext();
    if (audioContext.state === "suspended") await audioContext.resume();
    const context = audioContext;
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
  } catch {
    // Audio is best-effort.
  }
}

async function syncAll() {
  await syncFromSupabase();
  await syncToSupabase();
  await importCalendar();
}

async function syncFromSupabase() {
  if (!canSync()) {
    setSyncStatus("Local mode — add Supabase URL, key, and owner key in Settings to sync.");
    return;
  }

  try {
    setSyncStatus("Syncing from Supabase...");
    const [items, focusSessions, sleepEntries] = await Promise.all([
      supabaseFetch("life_flow_items?select=*&order=created_at.desc"),
      supabaseFetch("life_flow_focus_sessions?select=*&order=completed_at.desc"),
      supabaseFetch("life_flow_sleep_entries?select=*&order=sleep_date.desc"),
    ]);

    state = {
      ...state,
      items: mergeById(state.items, items),
      focusSessions: mergeById(state.focusSessions, focusSessions),
      sleepEntries: mergeById(state.sleepEntries, sleepEntries),
    };
    persist();
    render();
    setSyncStatus("Synced with Supabase");
  } catch (error) {
    setSyncStatus(`Sync paused: ${error.message}`);
  }
}

async function syncToSupabase() {
  if (!canSync()) return;
  setSyncStatus("Saving to Supabase...");
  try {
    await Promise.all([
      ...state.items.map((item) => upsertSupabase("life_flow_items", item)),
      ...state.focusSessions.map((session) => upsertSupabase("life_flow_focus_sessions", session)),
      ...state.sleepEntries.map((entry) => upsertSupabase("life_flow_sleep_entries", entry, "owner_key,sleep_date")),
    ]);
    setSyncStatus("Saved to Supabase");
  } catch (error) {
    setSyncStatus(`Sync paused: ${error.message}`);
  }
}

async function importCalendar() {
  if (!settings.calendarUrl) return;
  try {
    setSyncStatus("Importing Google Calendar...");
    const response = await fetch(`/api/calendar?url=${encodeURIComponent(settings.calendarUrl)}`);
    if (!response.ok) throw new Error("calendar unavailable");
    const icsText = await response.text();
    const imported = parseIcsEvents(icsText).map((item) => ({ ...item, owner_key: settings.ownerKey }));
    const existingIcs = new Set(state.items.filter((item) => item.source === "ics").map((item) => item.id));
    const fresh = imported.filter((item) => !existingIcs.has(item.id));
    if (fresh.length) {
      const importedIds = new Set(imported.map((item) => item.id));
      state.items = [...fresh, ...state.items.filter((item) => item.source !== "ics" || importedIds.has(item.id))];
      persist();
      render();
      if (canSync()) await Promise.all(fresh.map((item) => upsertSupabase("life_flow_items", item)));
    }
    setSyncStatus(`Imported ${imported.length} calendar event${imported.length === 1 ? "" : "s"}`);
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
  const text = await response.text();
  if (!response.ok) throw new Error(text || response.statusText);
  if (!text) return null;
  return JSON.parse(text);
}

function canSync() {
  return Boolean(settings.supabaseUrl && settings.supabaseAnonKey && settings.ownerKey);
}

function hydrateSettingsForm() {
  els.supabaseUrlInput.value = settings.supabaseUrl;
  els.supabaseAnonInput.value = settings.supabaseAnonKey;
  els.ownerKeyInput.value = settings.ownerKey;
  els.calendarUrlInput.value = settings.calendarUrl;
  els.plannerSubtitleInput.value = settings.plannerSubtitle || "Personal planner";
  els.lightModeInput.checked = Boolean(settings.lightMode);
  els.sleepGoalInput.value = clampSleepGoal(settings.sleepGoalHours);
}

function setSyncStatus(message) {
  els.syncStatus.textContent = message;
  if (!els.syncBanner) return;
  const isBusy = /syncing|saving|loading|importing/i.test(message);
  const isProblem = /paused|failed|unavailable|skipped/i.test(message);
  els.syncBanner.hidden = !isBusy && !isProblem;
  els.syncBanner.classList.toggle("error", isProblem);
  els.syncBannerText.textContent = message;
  if (!isBusy && !isProblem) {
    window.setTimeout(() => {
      els.syncBanner.hidden = true;
    }, 2500);
  }
}

function itemsForDate(dateKey) {
  return state.items.filter((item) => item.due_date === dateKey || String(item.scheduled_at || "").slice(0, 10) === dateKey);
}

function getNextOpenTask(dateKey) {
  return (
    filterItems(state.items, "today", dateKey).sort(sortItems)[0] ||
    state.items
      .filter((item) => !item.completed && (item.kind === "daily_task" || item.kind === "long_term"))
      .sort(sortItems)[0]
  );
}

function formatTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" });
}

function formatTaskDate(dateKey) {
  const date = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  const today = todayKey();
  if (dateKey === today) return "Today";
  const tomorrow = new Date(`${today}T00:00:00`);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (dateKey === formatDateKey(tomorrow)) return "Tomorrow";
  return date.toLocaleDateString("en", { month: "short", day: "numeric" });
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

function ensureSettings(savedSettings) {
  const normalized = {
    ...savedSettings,
    ownerKey: (savedSettings.ownerKey && savedSettings.ownerKey.trim()) || createOwnerKey(),
  };
  if (normalized.ownerKey !== savedSettings.ownerKey) saveJson(SETTINGS_KEY, normalized);
  return normalized;
}

function createOwnerKey() {
  if (globalThis.crypto?.randomUUID) return `owner_${globalThis.crypto.randomUUID()}`;
  return `owner_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
}

function refreshDailyState(savedState) {
  const today = todayKey();
  return {
    ...savedState,
    activeFilter: savedState.activeFilter === "all" ? "today" : savedState.activeFilter || "today",
    selectedDate: today,
    monthCursor: `${today.slice(0, 7)}-01`,
  };
}

function ensureStarterTasks(savedState) {
  if (savedState.starterTasksSeeded) return savedState;
  const existingTitles = new Set((savedState.items || []).map((item) => item.title.toLowerCase()));
  return {
    ...savedState,
    items: [
      ...starterTasks.filter((task) => !existingTitles.has(task.title.toLowerCase())),
      ...(savedState.items || []),
    ],
    starterTasksSeeded: true,
  };
}

function applySettings() {
  document.body.classList.toggle("light-mode", Boolean(settings.lightMode));
  els.sidebarSubtitle.textContent = settings.plannerSubtitle || "Personal planner";
}

function toggleSecret(button) {
  const input = document.getElementById(button.dataset.toggleSecret);
  const shouldShow = input.type === "password";
  input.type = shouldShow ? "text" : "password";
  button.textContent = shouldShow ? "Hide" : "Show";
}

function clampSleepGoal(value) {
  const goal = Number.parseFloat(value);
  if (!Number.isFinite(goal)) return 8;
  return Math.min(11, Math.max(1, Math.round(goal * 2) / 2));
}

function refreshIcons() {
  if (window.lucide?.createIcons) window.lucide.createIcons();
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
