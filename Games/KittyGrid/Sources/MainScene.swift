import SpriteKit
import SwiftUI
import GameCore

enum Theme {
    static let shell = ShellStyle(
        title: "KITTY\nGRID",
        accent: Color(red: 1.0, green: 0.62, blue: 0.70),
        background: Color(red: 0.99, green: 0.96, blue: 0.92),
        tagline: "One cat per row, column & color",
        textColor: Color(red: 0.30, green: 0.22, blue: 0.25)
    )
}

/// Logic puzzle: đặt mèo sao cho mỗi hàng, mỗi cột, mỗi vùng màu có đúng 1 con và không con nào chạm nhau.
/// Chạm ô = đặt mèo. Sai = mất 1 tim. Hết tim = game over (có thể xem quảng cáo để hồi tim).
final class MainScene: SKScene, ShellScene {
    var onScoreChanged: ((Int) -> Void)?
    var onGameOver: ((Int) -> Void)?

    private let levelKey = "kg.level"
    private var level: Int {
        get { max(1, UserDefaults.standard.integer(forKey: levelKey)) }
        set { UserDefaults.standard.set(newValue, forKey: levelKey) }
    }

    private var puzzle: Puzzle?
    private var placed = Set<Int>()           // row*size+col
    private var hearts = 3
    private var running = false
    private var autopilot = false
    private var busy = false

    private let board = SKNode()
    private var cells: [[SKShapeNode]] = []
    private let heartsLabel = SKLabelNode(fontNamed: "AvenirNext-Heavy")
    private let levelLabel = SKLabelNode(fontNamed: "AvenirNext-Bold")
    private let hintButton = SKShapeNode()
    private let hintLabel = SKLabelNode(fontNamed: "AvenirNext-Bold")

    private let palette: [UIColor] = [
        UIColor(red: 1.00, green: 0.80, blue: 0.82, alpha: 1), // hồng
        UIColor(red: 0.78, green: 0.90, blue: 1.00, alpha: 1), // xanh dương
        UIColor(red: 0.82, green: 0.95, blue: 0.80, alpha: 1), // xanh lá
        UIColor(red: 1.00, green: 0.92, blue: 0.70, alpha: 1), // vàng
        UIColor(red: 0.88, green: 0.82, blue: 1.00, alpha: 1), // tím
        UIColor(red: 1.00, green: 0.85, blue: 0.70, alpha: 1), // cam
        UIColor(red: 0.75, green: 0.95, blue: 0.93, alpha: 1), // ngọc
        UIColor(red: 0.92, green: 0.88, blue: 0.80, alpha: 1), // be
    ]
    private let ink = UIColor(red: 0.30, green: 0.22, blue: 0.25, alpha: 1)

    override func didMove(to view: SKView) {
        backgroundColor = .clear
        Sound.host = self
        addChild(board)

        levelLabel.fontSize = 18
        levelLabel.fontColor = ink.withAlphaComponent(0.6)
        addChild(levelLabel)

        heartsLabel.fontSize = 26
        addChild(heartsLabel)

        hintButton.fillColor = UIColor(red: 1.0, green: 0.62, blue: 0.70, alpha: 1)
        hintButton.strokeColor = .clear
        hintButton.name = "hint"
        hintLabel.text = "💡 Hint (Ad)"
        hintLabel.fontSize = 18
        hintLabel.fontColor = .white
        hintLabel.verticalAlignmentMode = .center
        hintLabel.name = "hint"
        hintButton.addChild(hintLabel)
        hintButton.isHidden = true
        addChild(hintButton)

        loadLevel(animated: false)
        running = false
    }

    override func didChangeSize(_ oldSize: CGSize) {
        guard board.parent != nil else { return }
        layoutBoard()
    }

    // MARK: ShellScene

    func setAutopilot(_ on: Bool) { autopilot = on }

    func startGame() {
        hearts = 3
        running = true
        loadLevel(animated: true)
        onScoreChanged?(level)
    }

    func revive() {
        hearts = 3
        updateHUD()
        running = true
    }

    // MARK: Level

    private func loadLevel(animated: Bool) {
        let lv = level
        busy = true
        DispatchQueue.global(qos: .userInitiated).async {
            let p = Puzzle.generate(level: lv)
            DispatchQueue.main.async { [weak self] in
                guard let self else { return }
                self.puzzle = p
                self.placed.removeAll()
                self.buildBoard(animated: animated)
                self.busy = false
                if self.autopilot && self.running { self.runAutopilot() }
            }
        }
    }

