import { fileURLToPath } from 'node:url';

export function classifyDemoError(error) {
  const text = error instanceof Error ? `${error.message}\n${error.stack ?? ''}` : String(error);

  if (isAirdropLimit(text)) {
    return {
      bucket: 'devnet-airdrop-limit',
      message: 'Devnet airdrop rate limit. Run `solana airdrop 2` manually or wait 24h.',
      link: 'docs/troubleshooting.md#devnet-airdrop-limit',
    };
  }

  if (isDependencyMismatch(text)) {
    return {
      bucket: 'dependency-mismatch',
      message: 'Toolchain mismatch. Run `nvm use && rustup show`.',
      link: 'docs/troubleshooting.md#dependency-mismatch',
    };
  }

  return {
    bucket: 'rpc-reachability',
    message: 'Helius/Solana devnet RPC unreachable.',
    link: 'docs/troubleshooting.md#rpc',
  };
}

function isAirdropLimit(text) {
  return /\b(airdrop|faucet)\b/i.test(text) && /(rate limit|429|too many requests|throttle|quota|exceeded)/i.test(text);
}

function isDependencyMismatch(text) {
  return (
    /ERR_MODULE_NOT_FOUND|Cannot find (module|package)|module not found|Package subpath .* is not defined|workspace package|ERR_PNPM|pnpm (install|build).*failed/i.test(
      text,
    ) ||
    /(^|[\s/])(anchor|solana|solana-keygen|node|pnpm)(: command not found|: not found| not found| is not installed| unsupported|required|requires|mismatch)/i.test(
      text,
    ) ||
    /(unsupported|required|requires|mismatch) (Node\.js|node|pnpm|anchor|solana)|(Node\.js|node|pnpm|anchor|solana) version (mismatch|unsupported|required)/i.test(
      text,
    )
  );
}

async function readStdin() {
  let text = '';
  process.stdin.setEncoding('utf8');
  for await (const chunk of process.stdin) {
    text += chunk;
  }
  return text;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const failure = classifyDemoError(await readStdin());
  process.stdout.write(`${failure.bucket}\t${failure.message}\t${failure.link}\n`);
}
