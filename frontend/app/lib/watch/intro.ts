function pair(value: any) {
  const start = Number(value?.start), end = Number(value?.end);
  return Number.isFinite(start) && Number.isFinite(end) && start >= 0 && end > start && start <= 10800 ? { start, end } : null;
}

export function normalizeIntroOutro(json: any, stream?: any) {
  return {
    intro: pair(stream?.intro) || pair(json?.intro) || pair({ start: json?.intro_start, end: json?.intro_end }),
    outro: pair(stream?.outro) || pair(json?.outro) || pair({ start: json?.outro_start, end: json?.outro_end }),
  };
}
