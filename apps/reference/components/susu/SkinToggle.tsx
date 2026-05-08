'use client';

import { type KeyboardEvent, useEffect } from 'react';

import { type Skin } from '../../lib/skin';
import { useSkinStore } from '../../lib/stores/skin';

const OPTIONS: ReadonlyArray<{ label: string; value: Skin }> = [
  { label: 'Neutral', value: 'neutral' },
  { label: 'Heritage', value: 'heritage' },
];

export function SkinToggle() {
  const skin = useSkinStore((state) => state.skin);
  const setSkin = useSkinStore((state) => state.setSkin);
  const syncFromCookie = useSkinStore((state) => state.syncFromCookie);

  useEffect(() => {
    syncFromCookie();
  }, [syncFromCookie]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
      return;
    }

    event.preventDefault();

    if (event.key === 'Home') {
      setSkin('neutral');
      return;
    }

    if (event.key === 'End') {
      setSkin('heritage');
      return;
    }

    setSkin(skin === 'neutral' ? 'heritage' : 'neutral');
  };

  return (
    <div aria-label="Skin" role="radiogroup" onKeyDown={handleKeyDown} className="skin-toggle" tabIndex={0}>
      <span aria-hidden="true" className={`skin-toggle__thumb ${skin === 'heritage' ? 'skin-toggle__thumb--heritage' : ''}`} />
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={skin === option.value}
          className={`skin-toggle__option ${skin === option.value ? 'skin-toggle__option--active' : ''}`}
          onClick={() => setSkin(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
