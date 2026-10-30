import {
  calculateSleepMinutes,
  calculateSugarStreak,
  calculateSleepScore,
  eventsForDate,
  formatDateKey,
  formatDisplayDate,
  formatSleepDuration,
  getGreeting,
  getSleepSummary,
  getSugarProgress,
  parseFinancePath,
  SUGAR_DAILY_LIMIT_GRAMS,
  sleepTimestampsForWakeDate,
  sugarStreakMessage,
  sugarEntriesForDate,
  summarizeSugar,
  sumSugarForDate,
  todayKey,
} from "./planner-utils.mjs";
import {
  communicationSecrets,
  FRAMEWORK_MODES,
  frameworkById,
  frameworkModeById,
  PURPOSE_KIND,
  PURPOSE_LABELS,
  PURPOSES,
  resolveRound,
  sensoryMapping,
  speakKindLabels,
  speakTopics,
} from "./speak-library.mjs";
import { createIcons } from "./icons.mjs";
import { isLawsPath, LAW_AREAS, lawForDate, LAWS } from "./laws-library.mjs";
import { DEFAULT_MOTIVATION_VIDEOS, parseYouTubeLink } from "./motivation.mjs";

const STORE_KEY = "aran-life-flow-state";
const SETTINGS_KEY = "aran-life-flow-settings";
const CLOUD_REFRESH_MS = 60_000;
const SPEAK_PRACTICE_BUCKET = "speak-practice";
const legacySharedIds = new Set(["0b7c7939-4a28-4d4e-8e96-b4d3a78ff101", "f47ba22f-b0db-4d3d-853d-a3091caaaf20"]);
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

const defaultState = {
  items: [],
  sleepEntries: [],
  sugarEntries: [],
  sugarStreak: { current_streak: 0, longest_streak: 0, last_updated_date: "", limit_grams: SUGAR_DAILY_LIMIT_GRAMS },
  speakPracticeSessions: [],
  focusSessions: [],
  fitnessLog: [],
  rewards: [],
  dukeProgress: { physical: 0, volunteering: 0, skill: 0 },
  memoryNotes: { family: "Everything I do is for them.", moments: "", future: "" },
  goalDone: {},
  aboutMe: {},
  financeNotes: {},
  motivationVideos: DEFAULT_MOTIVATION_VIDEOS.map((video) => ({ ...video })),
  motivationVideosUpdatedAt: 0,
  deletedIds: [],
  rPractice: { completed: {}, sets: {} },
  goalReminder: "Train hard. Give back. Build something.",
};
const defaultSettings = {
  ownerKey: "",
  displayName: "Aran",
  plannerSubtitle: "Grade 9 \u00b7 Athlete \u00b7 Builder",
  sleepGoalHours: 8.5,
  focusGoal: 4,
  pushupGoal: 60,
  trackGoal: 3,
  darkMode: true,
};
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

let settings = normalizeSettings(loadJson(SETTINGS_KEY, defaultSettings));
// The Supabase URL and publishable key are served by /api/supabase-config at
// runtime so they are not in the repository, the bundle, or the settings form.
let cloud = { url: "", key: "" };
let state = importSleepLog(normalizeState(loadJson(STORE_KEY, defaultState)));
let cloudSyncInFlight = null;
let cloudSyncAgain = false;
let cloudRefreshTimer = null;
let pendingSleepId = "";
// One cursor, not three. The framework and storytelling technique are derived
// from whichever topic is showing, so they cannot drift away from it.
let speakCursor = null;
// Set when the user types their own topic; cleared when they draw a new round.
let speakCustomTopic = null;
let rGroup = "initial";
// Which tab the centre column is on. "auto" keeps the original behaviour, where
// the framework shown is whichever one the current topic declares.
let speakMode = "auto";
// What the pre-record checklist last captured, so the take is labelled with the
// reaction it was aiming for instead of just a lesson name.
let speakIntent = { feeling: "", outcome: "" };
let preRecordCountdownId = null;
let speakRecording = { recorder: null, stream: null, chunks: [], startedAt: 0, timerId: null };
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
  renderFinanceNotes();
  indexCards(document.querySelector(".view.active"));
  const financePage = parseFinancePath(location.pathname);
  const view = new URLSearchParams(location.search).get("view");
  if (financePage !== null) {
    showFinancePage(financePage, { updateUrl: false });
    setView("finance");
  } else if (isLawsPath(location.pathname)) {
    setView("laws");
  } else if (["home", "speak", "finance", "me"].includes(view)) setView(view);
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
});

function bindElements() {
  [
    "greeting", "homeTitle", "currentDateText", "quoteText", "nextQuoteButton",
    "addTrackSessionButton",
    "addPushupsButton", "workoutList", "goalsList", "goalsProgress", "goalsSummary", "themeToggleButton",
    "speakTopicKind", "speakTopicText", "speakTopicSource", "speakFrameworkName", "speakFrameworkWhen", "speakFrameworkSteps",
    "speakFrameworkDefinition", "speakFrameworkExample", "speakTopicForm", "speakTopicInput", "speakPurposeInput",
    "speakTechniqueName", "speakTechniqueDefinition", "speakTechniqueExample",
    "speakReflectionText", "newTopicButton", "speakTopicSelect", "speakModeTabs", "speakFrameworkCard",
    "speakFrameworkSplit", "speakFrameworkTagline", "speakArticulationCard",
    "speakSensoryName", "speakSensoryTagline", "speakSensoryList", "speakSensoryExample", "speakSecretsList",
    "rTabs", "rList", "rPracticeCount", "rProgressFill", "rNextSet",
    "speakPracticeLessonInput", "speakRecordButton", "speakRecordStatus", "speakRecordTimer", "speakPracticeSessions",
    "speakRecordIntent", "preRecordDialog", "preRecordForm", "preRecordFeelingInput", "preRecordOutcomeInput",
    "preRecordCountdown", "preRecordCount", "preRecordStartButton", "preRecordCancelButton",
    "heroRingFill", "heroProgressPercent",
    "addSleepButton", "sleepGoalInput",
    "lastNightDate", "lastBedtime", "lastWake", "lastDuration", "lastMood",
    "averageSleepStat", "sleepScoreStat", "sleepHint", "sleepChart", "sleepList",
    "sugarForm", "sugarNameInput", "sugarGramsInput", "sugarAddButton", "sugarList",
    "sugarNameError", "sugarGramsError",
    "sugarTotal", "sugarStatus", "sugarLimitLabel", "sugarProgressFill", "sugarOverFlag",
    "sugarChart", "sugarHistoryHint", "sugarHistoryList", "sugarLogCard", "sugarAverageStat", "sugarOverStat",
    "sugarStreakMessage", "sugarCurrentStreak", "sugarLongestStreak", "sugarStreakCaption",
    "sleepDialog", "sleepForm", "sleepDateInput", "sleptAtInput", "wokeAtInput",
    "sleepError", "sleepMoodDialog", "settingsDialog", "settingsForm",
    "financeView", "brandHomeButton", "sidebarSubtitle", "syncButton", "syncStatus", "syncBanner", "syncBannerText", "displayNameInput",
    "plannerSubtitleInput", "focusGoalInput", "pushupGoalInput", "trackGoalInput",
    "ownerKeyInput", "copyPairingLinkButton", "darkModeInput", "resetDataButton", "openSettingsButton",
  ].forEach((id) => {
    els[id] = document.getElementById(id);
  });
}

