---
stepsCompleted:
  - step-01-preflight-and-context
  - step-02-generation-mode
  - step-03-test-strategy
  - step-04c-aggregate
  - step-05-validate-and-complete
lastStep: step-05-validate-and-complete
lastSaved: 2026-05-08
storyId: "7.10"
storyKey: story-7-10-transaction-confirm-modal
storyFile: output_susu/implementation-artifacts/7-10-transaction-confirm-modal.md
atddChecklistPath: tests/atdd/story-7-10-transaction-confirm-modal.atdd.md
generatedTestFiles:
  - tests/atdd/story-7-10-transaction-confirm-modal.static.red.test.mjs
  - tests/playwright/transaction-confirm-modal.spec.ts
inputDocuments:
  - components/susu/TransactionConfirmModal.tsx
---

# ATDD Checklist: Story 7.10 — `TransactionConfirmModal`

- `components/susu/TransactionConfirmModal.tsx` includes typed descriptor props, prepared transaction simulation, and variant copy for contribute/claim/top-up/withdraw/cancel-group.
- Simulation loading/success/failure states are visible and confirm remains disabled unless simulation succeeds.
- Accessibility contract includes `<dialog>`, `aria-modal="true"`, focus trapping, `aria-live="polite"`, and escape handling blocked while signing.
- Responsive behavior keeps modal full-screen on mobile (`<640px`) and centered card on tablet+.
- `tests/playwright/transaction-confirm-modal.spec.ts` covers success, failure, and mid-signing escape scenarios.
