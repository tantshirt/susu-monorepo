"use client";

import * as React from "react";
import { Banner } from "@/components/susu/Banner";
import { FieldError } from "@/components/susu/FieldError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Non-crypto pilot page (Story 7.18, UX-DR49).
 *
 * Intentionally has zero wallet / Privy / Convex coupling so that
 * non-technical pilot testers (Vietnamese-speaker, Arabic-speaker,
 * English-speaker) can complete the flow on mobile without ever holding a
 * wallet — they're testing UX/a11y, not crypto. Renders a small "intro
 * yourself" form using the components Epic 7 ships (Banner, FieldError,
 * shadcn Button/Input/Label) so the page also doubles as an axe-core
 * smoke-test surface.
 *
 * All styling rides semantic tokens; layout uses logical Tailwind directional
 * properties (`ms-*` / `me-*` / `ps-*` / `pe-*`) so RTL flips correctly when
 * the surrounding `[locale]` layout sets `dir="rtl"` for Arabic.
 */
export default function PilotPage() {
  const [name, setName] = React.useState("");
  const [goal, setGoal] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);
  const [touched, setTouched] = React.useState(false);

  const nameError = touched && name.trim() === "" ? "Please enter your name." : null;
  const goalError = touched && goal.trim() === "" ? "Please share a goal." : null;

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched(true);
    if (name.trim() === "" || goal.trim() === "") return;
    setSubmitted(true);
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-12">
      <header className="flex flex-col gap-2">
        <h1 className="text-h2 font-semibold text-text">Pilot — say hello</h1>
        <p className="text-body text-muted">
          A short non-crypto preview so you can experience Susu&apos;s look,
          language, and motion without a wallet. Your input stays in this
          browser tab.
        </p>
      </header>

      <Banner variant="info">
        This page intentionally avoids wallets, on-chain calls, and Convex —
        it&apos;s a pure UI / a11y showcase.
      </Banner>

      {submitted ? (
        <Banner variant="success">
          Thanks, {name.trim()} — noted: &ldquo;{goal.trim()}&rdquo;.
        </Banner>
      ) : (
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="pilot-name">Your name</Label>
            <Input
              id="pilot-name"
              name="name"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-invalid={Boolean(nameError)}
              aria-describedby={nameError ? "pilot-name-error" : undefined}
              required
            />
            {nameError ? <FieldError id="pilot-name-error">{nameError}</FieldError> : null}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="pilot-goal">A savings goal you care about</Label>
            <Input
              id="pilot-goal"
              name="goal"
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              aria-invalid={Boolean(goalError)}
              aria-describedby={goalError ? "pilot-goal-error" : undefined}
              required
            />
            {goalError ? <FieldError id="pilot-goal-error">{goalError}</FieldError> : null}
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" variant="primary">
              Say hello
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setName("");
                setGoal("");
                setTouched(false);
              }}
            >
              Reset
            </Button>
          </div>
        </form>
      )}
    </main>
  );
}