function wireEvents() {
  document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => setView(button.dataset.view)));
  document.getElementById("closeSleepButton").addEventListener("click", () => els.sleepDialog.close());
  document.getElementById("closeSettingsButton").addEventListener("click", () => els.settingsDialog.close());
  els.themeToggleButton?.addEventListener("click", () => {
    settings.darkMode = !settings.darkMode;
    saveJson(SETTINGS_KEY, settings);
    applySettings();
    void upsertAppState();
  });
  initSwipeNavigation();
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
  els.addTrackSessionButton?.addEventListener("click", () => logFitness({ track_session: true }));
  els.addPushupsButton?.addEventListener("click", () => logFitness({ pushups: 10 }));
  els.workoutList?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-workout-add]");
    if (!button) return;
    logFitness({ [button.dataset.workoutAdd]: Number(button.dataset.workoutStep) });
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
  els.speakTopicSelect?.addEventListener("change", () => selectLibraryTopic(Number(els.speakTopicSelect.value)));
  els.speakModeTabs?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-speak-mode]");
    if (button) setSpeakMode(button.dataset.speakMode);
  });
  els.speakRecordButton?.addEventListener("click", toggleSpeakRecording);
  els.preRecordForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    beginPowerPause();
  });
  els.preRecordCancelButton?.addEventListener("click", closePreRecord);
  document.getElementById("closePreRecordButton")?.addEventListener("click", closePreRecord);
  els.preRecordDialog?.addEventListener("close", cancelPowerPause);
  els.speakPracticeSessions?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-practice-rating]");
    if (button) updateSpeakPracticeRating(button.dataset.practiceRating, Number(button.dataset.rating));
  });
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
  const motivationToggle = document.getElementById("motivationToggle");
  const motivationVideos = document.getElementById("motivationVideos");
  motivationToggle.addEventListener("click", () => {
    const open = motivationToggle.getAttribute("aria-expanded") !== "true";
    motivationToggle.setAttribute("aria-expanded", String(open));
    motivationVideos.hidden = !open;
  });
  document.getElementById("motivationRow").addEventListener("click", (event) => {
    const remove = event.target.closest("[data-yt-remove]");
    if (remove) {
      removeMotivationVideo(remove.dataset.ytRemove);
      return;
    }
    const play = event.target.closest("[data-yt-play]");
    if (play) openMotivationPlayer(play.dataset.ytPlay);
  });
  document.getElementById("motivationAddForm").addEventListener("submit", (event) => {
    event.preventDefault();
    addMotivationVideo(document.getElementById("motivationAddInput").value);
  });
  document.getElementById("motivationAddInput").addEventListener("input", () => showMotivationError(""));
  const motivationPlayer = document.getElementById("motivationPlayer");
  document.getElementById("motivationPlayerClose").addEventListener("click", () => motivationPlayer.close());
  // Tapping the dark area around the video closes it, like a story viewer.
  motivationPlayer.addEventListener("click", (event) => { if (event.target === motivationPlayer) motivationPlayer.close(); });
  // Removing the embed on close is what stops playback.
  motivationPlayer.addEventListener("close", () => { document.getElementById("motivationPlayerFrame").replaceChildren(); });
  document.querySelectorAll("[data-finance-note]").forEach((field) => field.addEventListener("input", () => {
    state.financeNotes[field.dataset.financeNote] = field.value;
    persist();
    void upsertAppState();
  }));
  document.querySelectorAll("[data-finance-link]").forEach((link) => link.addEventListener("click", (event) => {
    // Let modified clicks (new tab, etc.) follow the real href.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    showFinancePage(link.dataset.financeLink);
  }));
  window.addEventListener("popstate", () => {
    const page = parseFinancePath(location.pathname);
    const lawsActive = document.getElementById("lawsView").classList.contains("active");
    if (page !== null) {
      showFinancePage(page, { updateUrl: false });
      if (!els.financeView.classList.contains("active")) setView("finance");
    } else if (isLawsPath(location.pathname)) {
      if (!lawsActive) setView("laws");
    } else if (els.financeView.classList.contains("active") || lawsActive) {
      setView("home");
    }
  });
  document.getElementById("lawDayCard").addEventListener("click", (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    openLaws();
  });
  document.getElementById("lawsFilters").addEventListener("click", (event) => {
    const chip = event.target.closest("[data-law-filter]");
    if (!chip) return;
    lawsFilter = chip.dataset.lawFilter;
    document.querySelectorAll("[data-law-filter]").forEach((item) => {
      item.classList.toggle("active", item === chip);
      item.setAttribute("aria-pressed", String(item === chip));
    });
    renderLaws();
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
    void upsertAppState();
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
  // The settings dialog had no way in at all after the nav button was removed,
  // which stranded the owner key, Supabase config and iCal URL.
  els.openSettingsButton?.addEventListener("click", () => {
    hydrateSettingsForm();
    els.settingsDialog.showModal();
  });

  // Refresh when the user comes back to the tab so other devices' changes show up.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;
    if (canSync()) void syncAll();
  });

  window.addEventListener("online", () => {
    if (canSync()) void syncAll();
  });
  cloudRefreshTimer = window.setInterval(() => {
    if (document.visibilityState === "visible" && canSync()) void syncAll();
  }, CLOUD_REFRESH_MS);

  // Escape closes dialogs natively; make the backdrop click do the same.
  [els.sleepDialog, els.settingsDialog].forEach((dialog) => {
    dialog?.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
  });
}

function render() {
  renderHome();
  renderWorkout();
  renderGoals();
  renderSpeak();
  renderMemoryNotes();
  renderSleep();
  renderSugar();
  renderLawOfDay();
  renderMotivationVideos();
  refreshIcons();
}

let motivationRenderedKey = "";

