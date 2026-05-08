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
    const secure = document.location.protocol === 'https:' ? '; secure' : '';
    document.cookie = `${SKIN_COOKIE_NAME}=${skin}; path=/; max-age=${SKIN_COOKIE_MAX_AGE_SECONDS}; samesite=lax${secure}`;
  }
  persistStorageSkin(skin);
}

function readDomOrStorageSkin(): Skin | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const fromDom = document.documentElement.dataset.skin;
  if (isSkin(fromDom)) {
    return fromDom;
  }

  if (typeof window === 'undefined') {
    return null;
  }
  const fromStorage = window.localStorage.getItem(SKIN_LOCAL_STORAGE_KEY);
  return isSkin(fromStorage) ? fromStorage : null;
}

function getInitialSkin(): Skin {
  const fromCookie = readCookieSkin();
  if (fromCookie) {
    return fromCookie;
  }

  return readDomOrStorageSkin() ?? FALLBACK_SKIN;
}

type SkinStore = {
  skin: Skin;
  setSkin: (skin: Skin) => void;
};

export const useSkinStore = create<SkinStore>((set) => ({
  skin: getInitialSkin(),
  setSkin: (skin) => {
    applySkinToDom(skin);
    persistSkin(skin);
    set({ skin });
  },
}));
