# 🎮 Game Factory — iOS (Swift + SpriteKit + AdMob + StoreKit 2)

Dây chuyền ra game iOS bắt trend nhanh. **Claude viết code, bạn bấm duyệt 2 lần.**

```
 [1] Săn trend ──► [2] BẠN chọn ý tưởng ──► [3] Claude code game
                                                   │
 [6] Đọc số liệu ◄── [5] BẠN test + Submit ◄── [4] Build → TestFlight (tự động)
```

## Cấu trúc

| Thư mục | Vai trò |
|---|---|
| `Core/` | Swift package dùng chung: AdMob (interstitial + rewarded có giới hạn tần suất), UMP consent (EU), ATT, StoreKit 2 Remove Ads + Restore, lưu điểm, haptics, analytics, **GameShell** (menu, HUD, game over, continue bằng rewarded, settings). |
| `Template/` | Khuôn cho game mới. Chỉ cần viết `MainScene.swift`. |
| `Games/<Tên>/` | Từng game: `game.env` (ID, bundle, ads), `Sources/`, `metadata/` (mô tả App Store), icon. |
| `scripts/` | `new_game.sh`, `gen.sh`, `screenshots.sh`, `ship.sh`, `make_icon.py`. |
| `fastlane/` | Lane `beta` (build + TestFlight), `metadata` (đẩy mô tả + ảnh), `create_app`. |
| `docs/` | Privacy policy + trang support mỗi game (bật GitHub Pages trỏ vào `/docs`). |

## Setup lần đầu (≈30 phút, chỉ làm 1 lần)

1. Cài **Xcode** từ App Store, mở 1 lần.
2. `git clone` repo này về Mac → `./setup_mac.sh`
3. Điền `factory.env`:
   - `TEAM_ID`: developer.apple.com → Membership.
   - **API key**: App Store Connect → Users and Access → Integrations → App Store Connect API → tạo key quyền **Admin** (App Manager không ký được bản phát hành trên cloud) → tải file `.p8` vào `~/.appstoreconnect/`.
   - `GITHUB_PAGES_URL`: repo → Settings → Pages → Branch `main`, folder `/docs`.
4. App Store Connect → Business: ký **Paid Apps Agreement**, khai thuế, ngân hàng. Đăng ký **Small Business Program** (phí 15%).
5. Tạo tài khoản **AdMob**, thêm payment info.

## Ra 1 game (mỗi lần)

```bash
scripts/new_game.sh JellyStack "Jelly Stack"   # tạo khung + icon + privacy page
# ... Claude viết Games/JellyStack/Sources/MainScene.swift ...
scripts/gen.sh JellyStack --open                # mở Xcode, chạy thử trên máy/simulator
```

**Việc tay (5–10 phút/game)** — Apple chưa cho tự động hoàn toàn:
- App Store Connect → **New App** với đúng bundle ID trong `game.env` (hoặc `APPLE_ID=you@x.com fastlane create_app` sau khi nạp env).
- Tạo **In-App Purchase** Non-Consumable ID = `IAP_REMOVE_ADS_ID`, giá $1.99–2.99, thêm screenshot review.
- AdMob → Add app → tạo 2 ad unit (Interstitial, Rewarded) → dán ID vào `game.env`. Thêm `app-ads.txt` vào trang support.
- App Privacy (nutrition label): chọn *Identifiers, Usage Data, Diagnostics* — dùng cho *Third-Party Advertising*, có tracking.

```bash
scripts/screenshots.sh JellyStack    # chụp 4 ảnh 6.9" tự động
scripts/ship.sh JellyStack           # build → TestFlight → đẩy metadata + ảnh
```

Cài TestFlight, chơi thử 5 phút → trong App Store Connect chọn build → **Submit for Review**.

## Checklist chống reject

- [ ] Gameplay **khác biệt thật** so với game trước (4.3 Spam). Không tái dùng cùng scene đổi màu.
- [ ] Không dùng tên/nhân vật/hình/nhạc của game, phim, meme có bản quyền (5.2). Tên app không chứa tên game khác.
- [ ] Đủ nội dung: tăng độ khó, điểm cao, ít nhất 1 cơ chế phụ (4.2).
- [ ] Nút **Restore Purchases** (có sẵn trong Settings).
- [ ] Privacy URL mở được; ATT text rõ ràng; khai báo App Privacy khớp AdMob.
- [ ] Release build dùng ad unit **thật**; Debug luôn dùng test ID (Core tự xử lý). **Không bao giờ bấm quảng cáo thật của chính mình.**
- [ ] Không hiện interstitial trong 60s đầu, tối đa 1 lần/3 ván, cách nhau ≥45s (cấu hình trong `game.env`).
- [ ] Ảnh screenshot đúng gameplay thật, không chèn chữ quảng cáo sai sự thật.
- [ ] Age rating: trả lời bảng câu hỏi (quảng cáo → thường 4+ hoặc 9+).

## Vai trò của Claude trong mỗi vòng

1. **Săn trend**: quét top chart / TikTok / tin game → 3–5 ý tưởng kèm điểm khác biệt + rủi ro bản quyền.
2. **Code**: `new_game.sh` → viết `MainScene.swift` (gameplay, độ khó, autopilot cho screenshot) + metadata App Store (tên, subtitle, keywords, mô tả).
3. **Build & ship**: khi Claude được liên kết với Mac, Claude tự chạy `gen.sh` → `screenshots.sh` → `ship.sh`, sửa lỗi build nếu có.
4. **Theo dõi**: đọc số liệu (downloads, retention, doanh thu ads) → đề xuất làm sâu hay bỏ.

## Mở rộng sau

- Thêm mạng ads vào AdMob mediation (AppLovin, Unity, Meta) bằng adapter SPM tương ứng.
- Nối Firebase Analytics trong `Analytics.log`.
- Game Center leaderboard (tăng retention, Apple thích).
