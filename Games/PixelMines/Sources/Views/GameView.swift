import SpriteKit
import SwiftUI

struct GameView: View {
    @EnvironmentObject var app: AppModel
    @ObservedObject var game: GameController

    var body: some View {
        ZStack {
            VStack(spacing: 14) {
                topBar
                infoRow
                SpriteView(scene: game.scene, options: [.allowsTransparency])
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .overlay(alignment: .top) { tutorialCard }
                    .accessibilityLabel(L("Game board", "Bàn chơi"))
                toolbar
            }
            .padding(.horizontal, 16)
            .padding(.top, 16)
            .padding(.bottom, 12)

            if case .lost = game.phase { LoseOverlay(game: game).transition(.opacity) }
            if game.showCelebration { WinView(game: game).transition(.opacity) }
        }
        .animation(.easeInOut(duration: 0.25), value: game.phase)
        .animation(.easeInOut(duration: 0.3), value: game.showCelebration)
        .onDisappear { game.saveProgress() }
    }

    private var topBar: some View {
        HStack {
            RoundIconButton(system: "chevron.left", label: L("Back", "Quay lại")) { app.leaveGame() }
            Spacer()
            VStack(spacing: 0) {
                Text(game.title).font(Theme.font(13, .heavy)).foregroundColor(Theme.sub)
                Text(game.chapterName).font(Theme.font(18, .black)).foregroundColor(Theme.ink).lineLimit(1)
            }
            Spacer()
            HStack(spacing: 8) {
                RoundIconButton(system: "questionmark", label: L("How to play", "Cách chơi")) { app.sheet = .howTo }
                CoinPill()
            }
        }
    }

    private var infoRow: some View {
        HStack(spacing: 12) {
            ProgressBar(value: game.progress, height: 14)
            Text("\(Int((game.progress * 100).rounded()))%")
                .font(Theme.font(15, .black)).foregroundColor(Theme.ink).monospacedDigit()
                .frame(minWidth: 44, alignment: .leading)
            if game.shieldActive {
                Label(L("Shield", "Khiên"), systemImage: "shield.fill")
                    .font(Theme.font(13, .heavy)).foregroundColor(Theme.primaryDark)
                    .padding(.horizontal, 10).frame(height: 30)
                    .background(Capsule().fill(Theme.primarySoft))
            }
        }
        .padding(.horizontal, 8)
    }

    @ViewBuilder private var tutorialCard: some View {
        if let text = game.tutorial {
            HStack(alignment: .top, spacing: 12) {
                Image(systemName: "hand.point.up.left.fill").font(.system(size: 22)).foregroundColor(Theme.primary)
                Text(text).font(Theme.font(15, .bold)).foregroundColor(Theme.ink)
                    .fixedSize(horizontal: false, vertical: true)
                Spacer(minLength: 0)
                Button { game.tutorial = nil } label: {
                    Text(L("Got it", "Đã hiểu")).font(Theme.font(14, .black)).foregroundColor(Theme.primary)
                }
                .frame(minHeight: 44)
            }
            .padding(14)
            .card(18)
            .padding(.horizontal, 4)
            .transition(.move(edge: .top).combined(with: .opacity))
        }
    }

    private var toolbar: some View {
        HStack(spacing: 10) {
            HStack(spacing: 4) {
                modeButton(.dig, title: L("Dig", "Đào"), system: "hammer.fill")
                modeButton(.flag, title: L("Flag", "Cờ"), system: "flag.fill")
            }
            .padding(4)
            .background(RoundedRectangle(cornerRadius: 18).fill(Color.white))
            .background(RoundedRectangle(cornerRadius: 18).fill(Theme.line).offset(y: 3))

            toolButton(title: L("Hint", "Đèn soi"), cost: "\(game.hintPrice)") { game.useHint() }
            toolButton(title: L("Shield", "Khiên"),
                       cost: app.data.shields > 0 ? "×\(app.data.shields)" : "\(Price.shield)",
                       showCoin: app.data.shields == 0) { game.useShield() }
                .disabled(game.shieldActive)
                .opacity(game.shieldActive ? 0.5 : 1)
        }
        .frame(height: 72)
    }

