'use client';

import { useState } from 'react';

export function SkinToggle() {
  const [mode, setMode] = useState<'light' | 'dark'>('light');

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
