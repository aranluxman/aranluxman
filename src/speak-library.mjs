// Speak section library — data only.
//
import { motivationalStories, workExamples } from "./speak-content.mjs";

export { motivationalStories, workExamples } from "./speak-content.mjs";

// This file deliberately holds no DOM code and no selection logic. The old
// version kept frameworks in app.mjs next to a cursor that picked them at
// random, independently of the topic, which is how a reflection topic could
// draw "Past / Present / Future". Selection now lives in app.mjs and reads
// only what is declared here, so a topic can never be paired with a framework
// its author did not choose.

// The four things a speaking topic can ask you to do. A custom topic the user
// types picks one of these, and that decides which frameworks are eligible.
export const PURPOSES = {
  reflect: "Reflect on an experience",
  debate: "Argue a position",
  story: "Tell a story",
  explain: "Explain or pitch an idea",
};

export const frameworks = [
  {
    id: "prep",
    name: "PREP",
    purpose: "debate",
    whenToUse: "Quick opinions and debates.",
    definition: "State your opinion, back it up, prove it, then land it again.",
    steps: [
      "Point — state your opinion",
      "Reason — why you hold it",
      "Example — proof or a quick story",
      "Point — restate it",
    ],
    example: "Morning training is better. You start the day already having won something. Last term I trained at 6am three times a week and my marks went up too. Train early — the rest of the day follows.",
  },
  {
    id: "pair",
    name: "PAIR",
    purpose: "reflect",
    whenToUse: "Make an idea memorable.",
    definition: "Anchor a lesson to a real moment so it sticks.",
    steps: [
      "Point — your main idea",
      "Anecdote — a short real moment",
      "Insight — what it taught you",
      "Recommendation — what others should do",
    ],
    example: "Consistency beats intensity. I once did a brutal two-hour session, then nothing for a week. The guy who ran twenty minutes daily passed me by June. Pick the smallest session you'll actually repeat.",
  },
  {
    id: "wsn",
    name: "What / So What / Now What",
    purpose: "reflect",
    whenToUse: "Reflecting on an experience.",
    definition: "Report the event, weigh what it meant, then name the next move.",
    steps: [
      "What — what happened",
      "So What — why it matters",
      "Now What — your next step",
    ],
    example: "I missed the relay handoff at regionals. It cost us the race, and it happened because I never practised the exchange under pressure. This season I'm doing handoff drills tired, not fresh.",
  },
  {
    id: "ppf",
    name: "Past / Present / Future",
    purpose: "story",
    whenToUse: "Showing growth or a journey.",
    definition: "Track a change across time to show how far you've come.",
    steps: [
      "Past — where you started",
      "Present — where you are now",
      "Future — where you're headed",
    ],
    example: "Two years ago I couldn't run a lap without stopping. Now I train five days a week and race the 800. Next year I want to break 2:20 and help coach the younger group.",
  },
  {
    id: "story-showing",
    name: "Story Showing",
    purpose: "explain",
    whenToUse: "Any story or explanation you want people to feel, not just follow.",
    tagline: "Don't tell a story — take the listener into a time machine using sensory details.",
    definition: "Open inside the tension, chain the events with BUT and THEREFORE, and hold the lesson until the final moments.",
    steps: [
      "Shocking Hook (first 8 seconds) — start inside the conflict, a shocking question, or a bold statement",
      "The Body (the But / Therefore engine) — chain events with \"BUT…\" (unexpected conflict) and \"THEREFORE…\" (action taken), never \"and then…\"",
      "Dopamine Spikes — drop an \"oh my god, I had no idea\" insight or a tease so nobody drifts",
      "The Payoff (resolution) — deliver the core lesson only at the very end",
    ],
    example: "We were 12 hours from launching the robot when the motor caught fire [Hook]. We tried replacing it, BUT the store was closed; THEREFORE we had to dismantle our secondary prototype [But / Therefore]. That's when we realised our team lead had wired the voltage completely backwards [Dopamine Spike].",
  },
  {
    id: "feel-know-do",
    name: "Feel / Know / Do",
    purpose: "explain",
    whenToUse: "Pitching, persuading, or any talk with an outcome attached.",
    tagline: "Decide the reaction before you decide the words.",
    definition: "Answer three questions before you open your mouth: what should they feel, what should they know, what should they do.",
    steps: [
      "Feel — name the one emotion they should leave with",
      "Know — the single fact or idea they must remember",
      "Do — the exact action you are asking them to take",
      "Deliver — build every line to serve those three, and cut everything else",
    ],
    example: "Feel: uneasy about how much practice time we lose. Know: we burn twenty minutes a session setting up gear. Do: approve a ten-minute early call so everything is up before the whistle.",
  },
  {
    id: "pip",
    name: "PIP",
    purpose: "explain",
    whenToUse: "Opening a talk strongly.",
    definition: "Say the big idea, say why it matters, then map what's coming.",
    steps: [
      "Point — the big idea",
      "Importance — why it matters",
      "Preview — what you'll cover",
    ],
    example: "Sleep is the cheapest performance upgrade there is. Most of us are training hard and recovering badly. I'll cover what sleep does for muscle, what it does for focus, and three things to change tonight.",
  },
  {
    id: "star",
    name: "STAR",
    purpose: "story",
    whenToUse: "Telling an achievement story.",
    definition: "Walk through one accomplishment from setup to outcome.",
    steps: [
      "Situation — set the scene",
      "Task — your goal",
      "Action — what you did",
      "Result — how it turned out",
    ],
    example: "Our relay team lost two runners a week before the meet. I had to fill a leg I'd never run. I trained the 200 split every morning and studied the handoff on video. We finished second and I ran a personal best.",
  },
  {
    id: "pcs",
    name: "Problem / Cause / Solution",
    purpose: "debate",
    whenToUse: "Persuading toward a fix.",
    definition: "Name what's broken, explain why, then propose the repair.",
    steps: [
      "Problem — name the issue",
      "Cause — why it happens",
      "Solution — how to fix it",
    ],
    example: "Half the team shows up to practice exhausted. Practice is right after last period with no food in between. Move it back thirty minutes and put a snack bin in the change room.",
  },
  {
    id: "pas",
    name: "PAS",
    purpose: "debate",
    whenToUse: "Convincing someone to act.",
    definition: "Press on a real pain point before offering the relief.",
    steps: [
      "Problem — the pain point",
      "Agitate — make it feel real",
      "Solution — the relief",
    ],
    example: "You're losing an hour a night to your phone. That's a full extra training session every week, gone, and you don't even remember what you scrolled. Charge it outside your room and take the hour back.",
  },
  {
    id: "bab",
    name: "BAB",
    purpose: "explain",
    whenToUse: "Pitching a change or idea.",
    definition: "Contrast the old state with the better one, then bridge across.",
    steps: [
      "Before — the old situation",
      "After — the better outcome",
      "Bridge — how to get there",
    ],
    example: "Right now nobody knows when practices move. Imagine everyone getting one message the second a time changes. All it takes is a team group chat and one person who owns it.",
  },
  {
    id: "aaa",
    name: "Agree / Add / Ask",
    purpose: "debate",
    whenToUse: "Keeping a conversation flowing.",
    definition: "Take their point seriously, extend it, then hand it back.",
    steps: [
      "Agree — acknowledge their point",
      "Add — bring something new",
      "Ask — pose a question back",
    ],
    example: "You're right that talent gives someone a head start. What I'd add is that it stops mattering around year three, when the work compounds. Where do you think the crossover actually happens?",
  },
];

