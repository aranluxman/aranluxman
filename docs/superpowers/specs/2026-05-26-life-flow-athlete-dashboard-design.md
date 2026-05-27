# Life Flow Athlete Dashboard Design

## Direction

Life Flow remains a mobile-first personal planner with a dark navy and teal glass interface. The redesign makes the app specific to Aran's actual week: school deadlines, track training, YMCA volunteering, Duke of Edinburgh Bronze progress, web development, recovery, and earned breaks. Track uses orange, YMCA green, School blue, Duke of Ed violet, Web Dev gold, Personal grey, and interactive selection cyan.

## Shared Data

The existing local state gains weekly fitness logs, Duke of Ed percentages, coin transactions, memory notes, daily boost completion, reaction attempts, and memory-game results. Settings gain display name, daily focus goal, weekly track goal, and weekly pushup goal. Calendar items gain recurrence, event times, notes, completion-by-occurrence, and subtasks where relevant. Local storage is authoritative for the requested manual progress values; Supabase remains sync storage for tasks, sleep entries, and focus sessions with schema additions for their new fields.

## Pages

- Home: athlete quotes, six stat tiles, Upcoming Today events, contextual coach tips, Duke progress controls, and expandable family photo notes.
- Tasks: fast title entry with optional details, category filtering, overdue ordering, subtasks, Duke tracker, and fitness logging.
- Calendar: selected day always resets to the real current date on load, category dots, seeded weekly events, recurrence controls, month/week switch, and actionable day-event cards.
- Sleep: 8.5-hour default goal, last-night summary, sleep grades, mood follow-up, chart target line, and track-training marker.
- Focus: today's task selection plus free-form label, daily goal progress, relevant presets, history, and a completion dialog.
- Arcade: explicit coin rules, daily boost rewards, editable goal reminder, free Reaction Tap, and coin-gated Memory Match.
- Settings: editable identity and goals, masked cloud settings, and local reset confirmation.

## Validation

Utility tests cover category filtering, recurrence occurrence rules, weekly fitness metrics, coin accounting, and sleep grading. Browser QA covers Home rendering, fast task creation, calendar today/week interactions, invalid sleep rejection plus mood entry, focus completion, and both arcade games at desktop and phone widths.
