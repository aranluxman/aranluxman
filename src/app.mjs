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
const categoryIcons = {
  School: "book-open",
  "Track & Field": "footprints",
  YMCA: "users",
  "Duke of Ed": "award",
  "Web Dev": "code-2",
  Personal: "user",
  Calendar: "calendar-days",
};
function iconForCategory(category) {
  return categoryIcons[category] || "calendar-days";
}
const dukeLabels = { physical: "Physical (Track & Field)", volunteering: "Volunteering (YMCA)", skill: "Skill (Web Dev)" };
const dukeMeta = {
  physical: { icon: "footprints", accent: "#f97316" },
  volunteering: { icon: "heart-handshake", accent: "#34d399" },
  skill: { icon: "code-2", accent: "#fbbf24" },
};
const workoutMetrics = [
  { key: "pullups", label: "Pull-ups", icon: "dumbbell", accent: "#3e9cff", step: 5, unit: "reps" },
  { key: "pushups", label: "Push-ups", icon: "activity", accent: "#ff9738", step: 5, unit: "reps" },
  { key: "plank", label: "Plank", icon: "timer", accent: "#27c78a", step: 1, unit: "min" },
];
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
  "Win the morning: make your bed, fill your water bottle, and name your one must-do.",
  "Discipline is choosing what you want most over what you want now.",
  "Your warm-up decides your workout. Never skip it.",
  "Small steps every day beat giant leaps once a week.",
  "Recovery is where the training actually sticks. Sleep like it matters.",
  "Before you scroll, finish one thing that future-you will thank you for.",
  "Hydrate before you feel thirsty. Performance starts with water.",
  "A messy desk slows a sharp mind. Clear the space, then start.",
  "You don't have to feel ready. You just have to begin.",
  "Stretch tonight so tomorrow's sprint feels lighter.",
  "Protect your bedtime like it's a race you can't be late for.",
  "Two minutes of planning saves an hour of confusion.",
  "Effort you can repeat beats effort you can brag about once.",
  "When it's hard, shorten the goal: just the next rep, the next line.",
  "Fuel up with real food before training, not after the crash.",
  "Consistency is a superpower disguised as boredom.",
  "Finish the homework you're avoiding first. The rest gets easy.",
  "Your form matters more than your speed. Build it clean.",
  "Rest days are training days for your recovery.",
  "Track your sleep tonight; patterns reveal what excuses hide.",
  "Breathe out the nerves before the start line. Calm is fast.",
  "One focused hour beats three distracted ones.",
  "Show up even when motivation doesn't. Habits carry you.",
  "Pack your bag the night before so mornings stay calm.",
  "Celebrate the rep you didn't want to do. That's the one that counts.",
  "Phone in another room. Watch your focus double.",
  "Eat the frog: do the hardest task while your energy is highest.",
  "A good cool-down today is a faster recovery tomorrow.",
  "Your future self is built by today's small promises kept.",
  "Set the timer for 25 minutes. You can do anything for 25 minutes.",
  "Strong legs, strong mind. Move your body to clear your head.",
  "Drink water, stand up, roll your shoulders. Reset and continue.",
  "Don't count the days. Make the days count.",
  "Sleep is the cheapest performance enhancer you'll ever find.",
  "Plan tomorrow tonight so you wake up with a target, not a question.",
  "Progress hides in the boring reps. Trust the process.",
  "Be the athlete who does the little things nobody claps for.",
  "When tired, lower the bar to 'just start' and let momentum do the rest.",
  "Read the question twice. Half of mistakes are rushed reading.",
  "Stack one good habit on another: water, stretch, study, sleep.",
  "Your warm-up is a promise to your body. Keep it.",
  "Write down one thing you learned today. Reflection compounds.",
  "Tight on time? Do the 10-minute version, not the zero-minute version.",
  "Sweat now so you can smile at the finish line later.",
  "Comparison steals joy. Race your own clock.",
  "Sleep, train, eat, repeat. Champions love the routine.",
  "Energy follows attention. Point yours at what matters.",
  "Tomorrow's confidence is built by tonight's preparation.",
  "If it's on your mind, put it on your list and free your brain.",
  "The first rep is the hardest. Start and the body follows.",
  "Greatness is just good, repeated, with patience.",
  "Recover loud: foam roll, hydrate, and sleep early after a hard session.",
  "Block distractions, not ambition. Guard your focus time.",
  "Do it scared. Courage grows after the start, not before.",
  "Master your breathing and you master your pace.",
  "A clear goal beats a long to-do list. Pick the one that moves things.",
  "Train the mind too: five calm breaths before every big effort.",
  "Late-night scrolling steals tomorrow's energy. Log off, lights out.",
  "You become what you practice. Practice the good stuff.",
  "Take the win: finish, then rest without guilt.",
  "Plan your meals like you plan your workouts. Both build you.",
  "When stuck, teach it to someone. Explaining reveals the gaps.",
  "Sprint the warm-up of your day: knock out the quick wins early.",
  "Your only competition tomorrow is who you were today.",
  "Stretch the tight spots before they become injuries.",
  "Set fewer goals, finish more of them.",
  "Sleep is a skill: same time, dark room, no screens.",
  "Move first, think second. Action clears a foggy head.",
  "The grind isn't glamorous. That's why it works.",
  "Hard now, easy later. Easy now, hard later. Choose.",
  "Pre-pack water and a snack so good choices are the easy choices.",
  "Focus is a muscle. Train it one timer at a time.",
  "Don't break the chain: one small action keeps the streak alive.",
  "Strong starts come from steady warm-ups, not adrenaline.",
  "Give your best to the boring basics and the rest takes care of itself.",
  "Write the first sentence badly. You can fix it once it exists.",
  "Recovery food after training: protein, water, and real carbs.",
  "Tired isn't a reason to quit; it's a reason to slow down and continue.",
  "Your habits are voting for the person you're becoming.",
  "Earn your rest, then actually rest.",
  "A short walk beats a long stall. Move, then return.",
  "Train your weaknesses; show off your strengths on race day.",
  "Set the alarm across the room. Win the first decision of the day.",
  "One page, one rep, one minute. Start absurdly small.",
  "Cold water on the face beats another hour of scrolling.",
  "Hydrate, fuel, sleep: the unglamorous engine of every personal best.",
  "You can rest or you can quit. They're not the same thing.",
  "Build the skill on quiet days so it shows up on loud ones.",
  "Don't wait to feel motivated. Schedule it and show up.",
  "Finish strong: the last rep teaches the most.",
  "Give back today: help someone and your own problems shrink.",
  "Big dreams, small calendars. Put the dream on the schedule.",
  "Less hype, more reps. The work speaks for itself.",
  "Protect your mornings; they set the tempo for everything.",
  "When in doubt, do the next right thing, not the perfect thing.",
  "Sleep before midnight is worth double. Get to bed.",
  "Track it to change it. Numbers are honest even when feelings aren't.",
  "Train like you race; race like you trained.",
  "Stack tiny wins until they start to look like talent.",
  "End the day proud of one thing you finished, not just started.",
];
const boostPool = [
  "Log your Duke of Ed entry for the week.",
  "Complete 20 pushups before lunch.",
  "Finish one school task before checking your phone.",
  "Log last night's sleep.",
  "Review your next track session plan.",
  "Send one clear update on a Web Dev project.",
];
const memoryIconPool = [
  "bolt", "book-open", "trophy", "code-2", "heart-handshake", "timer", "star", "graduation-cap",
  "dumbbell", "flame", "rocket", "music", "heart", "crown", "gamepad-2", "medal",
  "footprints", "target", "moon", "sun", "zap", "bike",
];

