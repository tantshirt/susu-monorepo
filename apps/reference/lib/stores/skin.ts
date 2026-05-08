'use client';

import { create } from 'zustand';

import {
  isSkin,
  SKIN_COOKIE_MAX_AGE_SECONDS,
  SKIN_COOKIE_NAME,
  SKIN_LOCAL_STORAGE_KEY,
  type Skin,
} from '../skin';

const FALLBACK_SKIN: Skin = 'neutral';

function readCookieSkin(): Skin | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const cookie = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${SKIN_COOKIE_NAME}=`));
  const value = cookie?.split('=')[1] ?? null;

  return isSkin(value) ? value : null;
}

function applySkinToDom(skin: Skin): void {
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.skin = skin;
  }
}

function persistStorageSkin(skin: Skin): void {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(SKIN_LOCAL_STORAGE_KEY, skin);
  }
}

function persistSkin(skin: Skin): void {
  if (typeof document !== 'undefined') {
    document.cookie = `${SKIN_COOKIE_NAME}=${skin}; path=/; max-age=${SKIN_COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
  }
  persistStorageSkin(skin);
}

function getInitialSkin(): Skin {
  if (typeof document === 'undefined') {
    return FALLBACK_SKIN;
  }

  const fromCookie = readCookieSkin();
  if (fromCookie) {
    return fromCookie;
  }

  const fromDom = document.documentElement.dataset.skin;
  if (isSkin(fromDom)) {
    return fromDom;
  }

  const fromStorage = typeof window === 'undefined' ? null : window.localStorage.getItem(SKIN_LOCAL_STORAGE_KEY);
  if (isSkin(fromStorage)) {
    return fromStorage;
  }

  return FALLBACK_SKIN;
}

type SkinStore = {
  skin: Skin;
  setSkin: (skin: Skin) => void;
  syncFromCookie: () => void;
};

export const useSkinStore = create<SkinStore>((set) => ({
  skin: getInitialSkin(),
  setSkin: (skin) => {
    applySkinToDom(skin);
    persistSkin(skin);
    set({ skin });
  },
  syncFromCookie: () => {
    const cookieSkin = readCookieSkin() ?? FALLBACK_SKIN;
    applySkinToDom(cookieSkin);
    persistStorageSkin(cookieSkin);
    set({ skin: cookieSkin });
  },
}));
