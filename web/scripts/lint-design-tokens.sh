#!/usr/bin/env bash
# PR-3 § 3.8 AI Slop 黑名单 + design token 漂移检测
# 0 命中 = 通过;命中即列出违规位置后 exit 1

set -e

cd "$(dirname "$0")/.."

VIOLATIONS=0

# Tailwind palette class(禁,所有颜色走 var(--xxx))
PALETTE_REGEX='(bg|text|border|from|to|via)-(red|blue|green|purple|pink|yellow|orange|indigo|violet|gray|slate|zinc|neutral|stone|amber|lime|emerald|teal|cyan|sky|fuchsia|rose)-[0-9]+'

# 大圆角(禁 xl/2xl/3xl;rounded-full 在 IconButton 等场景允许 — 走 ESLint disable)
RADIUS_REGEX='rounded-(xl|2xl|3xl|4xl)\b'

# 直接 hex 颜色(组件内不允许)
HEX_REGEX='#[0-9a-fA-F]{3,8}\b'

scan() {
  local pattern="$1"
  local label="$2"
  local hits
  hits=$(grep -rEn --include='*.tsx' --include='*.ts' --include='*.css' \
    --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=scripts \
    "$pattern" app/ lib/ 2>/dev/null | grep -v 'globals.css' || true)
  if [ -n "$hits" ]; then
    echo "❌ [$label] violations:"
    echo "$hits"
    VIOLATIONS=$((VIOLATIONS + 1))
  fi
}

scan "$PALETTE_REGEX" "Tailwind palette class"
scan "$RADIUS_REGEX" "大圆角(禁 xl/2xl/3xl)"

# hex 颜色 — globals.css 允许(token 定义),其他文件违规
hex_hits=$(grep -rEn --include='*.tsx' --include='*.ts' \
  --exclude-dir=node_modules --exclude-dir=.next \
  "$HEX_REGEX" app/ lib/ 2>/dev/null || true)
if [ -n "$hex_hits" ]; then
  echo "❌ [hex 颜色] 组件内不允许 hardcode hex:"
  echo "$hex_hits"
  VIOLATIONS=$((VIOLATIONS + 1))
fi

if [ "$VIOLATIONS" -eq 0 ]; then
  echo "✅ design token lint: 0 violation"
  exit 0
else
  echo "❌ design token lint: $VIOLATIONS 类违规"
  exit 1
fi
