"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * CodeBlock — code surface for documentation, example snippets, and IDL
 * receipts (UX-DR19). Renders monospaced text via the `font-mono` typography
 * token (Story 7.3 → Geist Mono) and exposes a copy-to-clipboard affordance.
 *
 * Future Stories may layer Shiki / language-toggle / "verified at $COMMIT_SHA"
 * subtext on top; this baseline ships the component shape consumers depend on.
 *
 * Token discipline:
 *   - Surface  : `bg-surface2` + `border-border`
 *   - Body     : `text-text` (with `text-muted` for the optional filename caption)
 *   - Type     : `font-mono` + `text-caption` line-height
 */
export interface CodeBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  code: string;
  language?: string;
  filename?: string;
}

export const CodeBlock = React.forwardRef<HTMLDivElement, CodeBlockProps>(
  ({ code, language, filename, className, ...props }, ref) => {
    const [copied, setCopied] = React.useState(false);

    const onCopy = React.useCallback(async () => {
      try {
        // navigator.clipboard is gated to secure contexts; the catch keeps
        // SSR / unsupported-browser paths safe.
        if (typeof navigator !== "undefined" && navigator.clipboard) {
          await navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }
      } catch {
        // Swallow — copy is a best-effort affordance, never blocks the user.
      }
    }, [code]);

    return (
      <div
        ref={ref}
        className={cn(
          "group relative overflow-hidden rounded-md border border-border bg-surface2",
          className,
        )}
        data-language={language}
        {...props}
      >
        {filename ? (
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <span className="font-mono text-caption text-muted">{filename}</span>
            {language ? (
              <span className="font-mono text-caption text-muted">{language}</span>
            ) : null}
          </div>
        ) : null}
        <pre className="overflow-x-auto p-4 font-mono text-caption leading-6 text-text">
          <code className="font-mono">{code}</code>
        </pre>
        <div className="absolute end-2 top-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCopy}
            aria-label={copied ? "Copied to clipboard" : "Copy code to clipboard"}
          >
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </div>
    );
  },
);
CodeBlock.displayName = "CodeBlock";
