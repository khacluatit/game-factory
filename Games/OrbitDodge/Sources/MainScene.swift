import SpriteKit
import SwiftUI
import GameCore

enum Theme {
    static let shell = ShellStyle(
        title: "ORBIT\nDODGE",
        accent: Color(red: 0.35, green: 0.95, blue: 1.0),
        background: Color(red: 0.03, green: 0.03, blue: 0.10),
        tagline: "Tap to flip your orbit"
    )
}

/// Gameplay: chấm sáng chạy vòng quanh lõi. Chạm để đổi chiều. Né thiên thạch bay vào, ăn sao trên quỹ đạo.
final class MainScene: SKScene, ShellScene {
    var onScoreChanged: ((Int) -> Void)?
    var onGameOver: ((Int) -> Void)?

    // Tuning
    private let playerRadius: CGFloat = 13
    private let rockRadius: CGFloat = 11
    private let starRadius: CGFloat = 12
    private var orbitRadius: CGFloat { min(size.width, size.height) * 0.32 }

    // State
    private var center: CGPoint { CGPoint(x: size.width / 2, y: size.height * 0.46) }
    private var angle: CGFloat = .pi / 2
    private var direction: CGFloat = 1
    private var angularSpeed: CGFloat = 2.4
    private var running = false
    private var autopilot = false
    private var score = 0
    private var elapsed: TimeInterval = 0
    private var spawnTimer: TimeInterval = 0
    private var starTimer: TimeInterval = 0
    private var invulnerableUntil: TimeInterval = 0
    private var lastUpdate: TimeInterval = 0
    private var autoCooldown: TimeInterval = 0

    private let world = SKNode()
    private let player = SKShapeNode(circleOfRadius: 13)
    private let ring = SKShapeNode()
    private let core = SKShapeNode(circleOfRadius: 22)
    private var rocks: [(node: SKShapeNode, velocity: CGVector)] = []
    private var stars: [SKShapeNode] = []

    private let cyan = UIColor(red: 0.35, green: 0.95, blue: 1.0, alpha: 1)
    private let pink = UIColor(red: 1.0, green: 0.30, blue: 0.45, alpha: 1)
    private let gold = UIColor(red: 1.0, green: 0.85, blue: 0.25, alpha: 1)

    override func didMove(to view: SKView) {
        backgroundColor = .clear
        addChild(world)
        Sound.host = self
        buildStarfield()

        ring.strokeColor = cyan.withAlphaComponent(0.25)
        ring.lineWidth = 3
        ring.glowWidth = 4
        world.addChild(ring)

        core.fillColor = cyan.withAlphaComponent(0.25)
        core.strokeColor = cyan
        core.lineWidth = 3
        core.glowWidth = 8
        world.addChild(core)
        core.run(.repeatForever(.sequence([.scale(to: 1.15, duration: 0.8), .scale(to: 1.0, duration: 0.8)])))

        player.fillColor = .white
        player.strokeColor = cyan
        player.lineWidth = 4
        player.glowWidth = 10
        world.addChild(player)
        layout()
    }

    override func didChangeSize(_ oldSize: CGSize) {
        layout()
    }

    private func layout() {
        guard ring.parent != nil else { return }
        ring.path = CGPath(ellipseIn: CGRect(x: -orbitRadius, y: -orbitRadius,
                                             width: orbitRadius * 2, height: orbitRadius * 2), transform: nil)
        ring.position = center
        core.position = center
        placePlayer()
    }

    private func buildStarfield() {
        for _ in 0..<70 {
            let s = SKShapeNode(circleOfRadius: CGFloat.random(in: 0.6...1.8))
            s.fillColor = .white
            s.strokeColor = .clear
            s.alpha = CGFloat.random(in: 0.2...0.8)
            s.position = CGPoint(x: .random(in: 0...max(size.width, 400)), y: .random(in: 0...max(size.height, 900)))
            s.zPosition = -10
            addChild(s)
            s.run(.repeatForever(.sequence([.fadeAlpha(to: 0.1, duration: .random(in: 1...3)),
                                             .fadeAlpha(to: 0.8, duration: .random(in: 1...3))])))
        }
    }

    // MARK: ShellScene

    func setAutopilot(_ on: Bool) { autopilot = on }

    func startGame() {
        rocks.forEach { $0.node.removeFromParent() }
        stars.forEach { $0.removeFromParent() }
        rocks.removeAll(); stars.removeAll()
        score = 0
        elapsed = 0
        spawnTimer = 0.8
        starTimer = 2
        angularSpeed = 2.4
        direction = 1
        invulnerableUntil = 0
        running = true
        player.alpha = 1
        onScoreChanged?(0)
    }

    func revive() {
        rocks.forEach { $0.node.removeFromParent() }
        rocks.removeAll()
        invulnerableUntil = elapsed + 2.0
        player.run(.repeat(.sequence([.fadeAlpha(to: 0.3, duration: 0.1), .fadeAlpha(to: 1, duration: 0.1)]), count: 10))
        running = true
    }

