import SpriteKit
import SwiftUI

/// Điều khiển một bàn chơi: nhận chạm từ BoardScene, áp luật trên Board, cập nhật SwiftUI.
@MainActor
final class GameController: ObservableObject {
    enum Phase: Equatable {
        case playing
        case lost(Int)
        case won
    }

    enum Mode { case dig, flag }

    let level: Level
    let isDaily: Bool
    let scene: BoardScene
    private unowned let app: AppModel
    private let board: Board

    @Published private(set) var phase: Phase = .playing
    @Published private(set) var progress: Double = 0
    @Published private(set) var shieldActive = false
    @Published var mode: Mode = .dig
    @Published var tutorial: String?
    @Published private(set) var reward: AppModel.Reward?
    @Published var showCelebration = false
    private var hintCell: Int?

    init(app: AppModel, level: Level, isDaily: Bool) {
        self.app = app
        self.level = level
        self.isDaily = isDaily
        board = Board(w: level.w, h: level.h, mines: level.mines, start: level.start, state: app.data.boards[level.id])
        scene = BoardScene(level: level, size: CGSize(width: 390, height: 520))
        scene.longPressEnabled = app.data.flagByLongPress
        scene.highContrast = app.data.highContrast
        scene.onTap = { [weak self] i in self?.tap(i) }
        scene.onLongPress = { [weak self] i in self?.longPress(i) }
        shieldActive = board.state.shieldActive
        if board.isFresh {
            // Cú mở đầu luôn là ô 0 đã chọn sẵn, nên bàn không bao giờ bắt đầu bằng một lần đoán.
            scene.render(looks())
            let rings = board.flood(from: level.start)
            Task { @MainActor [weak self] in
                try? await Task.sleep(nanoseconds: 350_000_000)
                guard let self else { return }
                self.scene.reveal(rings: rings, looks: self.looks())
                Feedback.cascade(rings: rings.count)
            }
        } else {
            scene.render(looks())
        }
        progress = board.progress
        setupTutorial()
        runShotIfNeeded()
    }

    var title: String {
        if isDaily { return L("Daily picture", "Tranh hôm nay") }
        return L("Chapter \(level.chapter) · \(level.index + 1)/12", "Chương \(level.chapter) · Tranh \(level.index + 1)/12")
    }

    var chapterName: String { isDaily ? level.name.text : (app.pack.chapter(level.chapter)?.name.text ?? "") }

    private func looks() -> [CellLook] {
        (0..<(level.w * level.h)).map { i in
            if board.state.opened[i] { return .open(board.counts[i]) }
            if board.state.flagged[i] { return .flagged }
            if i == hintCell { return .hint }
            return .covered
        }
    }

    // MARK: - Chạm

    private func tap(_ i: Int) {
        guard phase == .playing else { return }
        if mode == .flag && !board.state.opened[i] {
            flag(i)
            return
        }
        if board.state.opened[i] {
            let targets = board.chordTargets(i)
            if targets.isEmpty { scene.pulse(i); return }
            var rings: [[Int]] = []
            for t in targets {
                if board.isMine[t] {
                    if hitMine(t) { return }
                } else {
                    let r = board.flood(from: t)
                    for (k, ring) in r.enumerated() {
                        if k < rings.count { rings[k] += ring } else { rings.append(ring) }
                    }
                }
            }
            opened(rings)
            return
        }
        guard !board.state.flagged[i] else { return }
        if board.isMine[i] {
            _ = hitMine(i)
            return
        }
        opened(board.flood(from: i))
    }

    private func longPress(_ i: Int) {
        guard phase == .playing, !board.state.opened[i] else { return }
        flag(i)
    }

    private func flag(_ i: Int) {
        board.toggleFlag(i)
        if hintCell == i { hintCell = nil }
        scene.render(looks())
        scene.pulse(i)
        Feedback.medium()
        if tutorial != nil, level.id == "c1-02", board.state.flagged[i] { tutorial = nil }
        saveProgress()
    }

    /// Trả về true nếu bàn kết thúc (thua).
    private func hitMine(_ i: Int) -> Bool {
        if board.state.shieldActive {
            board.state.shieldActive = false
            shieldActive = false
            board.state.flagged[i] = true
            scene.render(looks())
            scene.pulse(i)
            Feedback.medium()
            Feedback.play("wrong", volume: 0.6)
            saveProgress()
            return false
        }
        var l = looks()
        l[i] = .boom
        scene.render(l)
        scene.splash(at: i)
        Feedback.heavy()
        Feedback.play("wrong")
        phase = .lost(i)
        return true
    }

    private func opened(_ rings: [[Int]]) {
        guard !rings.isEmpty else { return }
        if let h = hintCell, board.state.opened[h] { hintCell = nil }
        scene.reveal(rings: rings, looks: looks())
        Feedback.cascade(rings: rings.count)
        if rings.count > 1 { Feedback.light() }
        progress = board.progress
        if tutorial != nil, level.id == "c1-01" { tutorial = nil }
        if tutorial != nil, level.id == "c1-03", rings.count >= 1 { tutorial = nil }
        if board.isWon { win() } else { saveProgress() }
    }