// Not yet built: "The One Important Thing" is a framework Aran uses, but its
// steps are not in the source material and have not been supplied, so it is
// listed here rather than guessed at. To add it, append an entry to
// `frameworks` above with the same shape and drop its name from this list —
// the test suite checks that every pending name is genuinely still missing, so
// nothing else needs changing.
export const PENDING_FRAMEWORKS = ["The One Important Thing"];

export const storytellingTechniques = [
  {
    id: "state-the-location",
    name: "State the Location",
    definition: "Put the listener somewhere before anything happens.",
    prompt: "Set the scene in one sentence — what room were you in, and what small detail do you remember?",
    example: "\"It was the back stairwell of the school, the one that always smelled like chlorine from the pool.\"",
  },
  {
    id: "describe-actions",
    name: "Describe Actions",
    definition: "Show what bodies did, not just what happened.",
    prompt: "Drop us into the middle of the action first, then explain how you got there.",
    example: "\"I was already halfway down the hall before I realised I'd left the baton behind.\"",
  },
  {
    id: "share-your-thoughts",
    name: "Share Your Thoughts",
    definition: "Let the listener hear what you were actually thinking.",
    prompt: "What was the one thought running through your head that you'd be embarrassed to say out loud?",
    example: "\"All I could think was: please let someone else volunteer first.\"",
  },
  {
    id: "show-emotions",
    name: "Show Emotions",
    definition: "Signal the feeling through the body instead of naming it.",
    prompt: "Show how you felt without naming the emotion — what did your hands, breathing, or posture do?",
    example: "\"My hands wouldn't stay still, so I kept retying a shoe that was already tied.\"",
  },
  {
    id: "use-dialogue",
    name: "Use Dialogue",
    definition: "Quote the words instead of summarising them.",
    prompt: "Add a single line of real dialogue. What exact words were said, and by whom?",
    example: "\"My coach just said, 'You're running third. Don't think about it.'\"",
  },
  {
    id: "sensory-anchor",
    name: "The Sensory Anchor",
    definition: "Anchor the moment in a sense other than sight.",
    prompt: "Describe the exact moment using one non-visual sense — what did you hear, smell, or feel physically?",
    example: "\"The whole gym went quiet enough that I could hear the clock.\"",
  },
  {
    id: "status-shift",
    name: "The Status Shift",
    definition: "Show who rose and who fell by the end.",
    prompt: "Find the status shift: who or what went up, and who or what went down by the end?",
    example: "\"I walked in as the kid filling a spot and walked out as the one they wanted anchoring.\"",
  },
];

