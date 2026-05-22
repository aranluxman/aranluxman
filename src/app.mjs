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
  parseIcsEvents,
  sanitizeFocusMinutes,
  todayKey,
} from "./planner-utils.mjs";

const STORE_KEY = "aran-life-flow-state";
const SETTINGS_KEY = "aran-life-flow-settings";
const colors = ["#ef6f75", "#95cfb7", "#efc963", "#6f3aa5", "#b99be1"];
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

const moods = [
  ["\ud83d\ude35\u200d\ud83d\udcab", "Overwhelmed"],
  ["\ud83d\ude34", "Tired"],
  ["\ud83d\ude42", "Okay"],
  ["\ud83d\udcaa", "Productive"],
  ["\ud83d\udd25", "Locked In"],
];

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
  "Study like you are helping tomorrow-you breathe easier.",
  "Give one task your full attention and watch the day open up.",
  "The hard part gets smaller once it is named.",
  "Tiny progress still counts as proof.",
  "Do it badly for two minutes. Then make it better.",
  "Momentum likes motion, not speeches.",
  "Your future is built in boring, brave minutes.",
  "Start with the page, the problem, or the first sentence.",
  "Lock in now so you can relax properly later.",
  "A little discipline gives you a lot of freedom.",
  "The next right action is enough.",
  "You do not need a perfect day to have a strong one.",
  "Make it simple. Make it done.",
  "One calm hour can rescue the whole afternoon.",
  "Energy follows action more often than action follows energy.",
  "Give yourself one clean block of attention.",
  "Done is a door. Walk through it.",
  "You can be tired and still take one good step.",
  "Pick the important thing before the urgent noise picks for you.",
  "Your attention is valuable. Spend it like it matters.",
  "Small habits are how big goals learn to stand.",
  "Do the work your future self keeps thanking you for.",
  "A focused twenty-five minutes is a serious move.",
  "The best comeback is a quiet restart.",
  "You are not behind. You are here, and here is workable.",
  "Less scrolling, more becoming.",
  "Start where your feet are.",
  "You do not have to crush the day. Just move it forward.",
  "Protect the next hour like it belongs to your goals.",
  "The first rep is the hardest. Do that one.",
  "Progress is allowed to look ordinary.",
  "Your brain likes proof. Give it one completed task.",
  "Make the plan smaller until it moves.",
  "The assignment gets less scary when it has a first line.",
  "You can always choose focus again.",
  "Every finished task is a vote for the person you are becoming.",
  "A calm pace can still be a powerful pace.",
  "Start now. Confidence can catch up.",
  "Build the streak one honest session at a time.",
  "The goal is not drama. The goal is progress.",
  "Do the useful thing before the easy distraction.",
  "You only need enough courage for the next step.",
  "If it matters, give it a block on the calendar.",
  "Your work does not need to be loud to be strong.",
  "Turn the big thing into a checklist and take the first check.",
  "You are closer after one focused minute than after one worried hour.",
  "Breathe, choose, begin.",
  "Good work starts with attention.",
  "You can make this lighter by starting.",
  "Let the first draft be messy and real.",
  "Respect the timer. It is here to help you win.",
  "Focus is just returning, over and over.",
  "A clean start is available right now.",
  "Choose one thing and make it obvious.",
  "The day bends when you act.",
  "Do the thing that makes you proud at bedtime.",
  "Your goals deserve a quiet yes today.",
  "No rush, no panic, just steady pressure.",
  "You can handle a small beginning.",
  "A little order creates a lot of peace.",
  "Put the next task where your eyes can find it.",
  "Your effort is not wasted just because it is slow.",
  "Focus first, polish later.",
  "You are building evidence that you can trust yourself.",
  "One task. One timer. One clean finish.",
  "The page will not stay blank after the first word.",
  "Study now so the test feels familiar later.",
  "Your sleep, focus, and work all count. Track them honestly.",
  "Make today easier by doing the next real thing.",
  "The strongest routine is the one you actually repeat.",
  "You can be low-energy and still be high-intent.",
  "Start with what is due. Then take care of what matters.",
  "The calendar is not pressure. It is a map.",
  "Put your mind where your future is.",
  "Short sessions are still sessions.",
  "Every reset is a skill.",
  "Win the next ten minutes.",
  "Do not negotiate with the distraction. Start the timer.",
  "You can make a hard day useful.",
  "Clear beats crowded.",
  "A task written down is a task you can beat.",
  "Give the work your full attention, then give rest your full attention.",
  "Your best days are made from small choices repeated.",
  "The next focused block is always available.",
  "Keep promises to yourself in small, specific ways.",
  "Let steady be enough.",
  "The finish line gets closer when you stop measuring and start moving.",
  "You have done hard things before. This is another rep.",
  "Be the person who starts.",
];

