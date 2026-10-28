import SwiftUI
import GameCore

@main
struct GameApp: App {
    var body: some Scene {
        WindowGroup {
            GameShell(style: Theme.shell) { MainScene(size: CGSize(width: 390, height: 844)) }
        }
    }
}
