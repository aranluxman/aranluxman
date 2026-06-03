import {
  buildMonthDays,
  calculateCoinBreakdown,
  calculateSleepMinutes,
  calculateSleepScore,
  calculateStats,
  countSessionsForDate,
  eventsForDate,
  filterItems,
  formatDateKey,
  formatDisplayDate,
  formatSleepDuration,
  getGreeting,
  getGreetingEmoji,
  getHomeSubtitle,
  getSleepSummary,
  parseIcsEvents,
  sanitizeFocusMinutes,
  summarizeFitnessWeek,
  todayKey,
} from "./planner-utils.mjs";

const STORE_KEY = "aran-life-flow-state";
const SETTINGS_KEY = "aran-life-flow-settings";
const legacySharedIds = new Set(["0b7c7939-4a28-4d4e-8e96-b4d3a78ff101", "f47ba22f-b0db-4d3d-853d-a3091caaaf20"]);
const categoryColors = {
  School: "#3e9cff",
  "Track & Field": "#ff9738",
  YMCA: "#27c78a",
  "Duke of Ed": "#9171ef",
  "Web Dev": "#ebbd45",
  Personal: "#9aa9ba",
  Calendar: "#22c6d6",
};
const dukeLabels = { physical: "Physical (Track & Field)", volunteering: "Volunteering (YMCA)", skill: "Skill (Web Dev)" };
const quotePool = [
  "Champions are made in the moments they want to quit.",
  "Speed is earned in quiet training sessions.",
  "Discipline carries you when motivation takes the day off.",
  "The finish line rewards the work nobody saw.",
  "Train with purpose. Recover with purpose.",
  "One clean rep is a vote for the athlete you are becoming.",
  "Strong starts begin with steady habits.",
  "Confidence is built after practice, not before it.",
  "Show up on ordinary days and race days feel possible.",
  "You do not need perfect conditions to give honest effort.",
  "A focused hour today makes tomorrow lighter.",
  "The hardest lap teaches the most.",
  "Your future time on the clock starts with today's choice.",
  "Be patient with results and demanding about effort.",
  "Recovery is training too.",
  "Small improvements stack into big performances.",
  "Complete the assignment. Complete the rep. Build trust in yourself.",
  "Great athletes prepare before the starting gun.",
  "Finish what matters before chasing what is easy.",
  "The work is the reward before the medal arrives.",
  "A calm mind and a trained body move fast.",
  "Every session is practice for keeping a promise.",
  "Strong weeks are built one planned day at a time.",
  "Make effort automatic and excellence follows.",
  "A bad start is still a chance to finish strong.",
  "The person who keeps going becomes hard to beat.",
  "Your goals deserve your attention today.",
  "Race your own standard first.",
  "Schoolwork finished early is energy saved for training.",
  "Give back, build skills, and keep moving forward.",
  "The clock measures the result; your routine creates it.",
  "Turn pressure into preparation.",
  "The best comeback begins with the next task.",
  "Train hard enough to be proud, rest well enough to repeat.",
  "Momentum begins the second you start.",
];
const coachTips = [
  "After track practice, drink water, eat something useful, and give your legs a real stretch before homework.",
  "Your 100m speed depends on recovery too. An 8.5-hour sleep target is training, not a bonus.",
  "A hard 400m day deserves an easy evening: finish one school task, then protect bedtime.",
  "Before Monday, Wednesday, or Friday practice, pack spikes, water, and a snack before school gets busy.",
  "Write one note after training: how your start, stride, or finish felt. It turns practice into progress.",
  "Check School tasks first. Finishing the nearest deadline frees your head for training.",
  "Break a culminating project into one action you can finish in a 25-minute homework session.",
  "Submit or pack school work before the deadline day whenever possible. Race days need mental room.",
  "Open the hardest assignment and write the first line before switching tabs.",
  "Use today's calendar events as anchors: plan homework around training instead of hoping time appears.",
  "For Saturday YMCA volunteering, confirm your timing and bring water before you leave.",
  "Coaching well starts with preparation: think of one basketball or volleyball drill before the YMCA shift.",
  "After volunteering, log your hours while they are fresh so your Duke of Ed evidence stays complete.",
  "Your Duke of Ed log only takes a few minutes when you do it weekly. Sunday is your reset point.",
  "Physical, Volunteering, and Skill all count. Advance a Duke bar when you complete real evidence.",
  "Web development is your Skill section: record a feature you built or a problem you solved this week.",
  "For a freelance client project, choose one visible deliverable and send an update after it is done.",
  "A clean client checklist beats trying to remember revisions in your head.",
  "Before coding, define the smallest feature the client can see working today.",
  "Train hard, give back, build something: pick one action that serves one of those goals right now.",
  "If energy is low, take a 10-minute Track Planning session and update your log instead of losing momentum.",
  "Schedule recovery like an event. Athletes improve between demanding sessions too.",
  "Do 10 pushups now if you need a quick win, then return to the school task that matters most.",
  "One completed focus session earns your break. Keep the phone away until the timer finishes.",
];
const completionMessages = [
  "One session closer to your goal, Aran.",
  "That is real progress. Let it count.",
  "Your discipline just got stronger.",
  "One block finished; your day is already better.",
  "Strong focus carries into strong races.",
  "Good work. Recover briefly and choose the next move.",
  "That is how deadlines become manageable.",
  "You showed up. That matters.",
  "Momentum looks good on you.",
  "A small win, properly earned.",
  "You are building consistency one session at a time.",
  "Keep the standard high and the next step simple.",
  "Nice work. Water, breathe, reset.",
  "You just made future-you's day easier.",
  "Finish steady. Train steady. Grow steady.",
];
const boostPool = [
  "Log your Duke of Ed entry for the week.",
  "Complete 20 pushups before lunch.",
  "Finish one school task before checking your phone.",
  "Log last night's sleep.",
  "Review your next track session plan.",
  "Send one clear update on a Web Dev project.",
];
const memoryIcons = ["bolt", "book-open", "trophy", "code-2", "heart-handshake", "timer", "star", "graduation-cap"];

const defaultState = {
  items: [],
  sleepEntries: [],
  focusSessions: [],
  fitnessLog: [],
  rewards: [],
  dukeProgress: { physical: 0, volunteering: 0, skill: 0 },
  memoryNotes: { family: "Everything I do is for them.", moments: "", future: "" },
  reactionAttempts: [],
  goalReminder: "Train hard. Give back. Build something.",
  selectedDate: todayKey(),
  monthCursor: `${todayKey().slice(0, 7)}-01`,
  calendarView: "month",
  activeFilter: "today",
  focusedTaskId: "",
};
const defaultSettings = {
  supabaseUrl: "https://hcvjiveloioftozvnbhe.supabase.co",
  supabaseAnonKey: "sb_publishable_DGZFZUhnMLgFpdYzcHWRmw_wqOPu2Aq",
  ownerKey: "",
  calendarUrl: "",
  displayName: "Aran",
  plannerSubtitle: "Grade 9 \u00b7 Athlete \u00b7 Builder",
  sleepGoalHours: 8.5,
  focusGoal: 4,
  pushupGoal: 60,
  trackGoal: 3,
  darkMode: true,
};
const recurringTemplates = [
  ["seed-track", "Track Training", "Track & Field", "2026-01-01", "15:30", "17:30", [1, 3, 5]],
  ["seed-ymca", "YMCA - Basketball & Volleyball Coaching", "YMCA", "2026-01-01", "10:00", "12:00", [6]],
  ["seed-duke", "Duke of Ed Log Entry", "Duke of Ed", "2026-01-01", "", "", [0]],
];

let settings = normalizeSettings(loadJson(SETTINGS_KEY, defaultSettings));
let state = normalizeState(loadJson(STORE_KEY, defaultState));
let timer = { secondsLeft: 25 * 60, durationMinutes: 25, intervalId: null, isBreak: false };
let activeSound = "";
let audioContext;
let ambientNodes;
let reaction = { mode: "idle", goAt: 0, timeoutId: null };
let memoryGame = null;
let pendingSleepId = "";
const els = {};