function renderMotivationVideos() {
  const videos = state.motivationVideos;
  const key = JSON.stringify(videos);
  if (key === motivationRenderedKey) return;
  motivationRenderedKey = key;
  document.getElementById("motivationCount").textContent = videos.length
    ? `${videos.length} video${videos.length === 1 ? "" : "s"} \u00b7 swipe to watch`
    : "Add your first video";
  document.getElementById("motivationRow").innerHTML = videos.map((video) => {
    const id = escapeHtml(video.id);
    const title = escapeHtml(video.title || "Motivation video");
    return `
    <div class="motivation-tile" role="listitem">
      <button class="motivation-video" type="button" data-yt-play="${id}" aria-label="Play: ${title}">
        <img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="" loading="lazy" />
        <span class="motivation-play" aria-hidden="true"></span>
        <span class="motivation-kind">${video.kind === "short" ? "Short" : "Video"}</span>
      </button>
      <button class="motivation-remove" type="button" data-yt-remove="${id}" aria-label="Remove ${title}" title="Remove">&times;</button>
      <span class="motivation-title">${title}</span>
    </div>`;
  }).join("");
}

function saveMotivationVideos(videos) {
  state.motivationVideos = videos;
  state.motivationVideosUpdatedAt = Date.now();
  persist();
  renderMotivationVideos();
  void upsertAppState();
}

function showMotivationError(message) {
  const error = document.getElementById("motivationAddError");
  error.textContent = message;
  error.hidden = !message;
}

async function addMotivationVideo(link) {
  const parsed = parseYouTubeLink(link);
  if (!parsed) {
    showMotivationError("That doesn't look like a YouTube video link.");
    return;
  }
  if (state.motivationVideos.some((video) => video.id === parsed.id)) {
    showMotivationError("That video is already in your list.");
    return;
  }
  showMotivationError("");
  document.getElementById("motivationAddInput").value = "";
  // Newest first, like a story row. The title fills in once YouTube answers.
  saveMotivationVideos([{ ...parsed, title: "" }, ...state.motivationVideos]);
  document.getElementById("motivationRow").scrollTo({ left: 0, behavior: "smooth" });
  try {
    const response = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${parsed.id}`)}`);
    if (!response.ok) return;
    const { title } = await response.json();
    if (!title) return;
    saveMotivationVideos(state.motivationVideos.map((video) => (video.id === parsed.id ? { ...video, title: String(title).slice(0, 120) } : video)));
  } catch {
    // Offline or blocked: the video still plays, it just shows without a title.
  }
}

function removeMotivationVideo(id) {
  const video = state.motivationVideos.find((item) => item.id === id);
  if (!video || !window.confirm(`Remove "${video.title || "this video"}" from Motivation?`)) return;
  saveMotivationVideos(state.motivationVideos.filter((item) => item.id !== id));
}