    // MARK: Input

    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard running, !autopilot else { return }
        flip()
    }

    private func flip() {
        direction *= -1
        Haptics.tap()
        Sound.play("tap")
        let burst = SKShapeNode(circleOfRadius: playerRadius)
        burst.strokeColor = cyan
        burst.position = player.position
        world.addChild(burst)
        burst.run(.sequence([.group([.scale(to: 2.5, duration: 0.25), .fadeOut(withDuration: 0.25)]), .removeFromParent()]))
    }

    // MARK: Loop

    override func update(_ currentTime: TimeInterval) {
        let dt = lastUpdate == 0 ? 0 : min(currentTime - lastUpdate, 1.0 / 30)
        lastUpdate = currentTime
        guard running else { return }
        elapsed += dt

        // Độ khó tăng dần
        let difficulty = CGFloat(min(elapsed / 60, 1.0))
        angularSpeed = 2.4 + 1.2 * difficulty
        angle += direction * angularSpeed * CGFloat(dt)
        placePlayer()

        spawnTimer -= dt
        if spawnTimer <= 0 {
            spawnRock(speed: 150 + 140 * difficulty)
            spawnTimer = max(0.35, 1.0 - 0.6 * Double(difficulty)) * Double.random(in: 0.8...1.2)
        }
        starTimer -= dt
        if starTimer <= 0 && stars.count < 2 {
            spawnStar()
            starTimer = Double.random(in: 2.5...4.5)
        }

        moveRocks(dt)
        collectStars()
        if autopilot { runAutopilot(dt) }
    }

    private func placePlayer() {
        player.position = CGPoint(x: center.x + cos(angle) * orbitRadius, y: center.y + sin(angle) * orbitRadius)
    }

    private func spawnRock(speed: CGFloat) {
        // Xuất phát ngoài màn hình, nhắm vào lõi (có lệch nhẹ)
        let a = CGFloat.random(in: 0..<(2 * .pi))
        let dist = max(size.width, size.height) * 0.75
        let start = CGPoint(x: center.x + cos(a) * dist, y: center.y + sin(a) * dist)
        let target = CGPoint(x: center.x + .random(in: -15...15), y: center.y + .random(in: -15...15))
        let dx = target.x - start.x, dy = target.y - start.y
        let len = sqrt(dx * dx + dy * dy)
        let node = SKShapeNode(circleOfRadius: rockRadius)
        node.fillColor = pink
        node.strokeColor = .white
        node.lineWidth = 2
        node.glowWidth = 6
        node.position = start
        world.addChild(node)
        rocks.append((node, CGVector(dx: dx / len * speed, dy: dy / len * speed)))
    }

    private func moveRocks(_ dt: TimeInterval) {
        var keep: [(node: SKShapeNode, velocity: CGVector)] = []
        for r in rocks {
            r.node.position.x += r.velocity.dx * CGFloat(dt)
            r.node.position.y += r.velocity.dy * CGFloat(dt)

            if distance(r.node.position, player.position) < playerRadius + rockRadius - 2 && elapsed > invulnerableUntil {
                die(at: r.node.position)
                return
            }
            if distance(r.node.position, center) < 24 {
                // Né thành công → +1
                explode(at: r.node.position, color: pink, count: 6)
                r.node.removeFromParent()
                addScore(1)
                core.run(.sequence([.scale(to: 1.4, duration: 0.05), .scale(to: 1.0, duration: 0.15)]))
                continue
            }
            keep.append(r)
        }
        rocks = keep
    }

    private func spawnStar() {
        let a = angle + .pi * CGFloat.random(in: 0.6...1.4)
        let s = SKShapeNode(circleOfRadius: starRadius)
        s.fillColor = gold
        s.strokeColor = .white
        s.glowWidth = 8
        s.position = CGPoint(x: center.x + cos(a) * orbitRadius, y: center.y + sin(a) * orbitRadius)
        s.setScale(0)
        world.addChild(s)
        s.run(.scale(to: 1, duration: 0.2))
        s.run(.repeatForever(.rotate(byAngle: .pi, duration: 1)))
        stars.append(s)
    }

    private func collectStars() {
        stars.removeAll { s in
            guard distance(s.position, player.position) < playerRadius + starRadius else { return false }
            explode(at: s.position, color: gold, count: 10)
            s.removeFromParent()
            addScore(3)
            Sound.play("star")
            return true
        }
    }

    private func addScore(_ n: Int) {
        score += n
        onScoreChanged?(score)
    }

    private func die(at p: CGPoint) {
        running = false
        Sound.play("hit")
        explode(at: p, color: .white, count: 24)
        player.alpha = 0
        let shake = SKAction.sequence((0..<6).map { i in
            SKAction.moveBy(x: i % 2 == 0 ? 10 : -10, y: 0, duration: 0.04)
        })
        world.run(shake) { [weak self] in
            self?.world.position = .zero
            guard let self else { return }
            self.onGameOver?(self.score)
        }
    }

    private func explode(at p: CGPoint, color: UIColor, count: Int) {
        for _ in 0..<count {
            let dot = SKShapeNode(circleOfRadius: .random(in: 1.5...3.5))
            dot.fillColor = color
            dot.strokeColor = .clear
            dot.position = p
            world.addChild(dot)
            let a = CGFloat.random(in: 0..<(2 * .pi)), d = CGFloat.random(in: 20...70)
            dot.run(.sequence([.group([.moveBy(x: cos(a) * d, y: sin(a) * d, duration: 0.4),
                                        .fadeOut(withDuration: 0.4)]), .removeFromParent()]))
        }
    }

    /// Bot đơn giản cho chế độ chụp screenshot: đổi chiều khi thiên thạch sắp đâm.
    private func runAutopilot(_ dt: TimeInterval) {
        autoCooldown -= dt
        guard autoCooldown <= 0 else { return }
        let ahead = CGPoint(x: center.x + cos(angle + direction * 0.5) * orbitRadius,
                            y: center.y + sin(angle + direction * 0.5) * orbitRadius)
        if rocks.contains(where: { distance($0.node.position, ahead) < 60 }) {
            flip()
            autoCooldown = 0.35
        }
    }

    private func distance(_ a: CGPoint, _ b: CGPoint) -> CGFloat {
        hypot(a.x - b.x, a.y - b.y)
    }
}

/// Phát âm thanh ngắn (file .wav trong Resources), tôn trọng cài đặt Sound.
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
