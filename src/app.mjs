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
  getSugarProgress,
  parseIcsEvents,
  SUGAR_DAILY_LIMIT_GRAMS,
  sugarEntriesForDate,
  summarizeFitnessWeek,
  summarizeSugar,
  sumSugarForDate,
  todayKey,
} from "./planner-utils.mjs";
import {
  PURPOSE_KIND,
  PURPOSE_LABELS,
  PURPOSES,
  resolveRound,
  speakKindLabels,
  speakTopics,
} from "./speak-library.mjs";
import { createIcons } from "./icons.mjs";
import * as gcal from "./google-calendar.mjs";

const STORE_KEY = "aran-life-flow-state";
const SETTINGS_KEY = "aran-life-flow-settings";
const CLOUD_REFRESH_MS = 60_000;
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
const goalGroups = [
  { key: "ai", title: "AI & Career", icon: "cpu", accent: "#3e9cff", goals: [
    "Get one paying AI client",
    "Build and publish an app",
    "Create an AI school club",
    "Build a personal website / portfolio",
    "Choose a clear career path (AI generalist)",
    "Launch a small AI service with 5+ regular users by Dec 31, 2026",
  ] },
  { key: "edu", title: "Education", icon: "graduation-cap", accent: "#9171ef", goals: [
    "Achieve a 90% school average",
    "Join 2+ academic competitions or clubs by end of 2026",
  ] },
  { key: "fit", title: "Fitness & Health", icon: "dumbbell", accent: "#27c78a", goals: [
    "Do 50 push-ups in a row",
    "Hold an 8-minute plank",
    "Maintain a 30-day daily routine",
    "Sleep 7-9 hours most school nights for a full month by June 2026",
    "Build a habit of ~9 hours of sleep daily",
  ] },
  { key: "money", title: "Finance & Work", icon: "wallet", accent: "#ebbd45", goals: [
    "Save $5,000",
    "Get a part-time job",
    "Earn $200+ from a side hustle by Dec 31, 2026",
  ] },
  { key: "growth", title: "Personal Growth & Service", icon: "heart-handshake", accent: "#ff9738", goals: [
    "Read 10 personal-growth books",
    "Complete 100 volunteer hours",
    "Practice a creative skill 15 min/day for 30 days by end of 2026",
  ] },
];
// Speak page — practice structures (name, steps, when to use)
// R-words articulation drills (curated). These are the hand-written R sentences.
// They get combined with the S-words and hundreds of generated sentences below.
// Grouped by where the R sound falls: initial (start), medial (middle), final (end).
const rWordSentences = {
  initial: [
    "Rachel raced the rabbit around the red ranch.",
    "The rocket roared right past the rising moon.",
    "Ryan rode his red bike down the rocky road.",
    "Rain ran down the roof and around the rim.",
    "The robot rolled across the room and waved.",
    "Rebecca read a really riveting railway report.",
    "The river rushed right by the rugged ridge.",
    "Roy wrapped the ribbon around the round box.",
    "Rita's rooster crows at the rising sun.",
    "The referee raised his right hand to restart.",
    "Rabbits relax in rows beneath the redwood.",
    "Randy roasted radishes and rich red peppers.",
    "The racer reached the ramp and rocketed up.",
    "The ranger rescued a raccoon from the river.",
    "Rusty's rope reached the top of the ridge.",
    "Rain or shine, Riley runs every morning.",
    "The radio replayed a really retro rock song.",
    "Reggie ran a record race around the rink.",
    "Ruby's ring rolled right under the rug.",
    "Rapid rivers race over rough rocks.",
    "Renee rearranged the red roses in a row.",
    "The rookie raised his racket and returned it.",
    "Rico repaired the radio in record time.",
    "The raven rose above the rolling hills.",
    "Robin's recipe required ripe raspberries.",
    "Round and round the racetrack they ran.",
    "The rescue team reached the ridge by noon.",
    "Real runners respect their rest days.",
    "Rosa's room was ready right on time.",
    "Rick rolled the rugged rover over the ridge.",
    "Ramona wrote a riddle about a roaring river.",
    "The rancher rounded up the restless reindeer.",
    "Reach for the rope and ring the rusty bell.",
    "Roger raked the red and russet leaves.",
    "The runner's rhythm rarely ever broke.",
    "Ravi rented a rowboat for the river race.",
    "Rows of radishes ripened in the rich soil.",
    "The reporter recorded a remarkable rescue.",
    "The rooster, the rabbit, and the raven raced.",
    "Renata recited a rhyme about a red rocket.",
    "Rough roads rarely ruin a real road trip.",
    "The relay runner ran the right route.",
    "Ralph wrapped the railing in red ribbon.",
    "Rita's recipe relies on roasted red peppers.",
    "The river ran rapidly around the rugged rocks.",
    "Ronnie repaired the radio and the remote.",
    "Raise the roof and ring in the new record.",
    "The ranger's radio reached the remote ridge.",
    "Robin ran a rugged route through the rain.",
    "Rare rubies rolled across the royal rug.",
    "The restless river rose right to the road.",
    "Reuben wrote a review of the racing rover.",
  ],
  medial: [
    "The parrot carried a carrot across the garden.",
    "Sarah hurried through the crowded market.",
    "A squirrel buried an acorn near the barrel.",
    "The mirror in the hallway needed a quick repair.",
    "Every morning Larry borrows the orange ladder.",
    "The story of the brave pirate spread around town.",
    "Harry's umbrella turned inside out in the storm.",
    "Carol parked the car around the corner.",
    "The farmer carried barrels toward the barn.",
    "A cheerful chorus echoed through the forest.",
    "Maria poured syrup over her warm oatmeal.",
    "The arrow soared over the narrow stream.",
    "Gerald measured the perimeter of the arena.",
    "Cherry and berry flavors filled the bakery.",
    "The tourist wandered around the ancient ruins.",
    "Aaron operated the camera during the parade.",
    "A spirited terrier scurried after the squirrel.",
    "Theresa arranged the chairs around the table.",
    "The doctor measured the patient's temperature.",
    "Sparrows gathered near the garden sprinkler.",
    "Lauren prepared a colorful fruit platter.",
    "The orchestra performed a stirring overture.",
    "A herd of horses thundered across the prairie.",
    "Murray hurried to repair the broken stereo.",
    "The currents carried the surfers toward shore.",
    "Florence wore a coral scarf to the carnival.",
    "The narrator described the mysterious mirror.",
    "Caroline arranged forty oranges in the carton.",
    "The merry carolers gathered around the porch.",
    "Jeremy prepared a peppery carrot for dinner.",
    "The warrior carried armor through the corridor.",
    "Veronica borrowed a guitar for the chorus.",
    "The carpenter hammered narrow boards in a hurry.",
    "Forty parrots squawked around the harbor.",
    "Lawrence wandered the corridors of the library.",
    "A foreign tourist explored the historic quarry.",
    "The squirrel darted across the parking garage.",
    "Barbara wore a maroon apron in the bakery.",
    "The current carried the kayak toward the rapids.",
    "Gloria arranged the marbles in a curious order.",
    "The referee warned the players about the corner.",
    "Terry prepared a hearty curry for everybody.",
    "Margaret carried the parrot through the airport.",
    "The interview covered the history of the marina.",
    "Harold borrowed forty dollars for the parking.",
    "A spirited mare galloped around the racing arena.",
    "The director arranged a rehearsal in the morning.",
    "Sherry stirred the marinara with a wooden spoon.",
    "The narrow stairway spiraled toward the tower.",
    "Brave warriors guarded the marble corridor.",
    "The carpenter repaired the squeaky barn doors.",
    "Lauren carried groceries around the corner store.",
  ],
  final: [
    "The teacher wrote her answer on the chalkboard.",
    "After dinner, Peter cleared the kitchen counter.",
    "The doctor offered the runner some water.",
    "A polar bear wandered near the harbor.",
    "Mother and father waited by the door.",
    "The farmer gathered corn before the winter.",
    "Oliver wore a sweater near the heater.",
    "The painter colored the tower silver.",
    "Sooner or later the weather will get clearer.",
    "The driver parked the trailer by the river.",
    "Her sister is a singer and a dancer.",
    "The waiter brought butter for the cracker.",
    "A spider spun a web in the corner.",
    "The hiker carried water up the steeper trail.",
    "Trevor is taller than his older brother.",
    "The lawyer offered an answer to the reporter.",
    "Summer is warmer than the cooler autumn.",
    "The actor remembered every line by dinner.",
    "Pour the batter, then add a little sugar.",
    "The carpenter measured the lumber for the floor.",
    "Her father is a clever engineer and a teacher.",
    "The dancer twirled faster near the center.",
    "The baker offered a wafer with the coffee.",
    "A feather drifted lower toward the water.",
    "The manager thanked every customer by the door.",
    "Closer and closer the thunder rolled over.",
    "The author wrote a thriller about a sailor.",
    "The jogger ran farther than ever before.",
    "Our neighbor offered to repair the old mower.",
    "The professor answered after a brief pause.",
    "The farmer's tractor sputtered near the barn.",
    "The sailor steered the cruiser past the pier.",
    "My grandmother is a painter and a gardener.",
    "The plumber fixed the burner and the boiler.",
    "The reporter interviewed the mayor after lunch.",
    "A ranger warned the hiker about the bear.",
    "The voter answered the surveyor near the door.",
    "The barber gave the teacher a quicker haircut.",
    "The whisper grew louder near the empty theater.",
    "The flier landed near the runway in clear weather.",
    "The trainer offered the player some water.",
    "The diner ordered chowder and a cheeseburger.",
    "The conductor waved to the passenger by the door.",
    "A clever inventor built a faster motor.",
    "The juggler dropped a feather, never a hammer.",
    "The teacher cheered louder than the cheerleader.",
    "The cobbler repaired the leather slipper.",
    "The driver waited for the weather to get clearer.",
    "The painter offered the buyer a fair number.",
    "The senator answered every voter with honor.",
    "The fisher caught a flounder near the harbor.",
    "The director thanked the dancer and the singer.",
  ],
};
const R_SET_SIZE = 10;
// How many of each target sound make up one 10-sentence practice set. R and S carry
// the bulk of the drill; TH and SH get one slot each so they stay in rotation
// without crowding out the two sounds this module was built for.
const R_SET_MIX = { R: 4, S: 4, TH: 1, SH: 1 };
// Once a sentence is checked off (crossed out) it goes on a cooldown and will not
// appear again until this many days have passed.
const R_COOLDOWN_DAYS = 7;

// S-words articulation drills (curated), mixed in with the R-words so both sounds
// get practiced. Same three positions: initial (start), medial (middle), final (end).
const sWordSentences = {
  initial: [
    "Sam sipped a smoothie in the summer sun.",
    "Sarah sold seven sizzling sausages.",
    "The seal slid across the slippery sand.",
    "Sofia sang a soft song at sunset.",
    "Sean sorted the silver spoons slowly.",
    "The sailor steered the small ship to shore.",
    "Sydney searched for six seashells by the sea.",
    "Simon served soup and a sweet salad.",
    "The snake slithered past the sandy stones.",
    "Sally saved a seat for her sister.",
    "The soldier stood still in the silent square.",
    "Seven swans swam across the sunny sea.",
    "Sofia stacked the soft sweaters in a suitcase.",
    "The scout set up a small tent by sundown.",
  ],
  medial: [
    "The officer misplaced a pencil in the basket.",
    "Jessica whispered a secret by the castle.",
    "The dinosaur chased a bicycle down the street.",
    "Melissa unpacked the groceries in a hurry.",
    "The passenger fastened the seatbelt quickly.",
    "A messenger raced past the whistling wrestler.",
    "The grocer stacked the baskets in the cellar.",
    "Vanessa listened to the whistle in the distance.",
    "The wrestler tossed the crystal glass aside.",
    "A curious lizard escaped the plastic basket.",
    "The professor answered every question in class.",
    "Cassidy assembled a puzzle of a dinosaur.",
  ],
  final: [
    "The nurse chased the goose across the grass.",
    "The princess placed the glass on the staircase.",
    "A mouse raced past the fence toward the house.",
    "The waitress rinsed a glass at the sink.",
    "The boss lost his keys in the tall grass.",
    "A horse and a goose stood on the ice.",
    "The witness paced across the empty terrace.",
    "The class raced across the grass at recess.",
    "The prince chased a mouse around the palace.",
    "A moose stood still on the frozen ice.",
    "The actress wore a dress made of lace.",
    "The niece placed a vase on the bookcase.",
  ],
};