function openMotivationPlayer(id) {
  const video = state.motivationVideos.find((item) => item.id === id);
  if (!video) return;
  const frame = document.createElement("iframe");
  frame.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.id)}?autoplay=1&playsinline=1&rel=0`;
  frame.title = video.title || "Motivation video";
  frame.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
  frame.allowFullscreen = true;
  const holder = document.getElementById("motivationPlayerFrame");
  holder.classList.toggle("is-short", video.kind === "short");
  holder.replaceChildren(frame);
  document.getElementById("motivationPlayer").showModal();
}

function renderLawOfDay() {
  const law = lawForDate(todayKey());
  document.getElementById("lawDayNumber").textContent = `Law ${law.n} of 48`;
  document.getElementById("lawDayTitle").textContent = law.title;
  document.getElementById("lawDayIdea").textContent = law.idea;
  document.getElementById("lawDayTipLabel").textContent = law.mode === "use" ? "Use it today:" : "Watch for it today:";
  document.getElementById("lawDayTip").textContent = law.example;
  document.getElementById("lawDayCard").classList.toggle("is-defend", law.mode === "defend");
  // The full list marks today's law; rebuild it only when the day changes.
  if (lawsRenderedFor !== todayKey()) renderLaws();
}

let lawsFilter = "all";
let lawsRenderedFor = "";

function renderLaws() {
  lawsRenderedFor = todayKey();
  const todayN = lawForDate(todayKey()).n;
  const visible = LAWS.filter((law) => lawsFilter === "all" || law.mode === lawsFilter || law.area === lawsFilter);
  document.getElementById("lawsList").innerHTML = visible.map((law) => `
    <li class="law-item is-${law.mode}${law.n === todayN ? " is-today" : ""}" id="law-${law.n}">
      <div class="law-head">
        <span class="law-num">${law.n}</span>
        <h2>${escapeHtml(law.title)}</h2>
        ${law.n === todayN ? '<span class="law-today-pill">Today</span>' : ""}
      </div>
      <p class="law-idea">${escapeHtml(law.idea)}</p>
      <div class="law-tip"><span>${law.mode === "use" ? "How to use it" : "Spot it &amp; defend yourself"}</span><p>${escapeHtml(law.tip)}</p></div>
      <div class="law-example"><span>In your life &middot; ${escapeHtml(LAW_AREAS[law.area])}</span><p>${escapeHtml(law.example)}</p></div>
    </li>`).join("");
}

function openLaws() {
  lawsFilter = "all";
  document.querySelectorAll("[data-law-filter]").forEach((chip) => {
    const on = chip.dataset.lawFilter === "all";
    chip.classList.toggle("active", on);
    chip.setAttribute("aria-pressed", String(on));
  });
  renderLaws();
  setView("laws").then(() => {
    document.getElementById(`law-${lawForDate(todayKey()).n}`)?.scrollIntoView({ block: "center" });
  });
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
  const categories = [];
  els.goalsList.innerHTML = goalGroups.map((group) => {
    const groupDone = group.goals.filter((_, i) => state.goalDone[`${group.key}-${i}`]).length;
    total += group.goals.length;
    done += groupDone;
    categories.push({ group, groupDone });
    const items = group.goals.map((text, i) => {
      const id = `${group.key}-${i}`;
      const checked = Boolean(state.goalDone[id]);
      return `<button class="goal-item ${checked ? "done" : ""}" type="button" data-goal="${id}"><span class="goal-check"></span><span class="goal-text">${escapeHtml(text)}</span></button>`;
    }).join("");
    return `<div class="goal-group" style="--accent:${group.accent}">
      <div class="goal-group-head"><span class="goal-group-icon"><i data-lucide="${group.icon}"></i></span><b>${group.title}</b><small>${groupDone}/${group.goals.length}</small></div>
      <div class="goal-items">${items}</div></div>`;
  }).join("");
  const percent = total ? Math.round((done / total) * 100) : 0;
  if (els.goalsProgress) els.goalsProgress.textContent = `${done} / ${total} done`;
  if (els.goalsSummary) {
    const rows = categories.map(({ group, groupDone }) => {
      const pct = group.goals.length ? Math.round((groupDone / group.goals.length) * 100) : 0;
      return `<li style="--accent:${group.accent}">
        <span class="goal-group-icon"><i data-lucide="${group.icon}"></i></span>
        <div class="goals-row-body"><div class="goals-row-top"><b>${group.title}</b><span>${groupDone}/${group.goals.length} &middot; <strong>${pct}%</strong></span></div>
        <div class="goals-bar" role="progressbar" aria-label="${group.title}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><i style="width:${pct}%"></i></div></div>
      </li>`;
    }).join("");
    els.goalsSummary.innerHTML = `<div class="goals-overall">
      <div class="goals-overall-top"><strong>${percent}%</strong><span>of your 2026 goals done<small>${done} of ${total} goals</small></span></div>
      <div class="goals-bar goals-bar-lg" role="progressbar" aria-label="All goals" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}"><i style="width:${percent}%"></i></div>
    </div><ul class="goals-breakdown">${rows}</ul>`;
  }
  renderHeroProgress(percent, total > 0 && done === total);
  refreshIcons();
}

// The ring on Home mirrors overall goal completion now that the daily
// checklist and calendar it used to count are gone.
function renderHeroProgress(percent, complete) {
  if (els.heroProgressPercent) els.heroProgressPercent.textContent = `${percent}%`;
  if (els.heroRingFill) {
    const circumference = 2 * Math.PI * 31;
    els.heroRingFill.style.strokeDasharray = String(circumference);
    els.heroRingFill.style.strokeDashoffset = String(circumference * (1 - percent / 100));
    els.heroRingFill.classList.toggle("is-complete", complete);
  }
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

// The library dropdown is long and never changes, so it is filled once and
// then only has its selection moved.
function hydrateTopicOptions() {
  if (!els.speakTopicSelect || els.speakTopicSelect.options.length) return;
  els.speakTopicSelect.innerHTML = speakTopics
    .map((topic, index) => `<option value="${index}">${escapeHtml(topic.text)}</option>`)
    .join("");
}

function hydrateModeTabs() {
  if (!els.speakModeTabs || els.speakModeTabs.children.length) return;
  els.speakModeTabs.innerHTML = FRAMEWORK_MODES
    .map((mode) => `<button type="button" role="tab" data-speak-mode="${mode.id}">${escapeHtml(mode.label)}</button>`)
    .join("");
}

// The right sidebar is a fixed reference list, so it is rendered once.
function renderCommunicationSecrets() {
  if (!els.speakSecretsList || els.speakSecretsList.children.length) return;
  els.speakSecretsList.innerHTML = communicationSecrets.map((secret) => `<li class="speak-secret">
      <details>
        <summary><span class="speak-secret-title">${escapeHtml(secret.title)}</span><span class="speak-secret-time">${escapeHtml(secret.timestamp)}</span></summary>
        <p>${escapeHtml(secret.detail)}</p>
      </details>
    </li>`).join("");
}

// The standing "story showing" instruction above the per-round technique. Also
// fixed content, so it only needs writing once.
function renderSensoryMapping() {
  if (!els.speakSensoryList || els.speakSensoryList.children.length) return;
  els.speakSensoryName.textContent = `${sensoryMapping.name} ("${sensoryMapping.alias}")`;
  els.speakSensoryTagline.textContent = sensoryMapping.tagline;
  els.speakSensoryList.innerHTML = sensoryMapping.guidelines
    .map((line) => `<li><strong>${escapeHtml(line.title)}:</strong> ${escapeHtml(line.detail)}</li>`)
    .join("");
  els.speakSensoryExample.querySelector("p").textContent = sensoryMapping.example;
}

function setSpeakMode(mode) {
  const next = frameworkModeById(mode).id;
  if (next === speakMode) return;
  speakMode = next;
  replaySpeakCards();
  renderSpeak();
}

function selectLibraryTopic(index) {
  if (!Number.isInteger(index) || index < 0 || index >= speakTopics.length) return;
  speakCustomTopic = null;
  speakCursor = index;
  if (els.speakTopicInput) els.speakTopicInput.value = "";
  replaySpeakCards();
  renderSpeak();
}

// Which framework the centre column shows: the topic's own on "auto", the tab's
// own otherwise. Articulation has no framework — it swaps the column's contents.
function activeFramework(topicFramework) {
  const mode = frameworkModeById(speakMode);
  if (!mode.frameworkId) return topicFramework;
  return frameworkById(mode.frameworkId) || topicFramework;
}

function renderSpeak() {
  if (!els.speakTopicText) return;
  hydratePurposeOptions();
  hydrateTopicOptions();
  hydrateModeTabs();
  renderCommunicationSecrets();
  renderSensoryMapping();
  // resolveRound derives the framework and technique from the topic itself, so
  // the mismatch that made this section useless is now impossible by construction.
  const round = resolveRound(currentSpeakTopic());
  if (!round?.framework || !round?.technique) return;
  const { topic, technique } = round;

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
  // A typed topic is not in the dropdown, so the select is disabled rather than
  // left pointing at a library entry that is not the one on screen.
  if (els.speakTopicSelect) {
    els.speakTopicSelect.disabled = isCustom;
    if (!isCustom) els.speakTopicSelect.value = String(speakCursor % speakTopics.length);
  }

  const mode = frameworkModeById(speakMode);
  const isArticulation = mode.id === "articulation";
  els.speakModeTabs?.querySelectorAll("[data-speak-mode]").forEach((button) => {
    const on = button.dataset.speakMode === mode.id;
    button.classList.toggle("active", on);
    button.setAttribute("aria-selected", String(on));
  });
  if (els.speakFrameworkCard) els.speakFrameworkCard.hidden = isArticulation;
  if (els.speakFrameworkSplit) els.speakFrameworkSplit.hidden = isArticulation;
  if (els.speakArticulationCard) els.speakArticulationCard.hidden = !isArticulation;

  if (!isArticulation) {
    const framework = activeFramework(round.framework);
    els.speakFrameworkName.textContent = framework.name;
    els.speakFrameworkWhen.textContent = framework.whenToUse;
    els.speakFrameworkDefinition.textContent = framework.definition;
    // Only the new frameworks carry a tagline; the older ones hide the line.
    els.speakFrameworkTagline.textContent = framework.tagline || "";
    els.speakFrameworkTagline.hidden = !framework.tagline;
    els.speakFrameworkSteps.innerHTML = framework.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("");
    els.speakFrameworkExample.querySelector("p").textContent = framework.example;

    els.speakTechniqueName.textContent = technique.name;
    els.speakTechniqueDefinition.textContent = technique.definition;
    els.speakReflectionText.textContent = technique.prompt;
    els.speakTechniqueExample.querySelector("p").textContent = technique.example;
  }

  renderRWords();
  renderSpeakPracticeSessions();
  refreshIcons();
}

function renderSpeakPracticeSessions() {
  if (!els.speakPracticeSessions) return;
  const sessions = [...(state.speakPracticeSessions || [])].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  els.speakPracticeSessions.innerHTML = sessions.length ? sessions.map((session) => {
    const rating = Number(session.rating || 0);
    const audio = session.audio_url
      ? `<audio controls preload="metadata" src="${escapeHtml(session.audio_url)}"></audio>`
      : session.audio_path ? `<span class="practice-audio-pending">Audio saved in private storage</span>` : `<span class="practice-audio-pending">Metadata saved on this device</span>`;
    return `<article class="practice-session"><div class="practice-session-meta"><strong>${escapeHtml(session.lesson || "Speak practice")}</strong><span>${formatTime(session.created_at)} · ${Math.max(0, Number(session.duration_seconds || 0))}s</span></div>${audio}<div class="practice-rating" aria-label="Rate this practice attempt">${[1, 2, 3, 4, 5].map((value) => `<button type="button" class="rating-star ${value <= rating ? "selected" : ""}" data-practice-rating="${session.id}" data-rating="${value}" aria-label="${value} out of 5">★</button>`).join("")}</div></article>`;
  }).join("") : '<p class="empty-inline">Your recorded attempts will appear here.</p>';
  refreshIcons();
}

function formatClock(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const pad = (value) => String(value).padStart(2, "0");
  return `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor(seconds / 60) % 60)}:${pad(seconds % 60)}`;
}

function updateSpeakRecordTimer() {
  if (!els.speakRecordTimer || !speakRecording.startedAt) return;
  els.speakRecordTimer.textContent = formatClock((Date.now() - speakRecording.startedAt) / 1000);
}

function toggleSpeakRecording() {
  if (speakRecording.recorder?.state === "recording") {
    speakRecording.recorder.stop();
    return;
  }
  openPreRecord();
}

// The checklist is the whole point of the pause: you name the reaction you are
// going for before the mic is live, not while you are already talking.
function openPreRecord() {
  if (!els.preRecordDialog) {
    void startSpeakRecording();
    return;
  }
  cancelPowerPause();
  els.preRecordDialog.showModal();
  els.preRecordFeelingInput?.focus();
  refreshIcons();
}

function closePreRecord() {
  cancelPowerPause();
  if (els.preRecordDialog?.open) els.preRecordDialog.close();
}

// Clears a countdown in flight. This also runs on the dialog's close event, so
// dismissing the dialog mid-count can never leave a timer that opens the mic
// three seconds later.
function cancelPowerPause() {
  if (preRecordCountdownId) clearInterval(preRecordCountdownId);
  preRecordCountdownId = null;
  if (els.preRecordCountdown) els.preRecordCountdown.hidden = true;
  if (els.preRecordStartButton) els.preRecordStartButton.disabled = false;
}

// Three seconds of held silence, then the mic opens. Secret #1, enforced by the
// UI rather than left to willpower.
function beginPowerPause() {
  if (preRecordCountdownId) return;
  speakIntent = {
    feeling: els.preRecordFeelingInput?.value.trim() || "",
    outcome: els.preRecordOutcomeInput?.value.trim() || "",
  };
  renderSpeakIntent();
  els.preRecordStartButton.disabled = true;
  els.preRecordCountdown.hidden = false;
  let remaining = 3;
  els.preRecordCount.textContent = String(remaining);
  preRecordCountdownId = window.setInterval(() => {
    remaining -= 1;
    if (remaining > 0) {
      els.preRecordCount.textContent = String(remaining);
      return;
    }
    cancelPowerPause();
    if (els.preRecordDialog?.open) els.preRecordDialog.close();
    void startSpeakRecording();
  }, 1000);
}

// The intent line under the timer, so the target stays visible while you talk.
function speakIntentLabel() {
  const parts = [];
  if (speakIntent.feeling) parts.push(`Feel: ${speakIntent.feeling}`);
  if (speakIntent.outcome) parts.push(`Do: ${speakIntent.outcome}`);
  return parts.join("  ·  ");
}

function renderSpeakIntent() {
  if (!els.speakRecordIntent) return;
  const label = speakIntentLabel();
  els.speakRecordIntent.textContent = label;
  els.speakRecordIntent.hidden = !label;
}

async function startSpeakRecording() {
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
    els.speakRecordStatus.textContent = "This browser does not support microphone recording.";
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = typeof MediaRecorder.isTypeSupported === "function" && MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "";
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    speakRecording = { recorder, stream, chunks: [], startedAt: Date.now(), timerId: window.setInterval(updateSpeakRecordTimer, 250) };
    recorder.addEventListener("dataavailable", (event) => { if (event.data.size) speakRecording.chunks.push(event.data); });
    recorder.addEventListener("stop", () => finishSpeakRecording(recorder.mimeType || "audio/webm"));
    recorder.start();
    els.speakRecordButton.classList.add("recording");
    els.speakRecordButton.innerHTML = '<i data-lucide="square"></i><span>Stop recording</span>';
    els.speakRecordStatus.textContent = "Listening… repeat the lesson clearly.";
    renderSpeakIntent();
    refreshIcons();
  } catch (error) {
    els.speakRecordStatus.textContent = error.name === "NotAllowedError" ? "Microphone permission was not granted." : "Could not start the microphone.";
  }
}

async function finishSpeakRecording(mimeType) {
  const duration = Math.max(0, Math.round((Date.now() - speakRecording.startedAt) / 1000));
  const blob = new Blob(speakRecording.chunks, { type: mimeType });
  speakRecording.stream?.getTracks().forEach((track) => track.stop());
  if (speakRecording.timerId) clearInterval(speakRecording.timerId);
  // speak_practice_sessions has no column for the checklist, so the intent rides
  // along in the lesson label rather than being dropped on the way to Supabase.
  const intent = speakIntentLabel();
  const lesson = els.speakPracticeLessonInput.value.trim() || "Speak practice";
  const session = {
    id: crypto.randomUUID(), user_id: settings.ownerKey, lesson: intent ? `${lesson} — ${intent}` : lesson,
    audio_path: "", audio_url: URL.createObjectURL(blob), duration_seconds: duration, rating: null, created_at: new Date().toISOString(),
  };
  state.speakPracticeSessions = [session, ...(state.speakPracticeSessions || [])].slice(0, 30);
  speakRecording = { recorder: null, stream: null, chunks: [], startedAt: 0, timerId: null };
  els.speakRecordButton.classList.remove("recording");
  els.speakRecordButton.innerHTML = '<i data-lucide="mic"></i><span>Start recording</span>';
  els.speakRecordTimer.textContent = formatClock(duration);
  els.speakRecordStatus.textContent = `Saved a ${duration}s attempt. Rate it when you're ready.`;
  persist();
  renderSpeakPracticeSessions();
  refreshIcons();

  if (!canSync()) return;
  const extension = mimeType.includes("ogg") ? "ogg" : mimeType.includes("mp4") ? "mp4" : "webm";
  session.audio_path = `${settings.ownerKey}/${session.id}.${extension}`;
  try {
    await uploadSpeakPracticeAudio(session.audio_path, blob, mimeType);
    await upsertSupabase("speak_practice_sessions", session);
    els.speakRecordStatus.textContent = "Saved to your private practice history.";
  } catch (error) {
    session.audio_path = "";
    await upsertSupabase("speak_practice_sessions", session).catch(() => {});
    els.speakRecordStatus.textContent = "Kept on this device; cloud upload was unavailable.";
  }
  persist();
  renderSpeakPracticeSessions();
}