document.addEventListener("DOMContentLoaded", () => {
  bindElements();
  wireEvents();
  state.selectedDate = todayKey();
  state.monthCursor = `${todayKey().slice(0, 7)}-01`;
  hydrateSettingsForm();
  applySettings();
  persist();
  render();
  const view = new URLSearchParams(location.search).get("view");
  if (["home", "tasks", "calendar", "sleep", "focus", "arcade"].includes(view)) setView(view);
  void initializeCloud();
});

function bindElements() {
  [
    "greeting", "homeTitle", "currentDateText", "freshLine", "quoteText", "nextQuoteButton", "coachText", "coachButton",
    "doneTodayStat", "openTasksStat", "streakStat", "coinsStat", "trackWeekStat", "pushupsWeekStat", "addTrackSessionButton",
    "addPushupsButton", "upcomingTodayList", "taskFilters", "taskList", "quickTaskForm", "quickTaskInput", "quickTaskCategory",
    "pushupsTodayText", "pushupsTodayButton", "trackTodayToggle", "monthLabel", "todayButton", "calendarGrid", "monthCalendar",
    "weekGrid", "calendarViewToggle", "agendaTitle", "agendaList", "addSleepButton", "sleepGoalInput", "lastNightSummary",
    "averageSleepStat", "sleepScoreStat", "sleepHint", "sleepChart", "sleepList", "focusTaskSelect", "focusLabelInput",
    "sessionsTodayText", "focusMinutesText", "sessionDots", "sessionHistoryList", "timerText", "customMinutesInput", "soundStatus",
    "arcadeCoins", "arcadeCoinBreakdown", "arcadeBoost", "arcadeBoostButton", "reactionStartButton", "reactionPad", "reactionBest",
    "reactionHistory", "memoryStartButton", "memoryStatus", "memoryGrid", "goalReminderInput", "composeDialog", "composeForm",
    "composeTitle", "editingItemIdInput", "toggleAdvancedButton", "advancedFields", "itemTitleInput", "itemKindInput",
    "itemDateInput", "itemCategoryInput", "itemPriorityInput", "itemNotesInput", "itemStartTimeInput", "itemEndTimeInput",
    "itemRepeatInput", "repeatDays", "sleepDialog", "sleepForm", "sleepDateInput", "sleptAtInput", "wokeAtInput",
    "sleepError", "sleepMoodDialog", "completionDialog", "completionMessage", "settingsDialog", "settingsForm", "settingsButton",
    "brandHomeButton", "sidebarSubtitle", "syncButton", "syncStatus", "syncBanner", "syncBannerText", "displayNameInput",
    "plannerSubtitleInput", "focusGoalInput", "pushupGoalInput", "trackGoalInput", "supabaseUrlInput", "supabaseAnonInput",
    "ownerKeyInput", "calendarUrlInput", "darkModeInput", "resetDataButton",
  ].forEach((id) => {
    els[id] = document.getElementById(id);
  });
}

function wireEvents() {
  document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => setView(button.dataset.view)));
  document.querySelectorAll("[data-open-compose]").forEach((button) => button.addEventListener("click", () => openCompose(button.dataset.openCompose)));
  document.querySelectorAll("[data-toggle-secret]").forEach((button) => button.addEventListener("click", () => toggleSecret(button)));
  document.getElementById("closeComposeButton").addEventListener("click", () => els.composeDialog.close());
  document.getElementById("closeSleepButton").addEventListener("click", () => els.sleepDialog.close());
  document.getElementById("closeSettingsButton").addEventListener("click", () => els.settingsDialog.close());
  document.getElementById("prevMonthButton").addEventListener("click", () => moveCalendar(-1));
  document.getElementById("nextMonthButton").addEventListener("click", () => moveCalendar(1));
  els.brandHomeButton.addEventListener("click", () => setView("home"));
  els.settingsButton.addEventListener("click", () => els.settingsDialog.showModal());
  els.nextQuoteButton.addEventListener("click", nextQuote);
  els.coachButton.addEventListener("click", () => renderCoach(true));
  els.addTrackSessionButton.addEventListener("click", () => logFitness({ track_session: true }));
  els.addPushupsButton.addEventListener("click", () => logFitness({ pushups: 10 }));
  els.pushupsTodayButton.addEventListener("click", () => logFitness({ pushups: 10 }));
  els.trackTodayToggle.addEventListener("click", (event) => {
    const button = event.target.closest("[data-track-value]");
    if (button) setTrackToday(button.dataset.trackValue === "true");
  });
  document.querySelectorAll(".memory-card").forEach((card) => card.addEventListener("click", (event) => {
    if (!event.target.matches("textarea")) card.classList.toggle("expanded");
  }));
  document.querySelectorAll("[data-memory-note]").forEach((textarea) => textarea.addEventListener("input", () => {
    state.memoryNotes[textarea.dataset.memoryNote] = textarea.value;
    persist();
    void upsertAppState();
  }));
  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-duke-key]");
    if (!button) return;
    const key = button.dataset.dukeKey;
    state.dukeProgress[key] = (state.dukeProgress[key] + 10) % 110;
    persist();
    renderDukeProgress();
    void upsertAppState();
  });
  els.quickTaskForm.addEventListener("submit", (event) => {
    event.preventDefault();
    createQuickTask();
  });
  els.taskFilters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter]");
    if (!button) return;
    state.activeFilter = button.dataset.filter;
    persist();
    renderTasks();
  });
  els.todayButton.addEventListener("click", goToToday);
  els.calendarViewToggle.addEventListener("click", (event) => {
    const button = event.target.closest("[data-calendar-view]");
    if (!button) return;
    state.calendarView = button.dataset.calendarView;
    persist();
    renderCalendar();
  });
  els.addSleepButton.addEventListener("click", openSleepDialog);
  els.sleepGoalInput.addEventListener("change", () => {
    settings.sleepGoalHours = clampNumber(els.sleepGoalInput.value, 6, 10, 8.5);
    els.sleepGoalInput.value = settings.sleepGoalHours;
    saveJson(SETTINGS_KEY, settings);
    renderSleep();
    renderStats();
    void upsertAppState();
  });
  els.focusTaskSelect.addEventListener("change", () => {
    state.focusedTaskId = els.focusTaskSelect.value;
    persist();
  });
  document.querySelectorAll("[data-minutes]").forEach((button) => button.addEventListener("click", () => setDuration(button)));
  els.customMinutesInput.addEventListener("change", () => setCustomDuration());
  document.getElementById("playTimerButton").addEventListener("click", toggleTimer);
  document.getElementById("resetTimerButton").addEventListener("click", resetTimer);
  document.getElementById("finishTimerButton").addEventListener("click", finishFocusSession);
  document.querySelectorAll("[data-sound]").forEach((button) => button.addEventListener("click", () => toggleAmbient(button.dataset.sound, button)));
  document.getElementById("startBreakButton").addEventListener("click", () => {
    els.completionDialog.close();
    selectPreset(15);
  });
  document.getElementById("startAgainButton").addEventListener("click", () => {
    els.completionDialog.close();
    selectPreset(25);
  });
  els.arcadeBoostButton.addEventListener("click", completeDailyBoost);
  els.reactionStartButton.addEventListener("click", startReaction);
  els.reactionPad.addEventListener("click", tapReaction);
  els.memoryStartButton.addEventListener("click", startMemoryGame);
  els.goalReminderInput.addEventListener("input", () => {
    state.goalReminder = els.goalReminderInput.value;
    persist();
    void upsertAppState();
  });
  els.toggleAdvancedButton.addEventListener("click", () => setAdvancedFields(els.advancedFields.hidden));
  els.itemKindInput.addEventListener("change", updateCalendarFields);
  els.itemRepeatInput.addEventListener("change", renderRepeatDays);
  els.repeatDays.addEventListener("click", (event) => {
    const button = event.target.closest("[data-repeat-day]");
    if (button) button.classList.toggle("active");
  });
  els.composeForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveItemFromForm();
  });
  els.sleepForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveSleepFromForm();
  });
  document.querySelectorAll("[data-sleep-mood]").forEach((button) => button.addEventListener("click", () => saveSleepMood(button)));
  els.syncButton.addEventListener("click", () => syncAll());
  els.settingsForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveSettings();
  });
  els.resetDataButton.addEventListener("click", resetAllData);
}

