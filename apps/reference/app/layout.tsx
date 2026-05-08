import type { ReactNode } from 'react';

import { TopNav } from '../components/susu/TopNav';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <TopNav
          clusterLabel="devnet"
          walletStatus={{ kind: 'not-connected' }}
          locale="en"
          onLocaleChange={() => undefined}
          onDisconnect={() => undefined}
        />
        {children}
      </body>
    </html>
  );
}
