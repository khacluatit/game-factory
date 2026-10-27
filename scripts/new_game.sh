#!/usr/bin/env bash
# Tạo game mới từ Template.  Dùng: scripts/new_game.sh OrbitDodge "Orbit Dodge"
set -euo pipefail
source "$(dirname "$0")/_common.sh"

NAME="${1:?Tên game (không dấu, không cách), vd OrbitDodge}"
DISPLAY="${2:-$NAME}"
LOWER="$(echo "$NAME" | tr '[:upper:]' '[:lower:]')"
DEST="$ROOT/Games/$NAME"
[[ -e "$DEST" ]] && { echo "❌ $DEST đã tồn tại"; exit 1; }

cp -R "$ROOT/Template" "$DEST"
PRIVACY="$GITHUB_PAGES_URL/$LOWER/privacy.html"
SUPPORT="$GITHUB_PAGES_URL/$LOWER/"

# Thay placeholder trong mọi file text
grep -rlI "__" "$DEST" | while read -r f; do
  sed -i.bak \
    -e "s#__GAME_NAME__#$NAME#g" \
    -e "s#__DISPLAY__#$DISPLAY#g" \
    -e "s#__LOWER__#$LOWER#g" \
    -e "s#__BUNDLE_PREFIX__#$BUNDLE_PREFIX#g" \
    -e "s#__PRIVACY_URL__#$PRIVACY#g" \
    -e "s#__SUPPORT_URL__#$SUPPORT#g" \
    "$f" && rm -f "$f.bak"
done

# Privacy policy + trang support (host qua GitHub Pages thư mục docs/)
mkdir -p "$ROOT/docs/$LOWER"
sed -e "s#__DISPLAY__#$DISPLAY#g" -e "s#__EMAIL__#$SUPPORT_EMAIL#g" -e "s#__DATE__#$(date +%Y-%m-%d)#g" \
  "$ROOT/scripts/privacy_template.html" > "$ROOT/docs/$LOWER/privacy.html"
sed -e "s#__DISPLAY__#$DISPLAY#g" -e "s#__EMAIL__#$SUPPORT_EMAIL#g" \
  "$ROOT/scripts/support_template.html" > "$ROOT/docs/$LOWER/index.html"

# Icon tạm (thay bằng icon đẹp sau)
python3 "$ROOT/scripts/make_icon.py" "$DISPLAY" "$DEST/Resources/Assets.xcassets/AppIcon.appiconset/icon.png"

echo "✅ Đã tạo $DEST"
echo "   Tiếp: viết gameplay trong Games/$NAME/Sources/MainScene.swift, rồi scripts/gen.sh $NAME"
