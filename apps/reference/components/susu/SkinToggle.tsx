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

  useEffect(() => {
    useSkinStore.getState().syncFromCookie();
  }, []);

  const focusOption = (value: Skin) => {
    if (typeof document === 'undefined') {
      return;
    }
    const button = document.querySelector<HTMLButtonElement>(`button[data-skin-option="${value}"]`);
    button?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
      return;
    }

    event.preventDefault();

    if (event.key === 'Home') {
      setSkin('neutral');
      focusOption('neutral');
      return;
    }

    if (event.key === 'End') {
      setSkin('heritage');
      focusOption('heritage');
      return;
    }

    const nextSkin = skin === 'neutral' ? 'heritage' : 'neutral';
    setSkin(nextSkin);
    focusOption(nextSkin);
  };

  return (
    <div aria-label="Skin" role="radiogroup" className="skin-toggle">
      <span aria-hidden="true" className={`skin-toggle__thumb ${skin === 'heritage' ? 'skin-toggle__thumb--heritage' : ''}`} />
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={skin === option.value}
          tabIndex={skin === option.value ? 0 : -1}
          data-skin-option={option.value}
          className={`skin-toggle__option ${skin === option.value ? 'skin-toggle__option--active' : ''}`}
          onClick={() => setSkin(option.value)}
          onKeyDown={handleKeyDown}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