// TH-words articulation drills. Unlike R and S these are hand-written only: the
// combinatorial generator below cannot guarantee a TH lands in the right position
// for every combination it produces, and a medial drill full of final-TH words is
// worse than a shorter list. Both the voiceless /th/ ("think") and the voiced /th/
// ("mother") count — they share the same tongue-between-teeth placement.
const thWordSentences = {
  initial: [
    "Thomas thought about three thick books.",
    "Thirty thirsty thinkers thanked the theater.",
    "Theo threw the thin thread over the thorn.",
    "Thursday's thunder shook the thatched roof.",
    "The thoughtful thief thanked me for the thermos.",
    "Think through the theory before Thursday.",
    "Three thousand thistles grew by the path.",
    "Thelma thumbed through a thrilling thriller.",
    "The thermometer read thirty-three degrees.",
    "Thank the thoughtful theater for the thick program.",
    "Thad threaded the needle with his thumb.",
    "Thirsty and thrilled, they thanked the thunderstorm.",
    "The therapist thought the theme was thoughtful.",
    "Throw the thick thermos through the doorway.",
    "Theodore thrives on Thursday theater practice.",
    "The thrush and the thistle thrived together.",
    "Thoughts of Thanksgiving filled Thelma's Thursday.",
    "Three thin threads held the thick thimble.",
    "Thankfully the thunder passed by Thursday.",
    "The thirsty thoroughbred thundered through the field.",
  ],
  medial: [
    "My birthday falls on a healthy Thursday.",
    "Mother and Father gathered by the weather vane.",
    "The athlete ran a marathon without anything to drink.",
    "My brother brushed his teeth with a new toothbrush.",
    "Heather bothered the panther in the northern zoo.",
    "Arthur would rather gather feathers together.",
    "Nothing was worthy of the wealthy author.",
    "The python slithered through the earthy pathway.",
    "Kathy's method was healthier than anything else.",
    "Either the weather or the leather will bother him.",
    "Together they gathered everything for the birthday.",
    "The author's brother is a faithful athlete.",
    "My grandmother bathed the puppy in the bathtub.",
    "Anthony gathered sympathy from another brother.",
    "The northern weather bothered the youthful athletes.",
    "Ruthie ran a marathon on her birthday.",
    "Feathers and leather gathered in the bathroom.",
    "Neither brother bothered with the birthday cake.",
    "The wealthy author gathered nothing but sympathy.",
    "Katherine's mother is a faithful marathon runner.",
  ],
  final: [
    "I take a warm bath after math.",
    "Brush both rows of teeth every month.",
    "The moth flew north above the path.",
    "Take a deep breath and open your mouth.",
    "Growth takes both health and youth.",
    "The cloth on the fifth shelf is smooth.",
    "Beth walked south along the narrow path.",
    "Tell the truth about the broken tooth.",
    "The earth beneath the path felt smooth.",
    "Both the math and the health test were tough.",
    "Wealth is worth less than health.",
    "The fifth month brought steady growth.",
    "Keith held his breath underneath the cloth.",
    "A moth landed on the birdbath by the path.",
    "Go north, then south, then back to the path.",
    "Every month I clean my teeth and my mouth.",
    "The youth showed growth and real strength.",
    "Smooth cloth is worth the extra length.",
    "Beneath the bath sat a small gray moth.",
    "Tell the truth: is the path north or south?",
  ],
};
// SH-words articulation drills (/sh/ as in "shoe"). Hand-written for the same
// positional reason as TH above.
const shWordSentences = {
  initial: [
    "She showed us her shiny new shoes.",
    "The shark shot past the shallow shore.",
    "Sharon shoveled snow off the short shed.",
    "Shawn shared his shirt with his shivering sister.",
    "The shepherd shooed the sheep into the shade.",
    "Shelly shopped for shampoo and a shower cap.",
    "Shine the flashlight and show me the shelf.",
    "The ship sheltered in the shadow of the shore.",
    "Sharp shells shimmered on the shallow shoreline.",
    "Shut the shutters before the shower starts.",
    "Sheila shouted from the shortest shortcut.",
    "The shy shopper shrugged at the shrinking shelf.",
    "Shane shaped the short shovel handle.",
    "Show the shopkeeper your shiny shell.",
    "Shirley shared a shortcake with the shepherd.",
    "The shuttle shook as it shot past the shore.",
    "Shallow shells shifted in the shining sand.",
    "Shawn's shoulder shifted under the sheep.",
    "She shouted, then showed us the shortcut.",
    "The shopkeeper shelved the shiny shoes.",
  ],
  medial: [
    "The washer shook the ocean-blue cushion.",
    "Sunshine filled the fishing station all morning.",
    "Michelle washed the dishes after the workshop.",
    "The patient waited by the ancient bookshelf.",
    "A delicious milkshake beat any marshmallow.",
    "The machine at the station needed washing.",
    "Mushrooms grew beside the seashell path.",
    "Special flashlights lit the ocean workshop.",
    "The magician's motion was precious to watch.",
    "Trisha finished washing the seashell dishes.",
    "The nation watched the ocean in motion.",
    "Marshall wished for a milkshake and a mushroom.",
    "An ancient brochure sat on the bookshelf.",
    "The fisherman's flashlight lit the ocean.",
    "Washing machines rushed through the workshop.",
    "The patient found a precious seashell.",
    "Sunshine and ocean motion filled the station.",
    "Alicia washed the cushions in the machine.",
    "A delicious marshmallow melted in the sunshine.",
    "The magician's special motion astonished us.",
  ],
  final: [
    "The fish splashed in the fresh dish.",
    "Wash the brush before the trash goes out.",
    "I wish I could finish the radish salad.",
    "Push the cash into the small dish.",
    "A flash of light made the goldfish dash.",
    "The crash of the wave made a big splash.",
    "Josh will finish the English homework.",
    "Polish the brush until the finish is fresh.",
    "The shellfish hid beneath the marsh.",
    "Don't rush; just finish and wash up.",
    "Trish put the radish in the fresh dish.",
    "A splash of water hit the windshield sash.",
    "The jellyfish drifted past in a flash.",
    "Brush the ash off the fresh trash bin.",
    "I wish the goldfish would finish its dish.",
    "Push the cart, then wash the fresh squash.",
    "The English class had to finish the quiz.",
    "Ash and trash filled the old brush pile.",
    "Cash and a fresh radish sat in the dish.",
    "The starfish and jellyfish caused a splash.",
  ],
};

// Deterministic sentence generator. It walks the full cartesian product of the word
// banks in a fixed pseudo-shuffled order: n -> (n * step) mod total, where step is
// coprime to total, so the sequence visits every distinct combination exactly once
// (rich variety across all banks) while staying stable across reloads. That
// stability is what lets the 7-day cooldown key off sentence ids reliably.
const gcd = (a, b) => { while (b) { const t = a % b; a = b; b = t; } return a; };
function coprimeStep(total) {
  if (total <= 1) return 1;
  let step = Math.max(1, Math.floor(total * 0.6180339887));
  while (gcd(step, total) !== 1) step += 1;
  return step % total || 1;
}
function buildSentencePool(template, banks, cap) {
  const radix = banks.map((bank) => bank.length);
  const total = radix.reduce((product, size) => product * size, 1);
  const limit = Math.min(cap, total);
  const step = coprimeStep(total);
  const out = [];
  const seen = new Set();
  for (let n = 0; out.length < limit && n < total; n += 1) {
    let index = (n * step) % total;
    const picks = banks.map((bank, position) => {
      const value = bank[index % radix[position]];
      index = Math.floor(index / radix[position]);
      return value;
    });
    const sentence = template(...picks);
    if (!seen.has(sentence)) { seen.add(sentence); out.push(sentence); }
  }
  return out;
}
const dedupeSentences = (list) => [...new Set(list.filter(Boolean))];

// ---- Generated pools (hundreds of sentences per position, per sound) ----
const genInitialR = buildSentencePool(
  (s, v, o) => `${s} ${v} ${o}.`,
  [
    ["Rachel", "Ryan", "Rita", "Roy", "Ronnie", "Riley", "Ruby", "Rico", "Roger", "Rosa", "Ramona", "Ravi", "Robin", "Rex", "Rowan", "The ranger", "The rooster", "The runner", "The racer", "The reporter", "The rancher", "The raccoon"],
    ["raced past", "rolled toward", "reached for", "raved about", "reviewed", "recorded", "repaired", "rented", "returned", "raised", "wrapped up", "read about", "rescued", "remembered"],
    ["the red rocket", "a rugged road", "the round ring", "a rusty rope", "the royal rug", "the rapid river", "a ripe raspberry", "the rocky ridge", "the racing rover", "a roaring river", "a rubber raft", "the radio remote"],
  ],
  240,
);
const genInitialS = buildSentencePool(
  (s, v, o) => `${s} ${v} ${o}.`,
  [
    ["Sam", "Sarah", "Sofia", "Sean", "Sydney", "Sally", "Simon", "Sasha", "Scott", "Sienna", "Silas", "Sonia", "The sailor", "The singer", "The seal", "The soldier", "The scientist", "The server"],
    ["sang about", "sailed toward", "sorted", "saved", "served", "sipped", "searched for", "sketched", "spotted", "seized", "surprised", "settled near", "sold"],
    ["the silver spoon", "a soft sofa", "the sandy shore", "seven seashells", "a sunny scene", "the sizzling soup", "a small saddle", "a sturdy sailboat", "the salty sea", "the sparkling stars", "a secret sign", "a sweet cider"],
  ],
  240,
);
const genMedialR = buildSentencePool(
  (s, v, o) => `${s} ${v} ${o}.`,
  [
    ["Sarah", "Larry", "Harry", "Carol", "Murray", "Gerald", "Theresa", "Caroline", "Barbara", "Jeremy", "Veronica", "The parrot", "The squirrel", "The sparrow", "The terrier", "The warrior", "The pirate", "The tourist"],
    ["carried", "hurried with", "buried", "borrowed", "arranged", "prepared", "measured", "gathered", "adored", "explored", "admired", "delivered", "cherished", "favored"],
    ["a fresh carrot", "an orange", "the barrel", "the mirror", "forty berries", "a cherry pie", "a coral scarf", "the marbles", "a narrow arrow", "a peppery curry", "the syrup jar", "a hairy caterpillar"],
  ],
  240,
);
const genMedialS = buildSentencePool(
  (s, v, o) => `${s} ${v} ${o}.`,
  [
    ["The officer", "The grocer", "The messenger", "The wrestler", "The passenger", "The professor", "Jessica", "Melissa", "Vanessa", "Cassidy", "The listener", "The dinosaur"],
    ["misplaced", "assembled", "rescued", "passed", "tossed", "fastened", "escaped past", "whistled at", "dusted", "rinsed", "boxed up", "chiseled"],
    ["a broken pencil", "the plastic basket", "a secret message", "the sandcastle", "a shiny bicycle", "the pink eraser", "a crystal glass", "the grocery list", "a tin whistle", "a bristle brush", "a plastic dinosaur", "a mystery parcel"],
  ],
  240,
);
const genFinalR = dedupeSentences([
  ...buildSentencePool(
    (a, b, o) => `The ${a} offered the ${b} some ${o}.`,
    [
      ["teacher", "doctor", "farmer", "painter", "driver", "singer", "dancer", "baker", "sailor", "author", "waiter", "hiker", "jogger", "reporter", "manager", "trainer", "barber", "plumber", "ranger", "actor"],
      ["doctor", "farmer", "painter", "driver", "singer", "dancer", "baker", "sailor", "author", "waiter", "hiker", "jogger", "reporter", "manager", "trainer", "barber", "plumber", "ranger", "actor", "teacher"],
      // All plural/mass nouns: the template reads "…some ${o}", so "a cracker"
      // here produced "offered the hiker some a cracker".
      ["water", "butter", "sugar", "cheddar", "chowder", "dinner", "supper", "crackers", "wafers", "burgers"],
    ],
    200,
  ),
  ...buildSentencePool(
    (a, b, place) => `The ${a} waited for the ${b} near the ${place}.`,
    [
      ["teacher", "doctor", "farmer", "painter", "driver", "singer", "dancer", "baker", "sailor", "author", "waiter", "hiker", "jogger", "reporter"],
      ["manager", "trainer", "barber", "plumber", "ranger", "actor", "waiter", "hiker", "jogger", "reporter", "doctor", "painter", "driver", "singer"],
      ["door", "corner", "tower", "harbor", "counter", "elevator", "theater", "river"],
    ],
    120,
  ),
]);
const genFinalS = dedupeSentences([
  ...buildSentencePool(
    (a, x, p) => `The ${a} chased the ${x} across the ${p}.`,
    [
      ["nurse", "prince", "princess", "waitress", "actress", "boss", "hostess", "witness", "duchess", "countess"],
      ["goose", "moose", "mouse", "horse"],
      ["grass", "ice", "fence", "terrace", "staircase", "palace", "surface", "bookcase"],
    ],
    150,
  ),
  ...buildSentencePool(
    (a, o, s) => `The ${a} placed the ${o} on the ${s}.`,
    [
      ["princess", "waitress", "actress", "hostess", "duchess", "witness", "boss", "niece"],
      ["glass", "dress", "vase", "necklace", "suitcase", "purse", "blouse", "fleece"],
      ["fence", "terrace", "staircase", "bookcase", "surface", "mattress", "canvas"],
    ],
    150,
  ),
]);

