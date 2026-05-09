"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { isSphereEnabled } from "@/lib/sphere/isEnabled";

/**
 * Story 7.16 — placeholder Sphere on-ramp button. Gated behind
 * `NEXT_PUBLIC_SPHERE_ENABLED` (FR44, NFR-R3): renders nothing when the
 * flag is off so the demo happy-path is Sphere-disabled.
 *
 * The real Sphere SDK wiring (KYC handoff, off-ramp, "Fund wallet" deep
 * flow in Linh's Story 7.20 path) lands in a future story; this component
 * exists today so layouts can reserve space for it without depending on
 * the integration timing.
 */
export interface OnrampButtonProps {
  className?: string;
}

export function OnrampButton({ className }: OnrampButtonProps): React.ReactElement | null {
  if (!isSphereEnabled()) {
    return null;
  }

  // TODO(story-future-sphere): wire the real Sphere on-ramp SDK here —
  // open the hosted Sphere widget, surface KYC state, and integrate with
  // the join-flow "Fund wallet" CTA per PRD §"Sphere on-ramp/off-ramp
  // optional flag" (Linh's Story 7.20 path).
  return (
    <Button
      type="button"
      variant="secondary"
      className={className}
      aria-label="On-ramp via Sphere"
    >
      On-ramp via Sphere
    </Button>
  );
}

export default OnrampButton;
