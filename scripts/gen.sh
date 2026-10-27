#!/usr/bin/env bash
# Sinh .xcodeproj từ project.yml.  Dùng: scripts/gen.sh OrbitDodge [--open]
set -euo pipefail
source "$(dirname "$0")/_common.sh"
load_game "${1:?Tên game}"
cd "$GAME_DIR"
xcodegen generate --quiet
echo "✅ $GAME_DIR/$GAME_NAME.xcodeproj"
[[ "${2:-}" == "--open" ]] && open "$GAME_NAME.xcodeproj"
exit 0
