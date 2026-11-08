#!/usr/bin/env bash
# Build + upload TestFlight + đẩy metadata/screenshots.  Dùng: scripts/ship.sh OrbitDodge [beta|metadata|all]
set -euo pipefail
source "$(dirname "$0")/_common.sh"
load_game "${1:?Tên game}"
LANE="${2:-all}"

"$ROOT/scripts/gen.sh" "$GAME_NAME"
cd "$ROOT"

case "$LANE" in
  beta)     fastlane beta && (fastlane testers || echo "⚠️ testers lỗi") ;;
  metadata) fastlane metadata ;;
  all)      fastlane beta && fastlane metadata && (fastlane testers || echo "⚠️ testers lỗi") ;;
  submit)   fastlane submit ;;
  resubmit) fastlane resubmit ;;
  store)    fastlane store ;;
  testers)  fastlane testers ;;
  *) echo "lane không hợp lệ: $LANE"; exit 1 ;;
esac
