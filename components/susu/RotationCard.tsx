import MemberAvatar from './MemberAvatar';

export type RotationCardState = 'active' | 'awaiting-start' | 'completed' | 'slashed';
export type RotationCardLayout = 'compact' | 'expanded';

export type RotationMember = Readonly<{
  walletPubkey: string;
  label?: string;
  tint?: 'neutral' | 'diaspora';
}>;

export type RotationCardProps = Readonly<{
  groupName: string;
  cluster: string;
  members: ReadonlyArray<RotationMember>;
  currentRecipientWallet: string;
  currentMonth: number;
  totalMonths: number;
  memberPosition: number;
  actionType: 'contribute' | 'claim';
  contributeByLabel?: string;
  collateralRequiredLabel: string;
  curvePlotHref?: string;
  state?: RotationCardState;
  layout?: RotationCardLayout;
}>;

const stateStyles: Record<RotationCardState, Readonly<{ bg: string; border: string; label: string }>> = {
  active: { bg: '#f4fbf8', border: '#98dcc4', label: 'Active' },
  'awaiting-start': { bg: '#f7f8fa', border: '#cbd3de', label: 'Awaiting start' },
  completed: { bg: '#f7fbf3', border: '#c7dfb6', label: 'Completed' },
  slashed: { bg: '#fff4f2', border: '#f2b7ad', label: 'Slashed' },
};

function ClusterPill({ cluster }: Readonly<{ cluster: string }>) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: 999,
        padding: '2px 8px',
        fontSize: 12,
        background: '#edf5ff',
        color: '#275ea6',
      }}
    >
      {cluster}
    </span>
  );
}

function RotationActionCopy({ actionType, contributeByLabel }: Readonly<{ actionType: 'contribute' | 'claim'; contributeByLabel?: string }>) {
  if (actionType === 'claim') {
    return <>Claim now</>;
  }
  return <>Contribute by {contributeByLabel ?? 'Dec 1'}</>;
}

export function RotationCard({
  groupName,
  cluster,
  members,
  currentRecipientWallet,
  currentMonth,
  totalMonths,
  memberPosition,
  actionType,
  contributeByLabel,
  collateralRequiredLabel,
  curvePlotHref = '/static/curve-collateral.svg',
  state = 'active',
  layout = 'expanded',
}: RotationCardProps) {
  const selectedState = stateStyles[state];
  const gridTemplate = layout === 'compact' ? '1fr' : '2fr 1fr';

  return (
    <article
      style={{
        border: `1px solid ${selectedState.border}`,
        borderRadius: 14,
        background: selectedState.bg,
        padding: 16,
        display: 'grid',
        gap: 14,
        gridTemplateColumns: gridTemplate,
      }}
      data-state={state}
      data-layout={layout}
    >
      <section style={{ display: 'grid', gap: 10 }}>
        <header style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
          <strong>{groupName}</strong>
          <span style={{ fontSize: 12, color: '#58606a' }}>{selectedState.label}</span>
        </header>
        <div>
          <ClusterPill cluster={cluster} />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {members.slice(0, 8).map((member) => (
            <MemberAvatar
              key={member.walletPubkey}
              walletPubkey={member.walletPubkey}
              label={member.label}
              tint={member.tint ?? 'neutral'}
              isCurrentRecipient={member.walletPubkey === currentRecipientWallet}
              size={layout === 'compact' ? 30 : 34}
            />
          ))}
        </div>
        <div style={{ fontSize: 13, color: '#2f3945' }}>
          Month {currentMonth}/{totalMonths}
        </div>
      </section>

      <section style={{ display: 'grid', alignContent: 'start', gap: 8 }}>
        <div style={{ fontSize: 13 }}>
          Position <strong>{memberPosition}</strong>
        </div>
        <div style={{ fontSize: 13 }}>
          Next action: <strong><RotationActionCopy actionType={actionType} contributeByLabel={contributeByLabel} /></strong>
        </div>
        <div style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
          Curve collateral: <strong>{collateralRequiredLabel}</strong>
          <a href={curvePlotHref} aria-label="Open static SVG curve plot" title="See the static SVG collateral curve">
            <span aria-hidden="true">ⓘ</span>
            <span
              style={{
                position: 'absolute',
                width: 1,
                height: 1,
                padding: 0,
                margin: -1,
                overflow: 'hidden',
                clip: 'rect(0 0 0 0)',
                whiteSpace: 'nowrap',
                border: 0,
              }}
            >
              Open static SVG curve plot
            </span>
          </a>
        </div>
      </section>
    </article>
  );
}

export default RotationCard;
