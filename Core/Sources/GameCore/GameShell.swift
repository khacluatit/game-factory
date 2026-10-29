import SwiftUI
import SpriteKit

/// Mỗi game chỉ cần viết 1 SKScene tuân theo protocol này. Menu, game over, ads, IAP do GameShell lo.
@MainActor
public protocol ShellScene: SKScene {
    var onScoreChanged: ((Int) -> Void)? { get set }
    var onGameOver: ((Int) -> Void)? { get set }
    /// Bắt đầu ván mới từ đầu.
    func startGame()
    /// Hồi sinh sau khi xem rewarded ad (giữ nguyên điểm).
    func revive()
    /// Tự chơi (dùng khi chụp screenshot). Không bắt buộc.
    func setAutopilot(_ on: Bool)
}

public extension ShellScene {
    func setAutopilot(_ on: Bool) {}
}

public struct ShellStyle {
    public var title: String
    public var accent: Color
    public var background: Color
    public var tagline: String
    /// Màu chữ trên menu/HUD (game nền sáng thì đổi sang màu tối).
    public var textColor: Color
    /// Che màn chơi phía sau khi đang ở menu (game puzzle có lưới dễ bị chồng chữ).
    public var menuBackdrop: Bool
    public init(title: String, accent: Color, background: Color, tagline: String,
                textColor: Color = .white, menuBackdrop: Bool = false) {
        self.title = title; self.accent = accent; self.background = background; self.tagline = tagline
        self.textColor = textColor; self.menuBackdrop = menuBackdrop
    }
}

public struct GameShell<S: ShellScene>: View {
    enum Phase: Equatable { case menu, playing, over(score: Int, newBest: Bool) }

    @State private var scene: S
    @State private var phase: Phase = .menu
    @State private var score = 0
    @State private var revivedThisRun = false
    @State private var showSettings = false
    @ObservedObject private var save = GameCore.shared.save
    @ObservedObject private var store = GameCore.shared.store
    @Environment(\.scenePhase) private var scenePhase

    private let style: ShellStyle
    private let screenshotMode = ProcessInfo.processInfo.arguments.contains { $0.hasPrefix("-screenshotMode") }
    private let autoplay = ProcessInfo.processInfo.arguments.contains("-screenshotMode")

    public init(style: ShellStyle, makeScene: () -> S) {
        self.style = style
        _scene = State(initialValue: makeScene())
    }

    public var body: some View {
        ZStack {
            style.background.ignoresSafeArea()
            SpriteView(scene: scene, options: [.ignoresSiblingOrder, .allowsTransparency])
                .ignoresSafeArea()

            switch phase {
            case .menu: menu
            case .playing: hud
            case .over(let s, let best): gameOver(score: s, newBest: best)
            }
        }
        .onAppear(perform: wire)
        .onChange(of: scenePhase) { p in
            if p == .active && !screenshotMode { GameCore.shared.start() }
            scene.isPaused = (p != .active)
        }
        .sheet(isPresented: $showSettings) { settings }
        .statusBarHidden()
    }