function updateSpeakPracticeRating(id, rating) {
  const session = state.speakPracticeSessions.find((entry) => entry.id === id);
  if (!session || rating < 1 || rating > 5) return;
  session.rating = rating;
  persist();
  renderSpeakPracticeSessions();
  void upsertSupabase("speak_practice_sessions", session);
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
  els.rList.innerHTML = batch.map((sentence) => `<button type="button" class="r-sentence ${completed[sentence.id] ? "done" : ""}" data-r-id="${sentence.id}"><span class="r-check" aria-hidden="true"></span><span class="r-sound-tag r-sound-${sentence.sound.toLowerCase()}">${sentence.sound}</span><span class="r-text">${escapeHtml(sentence.text)}</span>${completed[sentence.id] ? '<span class="r-done-badge">Done for today</span>' : ""}</button>`).join("");
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

function renderFinanceNotes() {
  document.querySelectorAll("[data-finance-note]").forEach((field) => {
    const value = state.financeNotes[field.dataset.financeNote] || "";
    if (field.value !== value) field.value = value;
  });
}

// Finance has an index plus sub-pages, each with its own URL. The rest of the
// app has no URL routing, so leaving Finance resets the path to "/".
const DEFAULT_TITLE = typeof document === "undefined" ? "" : document.title;
const FINANCE_TITLES = { "": "Finance", "4s-spending-framework": "The 4 S's of Spending" };

function showFinancePage(page, { updateUrl = true } = {}) {
  const slug = page in FINANCE_TITLES ? page : "";
  document.querySelectorAll("[data-finance-page]").forEach((panel) => {
    panel.hidden = panel.dataset.financePage !== (slug || "index");
  });
  document.title = `${FINANCE_TITLES[slug]} | Life Flow`;
  const path = slug ? `/finance/${slug}` : "/finance";
  if (updateUrl && location.pathname !== path) history.pushState(null, "", path);
  if (els.financeView.classList.contains("active")) {
    indexCards(els.financeView);
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }
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

/* ---- Simon Says (pattern memory) ---- */

/* ---- Math Sprint (30s quick arithmetic) ---- */

/* ---- Sprint Tap (track speed) ---- */

/* ---- Stop the Clock (precision / start timing) ---- */

/* ---- Number Rush ---- */

/* ---- Target Tap ---- */

function logFitness(change) {
  const entry = fitnessEntry(todayKey());
  if (change.pushups) entry.pushups = Number(entry.pushups || 0) + change.pushups;
  if (change.pullups) entry.pullups = Number(entry.pullups || 0) + change.pullups;
  if (change.plank) entry.plank = Number(entry.plank || 0) + change.plank;
  if (change.track_session) entry.track_session = true;
  saveFitnessEntry(entry);
}

function saveFitnessEntry(entry) {
  state.fitnessLog = [entry, ...state.fitnessLog.filter((candidate) => candidate.entry_date !== entry.entry_date)];
  persist();
  renderWorkout();
  void upsertAppState();
}

function fitnessEntry(date) {
  return { entry_date: date, pushups: 0, pullups: 0, plank: 0, track_session: false, ...(state.fitnessLog.find((entry) => entry.entry_date === date) || {}) };
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
  // Sleep history is attributed to the wake-up date. Convert the two local
  // wall-clock values to UTC before sending them to timestamptz columns.
  const { sleptAt, wokeAt } = sleepTimestampsForWakeDate(date, sleptTime, wokeTime);
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

function reconcileSugarStreak(sync = true) {
  const calculated = calculateSugarStreak(state.sugarEntries, SUGAR_DAILY_LIMIT_GRAMS, todayKey());
  const previous = state.sugarStreak || {};
  const next = {
    current_streak: calculated.currentStreak,
    longest_streak: Math.max(Number(previous.longest_streak || 0), calculated.longestStreak),
    last_updated_date: calculated.lastUpdatedDate,
    limit_grams: SUGAR_DAILY_LIMIT_GRAMS,
  };
  const changed = ["current_streak", "longest_streak", "last_updated_date", "limit_grams"].some((key) => String(previous[key] ?? "") !== String(next[key] ?? ""));
  state.sugarStreak = next;
  if (changed) {
    persist();
    if (sync) void upsertSupabase("sugar_streaks", { ...next, user_id: settings.ownerKey, updated_at: new Date().toISOString() }, "user_id");
  }
  return next;
}

function renderSugar() {
  if (!els.sugarList) return;
  const today = todayKey();
  const progress = getSugarProgress(sumSugarForDate(state.sugarEntries, today), SUGAR_DAILY_LIMIT_GRAMS);
  const streak = reconcileSugarStreak();

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
  els.sugarCurrentStreak.textContent = String(streak.current_streak);
  els.sugarLongestStreak.textContent = String(streak.longest_streak);
  els.sugarStreakMessage.textContent = sugarStreakMessage(streak.current_streak).replace("Log a day under the limit to start your streak.", "Ready when you are");
  els.sugarStreakCaption.textContent = streak.current_streak ? `${streak.current_streak} consecutive day${streak.current_streak === 1 ? "" : "s"} under ${SUGAR_DAILY_LIMIT_GRAMS}g.` : `Finish a day under ${SUGAR_DAILY_LIMIT_GRAMS}g to start your streak.`;

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

function hydrateSettingsForm() {
  els.displayNameInput.value = settings.displayName;
  els.plannerSubtitleInput.value = settings.plannerSubtitle;
  els.focusGoalInput.value = String(settings.focusGoal);
  els.pushupGoalInput.value = String(settings.pushupGoal);
  els.trackGoalInput.value = String(settings.trackGoal);
  els.ownerKeyInput.value = settings.ownerKey;
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
    ownerKey: els.ownerKeyInput.value.trim() || settings.ownerKey,
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
  document.body.classList.toggle("light-mode", !settings.darkMode);
  document.documentElement.style.colorScheme = settings.darkMode ? "dark" : "light";
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", settings.darkMode ? "#0a0f1e" : "#eaf6f3");
  els.themeToggleButton?.setAttribute("aria-label", settings.darkMode ? "Switch to light theme" : "Switch to dark theme");
  if (els.darkModeInput) els.darkModeInput.checked = settings.darkMode;
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

async function syncAll() {
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
      await syncToSupabase();
    } while (cloudSyncAgain);
  })();
  try {
    await cloudSyncInFlight;
  } finally {
    cloudSyncInFlight = null;
  }
}

async function loadCloudConfig() {
  try {
    const response = await fetch("/api/supabase-config", { cache: "no-store" });
    const config = response.ok ? await response.json() : null;
    if (config?.url && config?.key) {
      cloud = { url: config.url, key: config.key };
      // Older versions stored the pair in this browser; the server copy replaces it.
      if ("supabaseUrl" in settings || "supabaseAnonKey" in settings) {
        delete settings.supabaseUrl;
        delete settings.supabaseAnonKey;
        saveJson(SETTINGS_KEY, settings);
      }
      return;
    }
  } catch {
    // Offline or no function (plain static hosting): fall through to a saved pair.
  }
  if (settings.supabaseUrl && settings.supabaseAnonKey) cloud = { url: settings.supabaseUrl, key: settings.supabaseAnonKey };
}

async function initializeCloud() {
  await loadCloudConfig();
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
    const [items, focus, sleep, sugar, cloudState, streakRows, practiceSessions] = await Promise.all([
      supabaseFetch("life_flow_items?select=*&order=created_at.desc"),
      supabaseFetch("life_flow_focus_sessions?select=*&order=completed_at.desc"),
      supabaseFetch("life_flow_sleep_entries?select=*&order=sleep_date.desc"),
      // A project that has not run the sugar migration yet must not break the
      // rest of the pull, so this one table is allowed to come back empty.
      supabaseFetch("life_flow_sugar_entries?select=*&order=created_at.desc").catch(() => []),
      supabaseFetch("life_flow_app_state?select=*"),
      supabaseFetch("sugar_streaks?select=*&limit=1").catch(() => []),
      supabaseFetch("speak_practice_sessions?select=*&order=created_at.desc&limit=30").catch(() => []),
    ]);
    if (cloudState?.[0]) {
      const saved = cloudState[0];
      state.fitnessLog = saved.fitness_log || state.fitnessLog;
      state.dukeProgress = { ...state.dukeProgress, ...(saved.duke_progress || {}) };
      state.rewards = saved.rewards || state.rewards;
      state.memoryNotes = { ...state.memoryNotes, ...(saved.memory_notes || {}) };
      state.goalReminder = saved.goal_reminder || state.goalReminder;
      const { appData, ...prefs } = saved.preferences || {};
      if (appData) {
        state.goalDone = { ...(appData.goalDone || {}), ...state.goalDone };
        state.aboutMe = { ...(appData.aboutMe || {}), ...state.aboutMe };
        state.financeNotes = { ...(appData.financeNotes || {}), ...state.financeNotes };
        // A list can't be merged key-by-key (removals would come back), so the
        // most recently edited copy wins.
        if (Array.isArray(appData.motivationVideos) && (appData.motivationVideosUpdatedAt || 0) > state.motivationVideosUpdatedAt) {
          state.motivationVideos = appData.motivationVideos;
          state.motivationVideosUpdatedAt = appData.motivationVideosUpdatedAt;
        }
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
      renderFinanceNotes();
    }
    const deleted = new Set(state.deletedIds);
    state.items = mergeById(state.items, items || []).filter((item) => !deleted.has(item.id));
    state.focusSessions = mergeById(state.focusSessions, focus || []);
    state.sleepEntries = mergeById(state.sleepEntries, sleep || []);
    state.sugarEntries = mergeById(state.sugarEntries, sugar || []);
    if (streakRows?.[0]) state.sugarStreak = { ...state.sugarStreak, ...streakRows[0] };
    state.speakPracticeSessions = mergeById(state.speakPracticeSessions, practiceSessions || []).slice(-30);
    persist();
    render();
    setSyncStatus("Synced with Supabase");
    void hydrateSpeakPracticeAudioUrls();
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
    await upsertSupabase("sugar_streaks", { ...state.sugarStreak, user_id: settings.ownerKey, updated_at: new Date().toISOString() }, "user_id");
    for (const session of state.speakPracticeSessions) {
      await upsertSupabase("speak_practice_sessions", session);
    }
    await upsertAppState();
    setSyncStatus("Synced with Supabase");
  } catch (error) {
    setSyncStatus(`Saving paused: ${error.message}`);
  }
}


/* ============================================================
   GOOGLE CALENDAR
   ============================================================ */


// PostgREST reports an unknown column as PGRST204 and names it in the message.
const UNKNOWN_COLUMN = /Could not find the '([^']+)' column/i;