// Combined pools used by the UI: curated + generated, deduped. Each position holds
// one list per target sound; a practice set draws from all four so the sounds mix.
const articulationPools = {
  initial: {
    R: dedupeSentences([...rWordSentences.initial, ...genInitialR]),
    S: dedupeSentences([...sWordSentences.initial, ...genInitialS]),
    TH: dedupeSentences(thWordSentences.initial),
    SH: dedupeSentences(shWordSentences.initial),
  },
  medial: {
    R: dedupeSentences([...rWordSentences.medial, ...genMedialR]),
    S: dedupeSentences([...sWordSentences.medial, ...genMedialS]),
    TH: dedupeSentences(thWordSentences.medial),
    SH: dedupeSentences(shWordSentences.medial),
  },
  final: {
    R: dedupeSentences([...rWordSentences.final, ...genFinalR]),
    S: dedupeSentences([...sWordSentences.final, ...genFinalS]),
    TH: dedupeSentences(thWordSentences.final),
    SH: dedupeSentences(shWordSentences.final),
  },
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
  sugarEntries: [],
  focusSessions: [],
  fitnessLog: [],
  rewards: [],
  dukeProgress: { physical: 0, volunteering: 0, skill: 0 },
  memoryNotes: { family: "Everything I do is for them.", moments: "", future: "" },
  reactionAttempts: [],
  gameBests: { sprint: 0, stopClock: null, numberRush: null, target: 0, simon: 0, math: 0 },
  goalDone: {},
  aboutMe: {},
  deletedIds: [],
  rPractice: { completed: {}, sets: {} },
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
  // Connection state only. The access token is deliberately never persisted —
  // see src/google-calendar.mjs.
  googleConnected: false,
  googleEmail: "",
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
// Import (v2) of Aran's schedule from his four-month calendar PDF (July 20 - September 3, 2026):
// [date, title, start (24h), end (24h), category, location]. Multi-day events get one all-day entry per day.
const calendarImport = [
  ["2026-07-20","YMCA Personal Training Academy","11:00","15:00","YMCA","YMCA"],
  ["2026-07-20","Track and Field","18:00","19:30","Track & Field","Bill Crothers Secondary School (44 Main St Unionville)"],
  ["2026-07-21","YMCA Personal Training Academy","11:00","15:00","YMCA","YMCA"],
  ["2026-07-22","YMCA Personal Training Academy","11:00","15:00","YMCA","YMCA"],
  ["2026-07-23","YMCA Personal Training Academy","11:00","15:00","YMCA","YMCA"],
  ["2026-07-23","Workout","19:00","20:00","Track & Field","YMCA"],
  ["2026-07-24","2026 Ontario U14, U16, U18 Outdoor Track and Field Championship","","","Track & Field","St. Catharines, Ontario"],
  ["2026-07-24","Track and Field","18:00","19:30","Track & Field","Bill Crothers Secondary School (44 Main St Unionville)"],
  ["2026-07-25","2026 Ontario U14, U16, U18 Outdoor Track and Field Championship","","","Track & Field","St. Catharines, Ontario"],
  ["2026-07-25","Work Out Training Track","08:00","09:30","Track & Field",""],
  ["2026-07-25","Track: U16 100m Heats","12:15","13:15","Track & Field",""],
  ["2026-07-25","Track: U16 100m Final (if qualified)","15:30","16:30","Track & Field",""],
  ["2026-07-26","2026 Ontario U14, U16, U18 Outdoor Track and Field Championship","","","Track & Field","St. Catharines, Ontario"],
  ["2026-07-26","Track: U16 200m Timed Final","14:50","15:50","Track & Field",""],
  ["2026-07-27","Track and Field","18:00","19:30","Track & Field","Bill Crothers Secondary School (44 Main St Unionville)"],
  ["2026-07-30","Workout","19:00","20:00","Track & Field","YMCA"],
  ["2026-07-31","Camping","","","Personal",""],
  ["2026-07-31","Track and Field","18:00","19:30","Track & Field","Bill Crothers Secondary School (44 Main St Unionville)"],
  ["2026-08-01","Camping","","","Personal",""],
  ["2026-08-01","Work Out Training Track","08:00","09:30","Track & Field",""],
  ["2026-08-02","Camping","","","Personal",""],
  ["2026-08-03","Track and Field","18:00","19:30","Track & Field","Bill Crothers Secondary School (44 Main St Unionville)"],
  ["2026-08-04","Bronze Medallion","09:00","16:00","Personal",""],
  ["2026-08-05","Bronze Medallion","09:00","16:00","Personal",""],
  ["2026-08-06","Bronze Medallion","09:00","16:00","Personal",""],
  ["2026-08-06","Workout","19:00","20:00","Track & Field","YMCA"],
  ["2026-08-07","Track and Field","18:00","19:30","Track & Field","Bill Crothers Secondary School (44 Main St Unionville)"],
  ["2026-08-08","Work Out Training Track","08:00","09:30","Track & Field",""],
  ["2026-08-10","Track and Field","18:00","19:30","Track & Field","Bill Crothers Secondary School (44 Main St Unionville)"],
  ["2026-08-13","Workout","19:00","20:00","Track & Field","YMCA"],
  ["2026-08-14","Track and Field","18:00","19:30","Track & Field","Bill Crothers Secondary School (44 Main St Unionville)"],
  ["2026-08-15","Work Out Training Track","08:00","09:30","Track & Field",""],
  ["2026-08-17","Track and Field","18:00","19:30","Track & Field","Bill Crothers Secondary School (44 Main St Unionville)"],
  ["2026-08-17","Basketball for Cadets","20:00","22:00","Personal","Bill Hogarth Secondary School (100 Donald Sim Ave)"],
  ["2026-08-20","Workout","19:00","20:00","Track & Field","YMCA"],
  ["2026-08-21","Track and Field","18:00","19:30","Track & Field","Bill Crothers Secondary School (44 Main St Unionville)"],
  ["2026-08-22","Work Out Training Track","08:00","09:30","Track & Field",""],
  ["2026-08-24","Track and Field","18:00","19:30","Track & Field","Bill Crothers Secondary School (44 Main St Unionville)"],
  ["2026-08-26","Camerons Birthday","","","Personal",""],
  ["2026-08-27","Workout","19:00","20:00","Track & Field","YMCA"],
  ["2026-08-28","Track and Field","18:00","19:30","Track & Field","Bill Crothers Secondary School (44 Main St Unionville)"],
  ["2026-08-29","Work Out Training Track","08:00","09:30","Track & Field",""],
  ["2026-08-31","Track and Field","18:00","19:30","Track & Field","Bill Crothers Secondary School (44 Main St Unionville)"],
  ["2026-09-03","Workout","19:00","20:00","Track & Field","YMCA"],
];
const CALENDAR_IMPORT_VERSION = 2;

let settings = normalizeSettings(loadJson(SETTINGS_KEY, defaultSettings));
let state = importCalendarEvents(importSleepLog(normalizeState(loadJson(STORE_KEY, defaultState))));
let cloudSyncInFlight = null;
let cloudSyncAgain = false;
let cloudRefreshTimer = null;
let reaction = { mode: "idle", goAt: 0, timeoutId: null };
let memoryGame = null;
let pendingSleepId = "";
let coachCursor = null;
let sprintGame = { active: false, count: 0, timeoutId: null };
let stopClock = { running: false, startAt: 0, rafId: null };
let numberRush = { order: [], next: 1, startAt: 0, active: false };
let targetGame = { active: false, score: 0, lit: -1, intervalId: null, timeoutId: null };
let simonGame = { sequence: [], inputIndex: 0, playing: false, awaitingInput: false };
let mathGame = { active: false, score: 0, answer: 0, timeoutId: null, intervalId: null, secondsLeft: 0 };
// One cursor, not three. The framework and storytelling technique are derived
// from whichever topic is showing, so they cannot drift away from it.
let speakCursor = null;
// Set when the user types their own topic; cleared when they draw a new round.
let speakCustomTopic = null;
let rGroup = "initial";
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
  renderAbout();
  indexCards(document.querySelector(".view.active"));
  const view = new URLSearchParams(location.search).get("view");
  if (["home", "calendar", "sleep", "sugar", "speak", "me", "arcade"].includes(view)) setView(view);
  scheduleMidnightRollover();
  // A phone that was asleep at midnight fires the timer late, or not until the
  // tab is looked at again; re-check the date whenever the app becomes visible.
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      handleDateRollover();
      scheduleMidnightRollover();
    }
  });
  void initializeCloud();
  void initGoogleCalendar();
});

function bindElements() {
  [
    "greeting", "homeTitle", "currentDateText", "quoteText", "nextQuoteButton", "coachText", "coachButton", "coachDots", "coachBadge", "heroCoins",
    "doneTodayStat", "openTasksStat", "streakStat", "coinsStat", "trackWeekStat", "pushupsWeekStat", "addTrackSessionButton",
    "addPushupsButton", "upcomingTodayList", "workoutList", "goalsList", "goalsProgress",
    "speakTopicKind", "speakTopicText", "speakTopicSource", "speakFrameworkName", "speakFrameworkWhen", "speakFrameworkSteps",
    "speakFrameworkDefinition", "speakFrameworkExample", "speakTopicForm", "speakTopicInput", "speakPurposeInput",
    "speakTechniqueName", "speakTechniqueDefinition", "speakTechniqueExample",
    "speakReflectionText", "newTopicButton",
    "rTabs", "rList", "rPracticeCount", "rProgressFill", "rNextSet",
    "heroRingFill", "heroProgressPercent",
    "simonStart", "simonGrid", "simonStatus", "simonBest", "mathStart", "mathQuestion", "mathAnswers", "mathStatus", "mathBest",
    "sprintPad", "sprintStatus", "sprintBest", "stopClockPad", "stopClockStatus", "stopClockBest",
    "numberRushStart", "numberRushGrid", "numberRushStatus", "numberRushBest",
    "targetStart", "targetGrid", "targetStatus", "targetBest",
    "monthLabel", "todayButton", "calendarGrid", "monthCalendar",
    "weekGrid", "calendarViewToggle", "agendaTitle", "agendaList", "addSleepButton", "sleepGoalInput",
    "lastNightDate", "lastBedtime", "lastWake", "lastDuration", "lastMood",
    "averageSleepStat", "sleepScoreStat", "sleepHint", "sleepChart", "sleepList",
    "sugarForm", "sugarNameInput", "sugarGramsInput", "sugarAddButton", "sugarList",
    "sugarNameError", "sugarGramsError",
    "sugarTotal", "sugarStatus", "sugarLimitLabel", "sugarProgressFill", "sugarOverFlag",
    "sugarChart", "sugarHistoryHint", "sugarHistoryList", "sugarLogCard", "sugarAverageStat", "sugarOverStat",
    "arcadeCoins", "arcadeCoinBreakdown", "arcadeBoost", "arcadeBoostButton", "reactionStartButton", "reactionPad", "reactionBest",
    "reactionHistory", "memoryStartButton", "memoryStatus", "memoryGrid", "goalReminderInput", "composeDialog", "composeForm",
    "composeTitle", "editingItemIdInput", "toggleAdvancedButton", "advancedFields", "itemTitleInput", "itemKindInput",
    "itemDateInput", "itemCategoryInput", "itemPriorityInput", "itemNotesInput", "itemStartTimeInput", "itemEndTimeInput",
    "itemRepeatInput", "repeatDays", "sleepDialog", "sleepForm", "sleepDateInput", "sleptAtInput", "wokeAtInput",
    "sleepError", "sleepMoodDialog", "settingsDialog", "settingsForm",
    "brandHomeButton", "sidebarSubtitle", "syncButton", "syncStatus", "syncBanner", "syncBannerText", "displayNameInput",
    "plannerSubtitleInput", "focusGoalInput", "pushupGoalInput", "trackGoalInput", "supabaseUrlInput", "supabaseAnonInput",
    "ownerKeyInput", "copyPairingLinkButton", "calendarUrlInput", "darkModeInput", "resetDataButton", "clearImportedButton", "openSettingsButton",
    "gcalMark", "gcalStatus", "gcalNote", "gcalConnectButton", "gcalRefreshButton", "gcalDisconnectButton",
    "icalUrlInput", "icalSaveButton", "icalRefreshButton", "icalServerNote",
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
  els.addTrackSessionButton?.addEventListener("click", () => logFitness({ track_session: true }));
  els.addPushupsButton?.addEventListener("click", () => logFitness({ pushups: 10 }));
  els.workoutList?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-workout-add]");
    if (!button) return;
    logFitness({ [button.dataset.workoutAdd]: Number(button.dataset.workoutStep) });
  });
  els.simonStart?.addEventListener("click", startSimon);
  els.simonGrid?.addEventListener("click", (event) => {
    const pad = event.target.closest("[data-simon]");
    if (pad) tapSimon(Number(pad.dataset.simon));
  });
  els.mathStart?.addEventListener("click", startMathSprint);
  els.mathAnswers?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-math-answer]");
    if (button) answerMath(Number(button.dataset.mathAnswer));
  });
  els.goalsList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-goal]");
    if (!button) return;
    const id = button.dataset.goal;
    if (state.goalDone[id]) delete state.goalDone[id];
    else state.goalDone[id] = true;
    persist();
    renderGoals();
    void upsertAppState();
  });
  els.newTopicButton?.addEventListener("click", newPracticeRound);
  els.speakTopicForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    useCustomTopic();
  });
  els.rTabs?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-r-group]");
    if (button) setRGroup(button.dataset.rGroup);
  });
  els.rList?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-r-id]");
    if (button) toggleRSentence(button.dataset.rId);
  });
  els.rNextSet?.addEventListener("click", nextRSet);
  els.sugarForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    addSugarFromForm();
  });
  // An error clears as soon as the field is plausible again, so the red state
  // never outlives the mistake.
  els.sugarNameInput?.addEventListener("input", () => {
    if (els.sugarNameInput.value.trim()) setSugarFieldError(els.sugarNameInput, els.sugarNameError, false);
  });
  els.sugarGramsInput?.addEventListener("input", () => {
    const raw = els.sugarGramsInput.value.trim();
    const grams = Number(raw);
    if (raw !== "" && Number.isFinite(grams) && grams >= 0 && grams <= 500) {
      setSugarFieldError(els.sugarGramsInput, els.sugarGramsError, false);
    }
  });
  const sugarRangeToggle = document.getElementById("sugarRangeToggle");
  sugarRangeToggle?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-sugar-range]");
    if (!button) return;
    sugarRangeToggle.querySelectorAll("button").forEach((item) => item.classList.toggle("active", item === button));
    renderSugarHistory();
  });
  document.querySelectorAll("[data-about]").forEach((field) => field.addEventListener("input", () => {
    state.aboutMe[field.dataset.about] = field.value;
    persist();
    void upsertAppState();
  }));
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
    renderSleep();
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
  els.copyPairingLinkButton?.addEventListener("click", () => void copyPairingLink());
  els.settingsForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveSettings();
  });
  els.resetDataButton.addEventListener("click", resetAllData);
  els.clearImportedButton?.addEventListener("click", clearImportedSchedule);
  // The settings dialog had no way in at all after the nav button was removed,
  // which stranded the owner key, Supabase config and iCal URL.
  els.openSettingsButton?.addEventListener("click", () => {
    hydrateSettingsForm();
    els.settingsDialog.showModal();
  });
  els.gcalConnectButton?.addEventListener("click", () => void syncGoogleCalendar({ interactive: true }));
  els.gcalRefreshButton?.addEventListener("click", () => void syncGoogleCalendar());
  els.gcalDisconnectButton?.addEventListener("click", disconnectGoogle);
  els.icalSaveButton?.addEventListener("click", saveIcalUrl);
  els.icalRefreshButton?.addEventListener("click", () => void refreshIcalFeed());
  els.icalUrlInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") { event.preventDefault(); saveIcalUrl(); }
  });

  // Refresh when the user comes back to the tab, so switching from the Google
  // Calendar app back to Life Flow shows the change straight away.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;
    if (canSync()) void syncAll({ includeCalendar: false });
    if (!settings.googleConnected) return;
    if (Date.now() - gcalLastSync < 60_000) return;
    void syncGoogleCalendar();
  });

  window.addEventListener("online", () => {
    if (canSync()) void syncAll({ includeCalendar: false });
  });
  cloudRefreshTimer = window.setInterval(() => {
    if (document.visibilityState === "visible" && canSync()) void syncAll({ includeCalendar: false });
  }, CLOUD_REFRESH_MS);

  // Escape closes dialogs natively; make the backdrop click do the same.
  [els.composeDialog, els.sleepDialog, els.settingsDialog].forEach((dialog) => {
    dialog?.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
  });
}

