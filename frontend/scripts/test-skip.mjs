import assert from "node:assert/strict";

const valid = (r) => r && Number.isFinite(r.start) && Number.isFinite(r.end) && r.end > r.start ? r : null;
const merge = (provider = {}, fallback = {}) => ({ intro: valid(provider.intro) || valid(fallback.intro), outro: valid(provider.outro) || valid(fallback.outro), recap: valid(provider.recap) || valid(fallback.recap) });
const visible = (time, range) => Boolean(range && time >= range.start - 1 && time <= range.end - 2);
const shouldAuto = (key, seen, range, time) => Boolean(!seen.has(key) && visible(time, range));
const frieren = { op: { start: 3.221, end: 93.221 } };
assert.deepEqual(frieren.op, { start: 3.221, end: 93.221 });
assert.equal([frieren.op, { start: 1, end: 200 }].sort((a, b) => (b.end - b.start) - (a.end - a.start))[0].end, 200);
assert.equal(merge({}, {}).intro, null);
assert.deepEqual(merge({ intro: { start: 4, end: 5 } }, { intro: { start: 1, end: 2 } }).intro, { start: 4, end: 5 });
const range = { start: 10, end: 30 };
assert.equal(visible(9, range), true);
assert.equal(visible(28, range), true);
assert.equal(visible(29, range), false);
const seen = new Set(["intro"]);
assert.equal(shouldAuto("intro", seen, range, 10), false);
assert.equal(shouldAuto("intro", new Set(), range, 10), true);
console.log("PASS skip mapping, priority, visibility, once-per-range");
