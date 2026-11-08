#!/usr/bin/env python3
"""Sinh Resources/levels.json cho Pixel Mines.

Với mỗi tranh trong pictures.py: đặt bom theo seed cố định, chạy solver logic từ ô bắt đầu
và chỉ nhận bố cục giải được hoàn toàn không cần đoán. Kết quả cố định giữa các lần chạy.

    python3 Games/PixelMines/tools/build_levels.py            # ghi levels.json
    python3 Games/PixelMines/tools/build_levels.py --preview  # thêm ảnh xem trước vào tools/preview/
"""
import json
import random
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from pictures import CHAPTERS, PALETTE, PICTURES  # noqa: E402

OUT = HERE.parent / "Resources" / "levels.json"
RARITY_ORDER = ["common", "rare", "precious", "legendary"]


def neighbors(i, w, h):
    x, y = i % w, i // w
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            if dx or dy:
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h:
                    yield ny * w + nx


def solve(w, h, mines, start):
    """Trả về True nếu giải hết bàn chỉ bằng suy luận (luật đơn, luật tập con, đếm tổng bom)."""
    n = w * h
    mine = [False] * n
    for m in mines:
        mine[m] = True
    count = [sum(mine[j] for j in neighbors(i, w, h)) for i in range(n)]
    opened = [False] * n
    flagged = [False] * n
    total_safe = n - len(mines)
    opened_count = 0

    def open_cell(i):
        nonlocal opened_count
        stack = [i]
        while stack:
            c = stack.pop()
            if opened[c] or flagged[c]:
                continue
            if mine[c]:
                raise RuntimeError("solver opened a mine")
            opened[c] = True
            opened_count += 1
            if count[c] == 0:
                stack.extend(j for j in neighbors(c, w, h) if not opened[j])

    if mine[start] or count[start] != 0:
        return False
    open_cell(start)

    while opened_count < total_safe:
        progress = False
        constraints = []
        for i in range(n):
            if not opened[i] or count[i] == 0:
                continue
            unknown = [j for j in neighbors(i, w, h) if not opened[j] and not flagged[j]]
            if not unknown:
                continue
            need = count[i] - sum(flagged[j] for j in neighbors(i, w, h))
            if need == 0:
                for j in unknown:
                    open_cell(j)
                progress = True
            elif need == len(unknown):
                for j in unknown:
                    flagged[j] = True
                progress = True
            else:
                constraints.append((frozenset(unknown), need))
        if progress:
            continue
        # Luật tập con giữa hai ràng buộc
        cs = list(set(constraints))
        for a, na in cs:
            for b, nb in cs:
                if a is b or not a < b:
                    continue
                rest = b - a
                diff = nb - na
                if diff == 0:
                    for j in rest:
                        open_cell(j)
                    progress = True
                elif diff == len(rest):
                    for j in rest:
                        flagged[j] = True
                    progress = True
            if progress:
                break
        if progress:
            continue
        # Đếm tổng bom còn lại
        unknown_all = [i for i in range(n) if not opened[i] and not flagged[i]]
        left = len(mines) - sum(flagged)
        if left == 0:
            for j in unknown_all:
                open_cell(j)
            continue
        if left == len(unknown_all):
            for j in unknown_all:
                flagged[j] = True
            continue
        return False
    return True


def make_level(pic, chapter, index, seed):
    rows = pic["rows"]
    h = len(rows)
    w = len(rows[0])
    assert all(len(r) == w for r in rows), f"{pic['en']}: các dòng không cùng độ dài"
    pal = dict(PALETTE)
    pal.update(pic.get("pal", {}))
    pal["."] = pic["bg"]
    colors = []
    pixels = []
    for row in rows:
        for ch in row:
            hexc = pal[ch]
            if hexc not in colors:
                colors.append(hexc)
            pixels.append(colors.index(hexc))
    assert len(colors) <= 36

    lo, hi = chapter["density"]
    rng = random.Random(seed)
    start = (h // 2) * w + w // 2
    banned = {start, *neighbors(start, w, h)}
    candidates = [i for i in range(w * h) if i not in banned]
    for attempt in range(20000):
        density = lo + (hi - lo) * (index / 11 if index else 0)
        if pic.get("tutorial"):
            density = pic["tutorial"]
        k = max(2, round(w * h * density))
        mines = sorted(rng.sample(candidates, k))
        if solve(w, h, mines, start):
            break
    else:
        raise SystemExit(f"Không tìm được bàn giải được cho {pic['en']}")

    rarity = pic.get("rarity", chapter["rarity"])
    return {
        "id": f"c{chapter['id']}-{index + 1:02d}",
        "chapter": chapter["id"],
        "index": index,
        "name": {"en": pic["en"], "vi": pic["vi"]},
        "about": pic.get("about"),
        "rarity": rarity,
        "w": w,
        "h": h,
        "colors": colors,
        "pixels": "".join("0123456789abcdefghijklmnopqrstuvwxyz"[p] for p in pixels),
        "mines": mines,
        "start": start,
        "attempts": attempt + 1,
    }


def main():
    by_chapter = {c["id"]: [] for c in CHAPTERS}
    for p in PICTURES:
        by_chapter[p["chapter"]].append(p)
    levels = []
    for chapter in CHAPTERS:
        for index, pic in enumerate(by_chapter[chapter["id"]]):
            seed = f"pixelmines-{chapter['id']}-{index}-{pic['en']}"
            lv = make_level(pic, chapter, index, seed)
            levels.append(lv)
            print(f"{lv['id']:7} {pic['en']:22} {lv['w']}x{lv['h']} mines={len(lv['mines']):3} tries={lv['attempts']}")
    data = {
        "chapters": [
            {"id": c["id"], "name": {"en": c["en"], "vi": c["vi"]}, "rarity": c["rarity"], "product": c["product"],
             "count": len(by_chapter[c["id"]])}
            for c in CHAPTERS
        ],
        "levels": [{k: v for k, v in lv.items() if k != "attempts"} for lv in levels],
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")))
    print(f"✅ {len(levels)} màn → {OUT}")
    if "--preview" in sys.argv:
        preview(levels)


def preview(levels):
    from PIL import Image, ImageDraw

    cell, pad = 18, 14
    cols = 6
    tiles = []
    for lv in levels:
        img = Image.new("RGB", (lv["w"] * cell, lv["h"] * cell), "#FFF7EC")
        d = ImageDraw.Draw(img)
        for i, ch in enumerate(lv["pixels"]):
            x, y = (i % lv["w"]) * cell, (i // lv["w"]) * cell
            d.rectangle([x, y, x + cell - 1, y + cell - 1], fill=lv["colors"][int(ch, 36)])
        tiles.append((lv, img))
    out_dir = HERE / "preview"
    out_dir.mkdir(exist_ok=True)
    for chap in sorted({lv["chapter"] for lv in levels}):
        items = [t for t in tiles if t[0]["chapter"] == chap]
        tw = max(i.width for _, i in items) + pad
        th = max(i.height for _, i in items) + pad + 16
        rows = (len(items) + cols - 1) // cols
        sheet = Image.new("RGB", (cols * tw + pad, rows * th + pad), "#F3EEE6")
        d = ImageDraw.Draw(sheet)
        for k, (lv, img) in enumerate(items):
            x = pad + (k % cols) * tw
            y = pad + (k // cols) * th
            sheet.paste(img, (x, y))
            d.text((x, y + img.height + 2), lv["name"]["en"], fill="#2B2340")
        sheet.save(out_dir / f"chapter{chap}.png")


if __name__ == "__main__":
    main()
