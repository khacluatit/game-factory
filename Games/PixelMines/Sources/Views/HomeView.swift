import SwiftUI

struct HomeView: View {
    @EnvironmentObject var app: AppModel

    var body: some View {
        VStack(spacing: 22) {
            HStack {
                CoinPill()
                Spacer()
                RoundIconButton(system: "gearshape.fill", label: L("Settings", "Cài đặt")) { app.sheet = .settings }
            }

            VStack(spacing: 10) {
                logo
                Text("Pixel Mines").font(Theme.font(44, .black)).foregroundColor(Theme.ink)
                Text(L("Sweep with logic · Reveal the picture", "Dò mìn bằng logic · Giải xong lộ tranh"))
                    .font(Theme.font(16, .bold)).foregroundColor(Theme.sub)
                    .multilineTextAlignment(.center)
            }
            .padding(.top, 4)

            continueCard
            dailyCard
            Spacer(minLength: 0)
            HStack(spacing: 14) {
                tile(system: "square.grid.2x2.fill", title: L("Album", "Album"),
                     subtitle: L("\(app.totalDone) / \(app.freeLevelCount) pictures", "\(app.totalDone) / \(app.freeLevelCount) tranh")) {
                    app.route = .album
                }
                tile(system: "bag.fill", title: L("Shop", "Cửa hàng"),
                     subtitle: L("Coins & new chapters", "Xu và chương mới")) {
                    app.sheet = .shop
                }
            }
        }
        .padding(.horizontal, 22)
        .padding(.top, 20)
        .padding(.bottom, 24)
    }

    private var logo: some View {
        let colors = ["#FF4D5E", "#C9C3F2", "#FFC83D", "#C9C3F2", "#C9C3F2", "#4CC36B", "#C9C3F2", "#5B4BDB",
                      "#FF6B6B", "#C9C3F2", "#FF4D5E", "#C9C3F2", "#C9C3F2", "#FFC83D", "#C9C3F2", "#4CC36B"]
        return LazyVGrid(columns: Array(repeating: GridItem(.fixed(18), spacing: 3), count: 4), spacing: 3) {
            ForEach(0..<16, id: \.self) { i in
                RoundedRectangle(cornerRadius: 4).fill(Color(hex: colors[i])).frame(width: 18, height: 18)
            }
        }
        .frame(width: 84)
        .accessibilityHidden(true)
    }

    private var continueCard: some View {
        let lv = app.nextLevel
        return VStack(spacing: 18) {
            if let lv {
                HStack(spacing: 18) {
                    PixelArtView(level: lv, revealedRows: app.data.boards[lv.id] == nil ? 0 : lv.h * 6 / 10, gap: 1)
                        .frame(width: 96, height: 104)
                        .padding(6)
                        .background(RoundedRectangle(cornerRadius: 12).fill(Theme.line))
                    VStack(alignment: .leading, spacing: 6) {
                        Text(L("Chapter \(lv.chapter) · Picture \(lv.index + 1)/12", "Chương \(lv.chapter) · Tranh \(lv.index + 1)/12"))
                            .font(Theme.font(14, .bold)).foregroundColor(Theme.sub)
                        Text(app.pack.chapter(lv.chapter)?.name.text ?? "")
                            .font(Theme.font(22, .black)).foregroundColor(Theme.ink)
                            .fixedSize(horizontal: false, vertical: true)
                        ProgressBar(value: Double(app.completed(in: lv.chapter)) / 12, height: 10).frame(width: 170)
                        Text(L("\(app.completed(in: lv.chapter)) of 12 done", "Xong \(app.completed(in: lv.chapter))/12 tranh"))
                            .font(Theme.font(13, .bold)).foregroundColor(Theme.sub)
                    }
                    Spacer(minLength: 0)
                }
            }
            Button(L("Continue", "Chơi tiếp")) { app.playNext() }
                .buttonStyle(ChunkyButtonStyle())
        }
        .padding(20)
        .card(28)
    }

    private var dailyCard: some View {
        HStack(spacing: 16) {
            ZStack {
                LazyVGrid(columns: Array(repeating: GridItem(.fixed(10), spacing: 2), count: 6), spacing: 2) {
                    ForEach(0..<36, id: \.self) { i in
                        RoundedRectangle(cornerRadius: 2).fill(Color(hex: i % 7 == 0 ? "#DCD7FA" : "#C9C3F2"))
                            .frame(width: 10, height: 10)
                    }
                }
                .frame(width: 72)
                Text(app.dailyDoneToday ? "✓" : "?")
                    .font(Theme.font(30, .black)).foregroundColor(.white)
                    .shadow(color: Theme.ink, radius: 0, x: 1, y: 1)
                    .shadow(color: Theme.ink, radius: 0, x: -1, y: -1)
            }
            .accessibilityHidden(true)
            VStack(alignment: .leading, spacing: 4) {
                Text(L("Daily picture", "Tranh hôm nay")).font(Theme.font(19, .black)).foregroundColor(Theme.ink)
                Text(app.dailyDoneToday
                     ? L("Done · \(app.data.dailyStreak)-day streak", "Đã xong · chuỗi \(app.data.dailyStreak) ngày")
                     : L("Streak \(app.nextStreak) · reward +\(app.dailyReward) coins", "Chuỗi \(app.nextStreak) ngày · thưởng +\(app.dailyReward) xu"))
                    .font(Theme.font(14, .bold)).foregroundColor(Theme.sub)
            }
            Spacer(minLength: 0)
            Button { app.playDaily() } label: {
                Text(L("Play", "Chơi")).font(Theme.font(16, .black)).foregroundColor(Theme.ink)
                    .padding(.horizontal, 18).frame(height: 44)
                    .background(RoundedRectangle(cornerRadius: 14).fill(Theme.coin))
            }
        }
        .padding(.horizontal, 18).padding(.vertical, 16)
        .card(24)
    }

    private func tile(system: String, title: String, subtitle: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 4) {
                Image(systemName: system).font(.system(size: 24, weight: .bold)).foregroundColor(Theme.primary)
                Text(title).font(Theme.font(19, .black)).foregroundColor(Theme.ink)
                Text(subtitle).font(Theme.font(13, .bold)).foregroundColor(Theme.sub).lineLimit(1)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(18)
            .card(22)
        }
    }
}
