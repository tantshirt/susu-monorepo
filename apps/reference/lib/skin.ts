export const SKIN_COOKIE_NAME = 'skin';
export const SKIN_LOCAL_STORAGE_KEY = 'skin';
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const DAYS_PER_YEAR = 365;

export const SKIN_COOKIE_MAX_AGE_SECONDS =
  SECONDS_PER_MINUTE * MINUTES_PER_HOUR * HOURS_PER_DAY * DAYS_PER_YEAR;

export type Skin = 'neutral' | 'heritage';

const VALID_SKINS: readonly Skin[] = ['neutral', 'heritage'] as const;

export function isSkin(value: string | null | undefined): value is Skin {
  return Boolean(value && VALID_SKINS.includes(value as Skin));
}
