import SwiftUI

struct ShopView: View {
    @EnvironmentObject var app: AppModel
    @EnvironmentObject var store: Store
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        VStack(spacing: 14) {
            HStack(spacing: 12) {
                RoundIconButton(system: "xmark", label: L("Close shop", "Đóng cửa hàng")) { dismiss() }
                Text(L("Shop", "Cửa hàng")).font(Theme.font(30, .black)).foregroundColor(Theme.ink)
                Spacer()
                HStack(spacing: 6) {
                    CoinIcon()
                    Text("\(app.data.coins)").font(Theme.font(17, .black)).foregroundColor(Theme.ink)
                }
                .padding(.horizontal, 14).frame(height: 40)
                .background(Capsule().fill(Color.white))
            }
            ScrollView(showsIndicators: false) {
                VStack(spacing: 10) {
                    if !app.data.starterBought { starterCard }
                    section(L("Coins", "Xu"))
                    row(icon: "circle.fill", title: L("Small bag · 300", "Túi xu nhỏ · 300"), subtitle: nil, id: Store.ID.coins300)
                    row(icon: "circle.grid.2x1.fill", title: L("Medium bag · 1,000", "Túi xu vừa · 1.000"), subtitle: nil, id: Store.ID.coins1000)
                    row(icon: "shippingbox.fill", title: L("Treasure chest · 2,200", "Rương xu · 2.200"),
                        subtitle: L("BEST VALUE", "LỢI NHẤT"), id: Store.ID.coins2200, highlight: true)
                    section(L("Picture chapters", "Chương tranh"))
                    chapterRow(4, id: Store.ID.chapter4)
                    chapterRow(5, id: Store.ID.chapter5)
                    row(icon: nil, title: L("All pictures", "Trọn bộ tranh"),
                        subtitle: L("Every chapter now and in the future", "Mọi chương hiện có và ra sau này"),
                        id: Store.ID.all, owned: app.data.owned.contains("all"), primary: true)
                    VStack(spacing: 6) {
                        Button(L("Restore purchases", "Khôi phục giao dịch")) { Task { await store.restore() } }
                            .font(Theme.font(15, .heavy)).foregroundColor(Theme.primary)
                            .frame(minHeight: 44)
                            .disabled(store.busy != nil)
                        Text(L("No ads · No data collected", "Không quảng cáo · Không thu thập dữ liệu"))
                            .font(Theme.font(13, .bold)).foregroundColor(Theme.sub)
                    }
                    .padding(.top, 8)
                }
                .padding(.bottom, 24)
            }
        }
        .padding(.horizontal, 20)
        .padding(.top, 24)
        .background(Theme.cream.ignoresSafeArea())
    }

    private var starterCard: some View {
        HStack(spacing: 14) {
            VStack(alignment: .leading, spacing: 4) {
                Text(L("ONE TIME ONLY", "CHỈ 1 LẦN")).font(Theme.font(12, .black)).foregroundColor(.white)
                    .padding(.horizontal, 8).padding(.vertical, 2)
                    .background(RoundedRectangle(cornerRadius: 8).fill(Theme.flag))
                Text(L("Starter pack", "Gói khởi đầu")).font(Theme.font(21, .black)).foregroundColor(.white)
                Text(L("800 coins + 3 shields", "800 xu + 3 Khiên")).font(Theme.font(14, .bold)).foregroundColor(Theme.primarySoft)
            }
            Spacer()
            buyButton(Store.ID.starter, fill: Theme.coin, text: Theme.ink)
        }
        .padding(16)
        .background(RoundedRectangle(cornerRadius: 24).fill(Theme.primary))
        .background(RoundedRectangle(cornerRadius: 24).fill(Theme.primaryDark).offset(y: 5))
        .padding(.bottom, 6)
    }

    private func section(_ title: String) -> some View {
        Text(title).font(Theme.font(17, .black)).foregroundColor(Theme.sub)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.top, 8).padding(.leading, 4)
    }

    private func chapterRow(_ chapterID: Int, id: String) -> some View {
        let ch = app.pack.chapter(chapterID)
        return row(icon: nil, title: ch?.name.text ?? "",
                   subtitle: L("12 \(ch?.rarity.title.lowercased() ?? "") pictures · Chapter \(chapterID)",
                               "12 tranh bậc \(ch?.rarity.title ?? "") · Chương \(chapterID)"),
                   id: id, owned: ch.map { app.ownsChapter($0) } ?? false)
    }

    private func row(icon: String?, title: String, subtitle: String?, id: String,
                     highlight: Bool = false, owned: Bool = false, primary: Bool = false) -> some View {
        HStack(spacing: 14) {
            if let icon {
                Image(systemName: icon).font(.system(size: 22, weight: .bold)).foregroundColor(Theme.coin).frame(width: 30)
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(Theme.font(17, .black)).foregroundColor(Theme.ink)
                if let subtitle {
                    Text(subtitle).font(Theme.font(12, .heavy)).foregroundColor(highlight ? Color(hex: "#A15C00") : Theme.sub)
                }
            }
            Spacer()
            if owned {
                Image(systemName: "checkmark.circle.fill").font(.system(size: 26)).foregroundColor(Color(hex: "#2E8B4A"))
                    .accessibilityLabel(L("Owned", "Đã sở hữu"))
            } else {
                buyButton(id, fill: primary || icon != nil ? Theme.primary : Theme.line, text: primary || icon != nil ? .white : Theme.ink)
            }
        }
        .padding(.horizontal, 16).frame(minHeight: 64)
        .background(RoundedRectangle(cornerRadius: 20).fill(Color.white))
        .overlay(RoundedRectangle(cornerRadius: 20).stroke(highlight ? Theme.coin : .clear, lineWidth: 3))
        .background(RoundedRectangle(cornerRadius: 20).fill(Theme.line).offset(y: 3))
    }

    private func buyButton(_ id: String, fill: Color, text: Color) -> some View {
        Button {
            Task { _ = await store.buy(id) }
        } label: {
            ZStack {
                if store.busy == id { ProgressView().tint(text) } else { Text(store.price(id)) }
            }
            .font(Theme.font(16, .black)).foregroundColor(text)
            .frame(minWidth: 84, minHeight: 44)
            .padding(.horizontal, 6)
            .background(RoundedRectangle(cornerRadius: 14).fill(fill))
        }
        .disabled(store.busy != nil)
    }
}

