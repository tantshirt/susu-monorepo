import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Story 7.7: load `apps/reference/i18n.ts` so `getRequestConfig` is wired into
// every server render. The plugin path is relative to the project root.
const withNextIntl = createNextIntlPlugin("./i18n.ts");

const nextConfig: NextConfig = {
  /* config options here */
};

export default withNextIntl(nextConfig);
