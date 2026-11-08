import SwiftUI

/// Danh sách 5 chương.
struct AlbumView: View {
    @EnvironmentObject var app: AppModel

    var body: some View {
        VStack(spacing: 16) {
            HStack(spacing: 12) {
                RoundIconButton(system: "chevron.left", label: L("Back", "Quay lại")) { app.route = .home }
                Text(L("Album", "Album")).font(Theme.font(32, .black)).foregroundColor(Theme.ink)
                Spacer()
                HStack(spacing: 6) {
                    Image(systemName: "star.fill").foregroundColor(Theme.coin)
                    Text(L("\(app.totalStars) stars", "\(app.totalStars) sao")).font(Theme.font(16, .black)).foregroundColor(Theme.ink)
                }
                .padding(.horizontal, 14).frame(height: 40)
                .background(Capsule().fill(Color.white))
            }
            ScrollView(showsIndicators: false) {
                VStack(spacing: 12) {
                    ForEach(app.pack.chapters) { ch in chapterRow(ch) }
                    if !app.data.owned.contains("all") { bundleBanner.padding(.top, 6) }
                }
                .padding(.bottom, 24)
            }
        }
        .padding(.horizontal, 20)
        .padding(.top, 20)
    }

    private func chapterRow(_ ch: Chapter) -> some View {
        let unlocked = app.isUnlocked(ch)
        let cover = app.pack.levels(in: ch.id).last
        return Button { app.openChapter(ch) } label: {
            HStack(spacing: 16) {
                ZStack {
                    if let cover {
                        PixelArtView(level: cover, silhouette: !unlocked, gap: 0.5)
                            .frame(width: 70, height: 78)
                    }
                    if !unlocked {
                        Image(systemName: "lock.fill").font(.system(size: 24, weight: .bold)).foregroundColor(Theme.ink)
                    }
                }
                .frame(width: 86, height: 92)
                .background(RoundedRectangle(cornerRadius: 14).fill(Theme.line.opacity(0.6)))
                VStack(alignment: .leading, spacing: 6) {
                    HStack(spacing: 8) {
                        Text(L("Chapter \(ch.id)", "Chương \(ch.id)")).font(Theme.font(13, .heavy)).foregroundColor(Theme.sub)
                        RarityChip(rarity: ch.rarity)
                    }
                    Text(ch.name.text).font(Theme.font(19, .black)).foregroundColor(Theme.ink)
                        .multilineTextAlignment(.leading)
                    if unlocked {
                        HStack(spacing: 10) {
                            ProgressBar(value: Double(app.completed(in: ch.id)) / Double(max(1, ch.count)), height: 8)
                                .frame(width: 110)
                            Text(L("\(app.completed(in: ch.id))/\(ch.count) · \(app.starsIn(ch.id)) stars",
                                   "\(app.completed(in: ch.id))/\(ch.count) · \(app.starsIn(ch.id)) sao"))
                                .font(Theme.font(13, .heavy)).foregroundColor(Theme.sub)
                        }
                    } else if ch.product == nil {
                        Text(L("Finish 8 pictures in chapter \(ch.id - 1) to unlock", "Xong 8 tranh chương \(ch.id - 1) để mở"))
                            .font(Theme.font(13, .bold)).foregroundColor(Theme.sub)
                            .multilineTextAlignment(.leading)
                    }
                }
                Spacer(minLength: 0)
                if !unlocked, let p = ch.product {
                    Text(app.store.price("com.beemob.pixelmines.\(p)"))
                        .font(Theme.font(15, .black)).foregroundColor(Theme.ink)
                        .padding(.horizontal, 12).frame(height: 36)
                        .background(RoundedRectangle(cornerRadius: 12).fill(Theme.coin))
                }
            }
            .padding(14)
            .card(24)
        }
        .buttonStyle(.plain)
    }

    private var bundleBanner: some View {
        Button { app.sheet = .shop } label: {
            HStack(spacing: 14) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(L("All pictures", "Trọn bộ tranh")).font(Theme.font(18, .black)).foregroundColor(.white)
                    Text(L("Every chapter now and in the future", "Mọi chương hiện có và ra sau này"))
                        .font(Theme.font(13, .bold)).foregroundColor(Theme.primarySoft)
                }
                Spacer()
                Text(app.store.price(Store.ID.all))
                    .font(Theme.font(17, .black)).foregroundColor(Theme.ink)
                    .padding(.horizontal, 14).frame(height: 40)
                    .background(RoundedRectangle(cornerRadius: 14).fill(Color.white))
            }
            .padding(.horizontal, 18).padding(.vertical, 16)
            .background(RoundedRectangle(cornerRadius: 22).fill(Theme.primary))
            .background(RoundedRectangle(cornerRadius: 22).fill(Theme.primaryDark).offset(y: 5))
        }
        .buttonStyle(.plain)
    }
}