function render() {
  renderHome();
  renderStats();
  renderUpcomingToday();
  renderCoach();
  renderWorkout();
  renderGoals();
  renderSpeak();
  renderMemoryNotes();
  renderCalendar();
  renderSleep();
  renderSugar();
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
    // Use the same photo as the website icon.
    const favicon = document.getElementById("dynamicFavicon");
    const touchIcon = document.getElementById("dynamicTouchIcon");
    if (favicon) favicon.href = settings.avatarUrl;
    if (touchIcon) touchIcon.href = settings.avatarUrl;
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
  if (els.doneTodayStat) els.doneTodayStat.textContent = String(stats.doneToday);
  if (els.openTasksStat) els.openTasksStat.textContent = String(stats.openTasks);
  if (els.streakStat) els.streakStat.textContent = stats.streakDays ? `${stats.streakDays}d` : "\u2014";
  if (els.coinsStat) els.coinsStat.textContent = String(stats.coins);
  if (els.heroCoins) els.heroCoins.textContent = String(stats.coins);
  if (els.trackWeekStat) els.trackWeekStat.textContent = `${fitness.trackSessions} / ${settings.trackGoal}`;
  if (els.pushupsWeekStat) els.pushupsWeekStat.textContent = `${fitness.pushups} / ${settings.pushupGoal}`;
  renderDailyProgress();
}

function renderDailyProgress() {
  // Today's plan = the day's calendar events plus any dated tasks. It used to
  // count only `daily_task` items, but nothing in the UI creates those since
  // the Tasks page was removed, so the ring sat at 0% forever.
  const key = todayKey();
  const todaysEvents = eventsForDate(state.items, key);
  const todaysTasks = state.items.filter((item) => item.kind === "daily_task" && item.due_date === key);
  const done = todaysEvents.filter((event) => (event.completed_dates || []).includes(key)).length
    + todaysTasks.filter((item) => item.completed).length;
  const total = todaysEvents.length + todaysTasks.length;
  const percent = total ? Math.round((done / total) * 100) : 0;
  if (els.heroProgressPercent) els.heroProgressPercent.textContent = `${percent}%`;
  if (els.heroRingFill) {
    const circumference = 2 * Math.PI * 31;
    els.heroRingFill.style.strokeDasharray = String(circumference);
    els.heroRingFill.style.strokeDashoffset = String(circumference * (1 - percent / 100));
    els.heroRingFill.classList.toggle("is-complete", total > 0 && done === total);
  }

}

/**
 * Ripple + check pop when something is marked done.
 * Uses the Web Animations API rather than a CSS class so the element can be
 * re-rendered underneath us without leaving a stuck animation behind.
 */