const defaultState = {
  items: [],
  sleepEntries: [],
  focusSessions: [],
  fitnessLog: [],
  rewards: [],
  dukeProgress: { physical: 0, volunteering: 0, skill: 0 },
  memoryNotes: { family: "Everything I do is for them.", moments: "", future: "" },
  reactionAttempts: [],
  gameBests: { sprint: 0, stopClock: null, numberRush: null, target: 0 },
  goalReminder: "Train hard. Give back. Build something.",
  selectedDate: todayKey(),
  monthCursor: `${todayKey().slice(0, 7)}-01`,
  calendarView: "month",
  activeFilter: "today",
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
// Real schedule is imported from calendarImport below, so no placeholder recurring events.
const recurringTemplates = [];
// One-time import of Aran's handwritten sleep log [date, fell asleep, woke up] (24h, wake is next morning).
const sleepLogImport = [
  ["2026-05-05", "22:30", "07:00"],
  ["2026-05-06", "23:03", "07:10"],
  ["2026-05-10", "23:45", "08:45"],
  ["2026-05-11", "22:02", "06:40"],
  ["2026-05-13", "22:35", "06:35"],
  ["2026-05-14", "23:05", "08:10"],
  ["2026-05-15", "22:00", "07:00"],
  ["2026-05-16", "22:15", "07:30"],
  ["2026-05-17", "23:00", "07:20"],
  ["2026-05-18", "23:30", "07:20"],
  ["2026-05-19", "22:30", "06:55"],
  ["2026-05-20", "22:06", "06:40"],
  ["2026-05-21", "23:00", "08:00"],
  ["2026-05-22", "22:30", "07:30"],
  ["2026-05-23", "23:35", "09:30"],
  ["2026-05-27", "22:20", "07:00"],
  ["2026-05-28", "22:35", "07:08"],
  ["2026-06-02", "22:38", "07:12"],
  ["2026-06-03", "22:15", "06:40"],
  ["2026-06-04", "22:56", "07:00"],
];
// One-time import of Aran's summer schedule [date, title, start (24h), end (24h), category].
const calendarImport = [
  ["2026-06-05","Track and Field","18:00","19:30","Track & Field"],
  ["2026-06-06","Amamma's Birthday","","","Personal"],
  ["2026-06-06","Spring Gliding session","06:30","17:00","Personal"],
  ["2026-06-06","Work Out Training Track","08:00","09:30","Track & Field"],
  ["2026-06-06","YMCA Basketball Volunteering","11:00","13:00","YMCA"],
  ["2026-06-06","YMCA League Basketball","13:00","15:00","YMCA"],
  ["2026-06-07","Annual - Cadets","08:30","09:30","Personal"],
  ["2026-06-07","YMCA Volleyball","14:15","15:15","YMCA"],
  ["2026-06-08","Track and Field","18:00","19:30","Track & Field"],
  ["2026-06-10","Air Cadets","18:30","22:00","Personal"],
  ["2026-06-11","Volunteer at Glad Park Fun Fair","16:00","20:30","YMCA"],
  ["2026-06-11","Open Gym Basketball","18:00","19:00","YMCA"],
  ["2026-06-11","Workout","19:00","20:00","Track & Field"],
  ["2026-06-12","Meeting with Kaya","00:00","01:00","Personal"],
  ["2026-06-12","Track and Field","18:00","19:30","Track & Field"],
  ["2026-06-13","Work Out Training Track","08:00","09:30","Track & Field"],
  ["2026-06-13","YMCA Basketball Volunteering","11:00","13:00","YMCA"],
  ["2026-06-13","YMCA League Basketball","13:00","15:00","YMCA"],
  ["2026-06-14","YMCA Volleyball","14:15","15:15","YMCA"],
  ["2026-06-15","Track and Field","18:00","19:30","Track & Field"],
  ["2026-06-17","Air Cadets","18:30","22:00","Personal"],
  ["2026-06-18","Open Gym Basketball","18:00","19:00","YMCA"],
  ["2026-06-18","Workout","19:00","20:00","Track & Field"],
  ["2026-06-19","Track and Field","18:00","19:30","Track & Field"],
  ["2026-06-20","Work Out Training Track","08:00","09:30","Track & Field"],
  ["2026-06-20","YMCA Basketball Volunteering","11:00","13:00","YMCA"],
  ["2026-06-20","YMCA League Basketball","13:00","15:00","YMCA"],
  ["2026-06-21","YMCA Volleyball","14:15","15:15","YMCA"],
  ["2026-06-22","Track and Field","18:00","19:30","Track & Field"],
  ["2026-06-24","Air Cadets","18:30","22:00","Personal"],
  ["2026-06-25","P.A. Day - No School","","","Personal"],
  ["2026-06-25","Vacation to Mayan Rivera","","","Personal"],
  ["2026-06-25","Open Gym Basketball","18:00","19:00","YMCA"],
  ["2026-06-25","Workout","19:00","20:00","Track & Field"],
  ["2026-06-26","P.A. Day - No School","","","Personal"],
  ["2026-06-26","Track and Field","18:00","19:30","Track & Field"],
  ["2026-06-27","Work Out Training Track","08:00","09:30","Track & Field"],
  ["2026-06-27","YMCA Basketball Volunteering","11:00","13:00","YMCA"],
  ["2026-06-27","YMCA League Basketball","13:00","15:00","YMCA"],
  ["2026-06-28","YMCA Volleyball","14:15","15:15","YMCA"],
  ["2026-06-29","Track and Field","18:00","19:30","Track & Field"],
  ["2026-07-01","Air Cadets","18:30","22:00","Personal"],
  ["2026-07-02","Open Gym Basketball","18:00","19:00","YMCA"],
  ["2026-07-02","Workout","19:00","20:00","Track & Field"],
  ["2026-07-03","Track and Field","18:00","19:30","Track & Field"],
  ["2026-07-04","Work Out Training Track","08:00","09:30","Track & Field"],
  ["2026-07-04","YMCA Basketball Volunteering","11:00","13:00","YMCA"],
  ["2026-07-04","YMCA League Basketball","13:00","15:00","YMCA"],
  ["2026-07-05","YMCA Volleyball","14:15","15:15","YMCA"],
  ["2026-07-06","Track and Field","18:00","19:30","Track & Field"],
  ["2026-07-08","Air Cadets","18:30","22:00","Personal"],
  ["2026-07-09","Open Gym Basketball","18:00","19:00","YMCA"],
  ["2026-07-09","Workout","19:00","20:00","Track & Field"],
  ["2026-07-10","Track and Field","18:00","19:30","Track & Field"],
  ["2026-07-11","Work Out Training Track","08:00","09:30","Track & Field"],
  ["2026-07-11","YMCA Basketball Volunteering","11:00","13:00","YMCA"],
  ["2026-07-11","YMCA League Basketball","13:00","15:00","YMCA"],
  ["2026-07-12","YMCA Volleyball","14:15","15:15","YMCA"],
  ["2026-07-13","Track and Field","18:00","19:30","Track & Field"],
  ["2026-07-15","Air Cadets","18:30","22:00","Personal"],
  ["2026-07-16","Open Gym Basketball","18:00","19:00","YMCA"],
  ["2026-07-16","Workout","19:00","20:00","Track & Field"],
  ["2026-07-17","Track and Field","18:00","19:30","Track & Field"],
  ["2026-07-18","Work Out Training Track","08:00","09:30","Track & Field"],
  ["2026-07-18","YMCA Basketball Volunteering","11:00","13:00","YMCA"],
  ["2026-07-18","YMCA League Basketball","13:00","15:00","YMCA"],
  ["2026-07-19","YMCA Volleyball","14:15","15:15","YMCA"],
  ["2026-07-20","Track and Field","18:00","19:30","Track & Field"],
  ["2026-07-22","Air Cadets","18:30","22:00","Personal"],
  ["2026-07-23","Open Gym Basketball","18:00","19:00","YMCA"],
  ["2026-07-23","Workout","19:00","20:00","Track & Field"],
  ["2026-07-24","Track and Field","18:00","19:30","Track & Field"],
  ["2026-07-25","Work Out Training Track","08:00","09:30","Track & Field"],
  ["2026-07-25","YMCA Basketball Volunteering","11:00","13:00","YMCA"],
  ["2026-07-25","YMCA League Basketball","13:00","15:00","YMCA"],
  ["2026-07-26","YMCA Volleyball","14:15","15:15","YMCA"],
  ["2026-07-27","Track and Field","18:00","19:30","Track & Field"],
  ["2026-07-29","Air Cadets","18:30","22:00","Personal"],
  ["2026-07-30","Open Gym Basketball","18:00","19:00","YMCA"],
  ["2026-07-30","Workout","19:00","20:00","Track & Field"],
  ["2026-07-31","Track and Field","18:00","19:30","Track & Field"],
  ["2026-08-01","Work Out Training Track","08:00","09:30","Track & Field"],
  ["2026-08-01","YMCA Basketball Volunteering","11:00","13:00","YMCA"],
  ["2026-08-01","YMCA League Basketball","13:00","15:00","YMCA"],
  ["2026-08-02","YMCA Volleyball","14:15","15:15","YMCA"],
  ["2026-08-03","Track and Field","18:00","19:30","Track & Field"],
  ["2026-08-05","Air Cadets","18:30","22:00","Personal"],
  ["2026-08-06","Open Gym Basketball","18:00","19:00","YMCA"],
  ["2026-08-06","Workout","19:00","20:00","Track & Field"],
  ["2026-08-07","Track and Field","18:00","19:30","Track & Field"],
  ["2026-08-08","Work Out Training Track","08:00","09:30","Track & Field"],
  ["2026-08-08","YMCA Basketball Volunteering","11:00","13:00","YMCA"],
  ["2026-08-08","YMCA League Basketball","13:00","15:00","YMCA"],
  ["2026-08-09","YMCA Volleyball","14:15","15:15","YMCA"],
  ["2026-08-10","Track and Field","18:00","19:30","Track & Field"],
  ["2026-08-12","Air Cadets","18:30","22:00","Personal"],
  ["2026-08-13","Open Gym Basketball","18:00","19:00","YMCA"],
  ["2026-08-13","Workout","19:00","20:00","Track & Field"],
  ["2026-08-14","Track and Field","18:00","19:30","Track & Field"],
  ["2026-08-15","Work Out Training Track","08:00","09:30","Track & Field"],
  ["2026-08-15","YMCA Basketball Volunteering","11:00","13:00","YMCA"],
  ["2026-08-15","YMCA League Basketball","13:00","15:00","YMCA"],
  ["2026-08-16","YMCA Volleyball","14:15","15:15","YMCA"],
  ["2026-08-17","Track and Field","18:00","19:30","Track & Field"],
  ["2026-08-17","Basketball for Cadets","20:00","22:00","Personal"],
  ["2026-08-19","Air Cadets","18:30","22:00","Personal"],
  ["2026-08-20","Open Gym Basketball","18:00","19:00","YMCA"],
  ["2026-08-20","Workout","19:00","20:00","Track & Field"],
  ["2026-08-21","Track and Field","18:00","19:30","Track & Field"],
  ["2026-08-22","Work Out Training Track","08:00","09:30","Track & Field"],
  ["2026-08-22","YMCA Basketball Volunteering","11:00","13:00","YMCA"],
  ["2026-08-22","YMCA League Basketball","13:00","15:00","YMCA"],
  ["2026-08-23","YMCA Volleyball","14:15","15:15","YMCA"],
  ["2026-08-24","Track and Field","18:00","19:30","Track & Field"],
  ["2026-08-26","Camerons Birthday","","","Personal"],
  ["2026-08-26","Air Cadets","18:30","22:00","Personal"],
  ["2026-08-27","Open Gym Basketball","18:00","19:00","YMCA"],
  ["2026-08-27","Workout","19:00","20:00","Track & Field"],
  ["2026-08-28","Track and Field","18:00","19:30","Track & Field"],
  ["2026-08-29","Work Out Training Track","08:00","09:30","Track & Field"],
  ["2026-08-30","YMCA Volleyball","14:15","15:15","YMCA"],
  ["2026-08-31","Track and Field","18:00","19:30","Track & Field"],
  ["2026-09-02","Air Cadets","18:30","22:00","Personal"],
  ["2026-09-03","Open Gym Basketball","18:00","19:00","YMCA"],
  ["2026-09-03","Workout","19:00","20:00","Track & Field"],
  ["2026-09-04","Track and Field","18:00","19:30","Track & Field"],
  ["2026-09-05","Work Out Training Track","08:00","09:30","Track & Field"],
  ["2026-09-05","YMCA Basketball Volunteering","11:00","13:00","YMCA"],
  ["2026-09-05","YMCA League Basketball","13:00","15:00","YMCA"],
];

let settings = normalizeSettings(loadJson(SETTINGS_KEY, defaultSettings));
let state = importCalendarEvents(importSleepLog(normalizeState(loadJson(STORE_KEY, defaultState))));
let reaction = { mode: "idle", goAt: 0, timeoutId: null };
let memoryGame = null;
let pendingSleepId = "";
let coachCursor = null;
let sprintGame = { active: false, count: 0, timeoutId: null };
let stopClock = { running: false, startAt: 0, rafId: null };
let numberRush = { order: [], next: 1, startAt: 0, active: false };
let targetGame = { active: false, score: 0, lit: -1, intervalId: null, timeoutId: null };
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
  if (["home", "tasks", "calendar", "sleep", "arcade"].includes(view)) setView(view);
  void initializeCloud();
});