async function uploadSpeakPracticeAudio(path, blob, mimeType) {
  const response = await fetch(`${cloud.url.replace(/\/$/, "")}/storage/v1/object/${SPEAK_PRACTICE_BUCKET}/${path}`, {
    method: "POST",
    headers: {
      apikey: cloud.key,
      Authorization: `Bearer ${cloud.key}`,
      "Content-Type": mimeType,
      "x-owner-key": settings.ownerKey,
      "x-upsert": "false",
    },
    body: blob,
  });
  if (!response.ok) throw new Error(await response.text() || response.statusText);
}

async function signedSpeakPracticeUrl(path) {
  const response = await fetch(`${cloud.url.replace(/\/$/, "")}/storage/v1/object/sign/${SPEAK_PRACTICE_BUCKET}`, {
    method: "POST",
    headers: {
      apikey: cloud.key,
      Authorization: `Bearer ${cloud.key}`,
      "Content-Type": "application/json",
      "x-owner-key": settings.ownerKey,
    },
    body: JSON.stringify({ paths: [path], expiresIn: 3600 }),
  });
  if (!response.ok) throw new Error(await response.text() || response.statusText);
  const payload = await response.json();
  const signed = Array.isArray(payload) ? payload[0]?.signedURL : payload?.signedURL;
  if (!signed) return "";
  return signed.startsWith("http") ? signed : `${cloud.url.replace(/\/$/, "")}/storage/v1${signed.startsWith("/") ? signed : `/${signed}`}`;
}

