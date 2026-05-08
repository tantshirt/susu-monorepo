export type ClusterLabel = 'devnet' | 'mainnet-beta';

type ClusterPillProps = {
  label: ClusterLabel;
};

const CLUSTER_CLASSNAMES: Record<ClusterLabel, string> = {
  devnet: 'bg-mint-500 text-slate-900',
  'mainnet-beta': 'bg-mint-500 border border-mint-700 text-slate-900',
};

export function ClusterPill({ label }: ClusterPillProps) {
  return (
    <span
      data-testid="cluster-pill"
      aria-label={`Active cluster: ${label}`}
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${CLUSTER_CLASSNAMES[label]}`}
    >
      {label}
    </span>
  );
}