function bindElements() {
  [
    "greeting", "homeTitle", "currentDateText", "quoteText", "nextQuoteButton", "coachText", "coachButton", "coachDots", "coachBadge", "heroCoins",
    "doneTodayStat", "openTasksStat", "streakStat", "coinsStat", "trackWeekStat", "pushupsWeekStat", "addTrackSessionButton",
    "addPushupsButton", "upcomingTodayList", "taskList", "quickTaskForm", "quickTaskInput", "workoutList",
    "sprintPad", "sprintStatus", "sprintBest", "stopClockPad", "stopClockStatus", "stopClockBest",
    "numberRushStart", "numberRushGrid", "numberRushStatus", "numberRushBest",
    "targetStart", "targetGrid", "targetStatus", "targetBest",
    "monthLabel", "todayButton", "calendarGrid", "monthCalendar",
    "weekGrid", "calendarViewToggle", "agendaTitle", "agendaList", "addSleepButton", "sleepGoalInput",
    "lastNightDate", "lastBedtime", "lastWake", "lastDuration", "lastMood",
    "averageSleepStat", "sleepScoreStat", "sleepHint", "sleepChart", "sleepList",
    "arcadeCoins", "arcadeCoinBreakdown", "arcadeBoost", "arcadeBoostButton", "reactionStartButton", "reactionPad", "reactionBest",
    "reactionHistory", "memoryStartButton", "memoryStatus", "memoryGrid", "goalReminderInput", "composeDialog", "composeForm",
    "composeTitle", "editingItemIdInput", "toggleAdvancedButton", "advancedFields", "itemTitleInput", "itemKindInput",
    "itemDateInput", "itemCategoryInput", "itemPriorityInput", "itemNotesInput", "itemStartTimeInput", "itemEndTimeInput",
    "itemRepeatInput", "repeatDays", "sleepDialog", "sleepForm", "sleepDateInput", "sleptAtInput", "wokeAtInput",
    "sleepError", "sleepMoodDialog", "settingsDialog", "settingsForm", "settingsButton",
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
  const heroAvatar = document.getElementById("heroAvatar");
  const avatarFileInput = document.getElementById("avatarFileInput");
  heroAvatar?.addEventListener("click", () => avatarFileInput?.click());
  avatarFileInput?.addEventListener("change", () => {
    const file = avatarFileInput.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      settings.avatarUrl = String(reader.result);
      saveJson(SETTINGS_KEY, settings);
      applyAvatar();
    };
    reader.readAsDataURL(file);
    avatarFileInput.value = "";
  });
  els.nextQuoteButton.addEventListener("click", nextQuote);
  els.coachButton.addEventListener("click", () => renderCoach(true));
  els.addTrackSessionButton.addEventListener("click", () => logFitness({ track_session: true }));
  els.addPushupsButton.addEventListener("click", () => logFitness({ pushups: 10 }));
  els.workoutList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-workout-add]");
    if (!button) return;
    logFitness({ [button.dataset.workoutAdd]: Number(button.dataset.workoutStep) });
  });
  els.sprintPad.addEventListener("click", tapSprint);
  els.stopClockPad.addEventListener("click", tapStopClock);
  els.numberRushStart.addEventListener("click", startNumberRush);
  els.numberRushGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-rush]");
    if (button) tapNumberRush(Number(button.dataset.rush));
  });
  els.targetStart.addEventListener("click", startTargetGame);
  els.targetGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-target]");
    if (button) tapTarget(Number(button.dataset.target));
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
  els.todayButton.addEventListener("click", goToToday);
  els.calendarViewToggle.addEventListener("click", (event) => {
    const button = event.target.closest("[data-calendar-view]");
    if (!button) return;
    state.calendarView = button.dataset.calendarView;
    persist();
    renderCalendar();
  });
  const sleepRangeToggle = document.getElementById("sleepRangeToggle");
  sleepRangeToggle?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-sleep-range]");
    if (!button) return;
    sleepRangeToggle.querySelectorAll("button").forEach((item) => item.classList.toggle("active", item === button));
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
  renderWorkout();
  renderMemoryNotes();
  renderTasks();
  renderCalendar();
  renderSleep();
  renderArcade();
  refreshIcons();
}