function celebrateDone(trigger) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  trigger.animate(
    [
      { transform: "scale(1)" },
      { transform: "scale(1.35)", offset: 0.35 },
      { transform: "scale(1)" },
    ],
    { duration: 420, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
  );
  const ripple = document.createElement("span");
  ripple.className = "done-ripple";
  trigger.appendChild(ripple);
  ripple.animate(
    [
      { transform: "scale(0.2)", opacity: 0.7 },
      { transform: "scale(2.4)", opacity: 0 },
    ],
    { duration: 520, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
  ).finished.finally(() => ripple.remove());
}

/**
 * Drop the schedule that was transcribed into the source from Aran's calendar
 * PDF. Once Google is connected those rows are redundant duplicates.
 */
function clearImportedSchedule() {
  const imported = state.items.filter((item) => item.kind === "calendar_event" && item.source === "import");
  if (!imported.length) {
    window.alert("There are no pre-loaded events left to remove.");
    return;
  }
  if (!window.confirm(`Remove ${imported.length} pre-loaded event${imported.length === 1 ? "" : "s"}? Events from Google and ones you added yourself are kept.`)) return;
  state.deletedIds = [...new Set([...state.deletedIds, ...imported.map((item) => item.id)])].slice(-300);
  state.items = state.items.filter((item) => !(item.kind === "calendar_event" && item.source === "import"));
  persist();
  render();
  void Promise.all(imported.map((item) => deleteSupabaseItem(item.id).catch(() => {})));
  void upsertAppState();
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

function renderGoals() {
  if (!els.goalsList) return;
  let total = 0;
  let done = 0;
  els.goalsList.innerHTML = goalGroups.map((group) => {
    const groupDone = group.goals.filter((_, i) => state.goalDone[`${group.key}-${i}`]).length;
    total += group.goals.length;
    done += groupDone;
    const items = group.goals.map((text, i) => {
      const id = `${group.key}-${i}`;
      const checked = Boolean(state.goalDone[id]);
      return `<button class="goal-item ${checked ? "done" : ""}" type="button" data-goal="${id}"><span class="goal-check"></span><span class="goal-text">${escapeHtml(text)}</span></button>`;
    }).join("");
    return `<div class="goal-group" style="--accent:${group.accent}">
      <div class="goal-group-head"><span class="goal-group-icon"><i data-lucide="${group.icon}"></i></span><b>${group.title}</b><small>${groupDone}/${group.goals.length}</small></div>
      <div class="goal-items">${items}</div></div>`;
  }).join("");
  if (els.goalsProgress) els.goalsProgress.textContent = `${done} / ${total} done`;
  refreshIcons();
}

function hydratePurposeOptions() {
  if (!els.speakPurposeInput || els.speakPurposeInput.options.length) return;
  els.speakPurposeInput.innerHTML = Object.entries(PURPOSES)
    .map(([value, label]) => `<option value="${value}">${escapeHtml(label)}</option>`).join("");
}

// The topic showing right now: whatever the user typed, else the library entry
// the single cursor points at.
function currentSpeakTopic() {
  if (speakCustomTopic) return speakCustomTopic;
  if (speakCursor === null) speakCursor = dailyIndex(speakTopics.length);
  return speakTopics[speakCursor % speakTopics.length];
}

function renderSpeak() {
  if (!els.speakTopicText) return;
  hydratePurposeOptions();
  // resolveRound derives the framework and technique from the topic itself, so
  // the mismatch that made this section useless is now impossible by construction.
  const round = resolveRound(currentSpeakTopic());
  if (!round?.framework || !round?.technique) return;
  const { topic, framework, technique } = round;

  // For a typed topic the chip names the purpose the user chose; the source chip
  // beside it is what says the topic is theirs.
  const isCustom = topic.kind === "custom";
  els.speakTopicKind.textContent = isCustom
    ? (PURPOSE_LABELS[topic.purpose] || "Your topic")
    : (speakKindLabels[topic.kind] || "Topic");
  els.speakTopicKind.dataset.kind = isCustom ? (PURPOSE_KIND[topic.purpose] || "debate") : topic.kind;
  els.speakTopicText.textContent = topic.text;
  if (els.speakTopicSource) {
    els.speakTopicSource.textContent = isCustom ? "Your topic" : "From the library";
  }

  els.speakFrameworkName.textContent = framework.name;
  els.speakFrameworkDefinition.textContent = framework.definition;
  els.speakFrameworkWhen.textContent = framework.whenToUse;
  els.speakFrameworkSteps.innerHTML = framework.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("");
  els.speakFrameworkExample.querySelector("p").textContent = framework.example;

  els.speakTechniqueName.textContent = technique.name;
  els.speakTechniqueDefinition.textContent = technique.definition;
  els.speakReflectionText.textContent = technique.prompt;
  els.speakTechniqueExample.querySelector("p").textContent = technique.example;

  renderRWords();
  refreshIcons();
}

function replaySpeakCards() {
  const cards = document.querySelectorAll("#speakView .speak-topic-card, #speakView .speak-framework-card, #speakView .speak-reflection-card");
  cards.forEach((card) => { card.classList.remove("round-in"); void card.offsetWidth; card.classList.add("round-in"); });
}

function pickDifferent(current, length) {
  if (length <= 1) return current;
  let next = current;
  while (next === current) next = Math.floor(Math.random() * length);
  return next;
}

// Only the topic is redrawn. Everything else follows from it.
function newPracticeRound() {
  speakCustomTopic = null;
  speakCursor = pickDifferent(speakCursor ?? 0, speakTopics.length);
  if (els.speakTopicInput) els.speakTopicInput.value = "";
  replaySpeakCards();
  renderSpeak();
}

function useCustomTopic() {
  const text = els.speakTopicInput?.value.trim();
  if (!text) return;
  speakCustomTopic = { kind: "custom", text, purpose: els.speakPurposeInput?.value || "reflect" };
  replaySpeakCards();
  renderSpeak();
}

function daysSinceKey(dateKey) {
  const then = new Date(`${dateKey}T00:00:00`);
  const now = new Date(`${todayKey()}T00:00:00`);
  return Math.round((now - then) / 86400000);
}

// A sentence is hidden while it is inside its 7-day cooldown window.
function isSentenceOnCooldown(id) {
  const completedOn = state.rPractice.completed[id];
  if (!completedOn) return false;
  return daysSinceKey(completedOn) < R_COOLDOWN_DAYS;
}

// Drop cooldown entries once seven days have passed so the words become available
// again (and storage stays tidy).
function purgeExpiredCooldowns() {
  const completed = state.rPractice.completed;
  let changed = false;
  for (const id of Object.keys(completed)) {
    if (daysSinceKey(completed[id]) >= R_COOLDOWN_DAYS) { delete completed[id]; changed = true; }
  }
  if (changed) persist();
}

function sentenceById(id) {
  const separator = id.lastIndexOf("-");
  const prefix = id.slice(0, separator);
  const index = Number(id.slice(separator + 1));
  const dash = prefix.indexOf("-");
  const group = prefix.slice(0, dash);
  const sound = prefix.slice(dash + 1);
  const text = articulationPools[group]?.[sound]?.[index] || "";
  return { text, sound };
}

function interleaveSentences(first, second) {
  const out = [];
  const max = Math.max(first.length, second.length);
  for (let i = 0; i < max; i += 1) {
    if (first[i]) out.push(first[i]);
    if (second[i]) out.push(second[i]);
  }
  return out;
}

// Build a fresh practice set for a position: 4 R, 4 S, 1 TH and 1 SH (R_SET_MIX),
// skipping anything on cooldown. R and S alternate as they always have, then the
// single TH and SH slot in at spread-out positions so they never land side by side.
function buildRSet(group) {
  const pools = articulationPools[group] || {};
  const eligibleFor = (sound) => shuffle((pools[sound] || [])
    .map((text, index) => ({ id: `${group}-${sound}-${index}`, text, sound }))
    .filter((sentence) => !isSentenceOnCooldown(sentence.id)));
  const eligible = Object.fromEntries(Object.keys(R_SET_MIX).map((sound) => [sound, eligibleFor(sound)]));
  const picked = Object.fromEntries(Object.entries(R_SET_MIX).map(([sound, count]) => [sound, eligible[sound].slice(0, count)]));

  let combined = interleaveSentences(picked.R, picked.S);
  // Spread the two singles through the R/S run rather than tacking them on the end.
  [...picked.TH, ...picked.SH].forEach((sentence, slot) => {
    combined.splice(Math.min(3 + slot * 4, combined.length), 0, sentence);
  });
  if (combined.length < R_SET_SIZE) {
    // A sound whose pool is thinned by cooldown gives its slots back to the others
    // so a set is always full rather than short.
    const used = new Set(combined.map((sentence) => sentence.id));
    const extras = Object.keys(R_SET_MIX).flatMap((sound) => eligible[sound]).filter((sentence) => !used.has(sentence.id));
    combined = combined.concat(extras.slice(0, R_SET_SIZE - combined.length));
  }
  return combined.map((sentence) => sentence.id);
}

function renderRWords() {
  if (!els.rList) return;
  purgeExpiredCooldowns();
  let active = state.rPractice.sets[rGroup];
  if (!active || active.date !== todayKey() || !Array.isArray(active.ids) || !active.ids.length) {
    active = { date: todayKey(), ids: buildRSet(rGroup) };
    state.rPractice.sets[rGroup] = active;
    persist();
  }
  const completed = state.rPractice.completed;
  const batch = active.ids.map((id) => ({ id, ...sentenceById(id) })).filter((sentence) => sentence.text);
  els.rTabs.querySelectorAll("[data-r-group]").forEach((button) => button.classList.toggle("active", button.dataset.rGroup === rGroup));
  if (!batch.length) {
    els.rList.innerHTML = `<p class="r-empty">Every sentence here is still resting. Fresh words unlock over the next few days.</p>`;
    els.rPracticeCount.textContent = "0 of 0 practiced";
    if (els.rProgressFill) els.rProgressFill.style.width = "0%";
    return;
  }
  els.rList.innerHTML = batch.map((sentence) => `<button type="button" class="r-sentence ${completed[sentence.id] ? "done" : ""}" data-r-id="${sentence.id}"><span class="r-check" aria-hidden="true"></span><span class="r-sound-tag r-sound-${sentence.sound.toLowerCase()}">${sentence.sound}</span><span class="r-text">${escapeHtml(sentence.text)}</span></button>`).join("");
  const doneCount = batch.filter((sentence) => completed[sentence.id]).length;
  els.rPracticeCount.textContent = `${doneCount} of ${batch.length} practiced`;
  if (els.rProgressFill) els.rProgressFill.style.width = `${batch.length ? Math.round((doneCount / batch.length) * 100) : 0}%`;
}

function toggleRSentence(id) {
  const completed = state.rPractice.completed;
  if (completed[id]) delete completed[id];
  else completed[id] = todayKey();
  persist();
  renderRWords();
  void upsertAppState();
}

function setRGroup(group) {
  if (!articulationPools[group]) return;
  rGroup = group;
  renderRWords();
}

function nextRSet() {
  state.rPractice.sets[rGroup] = { date: todayKey(), ids: buildRSet(rGroup) };
  persist();
  renderRWords();
  void upsertAppState();
}

function renderAbout() {
  document.querySelectorAll("[data-about]").forEach((field) => {
    const value = state.aboutMe[field.dataset.about] || "";
    if (field.value !== value) field.value = value;
  });
}

function renderMemoryNotes() {
  document.querySelectorAll("[data-memory-note]").forEach((input) => {
    input.value = state.memoryNotes[input.dataset.memoryNote] || "";
  });
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
  els.calendarViewToggle.querySelectorAll("button").forEach((button) =>
    button.setAttribute("aria-selected", String(button.dataset.calendarView === state.calendarView)));
  els.monthCalendar.hidden = state.calendarView !== "month";
  els.weekGrid.hidden = state.calendarView !== "week";
  if (state.calendarView === "month") renderMonth(cursor);
  else renderWeek();
  renderAgenda();
  renderGcalCard();
}

function renderMonth(cursor) {
  els.calendarGrid.innerHTML = buildMonthDays(cursor.getFullYear(), cursor.getMonth()).map((day, index) => {
    const events = eventsForDate(state.items, day.key);
    const dots = events.slice(0, 3).map((event) => `<i style="background:${colorFor(event.category)}"></i>`).join("");
    const label = `${new Date(`${day.key}T00:00:00`).toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" })}, ${events.length} event${events.length === 1 ? "" : "s"}`;
    return `<button class="calendar-day ${!day.isCurrentMonth ? "outside" : ""} ${day.key === todayKey() ? "today" : ""} ${day.key === state.selectedDate ? "selected" : ""}" data-date="${day.key}" type="button" role="gridcell" aria-label="${label}" aria-selected="${day.key === state.selectedDate}" style="--row:${Math.floor(index / 7)}"><span>${day.dayNumber}</span><b class="dots">${dots}</b></button>`;
  }).join("");
  els.calendarGrid.querySelectorAll("[data-date]").forEach((button) => button.addEventListener("click", () => selectDate(button.dataset.date)));
  applySlide(els.calendarGrid);
}

// Replay the directional slide once, then clear it so an unrelated re-render
// (a Google sync landing, say) does not animate the grid again.
let calendarSlide = "";
function applySlide(container) {
  if (!container || !calendarSlide) return;
  container.classList.remove("slide-next", "slide-prev");
  void container.offsetWidth;
  container.classList.add(calendarSlide);
  calendarSlide = "";
}

function renderWeek() {
  const start = startOfWeek(state.selectedDate);
  const days = Array.from({ length: 7 }, (_, index) => addDays(start, index));
  const weekCount = days.reduce((sum, date) => sum + eventsForDate(state.items, date).length, 0);
  els.weekGrid.innerHTML = `<div class="week-head">${days.map((date) => `<button data-date="${date}" class="${date === todayKey() ? "today" : ""}">${new Date(`${date}T00:00:00`).toLocaleDateString("en", { weekday: "short", day: "numeric" })}</button>`).join("")}</div>
    <div class="week-columns">${days.map((date) => `<div>${eventsForDate(state.items, date).map((event) => `<article class="week-event" style="--accent:${colorFor(event.category)}"><small>${formatEventTime(event)}</small>${escapeHtml(event.title)}</article>`).join("") || '<span class="week-empty"></span>'}</div>`).join("")}</div>
    <p class="week-range">${weekCount} event${weekCount === 1 ? "" : "s"} this week</p>`;
  els.weekGrid.querySelectorAll("[data-date]").forEach((button) => button.addEventListener("click", () => selectDate(button.dataset.date)));
  applySlide(els.weekGrid);
}

function renderAgenda() {
  const events = eventsForDate(state.items, state.selectedDate).sort(sortByTime);
  const selected = new Date(`${state.selectedDate}T00:00:00`);
  els.agendaTitle.textContent = state.selectedDate === todayKey() ? `Today - ${prettyDate(state.selectedDate)}` : formatDisplayDate(selected);
  els.agendaList.innerHTML = events.length ? events.map((event, index) => {
    const done = (event.completed_dates || []).includes(state.selectedDate);
    const fromGoogle = event.source === "google";
    // Location gets its own line with a pin so it reads the way Google shows it.
    const location = event.location ? `<span class="agenda-location"><i data-lucide="map-pin"></i>${escapeHtml(event.location)}</span>` : "";
    const description = descriptionOf(event);
    return `<article class="agenda-item ${done ? "completed" : ""}" style="--accent:${colorFor(event.category)};--i:${index}">
      <div class="agenda-body">
        <strong>${escapeHtml(event.title)}</strong>
        <span class="agenda-meta">${formatEventTime(event)} &middot; ${escapeHtml(event.google_calendar_name || event.category)}${fromGoogle ? '<em class="agenda-src">Google</em>' : ""}</span>
        ${location}
        ${description ? `<p>${escapeHtml(description)}</p>` : ""}
      </div>
      <button class="icon-button agenda-done" data-done-event="${event.id}" title="${done ? "Mark not done" : "Mark done"}" aria-label="${done ? "Mark not done" : "Mark done"}: ${escapeHtml(event.title)}" aria-pressed="${done}"><i data-lucide="check"></i></button>
      <button class="icon-button agenda-delete" data-delete-event="${event.id}" title="Delete" aria-label="Delete ${escapeHtml(event.title)}"><i data-lucide="trash-2"></i></button>
    </article>`;
  }).join("") : '<article class="empty-inline">Nothing scheduled for this day.</article>';
  els.agendaList.querySelectorAll("[data-done-event]").forEach((button) => button.addEventListener("click", () => toggleEventDone(button.dataset.doneEvent, state.selectedDate)));
  els.agendaList.querySelectorAll("[data-delete-event]").forEach((button) => button.addEventListener("click", () => deleteItem(button.dataset.deleteEvent)));
  refreshIcons();
}

// Notes hold "location\ndescription"; the location is rendered separately, so
// strip it here to avoid printing the same string twice.
function descriptionOf(event) {
  const notes = String(event.notes || "");
  if (!event.location) return notes;
  return notes.startsWith(event.location) ? notes.slice(event.location.length).trim() : notes;
}

function selectDate(date) {
  state.selectedDate = date;
  state.monthCursor = `${date.slice(0, 7)}-01`;
  persist();
  renderCalendar();
}

function renderSleep() {
  const goalMinutes = settings.sleepGoalHours * 60;
  const sleepRangeToggle = document.getElementById("sleepRangeToggle");
  const selectedRangeButton = sleepRangeToggle?.querySelector(".active");
  const rangeType = selectedRangeButton?.dataset.sleepRange || "days";
  const summary = getSleepSummary(state.sleepEntries, goalMinutes, rangeType);
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
    refreshIcons();
    return;
  }
  renderSleepGraph(summary.points, goalMinutes);
  els.sleepList.innerHTML = sorted.map((entry) => {
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
  if (els.simonBest) els.simonBest.textContent = best.simon ? String(best.simon) : "—";
  if (els.mathBest) els.mathBest.textContent = best.math ? String(best.math) : "—";
  if (!sprintGame.active) { els.sprintPad.className = "reaction-pad"; els.sprintPad.textContent = "Tap to start"; }
  if (!stopClock.running) { els.stopClockPad.className = "reaction-pad"; els.stopClockPad.textContent = "Start clock"; }
  if (!numberRush.active) els.numberRushGrid.innerHTML = "";
  if (!targetGame.active) els.targetGrid.innerHTML = "";
}

/* ---- Simon Says (pattern memory) ---- */
function startSimon() {
  simonGame = { sequence: [Math.floor(Math.random() * 4)], inputIndex: 0, playing: false, awaitingInput: false };
  els.simonStatus.textContent = "Watch the pattern...";
  playSimonSequence();
}
async function playSimonSequence() {
  simonGame.playing = true;
  simonGame.awaitingInput = false;
  els.simonGrid.classList.add("locked");
  await new Promise((resolve) => setTimeout(resolve, 450));
  for (const pad of simonGame.sequence) {
    flashSimonPad(pad);
    await new Promise((resolve) => setTimeout(resolve, 560));
  }
  simonGame.playing = false;
  simonGame.awaitingInput = true;
  simonGame.inputIndex = 0;
  els.simonGrid.classList.remove("locked");
  els.simonStatus.textContent = `Your turn — repeat ${simonGame.sequence.length} ${simonGame.sequence.length === 1 ? "tap" : "taps"}.`;
}
function flashSimonPad(index) {
  const pad = els.simonGrid.querySelector(`[data-simon="${index}"]`);
  if (!pad) return;
  pad.classList.add("lit");
  window.setTimeout(() => pad.classList.remove("lit"), 340);
}
function tapSimon(index) {
  if (!simonGame.awaitingInput || simonGame.playing) return;
  flashSimonPad(index);
  if (index !== simonGame.sequence[simonGame.inputIndex]) {
    const streak = simonGame.sequence.length - 1;
    simonGame.awaitingInput = false;
    els.simonStatus.textContent = `Wrong pad! You reached a streak of ${streak}.`;
    state.gameBests.simon = Math.max(Number(state.gameBests.simon || 0), streak);
    els.simonBest.textContent = state.gameBests.simon ? String(state.gameBests.simon) : "—";
    persist();
    void upsertAppState();
    return;
  }
  simonGame.inputIndex += 1;
  if (simonGame.inputIndex < simonGame.sequence.length) return;
  const streak = simonGame.sequence.length;
  state.gameBests.simon = Math.max(Number(state.gameBests.simon || 0), streak);
  els.simonBest.textContent = String(state.gameBests.simon);
  els.simonStatus.textContent = `Streak ${streak}! Next round...`;
  simonGame.sequence.push(Math.floor(Math.random() * 4));
  persist();
  void upsertAppState();
  window.setTimeout(playSimonSequence, 750);
}

/* ---- Math Sprint (30s quick arithmetic) ---- */
function startMathSprint() {
  if (mathGame.timeoutId) clearTimeout(mathGame.timeoutId);
  if (mathGame.intervalId) clearInterval(mathGame.intervalId);
  mathGame = { active: true, score: 0, answer: 0, timeoutId: null, intervalId: null, secondsLeft: 30 };
  els.mathStatus.textContent = "Score: 0 · 30s left";
  mathGame.intervalId = window.setInterval(() => {
    mathGame.secondsLeft -= 1;
    if (mathGame.secondsLeft > 0) els.mathStatus.textContent = `Score: ${mathGame.score} · ${mathGame.secondsLeft}s left`;
  }, 1000);
  mathGame.timeoutId = window.setTimeout(endMathSprint, 30000);
  nextMathQuestion();
}
function nextMathQuestion() {
  const kind = Math.floor(Math.random() * 3);
  let a;
  let b;
  let text;
  if (kind === 0) { a = 7 + Math.floor(Math.random() * 43); b = 6 + Math.floor(Math.random() * 38); mathGame.answer = a + b; text = `${a} + ${b}`; }
  else if (kind === 1) { a = 25 + Math.floor(Math.random() * 60); b = 4 + Math.floor(Math.random() * 21); mathGame.answer = a - b; text = `${a} − ${b}`; }
  else { a = 3 + Math.floor(Math.random() * 10); b = 3 + Math.floor(Math.random() * 9); mathGame.answer = a * b; text = `${a} × ${b}`; }
  els.mathQuestion.textContent = `${text} = ?`;
  const options = new Set([mathGame.answer]);
  while (options.size < 4) {
    const offset = Math.ceil(Math.random() * 9) * (Math.random() < 0.5 ? -1 : 1);
    if (mathGame.answer + offset > 0) options.add(mathGame.answer + offset);
  }
  els.mathAnswers.innerHTML = shuffle([...options]).map((value) => `<button type="button" class="math-answer" data-math-answer="${value}">${value}</button>`).join("");
}
function answerMath(value) {
  if (!mathGame.active) return;
  if (value === mathGame.answer) {
    mathGame.score += 1;
    els.mathStatus.textContent = `Score: ${mathGame.score} · ${mathGame.secondsLeft}s left`;
    nextMathQuestion();
  } else {
    els.mathQuestion.classList.add("shake");
    window.setTimeout(() => els.mathQuestion.classList.remove("shake"), 350);
  }
}
function endMathSprint() {
  mathGame.active = false;
  if (mathGame.intervalId) clearInterval(mathGame.intervalId);
  els.mathQuestion.textContent = `Time! Final score: ${mathGame.score}`;
  els.mathAnswers.innerHTML = "";
  state.gameBests.math = Math.max(Number(state.gameBests.math || 0), mathGame.score);
  els.mathStatus.textContent = `You solved ${mathGame.score} in 30 seconds.`;
  els.mathBest.textContent = state.gameBests.math ? String(state.gameBests.math) : "—";
  persist();
  void upsertAppState();
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

function toggleEventDone(id, date) {
  const event = state.items.find((item) => item.id === id);
  if (!event) return;
  const completing = !(event.completed_dates || []).includes(date);
  const completed = new Set(event.completed_dates || []);
  if (completed.has(date)) completed.delete(date);
  else completed.add(date);
  event.completed_dates = [...completed];
  persist();
  render();
  // Celebrate *after* the re-render: render() replaces the agenda markup, so
  // animating the button that was clicked would throw the animation away with it.
  if (completing) {
    const button = els.agendaList.querySelector(`[data-done-event="${CSS.escape(id)}"]`);
    if (button) celebrateDone(button);
  }
  void upsertSupabase("life_flow_items", event);
}

function deleteItem(id) {
  const target = state.items.find((item) => item.id === id);
  if (target && !window.confirm(`Delete "${target.title}"?`)) return;
  if (target?.source === "google") {
    // Deleting locally would just come back on the next sync, so be honest.
    window.alert("This event comes from Google Calendar. Delete it in Google and refresh to remove it here.");
    return;
  }
  state.items = state.items.filter((item) => item.id !== id);
  // Tombstone the id so other devices drop it too instead of re-uploading it.
  state.deletedIds = [...new Set([...state.deletedIds, id])].slice(-300);
  persist();
  render();
  void deleteSupabaseItem(id);
  void upsertAppState();
}

function moveCalendar(direction) {
  calendarSlide = direction > 0 ? "slide-next" : "slide-prev";
  if (state.calendarView === "week") {
    // Move week-by-week relative to the currently shown week.
    state.selectedDate = addDays(startOfWeek(state.selectedDate), direction * 7);
    state.monthCursor = `${state.selectedDate.slice(0, 7)}-01`;
  } else {
    // Build the target month from its first day: setMonth() on a 29th-31st
    // overflows into the month after (Jan 31 + 1 month = Mar 3).
    const base = new Date(`${state.monthCursor}T00:00:00`);
    const target = new Date(base.getFullYear(), base.getMonth() + direction, 1);
    state.monthCursor = formatDateKey(target);
    // Keep the day-of-month where it still exists, else clamp to the last day.
    const previousDay = Number(state.selectedDate.slice(8, 10));
    const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
    target.setDate(Math.min(previousDay, lastDay));
    state.selectedDate = formatDateKey(target);
  }
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
    source: "manual", created_at: new Date().toISOString(),
  };
  state.sleepEntries = [entry, ...state.sleepEntries.filter((item) => item.sleep_date !== entry.sleep_date)];
  pendingSleepId = entry.id;
  persist();
  els.sleepDialog.close();
  render();
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

// ---------- Sugar ----------
// "Today" is always derived from todayKey() rather than stored, so the daily
// reset is a consequence of the date changing, not a job that has to run. The
// only thing a rollover needs is a re-render — see scheduleMidnightRollover.
function sugarRangeType() {
  return document.getElementById("sugarRangeToggle")?.querySelector(".active")?.dataset.sugarRange || "days";
}

function renderSugar() {
  if (!els.sugarList) return;
  const today = todayKey();
  const progress = getSugarProgress(sumSugarForDate(state.sugarEntries, today), SUGAR_DAILY_LIMIT_GRAMS);

  els.sugarLimitLabel.textContent = `Daily limit: ${progress.limit}g`;
  els.sugarTotal.textContent = `${progress.grams}g`;
  els.sugarStatus.textContent = progress.over
    ? `${progress.percent}% of your daily limit`
    : `${progress.percent}% of your daily limit · ${progress.remaining}g left`;
  els.sugarProgressFill.style.width = `${progress.fillPercent}%`;
  // Three visual tiers off the same number: teal on track, amber closing in,
  // red over. Purely presentational — the limit and the maths are unchanged.
  const track = els.sugarProgressFill.parentElement;
  track.classList.toggle("over", progress.over);
  track.classList.toggle("near", !progress.over && progress.percent >= 80);
  els.sugarOverFlag.hidden = !progress.over;
  els.sugarOverFlag.textContent = progress.over ? `${progress.overBy}g over limit` : "";

  const todayEntries = sugarEntriesForDate(state.sugarEntries, today);
  els.sugarList.innerHTML = todayEntries.length
    ? todayEntries.map((entry) => `<article class="sugar-row" data-sugar-row="${entry.id}"><div><strong>${escapeHtml(entry.item_name)}</strong><span>${formatTime(entry.created_at)}</span></div><b>${Number(entry.grams)}g</b><button class="icon-button sugar-row-remove" data-delete-sugar="${entry.id}" aria-label="Remove ${escapeHtml(entry.item_name)}" title="Remove"><i data-lucide="trash-2"></i></button></article>`).join("")
    : '<article class="empty-state compact"><strong>Nothing logged today</strong><p>Add an item above to start tracking.</p></article>';
  els.sugarList.querySelectorAll("[data-delete-sugar]").forEach((button) => {
    button.addEventListener("click", () => removeSugarRow(button.dataset.deleteSugar));
  });
  // Only the row added by this submit animates in; a re-render for any other
  // reason must not replay the whole list.
  if (pendingSugarRowId) {
    els.sugarList.querySelector(`[data-sugar-row="${pendingSugarRowId}"]`)?.classList.add("is-entering");
    pendingSugarRowId = null;
  }

  renderSugarHistory();
  refreshIcons();
}

function renderSugarHistory() {
  const rangeType = sugarRangeType();
  const summary = summarizeSugar(state.sugarEntries, rangeType, SUGAR_DAILY_LIMIT_GRAMS);
  els.sugarHistoryHint.textContent = summary.daysTracked ? `${summary.daysTracked} days tracked` : "";
  els.sugarAverageStat.textContent = summary.daysTracked ? `${summary.averageGrams}g` : "—";
  els.sugarOverStat.textContent = summary.daysTracked ? String(summary.daysOverLimit) : "—";

  if (!summary.points.length) {
    els.sugarChart.innerHTML = '<article class="empty-state compact"><strong>No history yet</strong><p>Days you log will show up here as a trend.</p></article>';
    els.sugarHistoryList.innerHTML = "";
    if (els.sugarLogCard) els.sugarLogCard.hidden = true;
    return;
  }
  els.sugarChart.innerHTML = `
    <div class="sugar-bars" style="--limit-ratio:${(summary.limitHeight / 100).toFixed(3)}">
      <span class="sugar-gridlines" aria-hidden="true"></span>
      <span class="sugar-limit-line" aria-hidden="true"><b>${summary.limit}g</b></span>
      ${summary.points.map((point) => `<div class="sugar-bar ${point.over ? "over" : point.percent >= 80 ? "near" : ""}" title="${prettyDate(point.date)}: ${point.label}"><span class="sugar-bar-slot"><i style="height:${Math.max(2, point.height)}%"><em>${point.label}</em></i></span><small>${new Date(`${point.date}T00:00:00`).toLocaleDateString("en", { day: "numeric" })}</small></div>`).join("")}
    </div>`;

  els.sugarHistoryList.innerHTML = [...summary.points].reverse().map((point) => `<article class="sugar-history-row ${point.over ? "over" : point.percent >= 80 ? "near" : ""}"><div><strong>${prettyDate(point.date)}</strong><span>${point.percent}% of limit</span></div><b>${point.label}</b></article>`).join("");
  if (els.sugarLogCard) els.sugarLogCard.hidden = false;
}

// The form carries `novalidate`, so the browser's grey "Please fill out this
// field" bubble never appears. These two helpers are the replacement: the field
// itself carries the state, and the message sits under it.
function setSugarFieldError(input, message, show) {
  if (!input || !message) return;
  input.classList.toggle("has-error", show);
  input.setAttribute("aria-invalid", show ? "true" : "false");
  message.hidden = !show;
  if (!show) return;
  // Restart the nudge even if the field was already marked, so a second failed
  // submit still reads as a rejection rather than a no-op.
  input.classList.remove("shake");
  void input.offsetWidth;
  input.classList.add("shake");
}

function clearSugarFieldErrors() {
  setSugarFieldError(els.sugarNameInput, els.sugarNameError, false);
  setSugarFieldError(els.sugarGramsInput, els.sugarGramsError, false);
}

let pendingSugarRowId = null;

function addSugarFromForm() {
  const name = els.sugarNameInput.value.trim();
  const raw = els.sugarGramsInput.value.trim();
  const grams = Number(raw);
  const nameBad = !name;
  const gramsBad = raw === "" || !Number.isFinite(grams) || grams < 0 || grams > 500;
  setSugarFieldError(els.sugarNameInput, els.sugarNameError, nameBad);
  setSugarFieldError(els.sugarGramsInput, els.sugarGramsError, gramsBad);
  if (nameBad || gramsBad) {
    (nameBad ? els.sugarNameInput : els.sugarGramsInput).focus();
    return;
  }
  const entry = {
    id: crypto.randomUUID(),
    owner_key: settings.ownerKey,
    entry_date: todayKey(),
    item_name: name,
    grams: Math.round(grams * 10) / 10,
    created_at: new Date().toISOString(),
  };
  state.sugarEntries = [entry, ...state.sugarEntries];
  persist();
  els.sugarForm.reset();
  clearSugarFieldErrors();
  els.sugarNameInput.focus();
  pendingSugarRowId = entry.id;
  renderSugar();
  void upsertSupabase("life_flow_sugar_entries", entry);
}

// Let the row collapse before the list re-renders, so a delete reads as the item
// leaving rather than the list jumping. The delete itself is not conditional on
// the animation: if the frame never lands, the timeout still fires.
function removeSugarRow(id) {
  const row = els.sugarList?.querySelector(`[data-sugar-row="${id}"]`);
  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (!row || reduced) {
    deleteSugarEntry(id);
    return;
  }
  row.classList.add("is-leaving");
  row.querySelector("[data-delete-sugar]")?.setAttribute("disabled", "");
  setTimeout(() => deleteSugarEntry(id), 220);
}

function deleteSugarEntry(id) {
  state.sugarEntries = state.sugarEntries.filter((entry) => entry.id !== id);
  persist();
  renderSugar();
  if (canSync()) void supabaseFetch(`life_flow_sugar_entries?id=eq.${id}`, { method: "DELETE" }).catch(() => {});
}

// The app is a PWA that stays open for days on a phone. Without this, a tab left
// open overnight would keep showing yesterday's sugar total against today's date.
let midnightTimer = null;
function scheduleMidnightRollover() {
  if (midnightTimer) clearTimeout(midnightTimer);
  const now = new Date();
  const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 2, 0);
  // setTimeout caps at ~24.8 days, and a sleeping device can fire late; either way
  // the guard below re-checks the real date rather than trusting the timer.
  midnightTimer = setTimeout(() => {
    handleDateRollover();
    scheduleMidnightRollover();
  }, Math.max(1000, nextMidnight.getTime() - now.getTime()));
}

let lastRenderedDay = todayKey();
function handleDateRollover() {
  const today = todayKey();
  if (today === lastRenderedDay) return;
  lastRenderedDay = today;
  state.selectedDate = today;
  state.monthCursor = `${today.slice(0, 7)}-01`;
  persist();
  render();
}

function completeDailyBoost() {
  if (state.rewards.some((reward) => reward.type === "daily_boost" && reward.date === todayKey())) return;
  const card = els.arcadeBoostButton?.closest(".arcade-card");
  state.rewards.unshift({ id: crypto.randomUUID(), type: "daily_boost", amount: 20, date: todayKey() });
  persist();
  render();
  celebrateBoost(card);
  void upsertAppState();
}

// A short pop on the card plus a burst of sparks from the button. Worth the
// extra code only because completing the boost is the one deliberately
// rewarding action on the page.
function celebrateBoost(card) {
  if (!card || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  card.classList.remove("boost-pop");
  void card.offsetWidth;
  card.classList.add("boost-pop");
  card.addEventListener("animationend", () => card.classList.remove("boost-pop"), { once: true });

  const button = card.querySelector("#arcadeBoostButton");
  if (!button) return;
  const origin = button.getBoundingClientRect();
  const host = card.getBoundingClientRect();
  const colors = ["#00e5c3", "#4ff5dc", "#ff9738", "#ebbd45"];
  for (let i = 0; i < 14; i += 1) {
    const spark = document.createElement("span");
    spark.className = "boost-spark";
    spark.style.background = colors[i % colors.length];
    spark.style.left = `${origin.left - host.left + origin.width / 2}px`;
    spark.style.top = `${origin.top - host.top + origin.height / 2}px`;
    card.appendChild(spark);
    const angle = (Math.PI * 2 * i) / 14 + Math.random() * 0.4;
    const distance = 46 + Math.random() * 44;
    spark.animate(
      [
        { transform: "translate(-50%, -50%) scale(1)", opacity: 1 },
        {
          transform: `translate(calc(-50% + ${Math.cos(angle) * distance}px), calc(-50% + ${Math.sin(angle) * distance}px)) scale(0.3)`,
          opacity: 0,
        },
      ],
      { duration: 620 + Math.random() * 220, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
    ).finished.finally(() => spark.remove());
  }
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
  // Pull first so a newly entered shared owner key immediately shows that
  // device group's tasks, then push local-only work up (mergeById dedupes).
  void syncAll();
}

function applySettings() {
  document.body.classList.toggle("dark-mode", settings.darkMode);
  els.sidebarSubtitle.textContent = settings.plannerSubtitle;
}

function resetAllData() {
  if (!window.confirm("Are you sure? This will clear all tasks, sleep logs, sugar logs, focus sessions, and calendar events.")) return;
  localStorage.removeItem(STORE_KEY);
  state = normalizeState(defaultState);
  persist();
  els.settingsDialog.close();
  render();
}

async function syncAll({ includeCalendar = true } = {}) {
  if (!canSync()) return;
  if (cloudSyncInFlight) {
    cloudSyncAgain = true;
    return cloudSyncInFlight;
  }
  cloudSyncInFlight = (async () => {
    do {
      cloudSyncAgain = false;
      const loaded = await syncFromSupabase();
      if (!loaded) return;
      if (includeCalendar) await importCalendar();
      await syncToSupabase();
    } while (cloudSyncAgain);
  })();
  try {
    await cloudSyncInFlight;
  } finally {
    cloudSyncInFlight = null;
  }
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
    const [items, focus, sleep, sugar, cloudState] = await Promise.all([
      supabaseFetch("life_flow_items?select=*&order=created_at.desc"),
      supabaseFetch("life_flow_focus_sessions?select=*&order=completed_at.desc"),
      supabaseFetch("life_flow_sleep_entries?select=*&order=sleep_date.desc"),
      // A project that has not run the sugar migration yet must not break the
      // rest of the pull, so this one table is allowed to come back empty.
      supabaseFetch("life_flow_sugar_entries?select=*&order=created_at.desc").catch(() => []),
      supabaseFetch("life_flow_app_state?select=*"),
    ]);
    if (cloudState?.[0]) {
      const saved = cloudState[0];
      state.fitnessLog = saved.fitness_log || state.fitnessLog;
      state.dukeProgress = { ...state.dukeProgress, ...(saved.duke_progress || {}) };
      state.rewards = saved.rewards || state.rewards;
      state.memoryNotes = { ...state.memoryNotes, ...(saved.memory_notes || {}) };
      state.reactionAttempts = saved.reaction_attempts || state.reactionAttempts;
      state.goalReminder = saved.goal_reminder || state.goalReminder;
      const { appData, ...prefs } = saved.preferences || {};
      if (appData) {
        state.goalDone = { ...(appData.goalDone || {}), ...state.goalDone };
        state.aboutMe = { ...(appData.aboutMe || {}), ...state.aboutMe };
        state.gameBests = { ...state.gameBests, ...(appData.gameBests || {}) };
        state.deletedIds = [...new Set([...(appData.deletedIds || []), ...state.deletedIds])].slice(-300);
        // normalizeRPractice migrates the legacy {date, done[]} shape into the
        // cooldown log; merging through it keeps local progress intact.
        if (appData.rPractice) {
          const incoming = normalizeRPractice(appData.rPractice);
          state.rPractice = {
            completed: { ...incoming.completed, ...state.rPractice.completed },
            sets: { ...incoming.sets, ...state.rPractice.sets },
          };
        }
      }
      settings = normalizeSettings({ ...settings, ...prefs });
      hydrateSettingsForm();
      applySettings();
      renderAbout();
    }
    const deleted = new Set(state.deletedIds);
    state.items = seedRecurring(mergeById(state.items, items || []).filter((item) => !deleted.has(item.id)));
    state.focusSessions = mergeById(state.focusSessions, focus || []);
    state.sleepEntries = mergeById(state.sleepEntries, sleep || []);
    state.sugarEntries = mergeById(state.sugarEntries, sugar || []);
    persist();
    render();
    setSyncStatus("Synced with Supabase");
    return true;
  } catch (error) {
    setSyncStatus(`Loading paused: ${error.message}`);
    return false;
  }
}

async function syncToSupabase() {
  if (!canSync()) return;
  try {
    const deleted = new Set(state.deletedIds);
    if (state.deletedIds.length) {
      // Clear tombstoned rows server-side so other devices stop seeing them.
      await supabaseFetch(`life_flow_items?id=in.(${state.deletedIds.join(",")})`, { method: "DELETE" }).catch(() => {});
    }
    for (const item of state.items.filter((entry) => !deleted.has(entry.id))) await upsertItemSafely(item);
    for (const session of state.focusSessions) {
      const sessionWithMeta = { ...session, source: session.source || "manual" };
      await upsertSupabase("life_flow_focus_sessions", sessionWithMeta);
    }
    for (const entry of state.sleepEntries) await upsertSupabase("life_flow_sleep_entries", entry, "owner_key,sleep_date");
    // Keyed by id, not by date: a day holds many items, unlike sleep.
    for (const entry of state.sugarEntries) await upsertSupabase("life_flow_sugar_entries", entry);
    await upsertAppState();
    setSyncStatus("Synced with Supabase");
  } catch (error) {
    setSyncStatus(`Saving paused: ${error.message}`);
  }
}

// True when the deployment has CALENDAR_ICAL_URL set, meaning the app can pull
// the feed without the URL ever being handed to the browser.
let icalServerConfigured = false;
let icalServerLabel = "";
let icalLastSync = 0;

async function loadIcalConfig() {
  try {
    const response = await fetch("/api/calendar-config", { headers: { Accept: "application/json" } });
    if (!response.ok) return;
    const data = await response.json();
    icalServerConfigured = Boolean(data.configured);
    icalServerLabel = data.label || "";
  } catch {
    icalServerConfigured = false;
  }
}

/**
 * Pull the iCal feed. Uses the server-side CALENDAR_ICAL_URL when one is
 * configured, otherwise the URL saved in Settings.
 * @returns {Promise<{ok: boolean, count?: number, error?: string}>}
 */
async function importCalendar({ silent = true } = {}) {
  if (!settings.calendarUrl && !icalServerConfigured) return { ok: false, error: "No calendar URL set" };
  try {
    // Omitting `url` lets the Function supply the secret from its environment.
    const endpoint = settings.calendarUrl
      ? `/api/calendar?url=${encodeURIComponent(settings.calendarUrl)}`
      : "/api/calendar";
    const response = await fetch(endpoint, { cache: "no-store" });
    if (!response.ok) {
      // Surface the Function's actual explanation (404 = wrong address form,
      // 422 = not a calendar) instead of a generic "skipped".
      throw new Error((await response.text().catch(() => "")) || `Calendar feed error ${response.status}`);
    }
    const imported = parseIcsEvents(await response.text()).map((event) => ({
      ...event, id: stableUuid(`${settings.ownerKey}:${event.id}`), owner_key: settings.ownerKey,
    }));
    // Replace the whole ICS set rather than merging, so events deleted upstream
    // disappear here too instead of lingering forever.
    state.items = [...state.items.filter((item) => item.source !== "ics"), ...imported];
    icalLastSync = Date.now();
    persist();
    render();
    // Push to Supabase in the background. The events are already on screen and
    // saved locally, so making the user wait on the upload just to see "synced"
    // adds latency for no benefit — and a slow cloud write shouldn't look like
    // a slow calendar.
    if (canSync()) {
      void Promise.all(imported.map((event) => upsertSupabase("life_flow_items", event).catch(() => {})));
    }
    return { ok: true, count: imported.length };
  } catch (error) {
    if (!silent) setGcalNote(error.message, "warn");
    setSyncStatus("Calendar import skipped");
    return { ok: false, error: error.message };
  }
}

async function refreshIcalFeed() {
  setGcalNote("Fetching calendar feed…");
  renderGcalCard();
  const result = await importCalendar({ silent: false });
  if (result.ok) {
    setGcalNote(
      result.count
        ? `Synced ${result.count} event${result.count === 1 ? "" : "s"} from the calendar feed.`
        : "Feed reached, but it contains no events.",
      "ok",
    );
  }
  renderGcalCard();
}

/* ============================================================
   GOOGLE CALENDAR
   ============================================================ */

let gcalBusy = false;
let gcalLastSync = 0;
let gcalTimerId = null;
// Whether this deployment has GOOGLE_OAUTH_CLIENT_ID set. Null until checked.
let googleConfigured = null;

function setGcalNote(text, tone = "") {
  if (!els.gcalNote) return;
  els.gcalNote.hidden = !text;
  els.gcalNote.textContent = text || "";
  els.gcalNote.dataset.tone = tone;
}

function renderGcalCard() {
  if (!els.gcalStatus) return;
  const connected = gcal.isConnected();
  const count = state.items.filter((item) => item.source === "google").length;

  els.gcalMark.dataset.state = connected ? "on" : "off";
  els.gcalConnectButton.hidden = connected;
  els.gcalRefreshButton.hidden = !connected;
  els.gcalDisconnectButton.hidden = !connected;
  els.gcalRefreshButton.disabled = gcalBusy;
  els.gcalConnectButton.disabled = gcalBusy || googleConfigured === false;
  els.gcalRefreshButton.classList.toggle("is-spinning", gcalBusy);

  // The feed path is independent of OAuth: show its refresh whenever a feed is
  // available, from Settings or from the server-side CALENDAR_ICAL_URL.
  const feedAvailable = Boolean(settings.calendarUrl || icalServerConfigured);
  if (els.icalRefreshButton) els.icalRefreshButton.hidden = connected || !feedAvailable;
  if (els.icalUrlInput && document.activeElement !== els.icalUrlInput) {
    els.icalUrlInput.value = settings.calendarUrl || "";
  }
  if (els.icalServerNote) {
    els.icalServerNote.hidden = !icalServerConfigured;
    els.icalServerNote.textContent = icalServerConfigured
      ? `A feed is already configured on the server (${icalServerLabel}). Leave the box empty to keep using it.`
      : "";
  }

  if (gcalBusy) {
    els.gcalStatus.textContent = "Syncing with Google…";
  } else if (connected) {
    const when = gcalLastSync
      ? new Date(gcalLastSync).toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" })
      : "just now";
    const who = settings.googleEmail ? `${settings.googleEmail} · ` : "";
    els.gcalStatus.textContent = `${who}${count} event${count === 1 ? "" : "s"} synced · updated ${when}`;
  } else if (settings.calendarUrl || icalServerConfigured) {
    const feedCount = state.items.filter((item) => item.source === "ics").length;
    const when = icalLastSync
      ? ` · updated ${new Date(icalLastSync).toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" })}`
      : "";
    els.gcalStatus.textContent = feedCount
      ? `Calendar feed · ${feedCount} event${feedCount === 1 ? "" : "s"}${when}`
      : "Calendar feed set. Tap Refresh feed to pull events.";
  } else {
    els.gcalStatus.textContent = "Not connected — showing saved events only.";
  }
  refreshIcons();
}

/**
 * Pull from Google and make its events the source of truth.
 *
 * Every `source: "google"` item is replaced wholesale on each sync. That is
 * what makes edits and deletions in Google propagate here: an event that no
 * longer comes back simply stops existing locally, with no tombstone bookkeeping.
 */
async function syncGoogleCalendar({ interactive = false } = {}) {
  if (gcalBusy) return;
  gcalBusy = true;
  renderGcalCard();
  try {
    if (interactive) {
      const email = await gcal.connect();
      settings.googleConnected = true;
      settings.googleEmail = email || "";
      saveJson(SETTINGS_KEY, settings);
    } else {
      await gcal.reconnectSilently();
    }

    const events = await gcal.fetchEvents();
    const withOwner = events.map((event) => ({ ...event, owner_key: settings.ownerKey }));
    state.items = [...state.items.filter((item) => item.source !== "google"), ...withOwner];
    gcalLastSync = Date.now();
    settings.googleConnected = true;
    saveJson(SETTINGS_KEY, settings);
    persist();
    render();
    setGcalNote(
      events.length
        ? `Synced ${events.length} event${events.length === 1 ? "" : "s"} from Google Calendar.`
        : "Connected — no events found in the next 12 months.",
      "ok",
    );
    scheduleGcalRefresh();
  } catch (error) {
    if (error?.needsConsent) {
      // A silent refresh legitimately fails when there is no live Google
      // session; only nag the user if they asked for this explicitly.
      settings.googleConnected = false;
      saveJson(SETTINGS_KEY, settings);
      if (interactive) setGcalNote(error.message, "warn");
      else setGcalNote("");
    } else {
      setGcalNote(error?.message || "Could not reach Google Calendar.", "warn");
    }
  } finally {
    gcalBusy = false;
    renderGcalCard();
  }
}

function disconnectGoogle() {
  gcal.disconnect();
  settings.googleConnected = false;
  settings.googleEmail = "";
  saveJson(SETTINGS_KEY, settings);
  state.items = state.items.filter((item) => item.source !== "google");
  if (gcalTimerId) { clearTimeout(gcalTimerId); gcalTimerId = null; }
  persist();
  render();
  setGcalNote("Disconnected. Google events removed from this device.", "ok");
}

// Keep the calendar fresh without polling a hidden tab.
function scheduleGcalRefresh() {
  if (gcalTimerId) clearTimeout(gcalTimerId);
  gcalTimerId = window.setTimeout(() => {
    if (document.visibilityState === "visible" && settings.googleConnected) void syncGoogleCalendar();
    else scheduleGcalRefresh();
  }, 5 * 60 * 1000);
}

/**
 * Validate and store a pasted iCal URL, then pull it immediately.
 *
 * The check is deliberately specific: the overwhelmingly common mistake is
 * grabbing the "public address" (.../public/basic.ics) for a calendar that is
 * not shared publicly, which Google answers with a 404 and no explanation.
 */
function saveIcalUrl() {
  const raw = els.icalUrlInput.value.trim();
  if (!raw) {
    settings.calendarUrl = "";
    saveJson(SETTINGS_KEY, settings);
    state.items = state.items.filter((item) => item.source !== "ics");
    persist();
    render();
    setGcalNote("Calendar feed cleared.", "ok");
    return;
  }

  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    setGcalNote("That doesn't look like a URL. Paste the whole link, starting with https://", "warn");
    return;
  }
  if (parsed.protocol !== "https:") {
    setGcalNote("The calendar link must start with https://", "warn");
    return;
  }
  if (!/\.ics$/i.test(parsed.pathname)) {
    setGcalNote("That link doesn't end in .ics — copy the iCal format address, not the calendar's web page.", "warn");
    return;
  }
  if (parsed.pathname.includes("/public/")) {
    setGcalNote(
      "That's the public address, which only works if your calendar is shared with the whole internet. Copy the Secret address instead — it contains \"private-\".",
      "warn",
    );
    return;
  }

  settings.calendarUrl = raw;
  saveJson(SETTINGS_KEY, settings);
  void refreshIcalFeed();
}

async function initGoogleCalendar() {
  if (!els.gcalStatus) return;
  await loadIcalConfig();
  // A feed configured either way should populate the calendar on load.
  if (settings.calendarUrl || icalServerConfigured) void importCalendar();
  googleConfigured = await gcal.isConfigured();
  if (!googleConfigured) {
    els.gcalConnectButton.title = "Needs GOOGLE_OAUTH_CLIENT_ID on the deployment";
    // Only nag about OAuth when there is no working feed already.
    if (!settings.calendarUrl && !icalServerConfigured) {
      setGcalNote(
        "Google sign-in isn't set up on this deployment. Either add GOOGLE_OAUTH_CLIENT_ID in Cloudflare Pages, or use a calendar feed link below.",
        "info",
      );
    }
    renderGcalCard();
    return;
  }
  renderGcalCard();
  // Resume a previous connection without showing a popup.
  if (settings.googleConnected) await syncGoogleCalendar();
}

// PostgREST reports an unknown column as PGRST204 and names it in the message.
const UNKNOWN_COLUMN = /Could not find the '([^']+)' column/i;

async function upsertSupabase(table, row, onConflict = "id") {
  if (!canSync()) return;
  const send = (body) => supabaseFetch(`${table}?on_conflict=${encodeURIComponent(onConflict)}`, {
    method: "POST", headers: { Prefer: "resolution=merge-duplicates" }, body: JSON.stringify(body),
  });

  let payload = { ...row, owner_key: settings.ownerKey };
  // A single column the deployed schema has not caught up with used to abort
  // the whole sync ("Saving paused: Could not find the 'source' column…").
  // Drop what the server does not know about and retry instead, so one missing
  // column can never strand every other field.
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      return await send(payload);
    } catch (error) {
      const missing = UNKNOWN_COLUMN.exec(String(error.message))?.[1];
      if (!missing || !(missing in payload)) throw error;
      const { [missing]: _dropped, ...rest } = payload;
      payload = rest;
      console.warn(`Supabase: "${table}" has no "${missing}" column on this project; syncing without it.`);
    }
  }
  return send(payload);
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
      appData: {
        goalDone: state.goalDone,
        aboutMe: state.aboutMe,
        gameBests: state.gameBests,
        deletedIds: state.deletedIds,
        rPractice: state.rPractice,
      },
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