    private func modeButton(_ m: GameController.Mode, title: String, system: String) -> some View {
        let on = game.mode == m
        return Button { game.mode = m; Feedback.light() } label: {
            VStack(spacing: 2) {
                Image(systemName: system).font(.system(size: 18, weight: .bold))
                    .foregroundColor(m == .flag && !on ? Theme.flag : (on ? .white : Theme.ink))
                Text(title).font(Theme.font(14, .black)).foregroundColor(on ? .white : Theme.ink)
            }
            .frame(width: 68, height: 60)
            .background(RoundedRectangle(cornerRadius: 14).fill(on ? Theme.primary : Color.clear))
        }
        .accessibilityAddTraits(on ? .isSelected : [])
    }

    private func toolButton(title: String, cost: String, showCoin: Bool = true, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            VStack(spacing: 3) {
                Text(title).font(Theme.font(15, .black)).foregroundColor(Theme.ink)
                HStack(spacing: 4) {
                    if showCoin { CoinIcon(size: 14) }
                    Text(cost).font(Theme.font(13, .heavy)).foregroundColor(Theme.sub)
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(RoundedRectangle(cornerRadius: 18).fill(Color.white))
            .background(RoundedRectangle(cornerRadius: 18).fill(Theme.line).offset(y: 3))
        }
        .buttonStyle(.plain)
    }
}

/// Trúng bom: tiếp tục bằng xu (bom thành cờ) hoặc chơi lại.
struct LoseOverlay: View {
    @EnvironmentObject var app: AppModel
    @EnvironmentObject var store: Store
    @ObservedObject var game: GameController

    var body: some View {
        ZStack(alignment: .bottom) {
            Theme.ink.opacity(0.55).ignoresSafeArea()
            VStack(spacing: 14) {
                Image(systemName: "drop.fill").font(.system(size: 44)).foregroundColor(Theme.ink)
                Text(L("Oops! An ink bomb", "Ối! Trúng bom mực")).font(Theme.font(28, .black)).foregroundColor(Theme.ink)
                Text(L("Continue to turn this bomb into a flag and keep going from right here.",
                       "Tiếp tục để biến quả bom này thành cờ và chơi tiếp từ đúng chỗ đó."))
                    .font(Theme.font(16, .bold)).foregroundColor(Theme.sub).multilineTextAlignment(.center)
                if game.canContinue {
                    Button { game.continueGame() } label: {
                        HStack(spacing: 10) {
                            Text(L("Continue", "Tiếp tục"))
                            HStack(spacing: 4) { CoinIcon(size: 18); Text("\(Price.continueGame)") }
                                .padding(.horizontal, 10).frame(height: 32)
                                .background(Capsule().fill(Color.white.opacity(0.18)))
                        }
                    }
                    .buttonStyle(ChunkyButtonStyle())
                } else {
                    HStack {
                        Text(L("Continue needs \(Price.continueGame) coins", "Tiếp tục cần \(Price.continueGame) xu"))
                            .font(Theme.font(15, .heavy)).foregroundColor(Theme.ink)
                        Spacer()
                        HStack(spacing: 4) {
                            CoinIcon(size: 16)
                            Text(L("You have \(app.data.coins)", "Bạn có \(app.data.coins)"))
                        }
                        .font(Theme.font(15, .heavy)).foregroundColor(Theme.danger)
                    }
                    .padding(.horizontal, 16).padding(.vertical, 12)
                    .background(RoundedRectangle(cornerRadius: 16).fill(Color.white))
                    Button {
                        Task {
                            if await store.buy(Store.ID.coins300) { game.continueGame() }
                        }
                    } label: {
                        Text(L("Buy 300 coins · \(store.price(Store.ID.coins300))", "Mua 300 xu · \(store.price(Store.ID.coins300))"))
                    }
                    .buttonStyle(ChunkyButtonStyle(fill: Theme.coin, shadow: Theme.coinDark, text: Theme.ink, size: 20))
                    .disabled(store.busy != nil)
                }
                Button(L("Play this picture again", "Chơi lại bức này")) { game.restart() }
                    .buttonStyle(ChunkyButtonStyle(fill: .white, shadow: Theme.line, text: Theme.ink, height: 54, size: 17))
            }
            .padding(.horizontal, 24).padding(.top, 28).padding(.bottom, 24)
            .background(RoundedRectangle(cornerRadius: 32).fill(Theme.cream))
            .padding(.horizontal, 16).padding(.bottom, 16)
        }
    }
}

/// Màn thắng: tranh hoàn chỉnh, sao, xu, độ quý và giới thiệu ngắn.
struct WinView: View {
    @EnvironmentObject var app: AppModel
    @ObservedObject var game: GameController

