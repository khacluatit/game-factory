#!/usr/bin/env bash
# Chụp screenshot App Store (6.9" bắt buộc) bằng simulator, app tự chơi ở -screenshotMode.
# Dùng: scripts/screenshots.sh OrbitDodge
set -euo pipefail
source "$(dirname "$0")/_common.sh"
load_game "${1:?Tên game}"

DEVICE="${SHOT_DEVICE:-iPhone 16 Pro Max}"
OUT="$GAME_DIR/screenshots/en-US"
mkdir -p "$OUT"
rm -f "$OUT"/*.png

"$ROOT/scripts/gen.sh" "$GAME_NAME"
cd "$GAME_DIR"

UDID=$(xcrun simctl list devices available -j | python3 -c "
import json,sys
d=json.load(sys.stdin)['devices']
for rt,devs in d.items():
    for x in devs:
        if x['name']=='$DEVICE': print(x['udid']); sys.exit()
")
[[ -n "$UDID" ]] || { echo "❌ Không thấy simulator '$DEVICE'"; exit 1; }

xcrun simctl boot "$UDID" 2>/dev/null || true
xcrun simctl status_bar "$UDID" override --time "9:41" --batteryState charged --batteryLevel 100 --cellularBars 4 || true

xcodebuild -project "$GAME_NAME.xcodeproj" -scheme "$GAME_NAME" -configuration Release \
  -destination "id=$UDID" -derivedDataPath build CODE_SIGNING_ALLOWED=NO -quiet build
APP=$(find build/Build/Products -name "$GAME_NAME.app" -maxdepth 3 | head -1)

xcrun simctl install "$UDID" "$APP"
xcrun simctl terminate "$UDID" "$BUNDLE_ID" 2>/dev/null || true

# Ảnh 1: menu
xcrun simctl launch "$UDID" "$BUNDLE_ID" -screenshotModeMenu >/dev/null
sleep 3; xcrun simctl io "$UDID" screenshot "$OUT/01_menu.png"
xcrun simctl terminate "$UDID" "$BUNDLE_ID"

# Ảnh 2-4: đang chơi (tự chơi)
xcrun simctl launch "$UDID" "$BUNDLE_ID" -screenshotMode >/dev/null
for i in 2 3 4; do
  sleep 4; xcrun simctl io "$UDID" screenshot "$OUT/0${i}_play.png"
done
xcrun simctl terminate "$UDID" "$BUNDLE_ID"
echo "✅ Screenshots: $OUT"
