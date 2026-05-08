#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="${1:-$ROOT/docs/legal-opinion.pdf}"

mkdir -p "$(dirname "$OUT")"

node - "$OUT" <<'NODE'
const fs = require('node:fs');

const out = process.argv[2];
const lines = [
  'Legal Opinion Placeholder',
  'Susu Protocol - Story 5.9',
  'Firm Letter Delayed',
  'As of 2026-05-08, a signed law-firm legal opinion has not been published.',
  'This placeholder documents the delay and preserves the public artifact path.',
  'SOW summary: docs/legal-sow-summary.md',
  'Requested scope: non-custodial / non-fee / non-yield posture under FinCEN FIN-2019-G001.',
  'Background: docs/fincen-cvc-framing.md, docs/threat-model.md, docs/architecture-notes.md.',
  'This placeholder is not legal advice and is not a legal opinion.',
];

function esc(value) {
  return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

const commands = ['BT', '/F1 12 Tf', '72 744 Td'];
for (const [index, line] of lines.entries()) {
  if (index > 0) {
    commands.push('0 -20 Td');
  }
  commands.push(`(${esc(line)}) Tj`);
}
commands.push('ET');

const stream = `${commands.join('\n')}\n`;
const objects = [
  '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
  '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
  '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n',
  '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
  `5 0 obj\n<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}endstream\nendobj\n`,
];

let pdf = '%PDF-1.4\n';
const offsets = [0];
for (const object of objects) {
  offsets.push(Buffer.byteLength(pdf, 'latin1'));
  pdf += object;
}
const xrefOffset = Buffer.byteLength(pdf, 'latin1');
pdf += `xref\n0 ${objects.length + 1}\n`;
pdf += '0000000000 65535 f \n';
for (let i = 1; i <= objects.length; i += 1) {
  pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
}
pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

fs.writeFileSync(out, pdf, 'latin1');
NODE

echo "render-legal-placeholder: wrote $OUT"