const words = [
  ["Sillage", "The scent that lingers in the air after someone passes by."],
  ["Eunoia", "Beautiful thinking; a well mind."],
  ["Meraki", "Doing something with soul, care, and full attention."],
  ["Areté", "Excellence through steady practice."],
  ["Komorebi", "Sunlight filtering through trees."],
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
let settings = ensureSettings(loadJson(SETTINGS_KEY, {
  supabaseUrl: "https://hcvjiveloioftozvnbhe.supabase.co",
  supabaseAnonKey: "sb_publishable_DGZFZUhnMLgFpdYzcHWRmw_wqOPu2Aq",
  ownerKey: "",
  calendarUrl: "",
  sleepGoalHours: 8,
  darkMode: false,
  plannerSubtitle: "Personal planner",
}));
let timer = {
  secondsLeft: 25 * 60,
  durationMinutes: 25,
  intervalId: null,
};
let audioContext;
let ambientNodes;
let activeSound = "";
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
    "soundStatus",
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
    "darkModeInput",
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
      darkMode: els.darkModeInput.checked,
      sleepGoalHours: clampSleepGoal(els.sleepGoalInput.value || settings.sleepGoalHours),
    };
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

function renderMoods() {
  if (!els.moodRow) return;
  const today = todayKey();
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
        <p>Add what you need to complete today or keep a long-term to-do for later.</p>
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
          <p class="task-title">${escapeHtml(item.title)}</p>
          <div class="task-meta">${escapeHtml(item.category || "Personal")} · ${item.duration_minutes || 30}min${item.due_date ? ` · ${item.due_date}` : ""}</div>
        </div>
        <div class="task-actions">
          <span aria-hidden="true">♧</span>
          <button class="icon-button" type="button" aria-label="Delete task">×</button>
        </div>
      `;
      row.querySelector(".task-meta").textContent = `${item.category || "Personal"} · ${item.duration_minutes || 30}min${item.due_date ? ` · Due ${item.due_date}` : ""}`;
      row.querySelector(".task-actions").innerHTML = `
        <button class="icon-button" type="button" data-edit-task aria-label="Edit task" title="Edit task"><i data-lucide="pencil"></i></button>
        <button class="icon-button" type="button" data-delete-task aria-label="Delete task" title="Delete task"><i data-lucide="trash-2"></i></button>
      `;
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

function renderSleep() {
  const goalHours = clampSleepGoal(settings.sleepGoalHours);
  const summary = getSleepSummary(state.sleepEntries, goalHours * 60);
  els.sleepGoalInput.value = goalHours;
  els.latestSleepStat.textContent = formatSleepDuration(summary.latestMinutes);
  els.averageSleepStat.textContent = formatSleepDuration(summary.averageMinutes);
  els.latestSleepContext.textContent = summary.latestMinutes ? `${summary.latestPercent}% of goal` : "No data";
  els.averageSleepContext.textContent = summary.averageMinutes ? `${summary.averagePercent}% of goal` : "No data";
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
          <span>${formatTime(entry.slept_at)} - ${formatTime(entry.woke_at)}</span>
        </div>
        <b>${formatSleepDuration(minutes)}</b>
        <button class="icon-button" type="button" aria-label="Delete sleep entry">Ã—</button>
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
  const playButton = document.getElementById("playTimerButton");
  playButton.innerHTML = timer.intervalId ? '<i data-lucide="pause"></i>' : '<i data-lucide="play"></i>';
  playButton.setAttribute("aria-label", timer.intervalId ? "Pause" : "Start");
  playButton.title = timer.intervalId ? "Pause" : "Start";
  refreshIcons();
}
function setView(view) {
  const switchView = () => {
    document.querySelectorAll(".nav-item").forEach((button) => button.classList.toggle("active", button.dataset.view === view));
    document.querySelectorAll(".view").forEach((section) => section.classList.remove("active"));
    document.getElementById(`${view}View`).classList.add("active");
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
  if (!minutes || minutes > 11 * 60) {
    els.sleepError.hidden = false;
    els.wokeAtInput.focus();
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
  playAlarm();
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
  master.gain.value = sound === "library" || sound === "white-noise" ? 0.035 : 0.055;
  master.connect(context.destination);

  if (sound === "rain") return createRain(context, master);
  if (sound === "cafe") return createCafe(context, master);
  if (sound === "library") return createLibrary(context, master);
  if (sound === "nature") return createTone(context, master, "sine", 196, 0.018);
  if (sound === "lofi") return createCafe(context, master);
  return createRain(context, master);
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
  return createTone(context, master, "triangle", 174, 0.02);
}

function createTone(context, master, type, frequency, volume) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.value = volume;
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
    const [items, moodsList, focusSessions, sleepEntries] = await Promise.all([
      supabaseFetch("life_flow_items?select=*&order=created_at.desc"),
      supabaseFetch("life_flow_moods?select=*&order=created_at.desc"),
      supabaseFetch("life_flow_focus_sessions?select=*&order=completed_at.desc"),
      supabaseFetch("life_flow_sleep_entries?select=*&order=sleep_date.desc"),
    ]);

    state = {
      ...state,
      items: mergeById(state.items, items),
      moods: mergeById(state.moods, moodsList),
      focusSessions: mergeById(state.focusSessions, focusSessions),
      sleepEntries: mergeById(state.sleepEntries, sleepEntries),
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
    ...state.sleepEntries.map((entry) => upsertSupabase("life_flow_sleep_entries", entry, "owner_key,sleep_date")),
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
    if (canSync()) await Promise.all(fresh.map((item) => upsertSupabase("life_flow_items", item)));
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
  // Security note: confirm Supabase RLS policies only allow rows whose owner_key matches the x-owner-key header.
  return Boolean(settings.supabaseUrl && settings.supabaseAnonKey && settings.ownerKey);
}

function hydrateSettingsForm() {
  els.supabaseUrlInput.value = settings.supabaseUrl;
  els.supabaseAnonInput.value = settings.supabaseAnonKey;
  els.ownerKeyInput.value = settings.ownerKey;
  els.calendarUrlInput.value = settings.calendarUrl;
  els.plannerSubtitleInput.value = settings.plannerSubtitle || "Personal planner";
  els.darkModeInput.checked = Boolean(settings.darkMode);
  els.sleepGoalInput.value = clampSleepGoal(settings.sleepGoalHours);
}

function setSyncStatus(message) {
  els.syncStatus.textContent = message;
  if (!els.syncBanner) return;
  const isBusy = /syncing|saving|loading/i.test(message);
  const isProblem = /paused|failed|unavailable|skipped/i.test(message);
  els.syncBanner.hidden = !isBusy && !isProblem;
  els.syncBanner.classList.toggle("error", isProblem);
  els.syncBannerText.textContent = message;
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
    ownerKey: savedSettings.ownerKey || createOwnerKey(),
  };
  if (normalized.ownerKey !== savedSettings.ownerKey) saveJson(SETTINGS_KEY, normalized);
  return normalized;
}

function createOwnerKey() {
  return `owner_${crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(36).slice(2)}`}`;
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
  document.body.classList.toggle("dark-mode", Boolean(settings.darkMode));
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
  return Math.min(14, Math.max(1, Math.round(goal * 2) / 2));
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
