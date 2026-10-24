export const PROVIDER_PRIORITY = ["anikoto","aniwaves","kaa","animegg","anipm","senshi","mkissa","reanime"];
export function providerRank(name: string) { const index=PROVIDER_PRIORITY.indexOf(name); return index < 0 ? PROVIDER_PRIORITY.length : index; }
