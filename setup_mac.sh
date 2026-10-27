#!/usr/bin/env bash
# Chạy 1 lần trên Mac. Yêu cầu: đã cài Xcode từ App Store và mở 1 lần để đồng ý license.
set -euo pipefail

xcode-select -p >/dev/null || { echo "❌ Cài Xcode trước"; exit 1; }
command -v brew >/dev/null || /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

brew install xcodegen fastlane python@3 gh
python3 -m pip install --user --break-system-packages pillow || python3 -m pip install --user pillow

# Simulator dùng để chụp screenshot 6.9"
xcrun simctl list devices available | grep -q "iPhone 16 Pro Max" || \
  echo "⚠️  Chưa có simulator iPhone 16 Pro Max — mở Xcode → Settings → Components để tải iOS runtime."

mkdir -p "$HOME/.appstoreconnect"
[[ -f factory.env ]] || { cp factory.env.example factory.env; echo "👉 Điền factory.env rồi chạy lại các lệnh."; }
chmod +x scripts/*.sh
echo "✅ Xong. Thử: scripts/gen.sh OrbitDodge --open"
