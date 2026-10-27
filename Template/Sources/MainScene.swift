import SpriteKit
import SwiftUI
import GameCore

enum Theme {
    static let shell = ShellStyle(
        title: "__DISPLAY__",
        accent: Color(red: 1.0, green: 0.8, blue: 0.2),
        background: Color(red: 0.05, green: 0.05, blue: 0.12),
        tagline: "Tap to play"
    )
}

/// Viết gameplay ở đây. Gọi onScoreChanged / onGameOver đúng lúc là xong.
final class MainScene: SKScene, ShellScene {
    var onScoreChanged: ((Int) -> Void)?
    var onGameOver: ((Int) -> Void)?
    private var score = 0
    private var running = false

    override func didMove(to view: SKView) {
        backgroundColor = .clear
    }

    func startGame() {
        removeAllChildren()
        score = 0
        running = true
        onScoreChanged?(0)
    }

    func revive() {
        running = true
    }

    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard running else { return }
        score += 1
        onScoreChanged?(score)
        if score >= 10 { running = false; onGameOver?(score) }
    }
}
