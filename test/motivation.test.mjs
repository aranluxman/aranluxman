import assert from "node:assert/strict";
import test from "node:test";

import { DEFAULT_MOTIVATION_VIDEOS, parseYouTubeLink } from "../src/motivation.mjs";

test("parseYouTubeLink handles every common link shape", () => {
  assert.deepEqual(parseYouTubeLink("https://www.youtube.com/watch?v=IIDrG9J4I_8&list=LL"), { id: "IIDrG9J4I_8", kind: "video" });
  assert.deepEqual(parseYouTubeLink("https://youtube.com/shorts/qSZWnmCwlyo?si=zLXj_IQGefC1nPjh"), { id: "qSZWnmCwlyo", kind: "short" });
  assert.deepEqual(parseYouTubeLink("https://youtu.be/O-tGIpa-YNc?t=30"), { id: "O-tGIpa-YNc", kind: "video" });
  assert.deepEqual(parseYouTubeLink("m.youtube.com/watch?v=wy0CyyPjnTs"), { id: "wy0CyyPjnTs", kind: "video" });
  assert.deepEqual(parseYouTubeLink("  https://www.youtube.com/embed/7fLqPBK_Z9o  "), { id: "7fLqPBK_Z9o", kind: "video" });
  assert.deepEqual(parseYouTubeLink("pYwQyUkq6Kc"), { id: "pYwQyUkq6Kc", kind: "video" });
});

test("parseYouTubeLink rejects non-YouTube and malformed links", () => {
  assert.equal(parseYouTubeLink(""), null);
  assert.equal(parseYouTubeLink("hello there"), null);
  assert.equal(parseYouTubeLink("https://vimeo.com/123456"), null);
  assert.equal(parseYouTubeLink("https://youtube.com.evil.com/watch?v=IIDrG9J4I_8"), null);
  assert.equal(parseYouTubeLink("https://www.youtube.com/playlist?list=PLsSkGS61OiiU6Bi9E8no1KnC8ncxRM4Mq"), null);
  assert.equal(parseYouTubeLink("https://www.youtube.com/watch?v=short"), null);
});

test("default videos are unique and valid", () => {
  const ids = DEFAULT_MOTIVATION_VIDEOS.map((video) => video.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const video of DEFAULT_MOTIVATION_VIDEOS) {
    assert.deepEqual(parseYouTubeLink(video.id)?.id, video.id);
    assert.ok(["video", "short"].includes(video.kind));
    assert.ok(video.title);
  }
});
