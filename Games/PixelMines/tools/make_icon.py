#!/usr/bin/env python3
"""Vẽ icon 1024×1024 cho Pixel Mines (không trong suốt, iOS tự bo góc)."""
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parent.parent / "Resources/Assets.xcassets/AppIcon.appiconset/icon.png"
S = 1024
CREAM, INK = "#FFF7EC", "#2B2340"
COVER, COVER_HI, COVER_LO = "#C9C3F2", "#DCD7FA", "#B3ABE6"
LAYOUT = [
    ["#FFE8EE", "#4CC36B", "#2E8B4A", "#FFE8EE"],
    ["#FF4D5E", "#C62F45", "#FF4D5E", "#FFE07A"],
    ["C", "C", "F", "C"],
    ["C", "C", "C", "C"],
]


def font(size):
    for p in ["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", "/Library/Fonts/Arial Bold.ttf",
              "/System/Library/Fonts/Supplemental/Arial Bold.ttf"]:
        if Path(p).exists():
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def main():
    img = Image.new("RGB", (S, S), CREAM)
    d = ImageDraw.Draw(img)
    pad, gap = 112, 24
    tile = (S - 2 * pad - 3 * gap) // 4
    radius = tile // 5
    for r, row in enumerate(LAYOUT):
        for c, v in enumerate(row):
            x = pad + c * (tile + gap)
            y = pad + r * (tile + gap)
            box = [x, y, x + tile, y + tile]
            if v in ("C", "F"):
                d.rounded_rectangle(box, radius, fill=COVER_LO)
                d.rounded_rectangle([x, y, x + tile, y + tile - 14], radius, fill=COVER_HI)
                d.rounded_rectangle([x, y + 12, x + tile, y + tile - 14], radius, fill=COVER)
                if v == "F":
                    cx, cy = x + tile * 0.42, y + tile * 0.18
                    d.line([cx, cy, cx, y + tile * 0.84], fill=INK, width=18)
                    d.polygon([(cx + 6, cy), (x + tile * 0.84, cy + tile * 0.17), (cx + 6, cy + tile * 0.34)],
                              fill="#FF6B6B", outline=INK, width=8)
            else:
                d.rounded_rectangle(box, radius, fill=v)
    # Số "2" trên ô quả dâu (ô hàng 2, cột 2)
    x = pad + 1 * (tile + gap) + tile / 2
    y = pad + 1 * (tile + gap) + tile / 2
    f = font(int(tile * 0.62))
    d.text((x, y), "2", font=f, fill="white", anchor="mm", stroke_width=12, stroke_fill=INK)
    img.save(OUT)
    print(f"✅ {OUT}")
    if "--preview" in sys.argv:
        img.resize((256, 256)).save(Path(__file__).resolve().parent / "preview" / "icon.png")


if __name__ == "__main__":
    main()
