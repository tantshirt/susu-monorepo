"use client";

import * as React from "react";
import { Banner } from "@/components/susu/Banner";
import { FieldError } from "@/components/susu/FieldError";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Wallet-free preview page.
 *
 * Intentionally has zero wallet / Privy / Convex coupling so that
 * Visitors can complete the flow on mobile without ever holding a wallet.
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
    <main className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 md:px-8 md:py-14 lg:grid-cols-[minmax(0,0.95fr)_minmax(24rem,1fr)] lg:items-start">
      <section className="overflow-hidden rounded-3xl border border-border/70 bg-white/95 shadow-2">
        <div className="flex min-h-full flex-col justify-between gap-10 bg-gradient-to-br from-white via-surface to-primary/10 p-6 md:p-8">
          <header className="flex flex-col gap-4">
            <p className="font-mono text-caption font-semibold uppercase tracking-[0.18em] text-primary">
              Wallet-free preview
            </p>
            <h1 className="text-h1 font-semibold tracking-tight text-text">Try Susu without a wallet</h1>
            <p className="max-w-xl text-body leading-7 text-muted">
              This short preview lets you see the layout and language before you
              connect anything. Your input stays in this browser tab.
            </p>
          </header>

          <div className="grid gap-3">
            <div className="rounded-2xl border border-border/70 bg-white p-4 shadow-1">
              <p className="text-caption font-semibold uppercase tracking-wide text-muted">Preview mode</p>
              <p className="mt-2 text-body text-text">No wallet signature or on-chain write is required.</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-white p-4 shadow-1">
              <p className="text-caption font-semibold uppercase tracking-wide text-muted">What you will see</p>
              <p className="mt-2 text-body text-text">Circle context, contribution flow, payout review, and receipts.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <Banner variant="info" className="rounded-2xl border-border/70 bg-white/90">
          No wallet is needed here. Use this page to get a feel for the app first.
        </Banner>

        {submitted ? (
          <Banner variant="success" className="rounded-2xl bg-white">
            Thanks, {name.trim()} - noted: &ldquo;{goal.trim()}&rdquo;.
          </Banner>
        ) : (
          <Card className="overflow-hidden rounded-2xl border-border/70 bg-white/95 shadow-1">
            <CardHeader className="border-b border-border/70 bg-surface2/60">
              <CardTitle>Start with your circle goal</CardTitle>
              <CardDescription>Use sample information to preview the member experience.</CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
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
                    className="h-12 rounded-xl bg-white"
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
                    className="h-12 rounded-xl bg-white"
                    required
                  />
                  {goalError ? <FieldError id="pilot-goal-error">{goalError}</FieldError> : null}
                </div>

                <div className="flex flex-col gap-3 rounded-2xl border border-primary/20 bg-primary/10 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-body text-text">Preview first. Connect only when ready to sign.</p>
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
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </section>
    </main>
  );
}
