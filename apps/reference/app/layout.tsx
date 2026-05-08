import type { ReactNode } from 'react';

import { TopNavShell } from '../components/susu/TopNavShell';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <TopNavShell />
        {children}
      </body>
    </html>
  );
}
