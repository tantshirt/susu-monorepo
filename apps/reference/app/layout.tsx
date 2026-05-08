import type { ReactNode } from 'react';
import { cookies } from 'next/headers';

import { isSkin, SKIN_COOKIE_NAME, type Skin } from '../lib/skin';

export default async function RootLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const cookieSkin = cookieStore.get(SKIN_COOKIE_NAME)?.value;
  const initialSkin: Skin = isSkin(cookieSkin) ? cookieSkin : 'neutral';

  return (
    <html lang="en" data-skin={initialSkin}>
      <head>
        <style>{`
          :root {
            --bg: #ffffff;
            --fg: #141414;
            transition: background-color 300ms ease, color 300ms ease;
          }

          html[data-skin='heritage'] {
            --bg: #2d1b15;
            --fg: #f3e7d3;
          }

          body {
            margin: 0;
            background: var(--bg);
            color: var(--fg);
          }

          .skin-toggle {
            position: relative;
            display: inline-grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 2px;
            padding: 2px;
            border-radius: 999px;
            background: color-mix(in srgb, var(--fg) 16%, transparent);
          }

          .skin-toggle__thumb {
            position: absolute;
            inset-block: 2px;
            left: 2px;
            width: calc(50% - 2px);
            border-radius: 999px;
            background: color-mix(in srgb, var(--bg) 92%, var(--fg) 8%);
            transform: translateX(0);
            transition: transform 300ms ease;
          }

          .skin-toggle__thumb--heritage {
            transform: translateX(100%);
          }

          .skin-toggle__option {
            position: relative;
            z-index: 1;
            border: 0;
            border-radius: 999px;
            background: transparent;
            color: inherit;
            min-width: 7rem;
            padding: 0.375rem 0.75rem;
            cursor: pointer;
          }

          .skin-toggle__option:focus-visible,
          .skin-toggle:focus-visible {
            outline: 2px solid color-mix(in srgb, var(--fg) 75%, transparent);
            outline-offset: 2px;
          }

          @media (prefers-reduced-motion: reduce) {
            :root,
            .skin-toggle__thumb {
              transition-duration: 0ms;
            }
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