// Index each panel's direct children so CSS can stagger their entrance.
function indexCards(panel) {
  if (!panel) return;
  [...panel.children].forEach((child, index) => child.style.setProperty("--card-index", String(index)));
}

function setView(view) {
  const change = () => {
    document.querySelectorAll(".nav-item").forEach((button) => {
      const selected = button.dataset.view === view;
      button.classList.toggle("active", selected);
      button.setAttribute("aria-selected", String(selected));
    });
    document.querySelectorAll(".view").forEach((panel) => panel.classList.toggle("active", panel.id === `${view}View`));
    const active = document.getElementById(`${view}View`);
    indexCards(active);
    refreshIcons();
    // Scroll position is per-app, not per-panel; land at the top of the new tab.
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
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
    sugarEntries: Array.isArray(saved.sugarEntries) ? saved.sugarEntries : [],
    focusSessions: Array.isArray(saved.focusSessions) ? saved.focusSessions : [],
    fitnessLog: Array.isArray(saved.fitnessLog) ? saved.fitnessLog : [],
    rewards: Array.isArray(saved.rewards) ? saved.rewards : [],
    reactionAttempts: Array.isArray(saved.reactionAttempts) ? saved.reactionAttempts : [],
    gameBests: { ...defaultState.gameBests, ...(saved.gameBests || {}) },
    goalDone: { ...(saved.goalDone || {}) },
    aboutMe: { ...(saved.aboutMe || {}) },
    deletedIds: Array.isArray(saved.deletedIds) ? saved.deletedIds : [],
    rPractice: normalizeRPractice(saved.rPractice),
  };
  return merged;
}