/// Trang album của một chương: 12 khung tranh.
struct ChapterView: View {
    @EnvironmentObject var app: AppModel
    let chapterID: Int
    @State private var viewing: Level?

    var body: some View {
        let ch = app.pack.chapter(chapterID)
        VStack(spacing: 16) {
            HStack(spacing: 12) {
                RoundIconButton(system: "chevron.left", label: L("Back", "Quay lại")) { app.route = .album }
                VStack(alignment: .leading, spacing: 0) {
                    Text(L("Chapter \(chapterID)", "Chương \(chapterID)")).font(Theme.font(13, .heavy)).foregroundColor(Theme.sub)
                    Text(ch?.name.text ?? "").font(Theme.font(22, .black)).foregroundColor(Theme.ink)
                }
                Spacer()
                CoinPill()
            }
            if app.data.chapterBonus.contains(chapterID) {
                Text(L("All 36 stars! Golden frame unlocked.", "Đủ 36 sao! Đã mở khung viền vàng."))
                    .font(Theme.font(14, .heavy)).foregroundColor(Theme.ink)
                    .padding(.horizontal, 14).padding(.vertical, 8)
                    .background(Capsule().fill(Theme.coinSoft))
            }
            ScrollView(showsIndicators: false) {
                LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 12), count: 3), spacing: 14) {
                    ForEach(app.pack.levels(in: chapterID)) { lv in frame(lv) }
                }
                .padding(.bottom, 24)
            }
        }
        .padding(.horizontal, 20)
        .padding(.top, 20)
        .sheet(item: $viewing) { lv in PictureDetailView(level: lv).environmentObject(app) }
    }

    private func frame(_ lv: Level) -> some View {
        let done = app.isDone(lv)
        let open = app.isUnlocked(lv)
        return Button {
            if done { viewing = lv } else if open { app.play(lv) }
        } label: {
            VStack(spacing: 6) {
                ZStack {
                    PixelArtView(level: lv, revealedRows: done ? nil : (app.data.boards[lv.id] != nil ? lv.h / 2 : nil),
                                 silhouette: !done && app.data.boards[lv.id] == nil, gap: 0.5)
                        .rarityFrame(lv.rarity)
                    if !open {
                        Image(systemName: "lock.fill").font(.system(size: 20, weight: .bold)).foregroundColor(Theme.ink.opacity(0.7))
                    }
                }
                if done {
                    StarsRow(count: app.stars(lv), size: 12)
                } else {
                    Text(open ? L("Play", "Chơi") : " ").font(Theme.font(13, .black)).foregroundColor(Theme.primary)
                }
            }
        }
        .buttonStyle(.plain)
        .disabled(!open && !done)
    }
}

/// Xem lớn một tranh đã giải.
struct PictureDetailView: View {
    @EnvironmentObject var app: AppModel
    @Environment(\.dismiss) private var dismiss
    let level: Level

    var body: some View {
        VStack(spacing: 18) {
            HStack {
                Spacer()
                RoundIconButton(system: "xmark", label: L("Close", "Đóng")) { dismiss() }
            }
            RarityChip(rarity: level.rarity)
            Text(level.name.text).font(Theme.font(28, .black)).foregroundColor(Theme.ink).multilineTextAlignment(.center)
            PixelArtView(level: level, gap: 1).padding(14).card(28).frame(maxWidth: 320)
            if let about = level.about {
                Text(about.text).font(Theme.font(16, .bold)).foregroundColor(Theme.sub).multilineTextAlignment(.center)
            }
            StarsRow(count: app.stars(level), size: 24)
            Spacer()
            ShareLink(item: PictureExport.image(level), preview: SharePreview(level.name.text, image: PictureExport.image(level))) {
                Label(L("Save picture", "Lưu ảnh"), systemImage: "square.and.arrow.down")
            }
            .buttonStyle(ChunkyButtonStyle(fill: .white, shadow: Theme.line, text: Theme.ink, height: 54, size: 17))
            Button(L("Play again", "Chơi lại")) {
                dismiss()
                app.play(level)
            }
            .buttonStyle(ChunkyButtonStyle(height: 58, size: 19))
        }
        .padding(24)
        .background(Theme.cream.ignoresSafeArea())
    }
}

/// Xuất tranh pixel ra ảnh để chia sẻ hoặc lưu vào Photos (qua bảng chia sẻ của hệ thống, không cần xin quyền).
enum PictureExport {
    @MainActor
    static func image(_ level: Level) -> Image {
        let view = PixelArtView(level: level, gap: 0)
            .frame(width: CGFloat(level.w) * 64, height: CGFloat(level.h) * 64)
        let r = ImageRenderer(content: view)
        r.scale = 1
        if let ui = r.uiImage { return Image(uiImage: ui) }
        return Image(systemName: "photo")
    }
}
