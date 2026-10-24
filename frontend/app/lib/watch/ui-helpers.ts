export function legacyEpisode(search: URLSearchParams) {
  return Number(search.get("ep") || search.get("episode") || 1);
}
export function resumePosition(time: number, duration: number) {
  return time >= 5 && (!duration || time < duration - 10) ? time : 0;
}
export function inRange(
  time: number,
  range?: { start: number; end: number } | null,
) {
  return !!range && time >= range.start && time < range.end;
}
export function showNextEpisode(
  time: number,
  duration: number,
  outroStart?: number,
) {
  return (
    !!duration &&
    (time >= duration * 0.95 || (outroStart != null && time >= outroStart))
  );
}
