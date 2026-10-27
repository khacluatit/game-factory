import Foundation
import UIKit

/// Lưu điểm cao, số coin, cài đặt âm thanh. Đơn giản, đủ cho game casual.
@MainActor
public final class SaveStore: ObservableObject {
    private let d = UserDefaults.standard

    @Published public var bestScore: Int { didSet { d.set(bestScore, forKey: "gc.best") } }
    @Published public var coins: Int { didSet { d.set(coins, forKey: "gc.coins") } }
    @Published public var soundOn: Bool { didSet { d.set(soundOn, forKey: "gc.sound") } }
    @Published public var hapticsOn: Bool { didSet { d.set(hapticsOn, forKey: "gc.haptics") } }

    init() {
        bestScore = d.integer(forKey: "gc.best")
        coins = d.integer(forKey: "gc.coins")
        soundOn = d.object(forKey: "gc.sound") as? Bool ?? true
        hapticsOn = d.object(forKey: "gc.haptics") as? Bool ?? true
    }

    /// Trả về true nếu là kỷ lục mới.
    @discardableResult
    public func submit(score: Int) -> Bool {
        guard score > bestScore else { return false }
        bestScore = score
        return true
    }
}

@MainActor
public enum Haptics {
    public static func tap() {
        guard GameCore.shared.save.hapticsOn else { return }
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
    }
    public static func hit() {
        guard GameCore.shared.save.hapticsOn else { return }
        UINotificationFeedbackGenerator().notificationOccurred(.error)
    }
}

/// Log sự kiện. Hiện ghi ra console + đếm local; sau này nối Firebase/TelemetryDeck tại đây.
public enum Analytics {
    public static func log(_ event: String) {
        #if DEBUG
        print("[Analytics] \(event)")
        #endif
        let k = "gc.evt.\(event)"
        UserDefaults.standard.set(UserDefaults.standard.integer(forKey: k) + 1, forKey: k)
    }
}
