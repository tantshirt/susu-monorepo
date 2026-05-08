export const SKIN_COOKIE_NAME = 'skin';
export const SKIN_LOCAL_STORAGE_KEY = 'skin';
// 365-day max-age in seconds for cookie persistence.
export const SKIN_COOKIE_MAX_AGE_SECONDS = 31_536_000;

export type Skin = 'neutral' | 'heritage';

const VALID_SKINS: readonly Skin[] = ['neutral', 'heritage'] as const;

export function isSkin(value: string | null | undefined): value is Skin {
  return Boolean(value && VALID_SKINS.includes(value as Skin));
}