    private func wire() {
        scene.scaleMode = .resizeFill
        scene.onScoreChanged = { s in score = s }
        scene.onGameOver = { s in
            if autoplay { play(); return }
            Haptics.hit()
            let best = save.submit(score: s)
            Analytics.log("game_over")
            GameCore.shared.ads.gameOver {
                withAnimation(.spring()) { phase = .over(score: s, newBest: best) }
            }
        }
        if autoplay {
            // Tự chơi để chụp screenshot App Store.
            scene.setAutopilot(true)
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) { play() }
        }
    }

    private func play() {
        Haptics.tap()
        score = 0
        revivedThisRun = false
        phase = .playing
        scene.startGame()
        Analytics.log("game_start")
    }

    // MARK: Views

    private var menu: some View {
        VStack(spacing: 18) {
            Spacer()
            Text(style.title)
                .font(.system(size: 52, weight: .black, design: .rounded))
                .foregroundStyle(style.textColor)
                .shadow(color: style.accent.opacity(0.8), radius: 16)
                .multilineTextAlignment(.center)
            Text(style.tagline)
                .font(.system(.headline, design: .rounded))
                .foregroundStyle(style.textColor.opacity(0.7))
            if save.bestScore > 0 {
                Text("BEST \(save.bestScore)")
                    .font(.system(.title3, design: .rounded).weight(.heavy))
                    .foregroundStyle(style.accent)
            }
            Spacer()
            bigButton("PLAY", action: play)
            HStack(spacing: 14) {
                if !store.adsRemoved, store.product != nil {
                    smallButton("No Ads \(store.priceText)") {
                        Task { _ = await store.buyRemoveAds() }
                    }
                }
                smallButton("Settings") { showSettings = true }
            }
            .padding(.bottom, 40)
        }
        .padding(.horizontal, 24)
        .background((style.menuBackdrop ? style.background : Color.clear).ignoresSafeArea())
        .transition(.opacity)
    }

    private var hud: some View {
        VStack {
            Text("\(score)")
                .font(.system(size: 64, weight: .black, design: .rounded))
                .foregroundStyle(style.textColor)
                .shadow(radius: 8)
                .padding(.top, 50)
                .contentTransition(.numericText())
            Spacer()
        }
        .allowsHitTesting(false)
    }

    private func gameOver(score s: Int, newBest: Bool) -> some View {
        VStack(spacing: 16) {
            Spacer()
            Text(newBest ? "NEW BEST!" : "GAME OVER")
                .font(.system(size: 40, weight: .black, design: .rounded))
                .foregroundStyle(newBest ? style.accent : .white)
            Text("\(s)")
                .font(.system(size: 80, weight: .black, design: .rounded))
                .foregroundStyle(.white)
            Text("BEST \(save.bestScore)")
                .font(.system(.title3, design: .rounded).weight(.bold))
                .foregroundStyle(.white.opacity(0.7))
            Spacer()
            if !revivedThisRun && GameCore.shared.ads.isRewardedReady {
                bigButton("▶︎ Continue (Ad)") {
                    GameCore.shared.ads.showRewarded(placement: "revive") { earned in
                        guard earned else { return }
                        revivedThisRun = true
                        phase = .playing
                        scene.revive()
                    }
                }
            }
            bigButton("PLAY AGAIN", action: play)
            smallButton("Menu", color: .white) { withAnimation { phase = .menu } }
                .padding(.bottom, 40)
        }
        .padding(.horizontal, 24)
        .background(Color.black.opacity(0.55).ignoresSafeArea())
        .transition(.opacity)
    }

    private var settings: some View {
        NavigationStack {
            Form {
                Toggle("Sound", isOn: $save.soundOn)
                Toggle("Vibration", isOn: $save.hapticsOn)
                Section {
                    if !store.adsRemoved, store.product != nil {
                        Button("Remove Ads \(store.priceText)") { Task { _ = await store.buyRemoveAds() } }
                    }
                    Button("Restore Purchases") { Task { await store.restore() } }
                }
                Section {
                    if let url = Bundle.main.object(forInfoDictionaryKey: "GCPrivacyURL") as? String,
                       let u = URL(string: url) {
                        Link("Privacy Policy", destination: u)
                    }
                }
            }
            .navigationTitle("Settings")
            .toolbar { Button("Done") { showSettings = false } }
        }
    }

    private func bigButton(_ title: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(title)
                .font(.system(.title2, design: .rounded).weight(.heavy))
                .foregroundStyle(.black)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 18)
                .background(style.accent, in: Capsule())
        }
    }

    private func smallButton(_ title: String, color: Color? = nil, action: @escaping () -> Void) -> some View {
        let c = color ?? style.textColor
        return Button(action: action) {
            Text(title)
                .font(.system(.subheadline, design: .rounded).weight(.bold))
                .foregroundStyle(c)
                .padding(.horizontal, 18).padding(.vertical, 10)
                .background(c.opacity(0.15), in: Capsule())
        }
    }
}
