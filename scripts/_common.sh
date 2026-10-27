#!/usr/bin/env bash
# Nạp cấu hình chung + cấu hình game. Dùng: source scripts/_common.sh <GameName>
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ ! -f "$ROOT/factory.env" ]]; then
  echo "❌ Thiếu factory.env — copy factory.env.example thành factory.env rồi điền." >&2
  exit 1
fi
set -a
# shellcheck disable=SC1091
source "$ROOT/factory.env"
set +a

load_game() {
  local name="$1"
  GAME_DIR="$ROOT/Games/$name"
  [[ -d "$GAME_DIR" ]] || { echo "❌ Không có game $name trong Games/" >&2; exit 1; }
  set -a
  # shellcheck disable=SC1091
  source "$GAME_DIR/game.env"
  set +a
  export GAME_DIR
}