async function hydrateSpeakPracticeAudioUrls() {
  if (!canSync()) return;
  const pending = state.speakPracticeSessions.filter((session) => session.audio_path && !session.audio_url);
  await Promise.all(pending.map(async (session) => {
    try { session.audio_url = await signedSpeakPracticeUrl(session.audio_path); } catch { /* keep metadata visible if signing is unavailable */ }
  }));
  if (pending.length) renderSpeakPracticeSessions();
}

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
        financeNotes: state.financeNotes,
        motivationVideos: state.motivationVideos,
        motivationVideosUpdatedAt: state.motivationVideosUpdatedAt,
        deletedIds: state.deletedIds,
        rPractice: state.rPractice,
      },
    },
    updated_at: new Date().toISOString(),
  }, "owner_key");
}

async function supabaseFetch(path, options = {}) {
  const response = await fetch(`${cloud.url.replace(/\/$/, "")}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: cloud.key,
      Authorization: `Bearer ${cloud.key}`,
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
  return Boolean(cloud.url && cloud.key && settings.ownerKey);
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

// Pages reachable from the bottom nav, in the order they appear there. Features
// that are switched off with CSS (display:none) are skipped automatically.
function navViews() {
  return [...document.querySelectorAll(".nav-item")]
    .filter((button) => button.offsetParent !== null)
    .map((button) => button.dataset.view);
}

function currentView() {
  return document.querySelector(".view.active")?.id.replace(/View$/, "") || "home";
}

function moveNavPill() {
  const list = document.querySelector(".nav-list");
  const active = list?.querySelector(".nav-item.active");
  if (!list || !active || active.offsetParent === null) return;
  list.style.setProperty("--pill-x", `${active.offsetLeft}px`);
  list.style.setProperty("--pill-w", `${active.offsetWidth}px`);
  list.classList.add("has-pill");
}

// Swipe left/right anywhere on the page (the nav bar included) to change tab.
function initSwipeNavigation() {
  const MIN_DISTANCE = 56;
  let start = null;
  const blocked = (target) => {
    if (document.querySelector("dialog[open]")) return true;
    for (let node = target; node instanceof Element && node !== document.body; node = node.parentElement) {
      if (node.matches?.("input, textarea, select, [data-no-swipe]")) return true;
      const { overflowX } = getComputedStyle(node);
      if ((overflowX === "auto" || overflowX === "scroll") && node.scrollWidth > node.clientWidth + 1) return true;
    }
    return false;
  };
  document.addEventListener("touchstart", (event) => {
    start = event.touches.length === 1 && !blocked(event.target)
      ? { x: event.touches[0].clientX, y: event.touches[0].clientY, time: Date.now() }
      : null;
  }, { passive: true });
  document.addEventListener("touchend", (event) => {
    if (!start) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    const quick = Date.now() - start.time < 700;
    start = null;
    if (!quick || Math.abs(dx) < MIN_DISTANCE || Math.abs(dx) < Math.abs(dy) * 1.6) return;
    const order = navViews();
    const at = order.indexOf(currentView());
    if (at === -1) return;
    const next = order[at + (dx < 0 ? 1 : -1)];
    if (next) void setView(next);
  }, { passive: true });
  document.addEventListener("touchcancel", () => { start = null; }, { passive: true });
  window.addEventListener("resize", moveNavPill);
  document.fonts?.ready.then(moveNavPill);
}

function setView(view) {
  if (view === "finance") {
    if (parseFinancePath(location.pathname) === null) showFinancePage("");
  } else if (parseFinancePath(location.pathname) !== null) {
    history.replaceState(null, "", "/");
    document.title = DEFAULT_TITLE;
  }
  if (view === "laws") {
    if (!isLawsPath(location.pathname)) history.pushState(null, "", "/laws");
    document.title = "48 Laws of Power | Life Flow";
  } else if (isLawsPath(location.pathname)) {
    history.replaceState(null, "", "/");
    document.title = DEFAULT_TITLE;
  }
  const order = navViews();
  const from = order.indexOf(currentView());
  const to = order.indexOf(view);
  const direction = from === -1 || to === -1 || from === to ? "" : to > from ? "from-right" : "from-left";
  const change = () => {
    document.querySelectorAll(".nav-item").forEach((button) => {
      const selected = button.dataset.view === view;
      button.classList.toggle("active", selected);
      button.setAttribute("aria-selected", String(selected));
    });
    document.querySelectorAll(".view").forEach((panel) => {
      panel.classList.remove("from-right", "from-left");
      panel.classList.toggle("active", panel.id === `${view}View`);
    });
    const active = document.getElementById(`${view}View`);
    if (direction) active.classList.add(direction);
    moveNavPill();
    indexCards(active);
    refreshIcons();
    // Scroll position is per-app, not per-panel; land at the top of the new tab.
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  };
  // Resolves once the new panel is in the DOM, for callers that scroll into it.
  if (document.startViewTransition && !direction) return document.startViewTransition(change).updateCallbackDone;
  change();
  return Promise.resolve();
}

function normalizeState(saved) {
  const merged = {
    ...defaultState, ...saved,
    dukeProgress: { ...defaultState.dukeProgress, ...(saved.dukeProgress || {}) },
    memoryNotes: { ...defaultState.memoryNotes, ...(saved.memoryNotes || {}) },
    items: normalizeItemIds(Array.isArray(saved.items) ? saved.items : []),
    sleepEntries: Array.isArray(saved.sleepEntries) ? saved.sleepEntries : [],
    sugarEntries: Array.isArray(saved.sugarEntries) ? saved.sugarEntries : [],
    sugarStreak: { ...defaultState.sugarStreak, ...(saved.sugarStreak || {}) },
    speakPracticeSessions: Array.isArray(saved.speakPracticeSessions) ? saved.speakPracticeSessions : [],
    focusSessions: Array.isArray(saved.focusSessions) ? saved.focusSessions : [],
    fitnessLog: Array.isArray(saved.fitnessLog) ? saved.fitnessLog : [],
    rewards: Array.isArray(saved.rewards) ? saved.rewards : [],
    goalDone: { ...(saved.goalDone || {}) },
    aboutMe: { ...(saved.aboutMe || {}) },
    financeNotes: { ...(saved.financeNotes || {}) },
    motivationVideos: Array.isArray(saved.motivationVideos) ? saved.motivationVideos : DEFAULT_MOTIVATION_VIDEOS.map((video) => ({ ...video })),
    motivationVideosUpdatedAt: Number(saved.motivationVideosUpdatedAt) || 0,
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
      const { sleptAt, wokeAt } = sleepTimestampsForWakeDate(date, slept, woke);
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

function normalizeSettings(saved) {
  const result = { ...defaultSettings, ...saved };
  const pairingKey = consumePairingKey();
  if (pairingKey) result.ownerKey = pairingKey;
  if (!result.plannerSubtitle || result.plannerSubtitle === "Personal planner") result.plannerSubtitle = defaultSettings.plannerSubtitle;
  if (saved.settingsVersion !== 2 && Number(result.sleepGoalHours) === 8) result.sleepGoalHours = 8.5;
  result.settingsVersion = 2;
  delete result.calendarUrl;
  delete result.googleConnected;
  delete result.googleEmail;
  result.ownerKey ||= createOwnerKey();
  result.sleepGoalHours = clampNumber(result.sleepGoalHours, 6, 10, 8.5);
  result.focusGoal = clampNumber(result.focusGoal, 1, 20, 4);
  result.pushupGoal = clampNumber(result.pushupGoal, 1, 1000, 60);
  result.trackGoal = clampNumber(result.trackGoal, 1, 14, 3);
  saveJson(SETTINGS_KEY, result);
  return result;
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

function formatTime(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" });
}

function prettyDate(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en", { month: "short", day: "numeric" });
}

function addDays(key, amount) {
  const date = new Date(`${key}T00:00:00`);
  date.setDate(date.getDate() + amount);
  return formatDateKey(date);
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