function renderHome() {
  const date = new Date();
  els.greeting.textContent = `${getGreeting(date)},`;
  els.homeTitle.textContent = settings.displayName;
  els.currentDateText.textContent = formatDisplayDate(date);
  els.quoteText.textContent = quotePool[dailyIndex(quotePool.length)];
  applyAvatar();
}

function applyAvatar() {
  const avatar = document.getElementById("heroAvatar");
  if (!avatar) return;
  if (settings.avatarUrl) {
    avatar.style.backgroundImage = `url("${settings.avatarUrl}")`;
    avatar.classList.add("has-photo");
  } else {
    avatar.style.backgroundImage = "";
    avatar.classList.remove("has-photo");
  }
}

function nextQuote() {
  const current = quotePool.indexOf(els.quoteText.textContent);
  els.quoteText.textContent = quotePool[(current + 1) % quotePool.length];
}

function renderCoach(advance = false) {
  if (coachCursor === null) coachCursor = dailyIndex(coachTips.length);
  if (advance) coachCursor = (coachCursor + 1) % coachTips.length;
  const index = coachCursor % coachTips.length;
  els.coachText.textContent = coachTips[index];
  if (els.coachBadge) els.coachBadge.textContent = `${index + 1} / ${coachTips.length}`;
  if (els.coachDots) {
    const count = Math.min(7, coachTips.length);
    els.coachDots.innerHTML = Array.from({ length: count }, (_, i) => `<span class="${i === index % count ? "active" : ""}"></span>`).join("");
  }
}

