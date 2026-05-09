"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "@/lib/utils";
import { Input } from "./input";

/**
 * Combobox — minimal token-driven combobox built on Radix Popover + a filtered
 * list. Story 7.4 ships the primitive shell; downstream stories (7.10/7.11)
 * compose it with their data sources. UX-DR28 focus ring on trigger + input.
 */
export interface ComboboxOption {
  value: string;
  label: string;
}

export interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Select…",
  emptyMessage = "No results.",
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const filtered = React.useMemo(
    () => options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase())),
    [options, query],
  );
  const current = options.find((o) => o.value === value);

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger
        type="button"
        role="combobox"
        aria-expanded={open}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-border bg-surface px-3 py-2",
          "text-body text-text",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
      >
        <span className={cn(!current && "text-muted")}>{current?.label ?? placeholder}</span>
        <span aria-hidden className="ms-2 text-muted">▾</span>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Content
        align="start"
        className={cn(
          "z-50 min-w-[var(--radix-popover-trigger-width)] rounded-md border border-border bg-surface p-2 text-text shadow-2",
        )}
      >
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="mb-2 h-8"
        />
        <ul role="listbox" className="max-h-60 overflow-auto">
          {filtered.length === 0 && (
            <li className="px-2 py-1.5 text-caption text-muted">{emptyMessage}</li>
          )}
          {filtered.map((opt) => (
            <li
              key={opt.value}
              role="option"
              aria-selected={opt.value === value}
              className={cn(
                "cursor-pointer rounded-sm px-2 py-1.5 text-body text-text",
                "hover:bg-surface2",
                opt.value === value && "bg-surface2",
              )}
              onClick={() => {
                onChange?.(opt.value);
                setOpen(false);
                setQuery("");
              }}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Root>
  );
}
