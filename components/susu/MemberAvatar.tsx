import { useId } from 'react';

export type MemberAvatarTint = 'neutral' | 'diaspora';

export type MemberAvatarProps = Readonly<{
  walletPubkey: string;
  label?: string;
  size?: number;
  tint?: MemberAvatarTint;
  isCurrentRecipient?: boolean;
}>;

const BASE_COLORS = {
  neutral: {
    skin: '#f5efe9',
    accentA: '#6ec9b0',
    accentB: '#3a8f7a',
    stroke: '#21463b',
    ring: '#81f0cf',
  },
  diaspora: {
    skin: '#f2e8de',
    accentA: '#cb7c3c',
    accentB: '#8f4f24',
    stroke: '#4d2b16',
    ring: '#c8783f',
  },
} as const;

function hashWallet(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function toPct(value: number, min: number, max: number): number {
  return min + (value % (max - min + 1));
}

export function MemberAvatar({
  walletPubkey,
  label,
  size = 40,
  tint = 'neutral',
  isCurrentRecipient = false,
}: MemberAvatarProps) {
  const clipId = useId().replace(/:/g, '');
  const hash = hashWallet(walletPubkey);
  const colors = BASE_COLORS[tint];
  const eyeY = toPct(hash >> 3, 38, 46);
  const eyeOffset = toPct(hash >> 7, 10, 15);
  const mouthY = toPct(hash >> 11, 58, 68);
  const patternRadius = toPct(hash >> 15, 6, 14);
  const patternX = toPct(hash >> 19, 22, 78);
  const patternY = toPct(hash >> 23, 16, 84);
  const avatarLabel = label ?? `Member ${walletPubkey.slice(0, 4)}…${walletPubkey.slice(-4)}`;

  return (
    <svg
      role="img"
      aria-label={avatarLabel}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      style={{ borderRadius: '999px', display: 'block' }}
      data-current-recipient={isCurrentRecipient ? 'true' : undefined}
    >
      <defs>
        <clipPath id={`avatar-clip-${hash}-${clipId}`}>
          <circle cx="50" cy="50" r="46" />
        </clipPath>
      </defs>
      <circle cx="50" cy="50" r="48" fill={isCurrentRecipient ? colors.ring : '#d4dbd7'} />
      <g clipPath={`url(#avatar-clip-${hash}-${clipId})`}>
        <rect x="4" y="4" width="92" height="92" fill={colors.accentA} />
        <circle cx={patternX} cy={patternY} r={patternRadius} fill={colors.accentB} opacity="0.9" />
        <circle cx="50" cy="54" r="26" fill={colors.skin} />
        <circle cx={50 - eyeOffset} cy={eyeY} r="3.2" fill={colors.stroke} />
        <circle cx={50 + eyeOffset} cy={eyeY} r="3.2" fill={colors.stroke} />
        <path
          d={`M${50 - eyeOffset},${mouthY} Q50,${mouthY + 8} ${50 + eyeOffset},${mouthY}`}
          fill="none"
          stroke={colors.stroke}
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

export default MemberAvatar;
