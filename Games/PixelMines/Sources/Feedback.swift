import AVFoundation
import UIKit

/// Âm thanh và rung, tôn trọng cài đặt của người chơi.
@MainActor
enum Feedback {
    private static var players: [String: [AVAudioPlayer]] = [:]
    private static var configured = false

    private static func player(_ name: String) -> AVAudioPlayer? {
        if !configured {
            configured = true
            try? AVAudioSession.sharedInstance().setCategory(.ambient, options: [.mixWithOthers])
        }
        var pool = players[name] ?? []
        if let free = pool.first(where: { !$0.isPlaying }) { return free }
        guard pool.count < 6,
              let url = Bundle.main.url(forResource: name, withExtension: "wav"),
              let p = try? AVAudioPlayer(contentsOf: url) else { return pool.first }
        p.enableRate = true
        p.prepareToPlay()
        pool.append(p)
        players[name] = pool
        return p
    }

    static func play(_ name: String, rate: Float = 1, volume: Float = 1) {
        guard AppModel.shared.data.sound, let p = player(name) else { return }
        p.rate = rate
        p.volume = volume
        p.currentTime = 0
        p.play()
    }

    /// Chuỗi nốt lên dần cho hiệu ứng mở lan.
    static func cascade(rings: Int) {
        guard rings > 0 else { play("pop"); return }
        let steps = min(rings, 8)
        Task { @MainActor in
            for k in 0..<steps {
                Feedback.play("pop", rate: 0.9 + Float(k) * 0.12, volume: 0.7)
                try? await Task.sleep(nanoseconds: 50_000_000)
            }
        }
    }

    static func light() {
        guard AppModel.shared.data.haptics else { return }
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
    }

    static func medium() {
        guard AppModel.shared.data.haptics else { return }
        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
    }

    static func heavy() {
        guard AppModel.shared.data.haptics else { return }
        UINotificationFeedbackGenerator().notificationOccurred(.error)
    }

    static func success() {
        guard AppModel.shared.data.haptics else { return }
        UINotificationFeedbackGenerator().notificationOccurred(.success)
    }
}
