#!/usr/bin/env python3
"""Sinh icon 1024x1024 tạm (không alpha — Apple bắt buộc). Dùng: make_icon.py "Tên" out.png [hue]"""
import colorsys
import hashlib
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont

name = sys.argv[1]
out = sys.argv[2]
hue = float(sys.argv[3]) if len(sys.argv) > 3 else int(hashlib.md5(name.encode()).hexdigest()[:4], 16) / 65535

S = 1024


def rgb(h, s, v):
    return tuple(int(c * 255) for c in colorsys.hsv_to_rgb(h % 1, s, v))


img = Image.new("RGB", (S, S))
top, bottom = rgb(hue, 0.75, 0.35), rgb(hue + 0.08, 0.9, 0.12)
d = ImageDraw.Draw(img)
for y in range(S):
    t = y / S
    d.line([(0, y), (S, y)], fill=tuple(int(top[i] * (1 - t) + bottom[i] * t) for i in range(3)))

# Vòng phát sáng + chấm (motif chung, đổi màu theo game)
glow = Image.new("RGB", (S, S), (0, 0, 0))
g = ImageDraw.Draw(glow)
accent = rgb(hue + 0.5, 0.7, 1.0)
g.ellipse([212, 212, 812, 812], outline=accent, width=46)
g.ellipse([740, 330, 880, 470], fill=rgb(hue + 0.15, 0.4, 1.0))
glow = glow.filter(ImageFilter.GaussianBlur(28))
img = Image.blend(img, Image.composite(glow, img, glow.convert("L")), 0.9)
d = ImageDraw.Draw(img)
d.ellipse([212, 212, 812, 812], outline=accent, width=30)
d.ellipse([755, 345, 865, 455], fill=(255, 255, 255))

letter = name.strip()[0].upper()
font = None
for f in ["/System/Library/Fonts/SFNSRounded.ttf", "/System/Library/Fonts/Supplemental/Arial Rounded Bold.ttf",
          "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"]:
    try:
        font = ImageFont.truetype(f, 380)
        break
    except OSError:
        continue
font = font or ImageFont.load_default()
bbox = d.textbbox((0, 0), letter, font=font)
w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
d.text(((S - w) / 2 - bbox[0], (S - h) / 2 - bbox[1]), letter, font=font, fill=(255, 255, 255))

img.save(out, "PNG")
print("icon ->", out)
