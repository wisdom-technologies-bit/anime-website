export type VttValidation = {
  cues: number;
  errors: string[];
  maxDuration: number;
  outOfOrder: boolean;
  endBeforeStart: number;
  overlapsMax: number;
};
const parse = (s: string) => {
  const m = s.match(/^(\d{2,}):(\d{2}):(\d{2})\.(\d{3})$/);
  return m
    ? Number(m[1]) * 3600 +
        Number(m[2]) * 60 +
        Number(m[3]) +
        Number(m[4]) / 1000
    : NaN;
};
export function validateVtt(text: string): VttValidation {
  const errors: string[] = [];
  const cues: { start: number; end: number }[] = [];
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/);
  if (lines[0] !== "WEBVTT") errors.push("missing WEBVTT header");
  for (const [i, line] of lines.entries()) {
    if (!line.includes("-->")) continue;
    const [a, b] = line.split("-->");
    const start = parse(a.trim()),
      end = parse((b || "").trim().split(/\s+/)[0] || "");
    if (!Number.isFinite(start) || !Number.isFinite(end))
      errors.push(`invalid timing line ${i + 1}`);
    else cues.push({ start, end });
  }
  let maxDuration = 0,
    outOfOrder = false,
    endBeforeStart = 0,
    overlapsMax = 0;
  for (let i = 0; i < cues.length; i++) {
    const c = cues[i];
    maxDuration = Math.max(maxDuration, c.end - c.start);
    if (i && c.start < cues[i - 1].start) outOfOrder = true;
    if (c.end <= c.start) endBeforeStart++;
    for (let j = i - 1; j >= 0; j--)
      overlapsMax = Math.max(overlapsMax, Math.max(0, cues[j].end - c.start));
  }
  return {
    cues: cues.length,
    errors,
    maxDuration,
    outOfOrder,
    endBeforeStart,
    overlapsMax,
  };
}
