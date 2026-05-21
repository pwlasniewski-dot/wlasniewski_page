const SEASON_ALIAS_TO_PL: Record<string, string> = {
    wiosna: 'wiosna',
    spring: 'wiosna',
    lato: 'lato',
    summer: 'lato',
    jesień: 'jesień',
    jesien: 'jesień',
    autumn: 'jesień',
    fall: 'jesień',
    zima: 'zima',
    winter: 'zima',
};

const SEASON_COLOR_BY_PL: Record<string, string> = {
    wiosna: '#C99A9A',
    lato: '#9CB37A',
    jesień: '#B8743D',
    zima: '#5A7A8C',
};

export function getSeasonLabel(season?: string | null): string | null {
    if (!season) return null;
    const normalized = season.trim().toLowerCase();
    return SEASON_ALIAS_TO_PL[normalized] || season;
}

export function getSeasonColor(season?: string | null): string | null {
    const label = getSeasonLabel(season);
    if (!label) return null;
    return SEASON_COLOR_BY_PL[label] || null;
}