// Two of the nine storytelling techniques were cut off in the source request
// and have not been confirmed, so they are named here rather than invented.
// Adding them works the same way as PENDING_FRAMEWORKS above.
export const PENDING_TECHNIQUES = ["technique 8 (unconfirmed)", "technique 9 (unconfirmed)"];

// The storytelling card's fixed half. The per-topic technique above still
// changes every round; this is the standing instruction that sits above it —
// what "story showing" actually asks you to do with your senses and your body.
export const sensoryMapping = {
  name: "Sensory & Emotion Mapping",
  alias: "Story Showing",
  tagline: "Light up both sides of the brain by engaging the 5 senses and mirror neurons.",
  guidelines: [
    {
      title: "Show, don't tell",
      detail: "Describe the sights, sounds, smells, textures, and tastes instead of summarising what happened.",
    },
    {
      title: "Embody the emotion",
      detail: "Feel the pain, anger, or excitement yourself while recording — mirror neurons carry it across to the listener.",
    },
    {
      title: "Turn mess into message",
      detail: "Start with what you hate, what you are against, or what you struggled through.",
    },
  ],
  example: "The smell of burnt circuit board filled the room as the red warning LED flashed furiously.",
};

// Prince Ea's ten secrets of world-class communication, in the order they are
// taught. The timestamp is where each one starts in the source talk, kept so a
// principle can be checked against the original rather than taken on trust.
export const communicationSecrets = [
  { id: "pause", title: "Power of the Pause", detail: "Hold silence before you speak or answer. It buys thinking time and reads as authority.", timestamp: "00:03:47" },
  { id: "energy", title: "Prioritize Energy over Words", detail: "55% visual, 38% tone, 7% words. Your energy carries the message; the words only label it.", timestamp: "00:09:02" },
  { id: "tone", title: "Master Your Tone", detail: "Tone leaks your real attitude. Practise the same sentence with conviction, with warmth, with urgency.", timestamp: "00:12:01" },
  { id: "enunciate", title: "Enunciate Clearly", detail: "Over-articulate on purpose. Crisp consonants sound confident and trustworthy; mumbling sounds unsure.", timestamp: "00:13:39" },
  { id: "feel-know-do", title: "Feel / Know / Do", detail: "Before you speak, answer three questions: what do I want them to feel, to know, and to do?", timestamp: "00:14:21" },
  { id: "authenticity", title: "Authenticity", detail: "Drop the stiff professional persona. Talk human to human instead of performing a role.", timestamp: "00:16:07" },
  { id: "wiifm", title: "Make It About Them", detail: "Speak to the listener's self-interest — WIIFM: what's in it for me?", timestamp: "00:17:37" },
  { id: "kiss", title: "Keep It Simple (KISS)", detail: "No $5 words, no jargon. Simple and universal beats clever and narrow.", timestamp: "00:22:29" },
  { id: "skirt-rule", title: "The Skirt Rule (Length)", detail: "Long enough to cover the subject, short enough to keep attention.", timestamp: "00:26:36" },
  { id: "big-me", title: "Big Me vs. Little Me", detail: "Beat the fear by serving the audience instead of protecting your ego.", timestamp: "00:26:59" },
];