    private func buildBoard(animated: Bool) {
        board.removeAllChildren()
        cells = []
        guard let p = puzzle else { return }
        for r in 0..<p.size {
            var row: [SKShapeNode] = []
            for c in 0..<p.size {
                let n = SKShapeNode()
                n.fillColor = palette[p.regions[r][c] % palette.count]
                n.strokeColor = ink.withAlphaComponent(0.15)
                n.lineWidth = 1
                n.name = "cell_\(r)_\(c)"
                board.addChild(n)
                row.append(n)
            }
            cells.append(row)
        }
        layoutBoard()
        updateHUD()
        if animated {
            board.setScale(0.85); board.alpha = 0
            board.run(.group([.fadeIn(withDuration: 0.25), .scale(to: 1, duration: 0.25)]))
        }
    }

    private var cellSize: CGFloat {
        guard let p = puzzle else { return 40 }
        return min(size.width * 0.9, size.height * 0.55) / CGFloat(p.size)
    }

    private var boardOrigin: CGPoint {
        guard let p = puzzle else { return .zero }
        let total = cellSize * CGFloat(p.size)
        return CGPoint(x: (size.width - total) / 2, y: size.height * 0.47 - total / 2)
    }

    private func layoutBoard() {
        guard let p = puzzle else { return }
        let s = cellSize, o = boardOrigin
        for r in 0..<p.size {
            for c in 0..<p.size {
                let n = cells[r][c]
                n.path = CGPath(roundedRect: CGRect(x: 1, y: 1, width: s - 2, height: s - 2),
                                cornerWidth: s * 0.12, cornerHeight: s * 0.12, transform: nil)
                // hàng 0 ở trên cùng
                n.position = CGPoint(x: o.x + CGFloat(c) * s, y: o.y + CGFloat(p.size - 1 - r) * s)
                n.childNode(withName: "cat")?.position = CGPoint(x: s / 2, y: s / 2)
                (n.childNode(withName: "cat") as? SKLabelNode)?.fontSize = s * 0.62
            }
        }
        drawRegionBorders()
        let top = o.y + s * CGFloat(p.size)
        heartsLabel.position = CGPoint(x: size.width / 2, y: top + 18)
        levelLabel.position = CGPoint(x: size.width / 2, y: top + 52)
        hintButton.path = CGPath(roundedRect: CGRect(x: -80, y: -22, width: 160, height: 44),
                                 cornerWidth: 22, cornerHeight: 22, transform: nil)
        hintButton.position = CGPoint(x: size.width / 2, y: o.y - 50)
    }

    /// Viền đậm giữa các vùng khác màu để dễ nhìn.
    private func drawRegionBorders() {
        board.childNode(withName: "borders")?.removeFromParent()
        guard let p = puzzle else { return }
        let s = cellSize, o = boardOrigin
        let path = CGMutablePath()
        for r in 0..<p.size {
            for c in 0..<p.size {
                let x = o.x + CGFloat(c) * s, y = o.y + CGFloat(p.size - 1 - r) * s
                if c + 1 < p.size && p.regions[r][c] != p.regions[r][c + 1] {
                    path.move(to: CGPoint(x: x + s, y: y)); path.addLine(to: CGPoint(x: x + s, y: y + s))
                }
                if r + 1 < p.size && p.regions[r][c] != p.regions[r + 1][c] {
                    path.move(to: CGPoint(x: x, y: y)); path.addLine(to: CGPoint(x: x + s, y: y))
                }
            }
        }
        let total = s * CGFloat(p.size)
        path.addRect(CGRect(x: o.x, y: o.y, width: total, height: total))
        let b = SKShapeNode(path: path)
        b.strokeColor = ink.withAlphaComponent(0.75)
        b.lineWidth = 3
        b.lineCap = .round
        b.name = "borders"
        b.zPosition = 5
        board.addChild(b)
    }

    private func updateHUD() {
        heartsLabel.text = String(repeating: "❤️", count: hearts) + String(repeating: "🤍", count: max(0, 3 - hearts))
        levelLabel.text = "LEVEL \(level)"
        hintButton.isHidden = !running || autopilot
    }