function render() {
  renderHome();
  renderStats();
  renderUpcomingToday();
  renderCoach();
  renderDukeProgress();
  renderMemoryNotes();
  renderTasks();
  renderCalendar();
  renderSleep();
  renderFocus();
  renderArcade();
  renderTimer();
  refreshIcons();
}

function renderHome() {
  const date = new Date();
  els.greeting.textContent = `${getGreeting(date)} ${getGreetingEmoji(date)}`;
  els.homeTitle.textContent = settings.displayName;
  els.currentDateText.textContent = formatDisplayDate(date);
  els.freshLine.textContent = getHomeSubtitle(date);
  els.quoteText.textContent = quotePool[dailyIndex(quotePool.length)];
}

function nextQuote() {
  const current = quotePool.indexOf(els.quoteText.textContent);
  els.quoteText.textContent = quotePool[(current + 1) % quotePool.length];
}

function renderCoach(randomize = false) {
  const index = randomize ? Math.floor(Math.random() * coachTips.length) : (dailyIndex(coachTips.length) + state.focusSessions.length) % coachTips.length;
  els.coachText.textContent = coachTips[index];
}

function renderStats() {
  const stats = calculateStats(state.items, state.focusSessions, todayKey(), state.sleepEntries, state.rewards, settings.sleepGoalHours * 60);
  const fitness = summarizeFitnessWeek(state.fitnessLog, todayKey());
  els.doneTodayStat.textContent = String(stats.doneToday);
  els.openTasksStat.textContent = String(stats.openTasks);
  els.streakStat.textContent = stats.streakDays ? `${stats.streakDays}d` : "\u2014";
  els.coinsStat.textContent = String(stats.coins);
  els.trackWeekStat.textContent = `${fitness.trackSessions} / ${settings.trackGoal}`;
  els.pushupsWeekStat.textContent = `${fitness.pushups} / ${settings.pushupGoal}`;
}

function renderUpcomingToday() {
  const events = eventsForDate(state.items, todayKey()).sort(sortByTime).slice(0, 3);
  els.upcomingTodayList.innerHTML = events.length
    ? events.map((event) => `<span class="event-pill" style="--accent:${colorFor(event.category)}"><b>${formatEventTime(event)}</b>${escapeHtml(event.title)}</span>`).join("")
    : '<p class="empty-inline">No events today - free day.</p>';
}

function renderDukeProgress() {
  document.querySelectorAll("[data-duke-bars]").forEach((container) => {
    container.innerHTML = Object.entries(dukeLabels).map(([key, label]) => `
      <button class="duke-bar" type="button" data-duke-key="${key}" aria-label="Advance ${label}">
        <span><b>${label}</b><strong>${state.dukeProgress[key]}%</strong></span>
        <i><em style="width:${state.dukeProgress[key]}%"></em></i>
      </button>`).join("");
  });
}

function renderMemoryNotes() {
  document.querySelectorAll("[data-memory-note]").forEach((input) => {
    input.value = state.memoryNotes[input.dataset.memoryNote] || "";
  });
}

function createQuickTask() {
  const title = els.quickTaskInput.value.trim();
  if (!title) return;
  state.items.unshift(makeTask({ title, category: els.quickTaskCategory.value, due_date: todayKey() }));
  els.quickTaskInput.value = "";
  persist();
  render();
  void upsertSupabase("life_flow_items", state.items[0]);
}

function renderTasks() {
  els.taskFilters.querySelectorAll("[data-filter]").forEach((button) => button.classList.toggle("active", button.dataset.filter === state.activeFilter));
  const tasks = filterItems(state.items, state.activeFilter, todayKey()).sort(sortTasks);
  const todayFitness = fitnessEntry(todayKey());
  els.pushupsTodayText.textContent = `Pushups logged today: ${todayFitness.pushups || 0}`;
  els.trackTodayToggle.querySelectorAll("button").forEach((button) => {
    button.classList.toggle("active", String(Boolean(todayFitness.track_session)) === button.dataset.trackValue);
  });
  if (!tasks.length) {
    els.taskList.innerHTML = '<article class="empty-state"><strong>No tasks yet</strong><p>Write one above and keep your day clear.</p></article>';
    return;
  }
  els.taskList.innerHTML = tasks.map((task) => taskMarkup(task)).join("");
  tasks.forEach((task) => {
    const row = document.querySelector(`[data-task-id="${task.id}"]`);
    row.querySelector("[data-toggle-task]").addEventListener("click", () => toggleTask(task.id));
    row.querySelector("[data-edit-task]").addEventListener("click", () => openCompose(task.kind, task));
    row.querySelector("[data-delete-task]").addEventListener("click", () => deleteItem(task.id));
    row.querySelector("[data-expand-task]").addEventListener("click", () => row.classList.toggle("expanded"));
    row.querySelector("[data-subtask-form]").addEventListener("submit", (event) => {
      event.preventDefault();
      addSubtask(task.id, event.target.elements.title.value);
    });
    row.querySelectorAll("[data-subtask-index]").forEach((input) => input.addEventListener("change", () => toggleSubtask(task.id, Number(input.dataset.subtaskIndex))));
  });
  refreshIcons();
}

function taskMarkup(task) {
  const overdue = !task.completed && task.due_date && task.due_date < todayKey();
  const subtasks = task.subtasks || [];
  return `<article class="task-item ${task.completed ? "completed" : ""}" data-task-id="${task.id}" style="--accent:${colorFor(task.category)}">
    <button class="task-check" data-toggle-task type="button" aria-label="Complete ${escapeHtml(task.title)}"></button>
    <div class="task-main">
      <div class="task-labels"><span class="category-tag">${escapeHtml(task.category || "Personal")}</span>${overdue ? '<span class="overdue">OVERDUE</span>' : ""}</div>
      <p class="task-title">${escapeHtml(task.title)}</p>
      <div class="task-meta">${task.priority || "medium"} priority${task.due_date ? ` &middot; Due ${prettyDate(task.due_date)}` : ""}</div>
      <div class="subtask-panel">
        ${subtasks.map((entry, index) => `<label><input type="checkbox" data-subtask-index="${index}" ${entry.completed ? "checked" : ""}/> ${escapeHtml(entry.title)}</label>`).join("")}
        ${subtasks.length < 5 ? '<form data-subtask-form><input name="title" maxlength="80" required placeholder="Add subtask" /><button type="submit">+</button></form>' : ""}
      </div>
    </div>
    <div class="task-actions"><button class="icon-button" data-expand-task type="button" title="Subtasks"><i data-lucide="list-tree"></i></button><button class="icon-button" data-edit-task type="button" title="Edit task"><i data-lucide="pencil"></i></button><button class="icon-button" data-delete-task type="button" title="Delete task"><i data-lucide="trash-2"></i></button></div>
  </article>`;
}

function renderCalendar() {
  const cursor = new Date(`${state.monthCursor}T00:00:00`);
  els.monthLabel.textContent = cursor.toLocaleDateString("en", { month: "long", year: "numeric" });
  els.calendarViewToggle.querySelectorAll("button").forEach((button) => button.classList.toggle("active", button.dataset.calendarView === state.calendarView));
  els.monthCalendar.hidden = state.calendarView !== "month";
  els.weekGrid.hidden = state.calendarView !== "week";
  if (state.calendarView === "month") renderMonth(cursor);
  else renderWeek();
  renderAgenda();
}

function renderMonth(cursor) {
  els.calendarGrid.innerHTML = buildMonthDays(cursor.getFullYear(), cursor.getMonth()).map((day) => {
    const dots = eventsForDate(state.items, day.key).slice(0, 3).map((event) => `<i style="background:${colorFor(event.category)}"></i>`).join("");
    return `<button class="calendar-day ${!day.isCurrentMonth ? "outside" : ""} ${day.key === todayKey() ? "today" : ""} ${day.key === state.selectedDate ? "selected" : ""}" data-date="${day.key}" type="button"><span>${day.dayNumber}</span><b class="dots">${dots}</b></button>`;
  }).join("");
  els.calendarGrid.querySelectorAll("[data-date]").forEach((button) => button.addEventListener("click", () => selectDate(button.dataset.date)));
}