// The centre column's tabs. "auto" is not a framework — it is the existing
// behaviour, where the round shows whatever framework the current topic
// declares. The next two pin the column to one framework regardless of topic,
// and "articulation" hands the column over to the legacy sound drills.
export const FRAMEWORK_MODES = [
  { id: "auto", label: "Topic match", frameworkId: null },
  { id: "story-showing", label: "Story Showing", frameworkId: "story-showing" },
  { id: "feel-know-do", label: "Feel / Know / Do", frameworkId: "feel-know-do" },
  { id: "articulation", label: "Articulation drills", frameworkId: null },
];

export const frameworkModeById = (id) => FRAMEWORK_MODES.find((mode) => mode.id === id) || FRAMEWORK_MODES[0];

// Every topic names its own framework and storytelling technique. Nothing here
// is chosen at run time, so a pairing can only ever be one an author wrote.
const baseSpeakTopics = [
  { kind: "debate", text: "Argue why guys are better than donuts.", framework: "prep", technique: "share-your-thoughts" },
  { kind: "debate", text: "Cereal is a soup. Defend it with full confidence.", framework: "pas", technique: "use-dialogue" },
  { kind: "debate", text: "A hot dog is a sandwich — convince the room.", framework: "prep", technique: "describe-actions" },
  { kind: "debate", text: "Mondays should be illegal. Make your case.", framework: "pcs", technique: "show-emotions" },
  { kind: "debate", text: "Pineapple absolutely belongs on pizza.", framework: "pip", technique: "sensory-anchor" },
  { kind: "debate", text: "Texting is better than calling. Prove it.", framework: "bab", technique: "use-dialogue" },
  { kind: "debate", text: "Cats secretly run the internet. Present the evidence.", framework: "story-showing", technique: "state-the-location" },
  { kind: "debate", text: "Summer break should be twice as long.", framework: "prep", technique: "status-shift" },
  { kind: "reflection", text: "Describe a problem you faced recently and how you overcame it.", framework: "wsn", technique: "share-your-thoughts" },
  { kind: "reflection", text: "Talk about a time you changed your mind about something.", framework: "wsn", technique: "status-shift" },
  { kind: "reflection", text: "What's a habit you're proud of building, and how did you do it?", framework: "pair", technique: "describe-actions" },
  { kind: "reflection", text: "Describe a mistake that ended up teaching you something.", framework: "wsn", technique: "show-emotions" },
  { kind: "reflection", text: "Walk through a goal you're chasing and your very next step.", framework: "wsn", technique: "share-your-thoughts" },
  { kind: "reflection", text: "What does a great day look like for you, and why?", framework: "pair", technique: "sensory-anchor" },
  // Labelled "reflection" originally, but "do you agree?" asks for a stance, not
  // a reflection — which is why Agree / Add / Ask was the right framework all along.
  { kind: "debate", text: "React to: 'hard work beats talent.' Do you agree?", framework: "aaa", technique: "share-your-thoughts" },
  { kind: "story", text: "Tell the story of a time you were the underdog.", framework: "star", technique: "status-shift" },
  { kind: "story", text: "Tell about a moment everything went wrong — then turned right.", framework: "bab", technique: "describe-actions" },
  { kind: "story", text: "Describe the first time you tried something really hard.", framework: "ppf", technique: "show-emotions" },
  { kind: "story", text: "Tell a story where one small choice changed everything.", framework: "star", technique: "state-the-location" },
  { kind: "story", text: "Tell about a time you genuinely surprised yourself.", framework: "star", technique: "sensory-anchor" },
  { kind: "story", text: "Share a story about someone who pushed you to be better.", framework: "ppf", technique: "use-dialogue" },
];