    // MARK: Input

    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard running, !busy, !autopilot, let t = touches.first else { return }
        let loc = t.location(in: self)
        if nodes(at: loc).contains(where: { $0.name == "hint" }) { useHint(); return }
        guard let (r, c) = cellAt(loc) else { return }
        tap(row: r, col: c)
    }

    private func cellAt(_ p: CGPoint) -> (Int, Int)? {
        guard let pz = puzzle else { return nil }
        let s = cellSize, o = boardOrigin
        let c = Int((p.x - o.x) / s)
        let rFromBottom = Int((p.y - o.y) / s)
        guard p.x >= o.x, p.y >= o.y, c >= 0, c < pz.size, rFromBottom >= 0, rFromBottom < pz.size else { return nil }
        return (pz.size - 1 - rFromBottom, c)
    }

    private func tap(row r: Int, col c: Int) {
        guard let p = puzzle else { return }
        let key = r * p.size + c
        if placed.contains(key) { return }
        if p.isCat(row: r, col: c) {
            placeCat(r, c)
        } else {
            wrong(r, c)
        }
    }

    private func placeCat(_ r: Int, _ c: Int) {
        guard let p = puzzle else { return }
        placed.insert(r * p.size + c)
        Haptics.tap()
        Sound.play("pop")
        let cell = cells[r][c]
        let cat = SKLabelNode(text: "🐱")
        cat.name = "cat"
        cat.fontSize = cellSize * 0.62
        cat.verticalAlignmentMode = .center
        cat.position = CGPoint(x: cellSize / 2, y: cellSize / 2)
        cat.zPosition = 6
        cat.setScale(0)
        cell.addChild(cat)
        cat.run(.sequence([.scale(to: 1.25, duration: 0.12), .scale(to: 1.0, duration: 0.08)]))
        if placed.count == p.size { levelComplete() }
    }

    private func wrong(_ r: Int, _ c: Int) {
        hearts -= 1
        Haptics.hit()
        Sound.play("wrong")
        let cell = cells[r][c]
        let x = SKLabelNode(text: "✖︎")
        x.fontColor = UIColor(red: 0.9, green: 0.2, blue: 0.3, alpha: 1)
        x.fontSize = cellSize * 0.5
        x.verticalAlignmentMode = .center
        x.position = CGPoint(x: cellSize / 2, y: cellSize / 2)
        x.zPosition = 6
        cell.addChild(x)
        x.run(.sequence([.wait(forDuration: 0.6), .fadeOut(withDuration: 0.2), .removeFromParent()]))
        cell.run(.sequence([.moveBy(x: 6, y: 0, duration: 0.04), .moveBy(x: -12, y: 0, duration: 0.08),
                            .moveBy(x: 6, y: 0, duration: 0.04)]))
        updateHUD()
        if hearts <= 0 {
            running = false
            updateHUD()
            run(.wait(forDuration: 0.5)) { [weak self] in
                guard let self else { return }
                self.onGameOver?(self.level)
            }
        }
    }

    private func useHint() {
        GameCore.shared.ads.showRewarded(placement: "hint") { [weak self] earned in
            guard earned, let self, let p = self.puzzle else { return }
            if let r = (0..<p.size).first(where: { !self.placed.contains($0 * p.size + p.solution[$0]) }) {
                self.placeCat(r, p.solution[r])
            }
        }
    }

    private func levelComplete() {
        busy = true
        Sound.play("win")
        celebrate()
        level += 1
        onScoreChanged?(level)
        run(.wait(forDuration: 1.2)) { [weak self] in
            guard let self else { return }
            // Interstitial có giới hạn tần suất (Core tự quyết)
            let next = { self.loadLevel(animated: true) }
            if self.autopilot { next() } else { GameCore.shared.ads.gameOver(completion: next) }
        }
    }

    private func celebrate() {
        let emojis = ["🎉", "✨", "🐾", "💖"]
        for _ in 0..<24 {
            let l = SKLabelNode(text: emojis.randomElement()!)
            l.fontSize = .random(in: 18...34)
            l.position = CGPoint(x: size.width / 2, y: size.height * 0.47)
            l.zPosition = 20
            addChild(l)
            let a = CGFloat.random(in: 0..<(2 * .pi)), d = CGFloat.random(in: 120...260)
            l.run(.sequence([.group([.moveBy(x: cos(a) * d, y: sin(a) * d, duration: 0.8),
                                     .fadeOut(withDuration: 0.8)]), .removeFromParent()]))
        }
    }

    /// Tự giải từ từ khi chụp screenshot.
    private func runAutopilot() {
        guard let p = puzzle else { return }
        var actions: [SKAction] = []
        for r in 0..<p.size {
            actions.append(.wait(forDuration: 0.7))
            actions.append(.run { [weak self] in self?.tap(row: r, col: p.solution[r]) })
        }
        run(.sequence(actions))
    }
}

/// Âm thanh ngắn, tôn trọng cài đặt Sound.
@MainActor
enum Sound {
    private static var cache: [String: SKAction] = [:]
    static weak var host: SKNode?

    static func play(_ name: String) {
        guard GameCore.shared.save.soundOn, let host else { return }
        let action = cache[name] ?? SKAction.playSoundFileNamed("\(name).wav", waitForCompletion: false)
        cache[name] = action
        host.run(action)
    }
}
