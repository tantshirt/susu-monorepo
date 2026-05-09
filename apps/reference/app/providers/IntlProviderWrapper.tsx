"use client";

import { NextIntlClientProvider, type AbstractIntlMessages } from "next-intl";
import type { ReactNode } from "react";

/**
 * Innermost provider in the locked chain. Story 7.7 wires real locale-aware
 * message loading: the parent layout (server component) imports the message
 * bundle for the active locale via `next-intl/server` and passes it in via
 * props. Per UX-DR46 we never hardcode strings here.
 */
export function IntlProviderWrapper({
  locale,
  messages,
  children,
}: {
  locale: string;
  messages: AbstractIntlMessages;
  children: ReactNode;
}) {
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      timeZone="UTC"
    >
      {children}
    </NextIntlClientProvider>
  );
}