function normalizeRPractice(saved) {
  const base = { completed: {}, sets: {} };
  if (!saved || typeof saved !== "object") return base;
  if (saved.completed && typeof saved.completed === "object") base.completed = { ...saved.completed };
  if (saved.sets && typeof saved.sets === "object") base.sets = { ...saved.sets };
  // Migrate the old shape ({ date, done: [ids] }) into the cooldown log.
  if (Array.isArray(saved.done) && saved.date) {
    for (const id of saved.done) if (!base.completed[id]) base.completed[id] = saved.date;
  }
  return base;
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
  if (target.calendarImportVersion === CALENDAR_IMPORT_VERSION) return target;
  const additions = calendarImport
    .map(([date, title, start, end, category, location]) => ({
      // Stable ids so every synced device generates the same rows instead of duplicates.
      id: stableUuid(`${settings.ownerKey}:cal-v${CALENDAR_IMPORT_VERSION}:${date}|${title}|${start}`), owner_key: settings.ownerKey, kind: "calendar_event",
      title, category, priority: "medium", due_date: date,
      start_time: start, end_time: end, repeat_pattern: "none", repeat_days: [],
      notes: location || "", completed: false, completed_dates: [], subtasks: [],
      scheduled_at: start ? `${date}T${start}:00` : null,
      duration_minutes: durationBetween(start, end) || 30,
      color: colorFor(category), source: "import", created_at: new Date().toISOString(),
    }));
  // The schedule was corrected from Aran's calendar PDF, so tombstone every other
  // calendar event (synced devices drop them too) and keep only the new list.
  const keep = new Set(additions.map((item) => item.id));
  const outdated = (target.items || []).filter((item) => item.kind === "calendar_event" && !keep.has(item.id));
  target.deletedIds = [...new Set([...(target.deletedIds || []), ...outdated.map((item) => item.id)])].slice(-300);
  target.items = [...additions, ...(target.items || []).filter((item) => item.kind !== "calendar_event")];
  target.calendarImportVersion = CALENDAR_IMPORT_VERSION;
  target.calendarImported = true;
  saveJson(STORE_KEY, target);
  return target;
}

