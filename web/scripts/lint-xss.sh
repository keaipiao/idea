#!/usr/bin/env bash
# PR-3 ADR-18 XSS 缓解:禁 dangerouslySetInnerHTML
# 已在 eslint.config.mjs react/no-danger: error,本脚本作为 CI 双保险

set -e

cd "$(dirname "$0")/.."

hits=$(grep -rEn --include='*.tsx' --include='*.ts' \
  --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=scripts \
  'dangerouslySetInnerHTML' app/ lib/ __tests__/ 2>/dev/null || true)

if [ -n "$hits" ]; then
  echo "❌ XSS lint: dangerouslySetInnerHTML found:"
  echo "$hits"
  exit 1
fi

echo "✅ XSS lint: 0 dangerouslySetInnerHTML"
exit 0