function renderWeek() {
  const start = startOfWeek(state.selectedDate);
  const days = Array.from({ length: 7 }, (_, index) => addDays(start, index));
  els.weekGrid.innerHTML = `<div class="week-head">${days.map((date) => `<button data-date="${date}" class="${date === todayKey() ? "today" : ""}">${new Date(`${date}T00:00:00`).toLocaleDateString("en", { weekday: "short", day: "numeric" })}</button>`).join("")}</div>
    <div class="week-columns">${days.map((date) => `<div>${eventsForDate(state.items, date).map((event) => `<article class="week-event" style="--accent:${colorFor(event.category)}"><small>${formatEventTime(event)}</small>${escapeHtml(event.title)}</article>`).join("") || '<span class="week-empty"></span>'}</div>`).join("")}</div>
    <p class="week-range">Schedule window: 7 AM - 10 PM</p>`;
  els.weekGrid.querySelectorAll("[data-date]").forEach((button) => button.addEventListener("click", () => selectDate(button.dataset.date)));
}

function renderAgenda() {
  const events = eventsForDate(state.items, state.selectedDate).sort(sortByTime);
  const selected = new Date(`${state.selectedDate}T00:00:00`);
  els.agendaTitle.textContent = state.selectedDate === todayKey() ? `Today - ${prettyDate(state.selectedDate)}` : formatDisplayDate(selected);
  els.agendaList.innerHTML = events.length ? events.map((event) => {
    const done = (event.completed_dates || []).includes(state.selectedDate);
    return `<article class="agenda-item ${done ? "completed" : ""}" style="--accent:${colorFor(event.category)}">
      <div><strong>${escapeHtml(event.title)}</strong><span>${formatEventTime(event)} &middot; ${escapeHtml(event.category)}</span>${event.notes ? `<p>${escapeHtml(event.notes)}</p>` : ""}</div>
      <button class="icon-button" data-done-event="${event.id}" title="Mark done"><i data-lucide="check"></i></button>
      <button class="icon-button" data-delete-event="${event.id}" title="Delete"><i data-lucide="trash-2"></i></button>
    </article>`;
  }).join("") : '<article class="empty-inline">Nothing scheduled for this day.</article>';
  els.agendaList.querySelectorAll("[data-done-event]").forEach((button) => button.addEventListener("click", () => toggleEventDone(button.dataset.doneEvent, state.selectedDate)));
  els.agendaList.querySelectorAll("[data-delete-event]").forEach((button) => button.addEventListener("click", () => deleteItem(button.dataset.deleteEvent)));
  refreshIcons();
}

function selectDate(date) {
  state.selectedDate = date;
  state.monthCursor = `${date.slice(0, 7)}-01`;
  persist();
  renderCalendar();
}

function renderSleep() {
  const goalMinutes = settings.sleepGoalHours * 60;
  const summary = getSleepSummary(state.sleepEntries, goalMinutes);
  const sorted = [...state.sleepEntries].sort((a, b) => String(b.sleep_date).localeCompare(String(a.sleep_date)));
  const latest = sorted[0];
  els.sleepGoalInput.value = String(settings.sleepGoalHours);
  els.averageSleepStat.textContent = summary.averageMinutes ? formatSleepDuration(summary.averageMinutes) : "\u2014";
  const score = latest ? calculateSleepScore(Number(latest.minutes)) : null;
  els.sleepScoreStat.textContent = score?.grade || "\u2014";
  els.sleepScoreStat.className = score ? `grade-${score.tone}` : "";
  els.lastNightSummary.textContent = latest
    ? `${prettyDate(latest.sleep_date)} | ${formatTime(latest.slept_at)} - ${formatTime(latest.woke_at)} | ${formatSleepDuration(latest.minutes)} | Score ${score.grade}`
    : "Log your first night using the + button.";
  els.sleepHint.textContent = `Goal: ${settings.sleepGoalHours} hours`;
  if (!summary.points.length) {
    els.sleepChart.innerHTML = '<article class="empty-state compact"><strong>No sleep yet</strong><p>Add the date, bedtime, and wake time.</p></article>';
    els.sleepList.innerHTML = "";
    return;
  }
  els.sleepChart.innerHTML = `<span class="goal-line" style="bottom:${Math.min(92, Math.round((goalMinutes / Math.max(goalMinutes, ...summary.points.map((point) => point.minutes))) * 100))}%"></span>${summary.points.map((point) => `<div class="sleep-bar"><span class="sleep-bar-fill" style="height:${point.percent}%"></span><strong>${point.label}</strong><small>${new Date(`${point.date}T00:00:00`).toLocaleDateString("en", { weekday: "short" })}</small></div>`).join("")}`;
  els.sleepList.innerHTML = sorted.slice(0, 7).map((entry) => {
    const entryScore = calculateSleepScore(Number(entry.minutes));
    const trained = eventsForDate(state.items, entry.sleep_date).some((event) => event.category === "Track & Field");
    return `<article class="sleep-row"><div><strong>${prettyDate(entry.sleep_date)} ${trained ? '<span title="Track training day">&#9889;</span>' : ""}</strong><span>${formatTime(entry.slept_at)} &rarr; ${formatTime(entry.woke_at)}</span></div><b>${formatSleepDuration(entry.minutes)}</b><strong class="grade-${entryScore.tone}">${entryScore.grade}</strong><span>${entry.mood_emoji || ""}</span><button class="icon-button" data-delete-sleep="${entry.id}" title="Delete"><i data-lucide="trash-2"></i></button></article>`;
  }).join("");
  els.sleepList.querySelectorAll("[data-delete-sleep]").forEach((button) => button.addEventListener("click", () => deleteSleepEntry(button.dataset.deleteSleep)));
  refreshIcons();
}

function renderFocus() {
  const todayTasks = filterItems(state.items, "today", todayKey());
  els.focusTaskSelect.replaceChildren(new Option(todayTasks.length ? "Choose today's task" : "No open tasks yet", ""), ...todayTasks.map((item) => new Option(item.title, item.id)));
  if (todayTasks.some((item) => item.id === state.focusedTaskId)) els.focusTaskSelect.value = state.focusedTaskId;
  const sessions = state.focusSessions.filter((entry) => !entry.is_break && String(entry.completed_at).slice(0, 10) === todayKey());
  const minutes = sessions.reduce((sum, entry) => sum + Number(entry.minutes), 0);
  els.sessionsTodayText.textContent = `Sessions today: ${sessions.length} / ${settings.focusGoal}`;
  els.focusMinutesText.textContent = `Total focus time today: ${minutes} min`;
  els.sessionDots.innerHTML = Array.from({ length: settings.focusGoal }, (_, index) => `<i class="${index < sessions.length ? "filled" : ""}"></i>`).join("");
  els.sessionHistoryList.innerHTML = state.focusSessions.length
    ? state.focusSessions.slice(0, 10).map((entry) => `<article><strong>${escapeHtml(entry.label || "Focus session")}</strong><span>${entry.minutes} min &middot; ${new Date(entry.completed_at).toLocaleString("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span></article>`).join("")
    : '<p class="empty-inline">No sessions yet - start your first one.</p>';
}

function renderTimer() {
  const minutes = Math.floor(timer.secondsLeft / 60);
  const seconds = timer.secondsLeft % 60;
  els.timerText.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const button = document.getElementById("playTimerButton");
  button.innerHTML = timer.intervalId ? '<i data-lucide="pause"></i>' : '<i data-lucide="play"></i>';
  button.title = timer.intervalId ? "Pause" : "Start";
  button.setAttribute("aria-label", button.title);

  // Update Pomodoro SVG circular progress
  const progressCircle = document.getElementById("timerProgressCircle");
  if (progressCircle) {
    const radius = 100; // matching r="100" in SVG
    const circumference = radius * 2 * Math.PI;
    progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
    const totalSeconds = timer.durationMinutes * 60;
    const fraction = totalSeconds > 0 ? (timer.secondsLeft / totalSeconds) : 0;
    progressCircle.style.strokeDashoffset = circumference - (fraction * circumference);
  }

  refreshIcons();
}

function renderArcade() {
  const coins = calculateCoinBreakdown(state.items, state.focusSessions, state.sleepEntries, state.rewards, settings.sleepGoalHours * 60);
  els.arcadeCoins.textContent = String(coins.total);
  els.arcadeCoinBreakdown.textContent = `Earned from tasks: ${coins.tasks} | Earned from focus sessions: ${coins.focus}`;
  const boost = boostPool[dailyIndex(boostPool.length)];
  const completed = state.rewards.some((reward) => reward.type === "daily_boost" && reward.date === todayKey());
  els.arcadeBoost.textContent = completed ? `${boost} Completed today.` : boost;
  els.arcadeBoostButton.disabled = completed;
  els.arcadeBoostButton.textContent = completed ? "Completed +20" : "Complete boost +20";
  els.goalReminderInput.value = state.goalReminder;
  renderReaction();
  renderMemory();
}