function renderStats() {
  const stats = calculateStats(state.items, state.focusSessions, todayKey(), state.sleepEntries, state.rewards, settings.sleepGoalHours * 60);
  const fitness = summarizeFitnessWeek(state.fitnessLog, todayKey());
  els.doneTodayStat.textContent = String(stats.doneToday);
  els.openTasksStat.textContent = String(stats.openTasks);
  els.streakStat.textContent = stats.streakDays ? `${stats.streakDays}d` : "\u2014";
  els.coinsStat.textContent = String(stats.coins);
  if (els.heroCoins) els.heroCoins.textContent = String(stats.coins);
  els.trackWeekStat.textContent = `${fitness.trackSessions} / ${settings.trackGoal}`;
  els.pushupsWeekStat.textContent = `${fitness.pushups} / ${settings.pushupGoal}`;
}

function renderUpcomingToday() {
  const events = eventsForDate(state.items, todayKey()).sort(sortByTime).slice(0, 6);
  els.upcomingTodayList.innerHTML = events.length
    ? events.map((event) => {
        const start = event.start_time ? clock(event.start_time) : "All day";
        return `<article class="upcoming-item" style="--accent:${colorFor(event.category)}">
          <span class="upcoming-icon"><i data-lucide="${iconForCategory(event.category)}"></i></span>
          <span class="upcoming-time">${start}</span>
          <strong class="upcoming-name">${escapeHtml(event.title)}</strong>
          <span class="upcoming-range"><i></i>${formatEventTime(event)}</span>
        </article>`;
      }).join("")
    : '<p class="empty-inline">No events today - free day.</p>';
}

function renderDukeProgress() {
  document.querySelectorAll("[data-duke-bars]").forEach((container) => {
    container.innerHTML = Object.entries(dukeLabels).map(([key, label]) => {
      const meta = dukeMeta[key] || { icon: "target", accent: "#22d3ee" };
      const pct = state.dukeProgress[key];
      return `
      <button class="duke-bar" type="button" data-duke-key="${key}" style="--accent:${meta.accent}" aria-label="Advance ${label}">
        <span class="duke-icon"><i data-lucide="${meta.icon}"></i></span>
        <span class="duke-body"><b>${label}</b><i class="duke-track"><em style="width:${pct}%"></em></i></span>
        <strong>${pct}%</strong>
        <span class="duke-edit" aria-hidden="true"><i data-lucide="pencil"></i></span>
      </button>`;
    }).join("");
  });
}

function renderWorkout() {
  if (!els.workoutList) return;
  const today = todayKey();
  const days = Array.from({ length: 100 }, (_, i) => addDays(today, i - 99));
  const byDate = new Map(state.fitnessLog.map((entry) => [entry.entry_date, entry]));
  els.workoutList.innerHTML = workoutMetrics.map((metric) => {
    const values = days.map((day) => Number(byDate.get(day)?.[metric.key] || 0));
    const todayValue = values[values.length - 1];
    const total = values.reduce((sum, value) => sum + value, 0);
    const activeDays = values.filter((value) => value > 0).length;
    const max = Math.max(1, ...values);
    const bars = values.map((value) => {
      const height = value > 0 ? Math.max(10, Math.round((value / max) * 100)) : 4;
      return `<i style="height:${height}%;opacity:${value > 0 ? 1 : 0.25}"></i>`;
    }).join("");
    const unit = metric.unit === "min" ? "min" : metric.unit;
    return `<div class="workout-row" style="--accent:${metric.accent}">
      <span class="workout-icon"><i data-lucide="${metric.icon}"></i></span>
      <div class="workout-body">
        <div class="workout-top"><b>${metric.label}</b><strong>${todayValue} ${unit} today</strong></div>
        <div class="workout-spark">${bars}</div>
        <small>${total} ${unit} over 100 days &middot; ${activeDays} active ${activeDays === 1 ? "day" : "days"}</small>
      </div>
      <button class="workout-add" type="button" data-workout-add="${metric.key}" data-workout-step="${metric.step}">+${metric.step}${metric.unit === "min" ? "m" : ""}</button>
    </div>`;
  }).join("");
  refreshIcons();
}

function renderMemoryNotes() {
  document.querySelectorAll("[data-memory-note]").forEach((input) => {
    input.value = state.memoryNotes[input.dataset.memoryNote] || "";
  });
}

function createQuickTask() {
  const title = els.quickTaskInput.value.trim();
  if (!title) return;
  state.items.unshift(makeTask({ title, category: "Personal", due_date: todayKey() }));
  els.quickTaskInput.value = "";
  persist();
  render();
  void upsertSupabase("life_flow_items", state.items[0]);
}

