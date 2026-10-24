const { legacyEpisode, resumePosition, inRange, showNextEpisode } = await import('../app/lib/watch/ui-helpers.ts');
const assert = (value, message) => { if (!value) throw new Error(message); };
assert(legacyEpisode(new URLSearchParams('episode=2')) === 2, 'legacy episode');
assert(resumePosition(20, 100) === 20 && resumePosition(2, 100) === 0, 'resume');
assert(inRange(15, { start: 10, end: 20 }) && !inRange(25, { start: 10, end: 20 }), 'range');
assert(showNextEpisode(95, 100) && showNextEpisode(80, 100, 75) && !showNextEpisode(50, 100), 'next');
console.log('PASS watch UI helpers');