    var body: some View {
        let reward = game.reward
        VStack(spacing: 16) {
            VStack(spacing: 4) {
                Text(game.title).font(Theme.font(15, .heavy)).foregroundColor(Theme.sub)
                Text(L("Complete!", "Hoàn thành!")).font(Theme.font(38, .black)).foregroundColor(Theme.ink)
            }
            StarsRow(count: reward?.stars ?? 3, size: 40)
            PixelArtView(level: game.level, gap: 1)
                .frame(maxWidth: 300, maxHeight: 330)
                .rarityFrame(game.level.rarity)
                .shadow(color: Theme.line, radius: 0, x: 0, y: 6)
            VStack(spacing: 6) {
                if game.level.rarity != .common { RarityChip(rarity: game.level.rarity) }
                Text(game.level.name.text).font(Theme.font(26, .black)).foregroundColor(Theme.ink)
                    .multilineTextAlignment(.center)
                if let about = game.level.about {
                    Text(about.text).font(Theme.font(15, .bold)).foregroundColor(Theme.sub).multilineTextAlignment(.center)
                }
                if let r = reward, r.coins > 0 {
                    HStack(spacing: 8) {
                        CoinIcon()
                        Text("+\(r.coins) " + L("coins", "xu")).font(Theme.font(18, .black)).foregroundColor(Theme.ink)
                    }
                    .padding(.horizontal, 16).frame(height: 40)
                    .background(Capsule().fill(Theme.coinSoft))
                    if r.chapterBonus {
                        Text(L("Chapter bonus: all 36 stars!", "Thưởng chương: đủ 36 sao!"))
                            .font(Theme.font(14, .heavy)).foregroundColor(Theme.sub)
                    } else if let s = r.streak {
                        Text(L("\(s)-day streak", "Chuỗi \(s) ngày")).font(Theme.font(14, .heavy)).foregroundColor(Theme.sub)
                    }
                }
            }
            Spacer(minLength: 0)
            if game.nextLevel != nil {
                Button(L("Next picture", "Tranh tiếp")) { game.goNext() }
                    .buttonStyle(ChunkyButtonStyle())
            }
            HStack(spacing: 12) {
                Button(game.isDaily ? L("Home", "Trang chủ") : L("Album", "Về album")) { game.goAlbum() }
                    .buttonStyle(ChunkyButtonStyle(fill: .white, shadow: Theme.line, text: Theme.ink, height: 54, size: 17))
                ShareLink(item: PictureExport.image(game.level),
                          preview: SharePreview(game.level.name.text, image: PictureExport.image(game.level))) {
                    Label(L("Save", "Lưu ảnh"), systemImage: "square.and.arrow.down")
                }
                .buttonStyle(ChunkyButtonStyle(fill: .white, shadow: Theme.line, text: Theme.ink, height: 54, size: 17))
            }
        }
        .padding(.horizontal, 24).padding(.top, 36).padding(.bottom, 20)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Theme.cream.ignoresSafeArea())
    }
}
