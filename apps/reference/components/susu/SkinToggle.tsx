'use client';

import { useEffect, useState } from 'react';

export function SkinToggle() {
  const [mode, setMode] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') {
      return 'light';
    }

    const storedMode = window.localStorage.getItem('susu-skin-mode');
    return storedMode === 'dark' ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.dataset.skin = mode;
    window.localStorage.setItem('susu-skin-mode', mode);
  }, [mode]);

  return (
    <button
      type="button"
      aria-label="Toggle skin"
      className="rounded-md border px-2 py-1 text-sm"
      onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}
    >
      {mode === 'light' ? '🌞' : '🌙'}
    </button>
  );
}