// Keep the original practice prompts first for familiar daily rotation, then
// add the larger work/story library so repeated sessions stay varied.
export const speakTopics = [...baseSpeakTopics, ...workExamples, ...motivationalStories];

export const speakKindLabels = { debate: "Debate it", reflection: "Reflect", story: "Tell a story", explain: "Explain it" };

// Short badge labels for a topic the user typed, so the kind chip says what the
// topic asks of you rather than repeating "Your topic" next to the source chip.
export const PURPOSE_LABELS = { reflect: "Reflect", debate: "Debate it", story: "Tell a story", explain: "Explain it" };
// Reuses the existing kind colours: reflect borrows the reflection purple, story
// the orange, and the rest fall back to teal.
export const PURPOSE_KIND = { reflect: "reflection", debate: "debate", story: "story", explain: "explain" };

// Which purpose a curated topic kind maps to, for topics the user types.
export const KIND_PURPOSE = { debate: "debate", reflection: "reflect", story: "story", explain: "explain", custom: "reflect" };

export const frameworkById = (id) => frameworks.find((framework) => framework.id === id) || null;
export const techniqueById = (id) => storytellingTechniques.find((technique) => technique.id === id) || null;
export const frameworksForPurpose = (purpose) => frameworks.filter((framework) => framework.purpose === purpose);

// Stable, non-random pick for a topic the user typed. The same text plus the
// same purpose always yields the same framework, so a custom topic behaves
// exactly like a curated one: repeatable, and never a surprise re-roll.
export function hashText(text) {
  let hash = 0;
  for (let i = 0; i < String(text).length; i += 1) {
    hash = (hash * 31 + String(text).charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function resolveCustomTopic(text, purpose = "reflect") {
  const eligible = frameworksForPurpose(purpose);
  const pool = eligible.length ? eligible : frameworks;
  const seed = hashText(`${purpose}:${text}`);
  return {
    framework: pool[seed % pool.length],
    technique: storytellingTechniques[seed % storytellingTechniques.length],
  };
}

// Resolve a round to the exact framework and technique it should show. A
// curated topic uses the ids it declares; a typed topic goes through the
// deterministic hash above. Either way nothing is picked at random.
export function resolveRound(topic) {
  if (!topic) return null;
  if (topic.kind === "custom") {
    const resolved = resolveCustomTopic(topic.text, topic.purpose);
    return { topic, ...resolved };
  }
  return { topic, framework: frameworkById(topic.framework), technique: techniqueById(topic.technique) };
}
