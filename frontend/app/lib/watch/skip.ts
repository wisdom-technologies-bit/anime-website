export type SkipRange = { start: number; end: number } | null;
export type SkipRanges = {
  intro: SkipRange;
  outro: SkipRange;
  recap: SkipRange;
};

function valid(range: SkipRange): SkipRange {
  if (
    !range ||
    !Number.isFinite(range.start) ||
    !Number.isFinite(range.end) ||
    range.end <= range.start
  )
    return null;
  return range;
}

export function mergeSkipRanges(
  providerRanges: Partial<SkipRanges> = {},
  aniskipRanges: Partial<SkipRanges> = {},
): SkipRanges {
  return {
    intro:
      valid(providerRanges.intro ?? null) || valid(aniskipRanges.intro ?? null),
    outro:
      valid(providerRanges.outro ?? null) || valid(aniskipRanges.outro ?? null),
    recap:
      valid(providerRanges.recap ?? null) || valid(aniskipRanges.recap ?? null),
  };
}

export function isSkipVisible(currentTime: number, range: SkipRange) {
  return Boolean(
    range && currentTime >= range.start - 1 && currentTime <= range.end - 2,
  );
}

export function shouldAutoSkip(
  key: string,
  skipped: Set<string>,
  range: SkipRange,
  currentTime: number,
) {
  return Boolean(
    range && !skipped.has(key) && isSkipVisible(currentTime, range),
  );
}