/// Xem trước chương trả phí: 4 tranh bóng mờ, mua chương hoặc trọn bộ.
struct LockedChapterView: View {
    @EnvironmentObject var app: AppModel
    @EnvironmentObject var store: Store
    @Environment(\.dismiss) private var dismiss
    let chapterID: Int

    var body: some View {
        let ch = app.pack.chapter(chapterID)
        let levels = app.pack.levels(in: chapterID)
        let preview = [0, 2, 5, 11].compactMap { $0 < levels.count ? levels[$0] : nil }
        VStack(alignment: .leading, spacing: 18) {
            RoundIconButton(system: "chevron.left", label: L("Back", "Quay lại")) { dismiss() }
            LazyVGrid(columns: [GridItem(.flexible(), spacing: 14), GridItem(.flexible(), spacing: 14)], spacing: 14) {
                ForEach(preview) { lv in
                    PixelArtView(level: lv, silhouette: true, gap: 1)
                        .padding(10)
                        .background(RoundedRectangle(cornerRadius: 18).fill(Color(hex: "#F6F2FC")))
                }
            }
            .padding(16)
            .card(28)
            VStack(alignment: .leading, spacing: 8) {
                HStack(spacing: 10) {
                    Text(L("Chapter \(chapterID) · 12 pictures", "Chương \(chapterID) · 12 tranh"))
                        .font(Theme.font(14, .heavy)).foregroundColor(Theme.sub)
                    if let ch { RarityChip(rarity: ch.rarity) }
                }
                Text(ch?.name.text ?? "").font(Theme.font(32, .black)).foregroundColor(Theme.ink)
                Text(chapterID == 4
                     ? L("The Pyramids, the Great Wall, the Eiffel Tower, the Taj Mahal and more wonders.",
                         "Kim tự tháp, Vạn Lý Trường Thành, Tháp Eiffel, Taj Mahal và nhiều kỳ quan khác.")
                     : L("The Starry Night, The Great Wave, Mona Lisa and more of the world's most famous paintings.",
                         "Đêm đầy sao, Sóng lừng Kanagawa, Mona Lisa và nhiều kiệt tác nổi tiếng nhất thế giới."))
                    .font(Theme.font(16, .bold)).foregroundColor(Theme.sub)
            }
            Spacer(minLength: 0)
            Button {
                Task { if await store.buy(chapterID == 4 ? Store.ID.chapter4 : Store.ID.chapter5) { dismiss() } }
            } label: {
                Text(L("Buy chapter · ", "Mua chương · ") + store.price(chapterID == 4 ? Store.ID.chapter4 : Store.ID.chapter5))
            }
            .buttonStyle(ChunkyButtonStyle())
            .disabled(store.busy != nil)
            Button {
                Task { if await store.buy(Store.ID.all) { dismiss() } }
            } label: {
                VStack(spacing: 2) {
                    Text(L("All pictures · ", "Trọn bộ tranh · ") + store.price(Store.ID.all)).font(Theme.font(18, .black))
                    Text(L("Unlocks chapters 4, 5 and every future chapter", "Mở chương 4, 5 và mọi chương ra sau"))
                        .font(Theme.font(13, .bold)).foregroundColor(Theme.sub)
                }
            }
            .buttonStyle(ChunkyButtonStyle(fill: .white, shadow: Theme.coin, text: Theme.ink, height: 70))
            .disabled(store.busy != nil)
            Button(L("Maybe later", "Để sau")) { dismiss() }
                .font(Theme.font(15, .heavy)).foregroundColor(Theme.sub)
                .frame(maxWidth: .infinity, minHeight: 44)
        }
        .padding(24)
        .background(Theme.cream.ignoresSafeArea())
    }
}