function normalizeSettings(saved) {
  const result = { ...defaultSettings, ...saved };
  const pairingKey = consumePairingKey();
  if (pairingKey) result.ownerKey = pairingKey;
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

function sortByTime(a, b) {
  return String(a.start_time || "99:99").localeCompare(String(b.start_time || "99:99"));
}

function formatEventTime(event) {
  if (!event.start_time) return "All day";
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

async function copyPairingLink() {
  if (!settings.ownerKey) {
    setSyncStatus("Save settings first to create a pairing link.");
    return;
  }
  const url = new URL(window.location.href);
  url.hash = `sync=${encodeURIComponent(settings.ownerKey)}`;
  try {
    await navigator.clipboard.writeText(url.toString());
    setSyncStatus("Pairing link copied. Open it on your other devices.");
  } catch {
    setSyncStatus("Copy failed. Your browser blocked clipboard access; copy the private sync key instead.");
  }
}

function consumePairingKey() {
  if (typeof window === "undefined" || !window.location.hash.startsWith("#sync=")) return "";
  let key = "";
  try {
    key = decodeURIComponent(window.location.hash.slice("#sync=".length)).trim();
  } catch {
    return "";
  }
  if (key.length < 8 || key.length > 200) return "";
  window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
  return key;
}

function refreshIcons() {
  createIcons();
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