    // MARK: - Công cụ

    var hintPrice: Int { Price.hint }
    var shieldPrice: Int { app.data.shields > 0 ? 0 : Price.shield }

    func useHint() {
        guard phase == .playing else { return }
        guard let cell = board.deducibleSafeCell() else { return }
        guard app.spend(Price.hint) else { app.sheet = .shop; return }
        board.state.usedHint = true
        hintCell = cell
        scene.render(looks())
        scene.pulse(cell)
        Feedback.light()
        saveProgress()
    }

    func useShield() {
        guard phase == .playing, !board.state.shieldActive else { return }
        if app.data.shields > 0 {
            app.data.shields -= 1
        } else if !app.spend(Price.shield) {
            app.sheet = .shop
            return
        }
        board.state.shieldActive = true
        board.state.usedShield = true
        shieldActive = true
        Feedback.medium()
        saveProgress()
    }

    var canContinue: Bool { app.data.coins >= Price.continueGame }

    /// Trả xu để chơi tiếp: quả bom vừa trúng thành cờ.
    func continueGame() {
        guard case .lost(let i) = phase, app.spend(Price.continueGame) else { return }
        board.state.flagged[i] = true
        board.state.usedContinue = true
        scene.clearInk()
        scene.render(looks())
        phase = .playing
        saveProgress()
    }

    func restart() {
        app.data.boards[level.id] = nil
        app.play(level, daily: isDaily)
    }

    // MARK: - Thắng

    private var stars: Int {
        if board.state.usedContinue { return 1 }
        if board.state.usedHint || board.state.usedShield { return 2 }
        return 3
    }

    private func win() {
        phase = .won
        hintCell = nil
        scene.celebrate()
        Feedback.success()
        Feedback.play("win")
        reward = app.finish(level: level, isDaily: isDaily, stars: stars)
        Task { @MainActor [weak self] in
            try? await Task.sleep(nanoseconds: 1_300_000_000)
            self?.showCelebration = true
        }
    }

    var nextLevel: Level? {
        guard !isDaily else { return nil }
        let list = app.pack.levels(in: level.chapter)
        if level.index + 1 < list.count { return list[level.index + 1] }
        return app.nextLevel
    }

    func goNext() {
        app.maybeOfferStarter()
        if let n = nextLevel, app.isUnlocked(n) { app.play(n) } else { goAlbum() }
    }

    func goAlbum() {
        app.maybeOfferStarter()
        app.game = nil
        app.route = isDaily ? .home : .chapter(level.chapter)
    }

    func saveProgress() {
        guard phase != .won, app.shot == nil else { return }
        if board.isFresh { app.data.boards[level.id] = nil; return }
        app.data.boards[level.id] = board.state
    }

    // MARK: - Hướng dẫn 3 bàn đầu

    private func setupTutorial() {
        guard !isDaily, !app.data.tutorialSeen.contains(level.id) else { return }
        switch level.id {
        case "c1-01":
            tutorial = L("Each number tells how many ink bombs touch that tile. Tap the tiles that must be safe.",
                         "Mỗi con số cho biết có bao nhiêu bom mực quanh ô đó. Chạm để mở những ô chắc chắn an toàn.")
        case "c1-02":
            tutorial = app.data.flagByLongPress
                ? L("Sure a tile hides a bomb? Press and hold it to plant a flag.",
                    "Chắc chắn ô nào có bom? Chạm giữ ô đó để cắm cờ.")
                : L("Sure a tile hides a bomb? Switch to Flag, then tap it.",
                    "Chắc chắn ô nào có bom? Chuyển sang Cờ rồi chạm vào ô đó.")
        case "c1-03":
            tutorial = L("Tip: tap a number whose bombs are all flagged to open every tile around it.",
                         "Mẹo: chạm vào con số đã đủ cờ xung quanh để mở nhanh mọi ô còn lại quanh nó.")
        default:
            return
        }
        app.data.tutorialSeen.insert(level.id)
    }

    // MARK: - Ảnh App Store

    private func runShotIfNeeded() {
        guard let shot = app.shot else { return }
        Task { @MainActor [weak self] in
            try? await Task.sleep(nanoseconds: 1_500_000_000)
            guard let self else { return }
            let target = shot == "board" ? 0.55 : 1.0
            while self.board.progress < target, let s = self.board.deducibleSafeCell() {
                let rings = self.board.flood(from: s)
                self.scene.reveal(rings: rings, looks: self.looks())
                self.progress = self.board.progress
                try? await Task.sleep(nanoseconds: shot == "board" ? 220_000_000 : 60_000_000)
            }
            if shot == "board" {
                // Cắm vài cờ đúng cho bức ảnh trông như đang chơi thật.
                var flagged = 0
                for i in 0..<(self.level.w * self.level.h) where self.board.isMine[i] && flagged < 3 {
                    if self.board.neighbors(i).contains(where: { self.board.state.opened[$0] }) {
                        self.board.state.flagged[i] = true
                        flagged += 1
                    }
                }
                self.scene.render(self.looks())
            } else if self.board.isWon {
                self.win()
            }
        }
    }
}
