import { useEffect, useMemo, useRef, useState } from 'react';

export type TransactionActionType = 'contribute' | 'claim' | 'top-up' | 'withdraw' | 'cancel-group';

export type TransactionActionDescriptor = {
  actionType: TransactionActionType;
  actionLabel: string;
  recipient: string;
  amount: string;
  token: {
    symbol: string;
    mint: string;
    explorerUrl: string;
  };
  fee: string;
  cluster: string;
};

export type SimulationResult = {
  ok: boolean;
  reason?: string;
};

export type PreparedTransaction = {
  serialized: Uint8Array;
};

export type TransactionSimulationSdk = {
  simulateTransaction: (tx: PreparedTransaction) => Promise<SimulationResult>;
};

export type TransactionConfirmModalProps = {
  isOpen: boolean;
  descriptor: TransactionActionDescriptor;
  preparedTransaction: PreparedTransaction;
  sdk: TransactionSimulationSdk;
  isSigning: boolean;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
};

const ACTION_VARIANTS: Record<TransactionActionType, { title: string; confirmLabel: string; copy: string }> = {
  contribute: {
    title: 'Confirm contribution',
    confirmLabel: 'Confirm contribution',
    copy: 'You are about to contribute funds to this Susu group.',
  },
  claim: {
    title: 'Confirm claim',
    confirmLabel: 'Confirm claim',
    copy: 'You are about to claim this payout to your wallet.',
  },
  'top-up': {
    title: 'Confirm top-up',
    confirmLabel: 'Confirm top-up',
    copy: 'You are about to top up your collateral for this group.',
  },
  withdraw: {
    title: 'Confirm withdraw',
    confirmLabel: 'Confirm withdraw',
    copy: 'You are about to withdraw collateral back to your wallet.',
  },
  'cancel-group': {
    title: 'Confirm group cancellation',
    confirmLabel: 'Confirm cancel group',
    copy: 'You are about to cancel this group and stop future actions.',
  },
};

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, details, [tabindex]:not([tabindex="-1"])';

function truncateRecipient(recipient: string): string {
  if (recipient.length <= 12) {
    return recipient;
  }

  return `${recipient.slice(0, 6)}…${recipient.slice(-6)}`;
}

export function TransactionConfirmModal({
  isOpen,
  descriptor,
  preparedTransaction,
  sdk,
  isSigning,
  onConfirm,
  onClose,
}: TransactionConfirmModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [expandedRecipient, setExpandedRecipient] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [simulationState, setSimulationState] = useState<'idle' | 'loading' | 'success' | 'failure'>('idle');
  const [simulationReason, setSimulationReason] = useState<string>('');

  const variant = useMemo(() => ACTION_VARIANTS[descriptor.actionType], [descriptor.actionType]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(max-width: 639px)');
    const update = () => setIsMobile(mediaQuery.matches);
    update();
    mediaQuery.addEventListener('change', update);

    return () => {
      mediaQuery.removeEventListener('change', update);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setSimulationState('idle');
      setSimulationReason('');
      return;
    }

    let cancelled = false;
    setSimulationState('loading');
    setSimulationReason('');

    sdk
      .simulateTransaction(preparedTransaction)
      .then((result) => {
        if (cancelled) {
          return;
        }

        if (result.ok) {
          setSimulationState('success');
          return;
        }

        setSimulationState('failure');
        setSimulationReason(result.reason ?? 'Unknown simulation error');
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        const reason = error instanceof Error ? error.message : 'Unknown simulation error';
        setSimulationState('failure');
        setSimulationReason(reason);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, preparedTransaction, sdk]);

  useEffect(() => {
    if (!isOpen || !dialogRef.current) {
      return;
    }

    const dialog = dialogRef.current;
    const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    focusable[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (!isSigning) {
          onClose();
        }
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const ordered = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (ordered.length === 0) {
        event.preventDefault();
        return;
      }

      const first = ordered[0];
      const last = ordered[ordered.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    dialog.addEventListener('keydown', onKeyDown);
    return () => {
      dialog.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, isSigning, onClose]);

  if (!isOpen) {
    return null;
  }

  const recipientText = expandedRecipient ? descriptor.recipient : truncateRecipient(descriptor.recipient);
  const canConfirm = simulationState === 'success' && !isSigning;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: isMobile ? 'stretch' : 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        zIndex: 1000,
        padding: isMobile ? 0 : '1rem',
      }}
    >
      <dialog
        ref={dialogRef}
        open
        role="dialog"
        aria-modal="true"
        aria-labelledby="transaction-confirm-title"
        style={{
          margin: 0,
          border: 'none',
          width: '100%',
          maxWidth: isMobile ? '100%' : 560,
          minHeight: isMobile ? '100%' : 'auto',
          borderRadius: isMobile ? 0 : 12,
          padding: '1.25rem',
        }}
      >
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 id="transaction-confirm-title" style={{ margin: 0 }}>
            {variant.title}
          </h2>
          <button type="button" aria-label="Close confirmation" disabled={isSigning} onClick={onClose}>
            ×
          </button>
        </header>

        <p>{variant.copy}</p>

        <dl>
          <div>
            <dt>Action</dt>
            <dd>{descriptor.actionLabel}</dd>
          </div>
          <div>
            <dt>Recipient</dt>
            <dd>
              <button type="button" onClick={() => setExpandedRecipient((value) => !value)}>
                {recipientText}
              </button>
            </dd>
          </div>
          <div>
            <dt>Amount</dt>
            <dd>
              <span style={{ color: '#12b981', fontWeight: 600 }}>{descriptor.amount}</span>
            </dd>
          </div>
          <div>
            <dt>Token</dt>
            <dd>
              {descriptor.token.symbol}{' '}
              <a href={descriptor.token.explorerUrl} target="_blank" rel="noreferrer">
                {descriptor.token.mint}
              </a>
            </dd>
          </div>
          <div>
            <dt>Network fee</dt>
            <dd>{descriptor.fee}</dd>
          </div>
          <div>
            <dt>Cluster</dt>
            <dd>
              <span
                style={{
                  borderRadius: 999,
                  padding: '0.125rem 0.5rem',
                  border: '1px solid #94a3b8',
                  display: 'inline-block',
                }}
              >
                {descriptor.cluster}
              </span>
            </dd>
          </div>
        </dl>

        <section aria-live="polite" data-testid="simulation-result" style={{ minHeight: '1.5rem' }}>
          {simulationState === 'loading' && <span>Simulating transaction…</span>}
          {simulationState === 'success' && (
            <span style={{ color: '#12b981', fontWeight: 600 }}>Will succeed ✓</span>
          )}
          {simulationState === 'failure' && (
            <span style={{ color: '#ef4444', fontWeight: 600 }}>Will fail: {simulationReason}</span>
          )}
        </section>

        <footer style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button type="button" onClick={onClose} disabled={isSigning}>
            Cancel
          </button>
          <button type="button" onClick={onConfirm} disabled={!canConfirm}>
            {isSigning ? 'Signing…' : variant.confirmLabel}
          </button>
        </footer>
      </dialog>
    </div>
  );
}

export default TransactionConfirmModal;