function renderReaction() {
  const attempts = state.reactionAttempts.slice(0, 5);
  const best = attempts.length ? Math.min(...state.reactionAttempts.map((attempt) => attempt.ms)) : null;
  els.reactionBest.textContent = best ? `${best} ms` : "\u2014";
  els.reactionHistory.innerHTML = attempts.map((attempt) => `<li>${attempt.ms} ms</li>`).join("");
}

function renderMemory() {
  if (!memoryGame) {
    els.memoryGrid.innerHTML = "";
    return;
  }
  els.memoryGrid.innerHTML = memoryGame.cards.map((card, index) => `<button type="button" data-memory-index="${index}" class="${card.revealed || card.matched ? "revealed" : ""} ${card.matched ? "matched" : ""}">${card.revealed || card.matched ? `<i data-lucide="${card.icon}"></i>` : "?"}</button>`).join("");
  els.memoryGrid.querySelectorAll("[data-memory-index]").forEach((button) => button.addEventListener("click", () => flipMemory(Number(button.dataset.memoryIndex))));
  refreshIcons();
}

function logFitness(change) {
  const entry = fitnessEntry(todayKey());
  if (change.pushups) entry.pushups = Number(entry.pushups || 0) + change.pushups;
  if (change.track_session) entry.track_session = true;
  saveFitnessEntry(entry);
}

function setTrackToday(value) {
  const entry = fitnessEntry(todayKey());
  entry.track_session = value;
  saveFitnessEntry(entry);
}

function saveFitnessEntry(entry) {
  state.fitnessLog = [entry, ...state.fitnessLog.filter((candidate) => candidate.entry_date !== entry.entry_date)];
  persist();
  renderStats();
  renderTasks();
  void upsertAppState();
}

function fitnessEntry(date) {
  return { entry_date: date, pushups: 0, track_session: false, ...(state.fitnessLog.find((entry) => entry.entry_date === date) || {}) };
}

function openCompose(kind, item = null) {
  els.composeForm.reset();
  els.editingItemIdInput.value = item?.id || "";
  els.itemKindInput.value = item?.kind || kind;
  els.itemTitleInput.value = item?.title || "";
  els.itemDateInput.value = item?.due_date || todayKey();
  els.itemCategoryInput.value = item?.category || (kind === "calendar_event" ? "Personal" : "School");
  els.itemPriorityInput.value = item?.priority || "medium";
  els.itemNotesInput.value = item?.notes || "";
  els.itemStartTimeInput.value = item?.start_time || "";
  els.itemEndTimeInput.value = item?.end_time || "";
  els.itemRepeatInput.value = item?.repeat_pattern || "none";
  els.repeatDays.querySelectorAll("[data-repeat-day]").forEach((button) => button.classList.toggle("active", (item?.repeat_days || []).includes(Number(button.dataset.repeatDay))));
  els.composeTitle.textContent = item ? "Edit item" : kind === "calendar_event" ? "Add event" : "Add task";
  setAdvancedFields(Boolean(item || kind === "calendar_event"));
  updateCalendarFields();
  els.composeDialog.showModal();
  els.itemTitleInput.focus();
}

function setAdvancedFields(show) {
  els.advancedFields.hidden = !show;
  document.querySelectorAll("[data-advanced-field]").forEach((field) => { field.hidden = !show; });
  els.toggleAdvancedButton.textContent = show ? "Less options" : "More options";
  els.toggleAdvancedButton.setAttribute("aria-expanded", String(show));
}

function updateCalendarFields() {
  const visible = els.itemKindInput.value === "calendar_event";
  document.querySelectorAll(".calendar-field").forEach((field) => { field.hidden = !visible; });
  renderRepeatDays();
}

function renderRepeatDays() {
  els.repeatDays.hidden = els.itemKindInput.value !== "calendar_event" || els.itemRepeatInput.value !== "specific";
}