function renderTasks() {
  const tasks = filterItems(state.items, "all", todayKey()).sort(sortTasks);
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
    row.querySelector("[data-subtask-form]")?.addEventListener("submit", (event) => {
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
  const doneSubs = subtasks.filter((entry) => entry.completed).length;
  const priority = task.priority || "medium";
  const metaChips = [
    task.due_date ? `<span class="meta-chip"><i data-lucide="calendar"></i>${prettyDate(task.due_date)}</span>` : "",
    subtasks.length ? `<span class="meta-chip"><i data-lucide="list-tree"></i>${doneSubs}/${subtasks.length}</span>` : "",
  ].join("");
  return `<article class="task-item ${task.completed ? "completed" : ""}" data-task-id="${task.id}" style="--accent:${colorFor(task.category)}">
    <button class="task-check" data-toggle-task type="button" aria-label="Complete ${escapeHtml(task.title)}"></button>
    <div class="task-main">
      <div class="task-labels"><span class="category-tag">${escapeHtml(task.category || "Personal")}</span><span class="priority-tag" data-priority="${priority}">${priority}</span>${overdue ? '<span class="overdue">Overdue</span>' : ""}</div>
      <p class="task-title">${escapeHtml(task.title)}</p>
      ${metaChips ? `<div class="task-meta">${metaChips}</div>` : ""}
      <div class="subtask-panel">
        ${subtasks.map((entry, index) => `<label><input type="checkbox" data-subtask-index="${index}" ${entry.completed ? "checked" : ""}/> ${escapeHtml(entry.title)}</label>`).join("")}
        ${subtasks.length < 5 ? '<form data-subtask-form><input name="title" maxlength="80" required placeholder="Add step" /><button type="submit">+</button></form>' : ""}
      </div>
    </div>
    <div class="task-actions"><button class="icon-button" data-expand-task type="button" title="Details"><i data-lucide="chevron-down"></i></button><button class="icon-button" data-edit-task type="button" title="Edit task"><i data-lucide="pencil"></i></button><button class="icon-button" data-delete-task type="button" title="Delete task"><i data-lucide="trash-2"></i></button></div>
  </article>`;
}

function renderCalendar() {
  const cursor = new Date(`${state.monthCursor}T00:00:00`);
  if (state.calendarView === "week") {
    const start = startOfWeek(state.selectedDate);
    const end = addDays(start, 6);
    const fmt = (key) => new Date(`${key}T00:00:00`).toLocaleDateString("en", { month: "short", day: "numeric" });
    els.monthLabel.textContent = `${fmt(start)} - ${fmt(end)}`;
  } else {
    els.monthLabel.textContent = cursor.toLocaleDateString("en", { month: "long", year: "numeric" });
  }
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
  els.lastNightDate.textContent = latest ? prettyDate(latest.sleep_date) : "No entries yet";
  els.lastBedtime.textContent = latest ? formatTime(latest.slept_at) : "\u2014";
  els.lastWake.textContent = latest ? formatTime(latest.woke_at) : "\u2014";
  els.lastDuration.textContent = latest ? formatSleepDuration(latest.minutes) : "\u2014";
  els.lastMood.textContent = latest ? `${latest.mood_emoji || ""} ${latest.mood_tag || ""}`.trim() || "\u2014" : "\u2014";
  els.sleepHint.textContent = `Goal: ${settings.sleepGoalHours} hours`;
  if (!summary.points.length) {
    els.sleepChart.innerHTML = '<article class="empty-state compact"><strong>No sleep yet</strong><p>Add a date plus the time you fell asleep and woke up.</p></article>';
    els.sleepList.innerHTML = "";
    return;
  }
  renderSleepGraph(summary.points, goalMinutes);
  els.sleepList.innerHTML = sorted.slice(0, 7).map((entry) => {
    const entryScore = calculateSleepScore(Number(entry.minutes));
    const trained = eventsForDate(state.items, entry.sleep_date).some((event) => event.category === "Track & Field");
    return `<article class="sleep-row"><div><strong>${prettyDate(entry.sleep_date)} ${trained ? '<span title="Track training day">&#9889;</span>' : ""}</strong><span>${formatTime(entry.slept_at)} &rarr; ${formatTime(entry.woke_at)}</span></div><b>${formatSleepDuration(entry.minutes)}</b><strong class="grade-${entryScore.tone}">${entryScore.grade}</strong><span>${entry.mood_emoji || ""}</span><button class="icon-button" data-delete-sleep="${entry.id}" title="Delete"><i data-lucide="trash-2"></i></button></article>`;
  }).join("");
  els.sleepList.querySelectorAll("[data-delete-sleep]").forEach((button) => button.addEventListener("click", () => deleteSleepEntry(button.dataset.deleteSleep)));
  refreshIcons();
}

let sleepScrubPoints = [];

function renderSleepGraph(points, goalMinutes) {
  const W = 700, H = 240, ml = 38, mr = 16, mt = 16, mb = 30;
  const plotW = W - ml - mr, plotH = H - mt - mb;
  const minH = 4, maxH = 12; // 8 hours sits in the middle of the range
  const yForHours = (hours) => mt + (1 - (Math.min(maxH, Math.max(minH, hours)) - minH) / (maxH - minH)) * plotH;
  const yFor = (minutes) => yForHours(minutes / 60);
  const xFor = (i) => points.length === 1 ? ml + plotW / 2 : ml + (i / (points.length - 1)) * plotW;
  const coords = points.map((point, i) => ({ ...point, x: xFor(i), y: yFor(point.minutes) }));
  sleepScrubPoints = coords;

  const grid = [4, 6, 8, 10, 12].map((hours) => {
    const y = yForHours(hours).toFixed(1);
    return `<line class="sleep-grid" x1="${ml}" y1="${y}" x2="${W - mr}" y2="${y}"></line><text class="sleep-axis" x="${ml - 8}" y="${(Number(y) + 4).toFixed(1)}" text-anchor="end">${hours}h</text>`;
  }).join("");
  const goalHours = goalMinutes / 60;
  const goalLine = goalHours >= minH && goalHours <= maxH
    ? `<line class="sleep-goal-line" x1="${ml}" y1="${yForHours(goalHours).toFixed(1)}" x2="${W - mr}" y2="${yForHours(goalHours).toFixed(1)}"></line>`
    : "";
  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${coords.at(-1).x.toFixed(1)} ${(mt + plotH).toFixed(1)} L${coords[0].x.toFixed(1)} ${(mt + plotH).toFixed(1)} Z`;
  const dots = coords.map((c, i) => `<circle class="sleep-dot" cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="4" data-i="${i}"></circle>`).join("");
  const xLabels = coords.map((c) => `<text class="sleep-axis" x="${c.x.toFixed(1)}" y="${H - 8}" text-anchor="middle">${new Date(`${c.date}T00:00:00`).toLocaleDateString("en", { weekday: "short" })}</text>`).join("");

  els.sleepChart.innerHTML = `
    <div class="sleep-graph">
      <svg class="sleep-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Hours of sleep over time">
        <defs><linearGradient id="sleepFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="rgba(56,189,248,0.35)"></stop>
          <stop offset="100%" stop-color="rgba(56,189,248,0)"></stop>
        </linearGradient></defs>
        ${grid}${goalLine}
        <path class="sleep-area" d="${areaPath}"></path>
        <path class="sleep-line" d="${linePath}"></path>
        ${dots}${xLabels}
        <line class="sleep-scrub" id="sleepScrubLine" x1="0" y1="${mt}" x2="0" y2="${mt + plotH}" style="opacity:0"></line>
        <circle class="sleep-scrub-dot" id="sleepScrubDot" r="6" style="opacity:0"></circle>
      </svg>
      <div class="sleep-tip" id="sleepTip" hidden></div>
    </div>`;

  const graph = els.sleepChart.querySelector(".sleep-graph");
  const svg = graph.querySelector(".sleep-svg");
  const tip = graph.querySelector("#sleepTip");
  const scrubLine = graph.querySelector("#sleepScrubLine");
  const scrubDot = graph.querySelector("#sleepScrubDot");

  const showAt = (clientX) => {
    const rect = svg.getBoundingClientRect();
    if (!rect.width) return;
    const vx = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)) * W;
    let nearest = sleepScrubPoints[0];
    for (const c of sleepScrubPoints) if (Math.abs(c.x - vx) < Math.abs(nearest.x - vx)) nearest = c;
    scrubLine.setAttribute("x1", nearest.x);
    scrubLine.setAttribute("x2", nearest.x);
    scrubLine.style.opacity = "1";
    scrubDot.setAttribute("cx", nearest.x);
    scrubDot.setAttribute("cy", nearest.y);
    scrubDot.style.opacity = "1";
    const hours = Math.floor(nearest.minutes / 60), mins = nearest.minutes % 60;
    tip.hidden = false;
    tip.innerHTML = `<strong>${hours}h ${mins}m</strong><span>${new Date(`${nearest.date}T00:00:00`).toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" })}</span>`;
    tip.style.left = `${(nearest.x / W) * 100}%`;
    tip.style.top = `${(nearest.y / H) * 100}%`;
  };
  const hide = () => { tip.hidden = true; scrubLine.style.opacity = "0"; scrubDot.style.opacity = "0"; };

  graph.addEventListener("pointerdown", (event) => { graph.setPointerCapture?.(event.pointerId); showAt(event.clientX); });
  graph.addEventListener("pointermove", (event) => { if (event.buttons || event.pointerType === "mouse") showAt(event.clientX); });
  graph.addEventListener("pointerleave", hide);
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
  renderGames();
}

function renderGames() {
  const best = state.gameBests || {};
  els.sprintBest.textContent = best.sprint ? String(best.sprint) : "—";
  els.stopClockBest.textContent = best.stopClock != null ? `${Number(best.stopClock).toFixed(2)}s` : "—";
  els.numberRushBest.textContent = best.numberRush != null ? `${Number(best.numberRush).toFixed(2)}s` : "—";
  els.targetBest.textContent = best.target ? String(best.target) : "—";
  if (!sprintGame.active) { els.sprintPad.className = "reaction-pad"; els.sprintPad.textContent = "Tap to start"; }
  if (!stopClock.running) { els.stopClockPad.className = "reaction-pad"; els.stopClockPad.textContent = "Start clock"; }
  if (!numberRush.active) els.numberRushGrid.innerHTML = "";
  if (!targetGame.active) els.targetGrid.innerHTML = "";
}

/* ---- Sprint Tap (track speed) ---- */
function tapSprint() {
  if (!sprintGame.active) {
    sprintGame = { active: true, count: 0, timeoutId: window.setTimeout(endSprint, 5000) };
    els.sprintPad.className = "reaction-pad go";
    els.sprintPad.textContent = "TAP! 0";
    els.sprintStatus.textContent = "GO! Tap as fast as you can!";
    return;
  }
  sprintGame.count += 1;
  els.sprintPad.textContent = `TAP! ${sprintGame.count}`;
}
function endSprint() {
  const count = sprintGame.count;
  sprintGame.active = false;
  els.sprintPad.className = "reaction-pad result";
  els.sprintPad.textContent = `${count} taps`;
  state.gameBests.sprint = Math.max(Number(state.gameBests.sprint || 0), count);
  els.sprintBest.textContent = String(state.gameBests.sprint);
  els.sprintStatus.textContent = `${count} taps in 5s. Tap to go again.`;
  persist();
  void upsertAppState();
}

/* ---- Stop the Clock (precision / start timing) ---- */
function tapStopClock() {
  if (!stopClock.running) {
    stopClock = { running: true, startAt: performance.now(), rafId: null };
    els.stopClockPad.className = "reaction-pad waiting";
    els.stopClockStatus.textContent = "Tap again to stop at 5.00s!";
    const tick = () => {
      if (!stopClock.running) return;
      els.stopClockPad.textContent = `${((performance.now() - stopClock.startAt) / 1000).toFixed(2)}s`;
      stopClock.rafId = requestAnimationFrame(tick);
    };
    tick();
    return;
  }
  stopClock.running = false;
  if (stopClock.rafId) cancelAnimationFrame(stopClock.rafId);
  const seconds = (performance.now() - stopClock.startAt) / 1000;
  const gap = Math.abs(seconds - 5);
  els.stopClockPad.className = "reaction-pad result";
  els.stopClockPad.textContent = `${seconds.toFixed(2)}s`;
  els.stopClockStatus.textContent = `Off by ${gap.toFixed(2)}s. Tap to try again.`;
  const prev = state.gameBests.stopClock;
  if (prev == null || gap < prev) state.gameBests.stopClock = gap;
  els.stopClockBest.textContent = `${Number(state.gameBests.stopClock).toFixed(2)}s`;
  persist();
  void upsertAppState();
}

/* ---- Number Rush ---- */
function startNumberRush() {
  numberRush = { order: shuffle(Array.from({ length: 9 }, (_, i) => i + 1)), next: 1, startAt: performance.now(), active: true };
  els.numberRushStatus.textContent = "Tap 1 to start the clock!";
  renderNumberRush();
}
function renderNumberRush() {
  els.numberRushGrid.innerHTML = numberRush.order.map((n) => `<button type="button" data-rush="${n}" class="rush-cell ${n < numberRush.next ? "done" : ""}" ${n < numberRush.next ? "disabled" : ""}>${n < numberRush.next ? "" : n}</button>`).join("");
}
function tapNumberRush(n) {
  if (!numberRush.active) return;
  if (n !== numberRush.next) { els.numberRushStatus.textContent = `Tap ${numberRush.next} next!`; return; }
  numberRush.next += 1;
  if (numberRush.next > 9) {
    numberRush.active = false;
    const time = (performance.now() - numberRush.startAt) / 1000;
    const prev = state.gameBests.numberRush;
    if (prev == null || time < prev) state.gameBests.numberRush = time;
    els.numberRushStatus.textContent = `Cleared in ${time.toFixed(2)}s!`;
    els.numberRushBest.textContent = `${Number(state.gameBests.numberRush).toFixed(2)}s`;
    persist();
    void upsertAppState();
  } else {
    els.numberRushStatus.textContent = `Tap ${numberRush.next} next!`;
  }
  renderNumberRush();
}

/* ---- Target Tap ---- */
function startTargetGame() {
  if (targetGame.intervalId) clearInterval(targetGame.intervalId);
  if (targetGame.timeoutId) clearTimeout(targetGame.timeoutId);
  targetGame = { active: true, score: 0, lit: Math.floor(Math.random() * 16), intervalId: null, timeoutId: null };
  let left = 15;
  els.targetStatus.textContent = `Hits: 0 · ${left}s left`;
  targetGame.intervalId = window.setInterval(() => {
    left -= 1;
    if (left > 0) els.targetStatus.textContent = `Hits: ${targetGame.score} · ${left}s left`;
  }, 1000);
  targetGame.timeoutId = window.setTimeout(endTargetGame, 15000);
  renderTargetGame();
}
function renderTargetGame() {
  els.targetGrid.innerHTML = Array.from({ length: 16 }, (_, i) => `<button type="button" data-target="${i}" class="target-cell ${i === targetGame.lit ? "lit" : ""}"></button>`).join("");
}
function tapTarget(i) {
  if (!targetGame.active || i !== targetGame.lit) return;
  targetGame.score += 1;
  let next = targetGame.lit;
  while (next === targetGame.lit) next = Math.floor(Math.random() * 16);
  targetGame.lit = next;
  renderTargetGame();
}
function endTargetGame() {
  targetGame.active = false;
  if (targetGame.intervalId) clearInterval(targetGame.intervalId);
  state.gameBests.target = Math.max(Number(state.gameBests.target || 0), targetGame.score);
  els.targetStatus.textContent = `Time! You hit ${targetGame.score} targets.`;
  els.targetBest.textContent = String(state.gameBests.target);
  els.targetGrid.innerHTML = Array.from({ length: 16 }, (_, i) => `<button type="button" data-target="${i}" class="target-cell"></button>`).join("");
  persist();
  void upsertAppState();
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
  if (change.pullups) entry.pullups = Number(entry.pullups || 0) + change.pullups;
  if (change.plank) entry.plank = Number(entry.plank || 0) + change.plank;
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
  renderWorkout();
  renderTasks();
  void upsertAppState();
}

function fitnessEntry(date) {
  return { entry_date: date, pushups: 0, pullups: 0, plank: 0, track_session: false, ...(state.fitnessLog.find((entry) => entry.entry_date === date) || {}) };
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
  els.sleepError.hidden = true;
  els.sleepDateInput.value = todayKey();
  els.sleptAtInput.value = "22:30";
  els.wokeAtInput.value = "07:00";
  els.sleepDialog.showModal();
}

function saveSleepFromForm() {
  const date = els.sleepDateInput.value;
  const sleptTime = els.sleptAtInput.value;
  const wokeTime = els.wokeAtInput.value;
  if (!date || !sleptTime || !wokeTime) {
    els.sleepError.hidden = false;
    return;
  }
  const sleptAt = `${date}T${sleptTime}`;
  // If you woke at or before your bedtime clock value, you slept past midnight.
  const wokeAt = `${wokeTime <= sleptTime ? addDays(date, 1) : date}T${wokeTime}`;
  const minutes = calculateSleepMinutes(sleptAt, wokeAt);
  if (!minutes || minutes > 660) {
    els.sleepError.hidden = false;
    return;
  }
  const entry = {
    id: crypto.randomUUID(), owner_key: settings.ownerKey, sleep_date: date,
    slept_at: sleptAt, woke_at: wokeAt, minutes, mood_tag: "", mood_emoji: "",
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
  const chosen = shuffle([...memoryIconPool]).slice(0, 8);
  const cards = shuffle([...chosen, ...chosen]).map((icon) => ({ icon, revealed: false, matched: false }));
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
    item.id = crypto.randomUUID();
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
  // Keep cloud sync silent in the UI — never surface the top banner.
  els.syncBanner.hidden = true;
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
    gameBests: { ...defaultState.gameBests, ...(saved.gameBests || {}) },
  };
  return merged;
}

function importSleepLog(target) {
  if (target.sleepLogImported) return target;
  const existing = new Set((target.sleepEntries || []).map((entry) => entry.sleep_date));
  const additions = sleepLogImport
    .filter(([date]) => !existing.has(date))
    .map(([date, slept, woke]) => {
      const sleptAt = `${date}T${slept}`;
      const wokeAt = `${woke <= slept ? addDays(date, 1) : date}T${woke}`;
      return {
        id: crypto.randomUUID(), owner_key: settings.ownerKey, sleep_date: date,
        slept_at: sleptAt, woke_at: wokeAt, minutes: calculateSleepMinutes(sleptAt, wokeAt),
        mood_tag: "", mood_emoji: "", created_at: new Date().toISOString(), source: "import",
      };
    });
  target.sleepEntries = [...additions, ...(target.sleepEntries || [])];
  target.sleepLogImported = true;
  if (additions.length) saveJson(STORE_KEY, target);
  return target;
}

function importCalendarEvents(target) {
  if (target.calendarImported) return target;
  const existing = new Set((target.items || [])
    .filter((item) => item.kind === "calendar_event")
    .map((item) => `${item.due_date}|${item.title}|${item.start_time || ""}`));
  const additions = calendarImport
    .filter(([date, title, start]) => !existing.has(`${date}|${title}|${start}`))
    .map(([date, title, start, end, category]) => ({
      id: crypto.randomUUID(), owner_key: settings.ownerKey, kind: "calendar_event",
      title, category, priority: "medium", due_date: date,
      start_time: start, end_time: end, repeat_pattern: "none", repeat_days: [],
      notes: "", completed: false, completed_dates: [], subtasks: [],
      scheduled_at: start ? `${date}T${start}:00` : null,
      duration_minutes: durationBetween(start, end) || 30,
      color: colorFor(category), source: "import", created_at: new Date().toISOString(),
    }));
  target.items = [...additions, ...(target.items || [])];
  target.calendarImported = true;
  if (additions.length) saveJson(STORE_KEY, target);
  return target;
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
