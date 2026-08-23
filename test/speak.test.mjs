import assert from "node:assert/strict";
import test from "node:test";

import {
  frameworkById,
  frameworks,
  frameworksForPurpose,
  KIND_PURPOSE,
  PENDING_FRAMEWORKS,
  PENDING_TECHNIQUES,
  PURPOSES,
  resolveCustomTopic,
  resolveRound,
  speakTopics,
  storytellingTechniques,
  techniqueById,
  workExamples,
  motivationalStories,
} from "../src/speak-library.mjs";

test("every framework carries the five fields the UI renders", () => {
  for (const framework of frameworks) {
    assert.ok(framework.id, `missing id: ${framework.name}`);
    assert.ok(framework.name, `missing name: ${framework.id}`);
    assert.ok(Array.isArray(framework.steps) && framework.steps.length >= 3, `bad steps: ${framework.name}`);
    assert.ok(framework.definition?.length > 10, `missing definition: ${framework.name}`);
    assert.ok(framework.example?.length > 20, `missing worked example: ${framework.name}`);
    assert.ok(framework.whenToUse?.length > 5, `missing when-to-use tag: ${framework.name}`);
    assert.ok(framework.purpose in PURPOSES, `unknown purpose "${framework.purpose}" on ${framework.name}`);
  }
});

test("framework ids are unique", () => {
  const ids = frameworks.map((framework) => framework.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("the documented framework library is present and the undocumented one is not", () => {
  assert.equal(frameworks.length, 11);
  // "The One Important Thing" must stay absent until its real steps are supplied
  // — this test is what stops it being quietly invented later.
  for (const name of PENDING_FRAMEWORKS) {
    assert.equal(frameworks.some((framework) => framework.name === name), false, `${name} was added without its source steps`);
  }
});

test("the expanded work library has 100 unique renderable examples", () => {
  assert.ok(workExamples.length >= 100);
  assert.equal(new Set(workExamples.map((example) => example.text)).size, workExamples.length);
  for (const example of workExamples) {
    assert.equal(example.kind, "explain");
    assert.ok(example.framework && example.technique);
    assert.ok(resolveRound(example).framework);
  }
});

test("motivational stories carry setup, struggle, turning point, and lesson", () => {
  assert.ok(motivationalStories.length >= 15);
  for (const story of motivationalStories) {
    assert.equal(story.kind, "story");
    for (const field of ["setup", "struggle", "turningPoint", "lesson"]) assert.ok(story[field]?.length > 20, `${field} missing: ${story.text}`);
    assert.ok(resolveRound(story).framework);
  }
});

test("every storytelling technique carries a definition, prompt, and example", () => {
  for (const technique of storytellingTechniques) {
    assert.ok(technique.id, `missing id: ${technique.name}`);
    assert.ok(technique.definition?.length > 10, `missing definition: ${technique.name}`);
    assert.ok(technique.prompt?.length > 20, `missing prompt: ${technique.name}`);
    assert.ok(technique.example?.length > 10, `missing example: ${technique.name}`);
  }
  const ids = storytellingTechniques.map((technique) => technique.id);
  assert.equal(new Set(ids).size, ids.length);
  // Seven of nine confirmed; the two truncated in the source request stay pending.
  assert.equal(storytellingTechniques.length, 7);
  assert.equal(PENDING_TECHNIQUES.length, 2);
});

// This is the regression test for the reported bug: a serious reflection topic
// drawing "Past / Present / Future".
test("every topic resolves to the framework and technique it declares", () => {
  for (const topic of speakTopics) {
    const round = resolveRound(topic);
    assert.ok(round.framework, `topic has an unknown framework id "${topic.framework}": ${topic.text}`);
    assert.ok(round.technique, `topic has an unknown technique id "${topic.technique}": ${topic.text}`);
    assert.equal(round.framework.id, topic.framework);
    assert.equal(round.technique.id, topic.technique);
  }
});

test("resolving a topic is stable across repeated calls", () => {
  for (const topic of speakTopics) {
    assert.equal(resolveRound(topic).framework.id, resolveRound(topic).framework.id);
  }
});

test("no reflection topic is paired with a story-only framework", () => {
  // The exact shape of the reported bug: Past / Present / Future is tagged
  // "story", so it must never land on a topic whose purpose is reflection.
  const reflectionTopics = speakTopics.filter((topic) => topic.kind === "reflection");
  assert.ok(reflectionTopics.length > 0);
  for (const topic of reflectionTopics) {
    const framework = frameworkById(topic.framework);
    assert.equal(framework.purpose, KIND_PURPOSE.reflection, `${framework.name} (${framework.purpose}) on a reflection topic: ${topic.text}`);
  }
});

test("every topic kind maps to a purpose that has frameworks available", () => {
  for (const kind of new Set(speakTopics.map((topic) => topic.kind))) {
    const purpose = KIND_PURPOSE[kind];
    assert.ok(purpose, `topic kind "${kind}" has no purpose mapping`);
    assert.ok(frameworksForPurpose(purpose).length > 0, `purpose "${purpose}" has no frameworks`);
  }
});

test("every purpose offers at least two frameworks", () => {
  for (const purpose of Object.keys(PURPOSES)) {
    assert.ok(frameworksForPurpose(purpose).length >= 2, `purpose "${purpose}" is too thin`);
  }
});

test("a typed topic gets a framework matching the purpose the user picked", () => {
  for (const purpose of Object.keys(PURPOSES)) {
    const { framework, technique } = resolveCustomTopic("Talk about losing someone you looked up to", purpose);
    assert.equal(framework.purpose, purpose);
    assert.ok(technique.id);
  }
});

test("a typed topic resolves deterministically, never at random", () => {
  const text = "Describe the hardest conversation you have had this year";
  const first = resolveCustomTopic(text, "reflect");
  for (let i = 0; i < 50; i += 1) {
    const again = resolveCustomTopic(text, "reflect");
    assert.equal(again.framework.id, first.framework.id);
    assert.equal(again.technique.id, first.technique.id);
  }
  // Different text may differ, but the same text never does.
  assert.equal(resolveRound({ kind: "custom", text, purpose: "reflect" }).framework.id, first.framework.id);
});

test("a serious reflection topic never draws Past / Present / Future", () => {
  // The literal reported failure, checked across many phrasings.
  const phrasings = [
    "Talk about losing someone you looked up to",
    "Describe a time you let someone down badly",
    "Reflect on the hardest week of this year",
    "What did you learn from a failure nobody saw",
    "Describe a moment you felt genuinely alone",
    "Talk about a fear you have not told anyone",
  ];
  for (const text of phrasings) {
    const { framework } = resolveCustomTopic(text, "reflect");
    assert.notEqual(framework.id, "ppf", `"${text}" drew Past / Present / Future`);
    assert.equal(framework.purpose, "reflect");
  }
});

test("techniqueById and frameworkById return null for unknown ids", () => {
  assert.equal(frameworkById("nope"), null);
  assert.equal(techniqueById("nope"), null);
  assert.equal(resolveRound(null), null);
});