function saveItemFromForm() {
  const existing = state.items.find((item) => item.id === els.editingItemIdInput.value);
  const kind = els.itemKindInput.value;
  const category = els.itemCategoryInput.value;
  const item = {
    ...(existing || {}),
    id: existing?.id || crypto.randomUUID(),
    owner_key: settings.ownerKey,
    kind,
    title: els.itemTitleInput.value.trim(),
    notes: els.itemNotesInput.value.trim(),
    category,
    priority: els.itemPriorityInput.value,
    due_date: els.itemDateInput.value || null,
    start_time: kind === "calendar_event" ? els.itemStartTimeInput.value : "",
    end_time: kind === "calendar_event" ? els.itemEndTimeInput.value : "",
    repeat_pattern: kind === "calendar_event" ? els.itemRepeatInput.value : "none",
    repeat_days: kind === "calendar_event" && els.itemRepeatInput.value === "specific"
      ? [...els.repeatDays.querySelectorAll(".active")].map((button) => Number(button.dataset.repeatDay))
      : [],
    scheduled_at: kind === "calendar_event" && els.itemDateInput.value && els.itemStartTimeInput.value ? `${els.itemDateInput.value}T${els.itemStartTimeInput.value}:00` : null,
    duration_minutes: durationBetween(els.itemStartTimeInput.value, els.itemEndTimeInput.value) || existing?.duration_minutes || 30,
    completed: existing?.completed || false,
    completed_dates: existing?.completed_dates || [],
    subtasks: existing?.subtasks || [],
    color: colorFor(category),
    source: existing?.source || "manual",
    created_at: existing?.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  state.items = existing ? state.items.map((entry) => entry.id === item.id ? item : entry) : [item, ...state.items];
  persist();
  els.composeDialog.close();
  render();
  void upsertSupabase("life_flow_items", item);
}

function makeTask({ title, category, due_date }) {
  return {
    id: crypto.randomUUID(), owner_key: settings.ownerKey, kind: "daily_task", title, category, priority: "medium",
    due_date, notes: "", completed: false, subtasks: [], color: colorFor(category), source: "manual", created_at: new Date().toISOString(),
  };
}

function toggleTask(id) {
  const item = state.items.find((task) => task.id === id);
  item.completed = !item.completed;
  item.updated_at = new Date().toISOString();
  persist();
  render();
  void upsertSupabase("life_flow_items", item);
}

function addSubtask(id, title) {
  const item = state.items.find((task) => task.id === id);
  if (!item || !title.trim() || (item.subtasks || []).length >= 5) return;
  item.subtasks = [...(item.subtasks || []), { title: title.trim(), completed: false }];
  persist();
  renderTasks();
  void upsertSupabase("life_flow_items", item);
}

function toggleSubtask(id, index) {
  const item = state.items.find((task) => task.id === id);
  if (!item?.subtasks?.[index]) return;
  item.subtasks[index].completed = !item.subtasks[index].completed;
  persist();
  renderTasks();
  void upsertSupabase("life_flow_items", item);
}

function toggleEventDone(id, date) {
  const event = state.items.find((item) => item.id === id);
  const completed = new Set(event.completed_dates || []);
  if (completed.has(date)) completed.delete(date);
  else completed.add(date);
  event.completed_dates = [...completed];
  persist();
  render();
  void upsertSupabase("life_flow_items", event);
}

function deleteItem(id) {
  state.items = state.items.filter((item) => item.id !== id);
  persist();
  render();
  void deleteSupabaseItem(id);
}

function moveCalendar(direction) {
  const base = new Date(`${state.monthCursor}T00:00:00`);
  if (state.calendarView === "week") base.setDate(base.getDate() + direction * 7);
  else base.setMonth(base.getMonth() + direction);
  state.monthCursor = `${formatDateKey(base).slice(0, 7)}-01`;
  state.selectedDate = formatDateKey(base);
  persist();
  renderCalendar();
}

function goToToday() {
  selectDate(todayKey());
}

function openSleepDialog() {
  const date = todayKey();
  const tomorrow = addDays(date, 1);
  els.sleepError.hidden = true;
  els.sleepDateInput.value = date;
  els.sleptAtInput.value = `${date}T22:30`;
  els.wokeAtInput.value = `${tomorrow}T07:00`;
  els.sleepDialog.showModal();
}

function saveSleepFromForm() {
  const minutes = calculateSleepMinutes(els.sleptAtInput.value, els.wokeAtInput.value);
  if (!minutes || minutes > 660) {
    els.sleepError.hidden = false;
    return;
  }
  const entry = {
    id: crypto.randomUUID(), owner_key: settings.ownerKey, sleep_date: els.sleepDateInput.value,
    slept_at: els.sleptAtInput.value, woke_at: els.wokeAtInput.value, minutes, mood_tag: "", mood_emoji: "",
    created_at: new Date().toISOString(),
  };
  state.sleepEntries = [entry, ...state.sleepEntries.filter((item) => item.sleep_date !== entry.sleep_date)];
  pendingSleepId = entry.id;
  persist();
  els.sleepDialog.close();
  render();
  els.sleepMoodDialog.showModal();
  void upsertSupabase("life_flow_sleep_entries", entry, "owner_key,sleep_date");
}

function saveSleepMood(button) {
  const entry = state.sleepEntries.find((item) => item.id === pendingSleepId);
  if (entry) {
    entry.mood_tag = button.dataset.sleepMood;
    entry.mood_emoji = button.dataset.moodEmoji;
    persist();
    renderSleep();
    void upsertSupabase("life_flow_sleep_entries", entry, "owner_key,sleep_date");
  }
  els.sleepMoodDialog.close();
}

function deleteSleepEntry(id) {
  state.sleepEntries = state.sleepEntries.filter((entry) => entry.id !== id);
  persist();
  render();
  if (canSync()) void supabaseFetch(`life_flow_sleep_entries?id=eq.${id}`, { method: "DELETE" });
}

function setDuration(button) {
  timer.durationMinutes = sanitizeFocusMinutes(button.dataset.minutes);
  timer.secondsLeft = timer.durationMinutes * 60;
  timer.isBreak = timer.durationMinutes === 15;
  els.customMinutesInput.value = String(timer.durationMinutes);
  document.querySelectorAll("[data-minutes]").forEach((entry) => entry.classList.toggle("active", entry === button));
  stopTimer();
  renderTimer();
}

function selectPreset(minutes) {
  const button = document.querySelector(`[data-minutes="${minutes}"]`);
  if (button) setDuration(button);
}

function setCustomDuration() {
  timer.durationMinutes = sanitizeFocusMinutes(els.customMinutesInput.value);
  timer.secondsLeft = timer.durationMinutes * 60;
  timer.isBreak = false;
  stopTimer();
  document.querySelectorAll("[data-minutes]").forEach((entry) => entry.classList.remove("active"));
  renderTimer();
}

function toggleTimer() {
  if (timer.intervalId) {
    stopTimer();
    renderTimer();
    return;
  }
  timer.intervalId = window.setInterval(() => {
    timer.secondsLeft -= 1;
    if (timer.secondsLeft <= 0) finishFocusSession();
    else renderTimer();
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
  const selected = state.items.find((item) => item.id === state.focusedTaskId);
  const label = els.focusLabelInput.value.trim() || selected?.title || (timer.isBreak ? "Break" : "Focus session");
  const session = {
    id: crypto.randomUUID(), owner_key: settings.ownerKey, minutes: timer.durationMinutes, label,
    task_id: state.focusedTaskId || null, is_break: timer.isBreak, earns_coins: !timer.isBreak,
    completed_at: new Date().toISOString(), created_at: new Date().toISOString(),
  };
  state.focusSessions.unshift(session);
  timer.secondsLeft = timer.durationMinutes * 60;
  persist();
  render();
  void upsertSupabase("life_flow_focus_sessions", session);
  if (!timer.isBreak) {
    els.completionMessage.textContent = completionMessages[Math.floor(Math.random() * completionMessages.length)].replace("Aran", settings.displayName);
    els.completionDialog.querySelector("h2").textContent = "Session complete! +10 coins earned.";
    els.completionDialog.showModal();
  }
}

async function toggleAmbient(sound, button) {
  const context = await getAudioContext();
  if (activeSound === sound) {
    stopAmbient();
    els.soundStatus.textContent = "Sound off";
    return;
  }
  stopAmbient();
  const gain = context.createGain();
  gain.gain.value = 0.04;
  gain.connect(context.destination);
  const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < data.length; index += 1) data[index] = Math.random() * 2 - 1;
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 900;
  source.buffer = buffer;
  source.loop = true;
  source.connect(filter).connect(gain);
  source.start();
  ambientNodes = { sources: [source], master: gain };
  activeSound = sound;
  button.classList.add("active-sound");
  els.soundStatus.textContent = "Rain ambience playing";
}

function stopAmbient() {
  if (ambientNodes) {
    ambientNodes.sources.forEach((source) => source.stop());
    ambientNodes.master.disconnect();
  }
  ambientNodes = null;
  activeSound = "";
  document.querySelectorAll("[data-sound]").forEach((button) => button.classList.remove("active-sound"));
}

async function playAlarm() {
  const context = await getAudioContext();
  [0, 0.22, 0.44].forEach((delay) => {
    const tone = context.createOscillator();
    const gain = context.createGain();
    tone.frequency.value = 880;
    gain.gain.setValueAtTime(0.001, context.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.18, context.currentTime + delay + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + delay + 0.18);
    tone.connect(gain).connect(context.destination);
    tone.start(context.currentTime + delay);
    tone.stop(context.currentTime + delay + 0.2);
  });
}

async function getAudioContext() {
  audioContext ||= new AudioContext();
  if (audioContext.state === "suspended") await audioContext.resume();
  return audioContext;
}

function completeDailyBoost() {
  if (state.rewards.some((reward) => reward.type === "daily_boost" && reward.date === todayKey())) return;
  state.rewards.unshift({ id: crypto.randomUUID(), type: "daily_boost", amount: 20, date: todayKey() });
  persist();
  render();
  void upsertAppState();
}

function startReaction() {
  if (reaction.timeoutId) clearTimeout(reaction.timeoutId);
  reaction.mode = "waiting";
  els.reactionPad.disabled = false;
  els.reactionPad.className = "reaction-pad waiting";
  els.reactionPad.textContent = "Ready...";
  reaction.timeoutId = window.setTimeout(() => {
    reaction.mode = "go";
    reaction.goAt = performance.now();
    els.reactionPad.className = "reaction-pad go";
    els.reactionPad.textContent = "GO!";
  }, 1200 + Math.random() * 2500);
}

function tapReaction() {
  if (reaction.mode === "waiting") {
    clearTimeout(reaction.timeoutId);
    reaction.mode = "idle";
    els.reactionPad.textContent = "Too soon - try again";
    els.reactionPad.className = "reaction-pad false-start";
    return;
  }
  if (reaction.mode !== "go") return;
  const ms = Math.round(performance.now() - reaction.goAt);
  state.reactionAttempts.unshift({ ms, at: new Date().toISOString() });
  state.reactionAttempts = state.reactionAttempts.slice(0, 20);
  reaction.mode = "idle";
  els.reactionPad.textContent = `${ms} ms`;
  els.reactionPad.className = "reaction-pad result";
  persist();
  renderReaction();
  void upsertAppState();
}

function startMemoryGame() {
  const coins = calculateCoinBreakdown(state.items, state.focusSessions, state.sleepEntries, state.rewards, settings.sleepGoalHours * 60).total;
  if (coins < 5) {
    els.memoryStatus.textContent = "Earn 5 coins first to play.";
    return;
  }
  state.rewards.unshift({ id: crypto.randomUUID(), type: "memory_entry", amount: -5, date: todayKey() });
  const cards = shuffle([...memoryIcons, ...memoryIcons]).map((icon) => ({ icon, revealed: false, matched: false }));
  memoryGame = { cards, selected: [], moves: 0, startedAt: Date.now(), locked: false };
  els.memoryStatus.textContent = "Moves: 0";
  persist();
  renderArcade();
  void upsertAppState();
}

function flipMemory(index) {
  if (!memoryGame || memoryGame.locked) return;
  const card = memoryGame.cards[index];
  if (card.matched || card.revealed) return;
  card.revealed = true;
  memoryGame.selected.push(index);
  renderMemory();
  if (memoryGame.selected.length < 2) return;
  memoryGame.moves += 1;
  const [first, second] = memoryGame.selected.map((entry) => memoryGame.cards[entry]);
  if (first.icon === second.icon) {
    first.matched = true;
    second.matched = true;
    memoryGame.selected = [];
    finishMemoryIfComplete();
    return;
  }
  memoryGame.locked = true;
  window.setTimeout(() => {
    first.revealed = false;
    second.revealed = false;
    memoryGame.selected = [];
    memoryGame.locked = false;
    els.memoryStatus.textContent = `Moves: ${memoryGame.moves}`;
    renderMemory();
  }, 650);
}

function finishMemoryIfComplete() {
  if (!memoryGame.cards.every((card) => card.matched)) {
    els.memoryStatus.textContent = `Moves: ${memoryGame.moves}`;
    renderMemory();
    return;
  }
  const seconds = Math.round((Date.now() - memoryGame.startedAt) / 1000);
  state.rewards.unshift({ id: crypto.randomUUID(), type: "memory_win", amount: 5, date: todayKey() });
  els.memoryStatus.textContent = `Won in ${memoryGame.moves} moves and ${seconds}s. +5 coins!`;
  persist();
  renderArcade();
  void upsertAppState();
}

function hydrateSettingsForm() {
  els.displayNameInput.value = settings.displayName;
  els.plannerSubtitleInput.value = settings.plannerSubtitle;
  els.focusGoalInput.value = String(settings.focusGoal);
  els.pushupGoalInput.value = String(settings.pushupGoal);
  els.trackGoalInput.value = String(settings.trackGoal);
  els.supabaseUrlInput.value = settings.supabaseUrl;
  els.supabaseAnonInput.value = settings.supabaseAnonKey;
  els.ownerKeyInput.value = settings.ownerKey;
  els.calendarUrlInput.value = settings.calendarUrl;
  els.darkModeInput.checked = settings.darkMode;
  els.sleepGoalInput.value = String(settings.sleepGoalHours);
}

function saveSettings() {
  settings = normalizeSettings({
    ...settings,
    displayName: els.displayNameInput.value.trim() || "Aran",
    plannerSubtitle: els.plannerSubtitleInput.value.trim() || defaultSettings.plannerSubtitle,
    focusGoal: els.focusGoalInput.value,
    pushupGoal: els.pushupGoalInput.value,
    trackGoal: els.trackGoalInput.value,
    supabaseUrl: els.supabaseUrlInput.value.trim(),
    supabaseAnonKey: els.supabaseAnonInput.value.trim(),
    ownerKey: els.ownerKeyInput.value.trim() || settings.ownerKey,
    calendarUrl: els.calendarUrlInput.value.trim(),
    darkMode: els.darkModeInput.checked,
    sleepGoalHours: els.sleepGoalInput.value,
  });
  saveJson(SETTINGS_KEY, settings);
  applySettings();
  els.settingsDialog.close();
  render();
  void (async () => {
    await importCalendar();
    await syncToSupabase();
  })();
}

function applySettings() {
  document.body.classList.toggle("dark-mode", settings.darkMode);
  els.sidebarSubtitle.textContent = settings.plannerSubtitle;
}

function resetAllData() {
  if (!window.confirm("Are you sure? This will clear all tasks, sleep logs, focus sessions, and calendar events.")) return;
  localStorage.removeItem(STORE_KEY);
  state = normalizeState(defaultState);
  persist();
  els.settingsDialog.close();
  render();
}

async function syncAll() {
  await syncFromSupabase();
  await importCalendar();
  await syncToSupabase();
}

async function initializeCloud() {
  if (!canSync()) return;
  await syncAll();
}

async function syncFromSupabase() {
  if (!canSync()) {
    setSyncStatus("Local mode");
    return;
  }
  try {
    setSyncStatus("Syncing from Supabase...");
    const [items, focus, sleep, cloudState] = await Promise.all([
      supabaseFetch("life_flow_items?select=*&order=created_at.desc"),
      supabaseFetch("life_flow_focus_sessions?select=*&order=completed_at.desc"),
      supabaseFetch("life_flow_sleep_entries?select=*&order=sleep_date.desc"),
      supabaseFetch("life_flow_app_state?select=*"),
    ]);
    state.items = seedRecurring(mergeById(state.items, items || []));
    state.focusSessions = mergeById(state.focusSessions, focus || []);
    state.sleepEntries = mergeById(state.sleepEntries, sleep || []);
    if (cloudState?.[0]) {
      const saved = cloudState[0];
      state.fitnessLog = saved.fitness_log || state.fitnessLog;
      state.dukeProgress = { ...state.dukeProgress, ...(saved.duke_progress || {}) };
      state.rewards = saved.rewards || state.rewards;
      state.memoryNotes = { ...state.memoryNotes, ...(saved.memory_notes || {}) };
      state.reactionAttempts = saved.reaction_attempts || state.reactionAttempts;
      state.goalReminder = saved.goal_reminder || state.goalReminder;
      settings = normalizeSettings({ ...settings, ...(saved.preferences || {}) });
      hydrateSettingsForm();
      applySettings();
    }
    persist();
    render();
    setSyncStatus("Synced with Supabase");
  } catch (error) {
    setSyncStatus(`Loading paused: ${error.message}`);
  }
}

async function syncToSupabase() {
  if (!canSync()) return;
  try {
    for (const item of state.items) await upsertItemSafely(item);
    for (const session of state.focusSessions) await upsertSupabase("life_flow_focus_sessions", session);
    for (const entry of state.sleepEntries) await upsertSupabase("life_flow_sleep_entries", entry, "owner_key,sleep_date");
    await upsertAppState();
    setSyncStatus("Synced with Supabase");
  } catch (error) {
    setSyncStatus(`Saving paused: ${error.message}`);
  }
}

async function importCalendar() {
  if (!settings.calendarUrl) return;
  try {
    const response = await fetch(`/api/calendar?url=${encodeURIComponent(settings.calendarUrl)}`);
    if (!response.ok) throw new Error("Calendar unavailable");
    const imported = parseIcsEvents(await response.text()).map((event) => ({ ...event, id: stableUuid(`${settings.ownerKey}:${event.id}`), owner_key: settings.ownerKey }));
    state.items = mergeById(state.items, imported);
    persist();
    render();
    if (canSync()) await Promise.all(imported.map((event) => upsertSupabase("life_flow_items", event)));
  } catch {
    setSyncStatus("Calendar import skipped");
  }
}

async function upsertSupabase(table, row, onConflict = "id") {
  if (!canSync()) return;
  await supabaseFetch(`${table}?on_conflict=${encodeURIComponent(onConflict)}`, {
    method: "POST", headers: { Prefer: "resolution=merge-duplicates" }, body: JSON.stringify({ ...row, owner_key: settings.ownerKey }),
  });
}

async function upsertItemSafely(item) {
  try {
    return await upsertSupabase("life_flow_items", item);
  } catch (error) {
    if (!String(error.message).includes("42501")) throw error;
    const previousId = item.id;
    item.id = crypto.randomUUID();
    if (state.focusedTaskId === previousId) state.focusedTaskId = item.id;
    persist();
    try {
      return await upsertSupabase("life_flow_items", item);
    } catch (retryError) {
      throw new Error(`Unable to save "${item.title}": ${retryError.message}`);
    }
  }
}

async function upsertAppState() {
  if (!canSync()) return;
  return upsertSupabase("life_flow_app_state", {
    owner_key: settings.ownerKey,
    fitness_log: state.fitnessLog,
    duke_progress: state.dukeProgress,
    rewards: state.rewards,
    memory_notes: state.memoryNotes,
    reaction_attempts: state.reactionAttempts,
    goal_reminder: state.goalReminder,
    preferences: {
      displayName: settings.displayName,
      plannerSubtitle: settings.plannerSubtitle,
      sleepGoalHours: settings.sleepGoalHours,
      focusGoal: settings.focusGoal,
      pushupGoal: settings.pushupGoal,
      trackGoal: settings.trackGoal,
      darkMode: settings.darkMode,
    },
    updated_at: new Date().toISOString(),
  }, "owner_key");
}

async function deleteSupabaseItem(id) {
  if (canSync()) await supabaseFetch(`life_flow_items?id=eq.${id}`, { method: "DELETE" });
}

async function supabaseFetch(path, options = {}) {
  const response = await fetch(`${settings.supabaseUrl.replace(/\/$/, "")}/rest/v1/${path}`, {
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
  return text ? JSON.parse(text) : [];
}

function canSync() {
  // Security reminder: confirm Row Level Security policies only permit this owner's rows in Supabase.
  return Boolean(settings.supabaseUrl && settings.supabaseAnonKey && settings.ownerKey);
}

function setSyncStatus(text) {
  els.syncStatus.textContent = text;
  const visible = /syncing|paused|skipped/i.test(text);
  els.syncBanner.hidden = !visible;
  els.syncBanner.classList.toggle("error", /paused|skipped/i.test(text));
  els.syncBannerText.textContent = text;
}

function setView(view) {
  const change = () => {
    document.querySelectorAll(".nav-item").forEach((button) => button.classList.toggle("active", button.dataset.view === view));
    document.querySelectorAll(".view").forEach((panel) => panel.classList.toggle("active", panel.id === `${view}View`));
    refreshIcons();
  };
  if (document.startViewTransition) document.startViewTransition(change);
  else change();
}

function normalizeState(saved) {
  const merged = {
    ...defaultState, ...saved,
    dukeProgress: { ...defaultState.dukeProgress, ...(saved.dukeProgress || {}) },
    memoryNotes: { ...defaultState.memoryNotes, ...(saved.memoryNotes || {}) },
    items: seedRecurring(normalizeItemIds(Array.isArray(saved.items) ? saved.items : [])),
    sleepEntries: Array.isArray(saved.sleepEntries) ? saved.sleepEntries : [],
    focusSessions: Array.isArray(saved.focusSessions) ? saved.focusSessions : [],
    fitnessLog: Array.isArray(saved.fitnessLog) ? saved.fitnessLog : [],
    rewards: Array.isArray(saved.rewards) ? saved.rewards : [],
    reactionAttempts: Array.isArray(saved.reactionAttempts) ? saved.reactionAttempts : [],
  };
  return merged;
}

function normalizeSettings(saved) {
  const result = { ...defaultSettings, ...saved };
  if (!result.plannerSubtitle || result.plannerSubtitle === "Personal planner") result.plannerSubtitle = defaultSettings.plannerSubtitle;
  if (saved.settingsVersion !== 2 && Number(result.sleepGoalHours) === 8) result.sleepGoalHours = 8.5;
  result.settingsVersion = 2;
  result.ownerKey ||= createOwnerKey();
  result.sleepGoalHours = clampNumber(result.sleepGoalHours, 6, 10, 8.5);
  result.focusGoal = clampNumber(result.focusGoal, 1, 20, 4);
  result.pushupGoal = clampNumber(result.pushupGoal, 1, 1000, 60);
  result.trackGoal = clampNumber(result.trackGoal, 1, 14, 3);
  saveJson(SETTINGS_KEY, result);
  return result;
}

function createCalendarSeed(id, title, category, date, start, end, days) {
  return {
    id, kind: "calendar_event", title, category, due_date: date, start_time: start, end_time: end,
    repeat_pattern: "specific", repeat_days: days, notes: "", completed_dates: [], priority: "medium",
    duration_minutes: durationBetween(start, end) || 30, color: colorFor(category), source: "seed", created_at: `${date}T00:00:00.000Z`,
  };
}

function getRecurringSeeds() {
  return recurringTemplates.map(([key, title, category, date, start, end, days]) =>
    createCalendarSeed(stableUuid(`${settings.ownerKey}:${key}`), title, category, date, start, end, days),
  );
}

function seedRecurring(items) {
  items = items.filter((item) => item.source !== "seed" && !["seed-track", "seed-ymca", "seed-duke"].includes(item.id));
  const ids = new Set(items.map((item) => item.id));
  return [...items, ...getRecurringSeeds().filter((seed) => !ids.has(seed.id))];
}

function normalizeItemIds(items) {
  const mapped = items.map((item) => ({
    ...item,
    scheduled_at: item.scheduled_at || null,
    subtasks: item.subtasks || [],
    repeat_pattern: item.repeat_pattern || "none",
    repeat_days: item.repeat_days || [],
    completed_dates: item.completed_dates || [],
    start_time: item.start_time || "",
    end_time: item.end_time || "",
    duration_minutes: Number(item.duration_minutes) > 0 ? Number(item.duration_minutes) : 30,
    id: legacySharedIds.has(item.id)
      ? stableUuid(`${settings.ownerKey}:${item.id}`)
      : /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(item.id)
      ? item.id
      : stableUuid(item.id),
  }));
  return [...new Map(mapped.map((item) => [item.id, item])).values()];
}

function sortTasks(a, b) {
  const overdueA = Number(!a.completed && a.due_date && a.due_date < todayKey());
  const overdueB = Number(!b.completed && b.due_date && b.due_date < todayKey());
  return overdueB - overdueA || Number(a.completed) - Number(b.completed) || priorityWeight(b.priority) - priorityWeight(a.priority);
}

function sortByTime(a, b) {
  return String(a.start_time || "99:99").localeCompare(String(b.start_time || "99:99"));
}

function formatEventTime(event) {
  if (!event.start_time) return "Reminder";
  return `${clock(event.start_time)}${event.end_time ? ` - ${clock(event.end_time)}` : ""}`;
}

function clock(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return new Date(2026, 0, 1, hours, minutes).toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" });
}

function formatTime(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" });
}

function prettyDate(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en", { month: "short", day: "numeric" });
}

function startOfWeek(dateKey) {
  const date = new Date(`${dateKey}T00:00:00`);
  date.setDate(date.getDate() - date.getDay());
  return formatDateKey(date);
}

function addDays(key, amount) {
  const date = new Date(`${key}T00:00:00`);
  date.setDate(date.getDate() + amount);
  return formatDateKey(date);
}

function durationBetween(start, end) {
  if (!start || !end) return 0;
  const [startHours, startMinutes] = start.split(":").map(Number);
  const [endHours, endMinutes] = end.split(":").map(Number);
  return Math.max(0, endHours * 60 + endMinutes - startHours * 60 - startMinutes);
}

function priorityWeight(priority) {
  return { high: 3, medium: 2, low: 1 }[priority] || 0;
}

function colorFor(category) {
  return categoryColors[category] || categoryColors.Personal;
}

function dailyIndex(length) {
  const key = todayKey().replaceAll("-", "");
  return Number(key) % length;
}

function shuffle(values) {
  const list = [...values];
  for (let index = list.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [list[index], list[swap]] = [list[swap], list[index]];
  }
  return list;
}

function stableUuid(text) {
  let partOne = 2166136261;
  let partTwo = 2246822507;
  for (const character of String(text)) {
    partOne = Math.imul(partOne ^ character.charCodeAt(0), 16777619);
    partTwo = Math.imul(partTwo ^ character.charCodeAt(0), 3266489909);
  }
  const a = (partOne >>> 0).toString(16).padStart(8, "0");
  const b = (partTwo >>> 0).toString(16).padStart(8, "0");
  return `${a}-${b.slice(0, 4)}-4${b.slice(5, 8)}-8${a.slice(1, 4)}-${a}${b.slice(0, 4)}`;
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

function toggleSecret(button) {
  const input = document.getElementById(button.dataset.toggleSecret);
  input.type = input.type === "password" ? "text" : "password";
  button.textContent = input.type === "password" ? "Show" : "Hide";
}

function refreshIcons() {
  window.lucide?.createIcons();
}

function createOwnerKey() {
  return crypto.randomUUID();
}

function persist() {
  saveJson(STORE_KEY, state);
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function loadJson(key, fallback) {
  try {
    return { ...fallback, ...JSON.parse(localStorage.getItem(key) || "{}") };
  } catch {
    return { ...fallback };
  }
}

function mergeById(current, incoming) {
  const map = new Map(current.map((entry) => [entry.id, entry]));
  incoming.forEach((entry) => map.set(entry.id, { ...map.get(entry.id), ...entry }));
  return [...map.values()];
}

function escapeHtml(value = "") {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}