/// Gói khởi đầu, hiện một lần sau bàn thứ 6, luôn có nút đóng rõ ràng.
struct StarterOfferView: View {
    @EnvironmentObject var store: Store
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        VStack(spacing: 18) {
            HStack {
                Spacer()
                RoundIconButton(system: "xmark", label: L("Close", "Đóng")) { dismiss() }
            }
            Image(systemName: "gift.fill").font(.system(size: 64)).foregroundColor(Theme.primary)
            Text(L("Starter pack", "Gói khởi đầu")).font(Theme.font(32, .black)).foregroundColor(Theme.ink)
            Text(L("800 coins + 3 shields to sweep with confidence. Offered once.",
                   "800 xu + 3 Khiên để dò mìn tự tin hơn. Chỉ hiện một lần."))
                .font(Theme.font(17, .bold)).foregroundColor(Theme.sub).multilineTextAlignment(.center)
            Spacer()
            Button(L("Get it · ", "Nhận ngay · ") + store.price(Store.ID.starter)) {
                Task { if await store.buy(Store.ID.starter) { dismiss() } }
            }
            .buttonStyle(ChunkyButtonStyle(fill: Theme.coin, shadow: Theme.coinDark, text: Theme.ink))
            .disabled(store.busy != nil)
            Button(L("No thanks", "Không, cảm ơn")) { dismiss() }
                .font(Theme.font(15, .heavy)).foregroundColor(Theme.sub).frame(minHeight: 44)
        }
        .padding(24)
        .background(Theme.cream.ignoresSafeArea())
        .presentationDetents([.medium, .large])
    }
}
