import SwiftUI
import WebKit
import UIKit
import AVFoundation

/// Giữ WKWebView chạy cảnh 3D (Web/index.html) và cầu nối JS ⇄ Swift.
@MainActor
final class WebHost: NSObject, ObservableObject, WKScriptMessageHandler {
    let webView: WKWebView
    private let stateKey = "qp.state"
    private let speaker = Speaker()

    override init() {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        let ucc = WKUserContentController()
        config.userContentController = ucc
        webView = WKWebView(frame: .zero, configuration: config)
        super.init()

        ucc.add(WeakHandler(self), name: "qp")
        ucc.addUserScript(WKUserScript(source: Self.bootScript(stateKey: stateKey), injectionTime: .atDocumentStart, forMainFrameOnly: true))

        webView.isOpaque = false
        webView.backgroundColor = UIColor(red: 0.11, green: 0.055, blue: 0.035, alpha: 1)
        webView.scrollView.isScrollEnabled = false
        webView.scrollView.bounces = false
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.allowsBackForwardNavigationGestures = false
        if #available(iOS 16.4, *) { webView.isInspectable = false }

        if let dir = Bundle.main.url(forResource: "Web", withExtension: nil) {
            webView.loadFileURL(dir.appendingPathComponent("index.html"), allowingReadAccessTo: dir)
        }
        Store.shared.onUpdate = { [weak self] owned in self?.send("QP.onOwned(\(Self.json(owned)))") }
        Store.shared.startListening()
    }

    private static func bootScript(stateKey: String) -> String {
        let lang = Locale.preferredLanguages.first ?? "en"
        let state = UserDefaults.standard.string(forKey: stateKey) ?? ""
        let shot = UserDefaults.standard.string(forKey: "shot") ?? ""
        let privacy = Bundle.main.object(forInfoDictionaryKey: "QPPrivacyURL") as? String ?? ""
        return """
        window.QP_LANG = \(json(lang));
        window.QP_STATE = \(state.isEmpty ? "null" : json(state));
        window.QP_SHOT = \(shot.isEmpty ? "null" : json(shot));
        window.QP_PRIVACY = \(json(privacy));
        """
    }

    static func json(_ v: Any) -> String {
        if let s = v as? String, let d = try? JSONSerialization.data(withJSONObject: [s]), let a = String(data: d, encoding: .utf8) {
            return String(a.dropFirst().dropLast())
        }
        if let d = try? JSONSerialization.data(withJSONObject: v), let s = String(data: d, encoding: .utf8) { return s }
        return "null"
    }

    func send(_ js: String) {
        webView.evaluateJavaScript("window.QP && \(js)", completionHandler: nil)
    }

    func foreground() { send("QP.onForeground()") }

    func userContentController(_ ucc: WKUserContentController, didReceive message: WKScriptMessage) {
        guard let body = message.body as? [String: Any], let type = body["type"] as? String else { return }
        switch type {
        case "ready":
            Task {
                let prices = await Store.shared.loadProducts()
                send("QP.onProducts(\(Self.json(prices)))")
                let owned = await Store.shared.owned()
                if !owned.isEmpty { send("QP.onOwned(\(Self.json(owned)))") }
            }
        case "save":
            if let s = body["state"] as? String { UserDefaults.standard.set(s, forKey: stateKey) }
        case "buy":
            guard let id = body["id"] as? String else { return }
            Task {
                let ok = await Store.shared.buy(id)
                send("QP.onPurchase(\(Self.json(id)), \(ok ? "true" : "false"))")
            }
        case "restore":
            Task {
                let owned = await Store.shared.restore()
                send("QP.onRestored(\(Self.json(owned)))")
            }
        case "haptic":
            Haptics.play(body["style"] as? String ?? "light")
        case "notifyPermission":
            Task {
                let granted = await Notifier.requestPermission()
                send("QP.onNotifyPermission(\(granted ? "true" : "false"))")
            }
        case "schedule":
            let items = body["items"] as? [[String: Any]] ?? []
            Task { await Notifier.schedule(items) }
        case "open":
            if let s = body["url"] as? String, let u = URL(string: s) { UIApplication.shared.open(u) }
        case "speak":
            speaker.say(body["text"] as? String ?? "", lang: body["lang"] as? String ?? "vi-VN", rate: Float(body["rate"] as? Double ?? 0.4)) { [weak self] in self?.send("QP.onSpoken()") }
        case "stopSpeak":
            speaker.stop()
        case "reload":
            // đổi ngôn ngữ: nạp lại trang với trạng thái mới nhất (script khởi động được tạo lại)
            let ucc = webView.configuration.userContentController
            ucc.removeAllUserScripts()
            ucc.addUserScript(WKUserScript(source: Self.bootScript(stateKey: stateKey), injectionTime: .atDocumentStart, forMainFrameOnly: true))
            webView.reload()
        default:
            break
        }
    }
}

/// Tránh vòng giữ tham chiếu giữa WKUserContentController và WebHost.
private final class WeakHandler: NSObject, WKScriptMessageHandler {
    weak var target: WKScriptMessageHandler?
    init(_ t: WKScriptMessageHandler) { target = t }
    func userContentController(_ ucc: WKUserContentController, didReceive message: WKScriptMessage) {
        target?.userContentController(ucc, didReceive: message)
    }
}

struct PagodaView: UIViewRepresentable {
    let host: WebHost
    func makeUIView(context: Context) -> WKWebView { host.webView }
    func updateUIView(_ uiView: WKWebView, context: Context) {}
}

enum Haptics {
    @MainActor static func play(_ style: String) {
        switch style {
        case "success": UINotificationFeedbackGenerator().notificationOccurred(.success)
        case "medium": UIImpactFeedbackGenerator(style: .medium).impactOccurred()
        case "soft": UIImpactFeedbackGenerator(style: .soft).impactOccurred()
        default: UIImpactFeedbackGenerator(style: .light).impactOccurred()
        }
    }
}

/// Giọng đọc kinh bằng giọng có sẵn của iOS (bản 1.2; sẽ thay bằng bản thu người thật khi có).
@MainActor
final class Speaker: NSObject, AVSpeechSynthesizerDelegate {
    private let synth = AVSpeechSynthesizer()
    private var onEnd: (() -> Void)?
    override init() { super.init(); synth.delegate = self }
    func say(_ text: String, lang: String, rate: Float, onEnd: @escaping () -> Void) {
        stop()
        try? AVAudioSession.sharedInstance().setCategory(.playback, options: [.mixWithOthers])
        self.onEnd = onEnd
        let u = AVSpeechUtterance(string: text)
        u.voice = AVSpeechSynthesisVoice(language: lang)
        u.rate = max(AVSpeechUtteranceMinimumSpeechRate, min(rate, AVSpeechUtteranceDefaultSpeechRate))
        u.pitchMultiplier = 0.85
        u.postUtteranceDelay = 0.15
        synth.speak(u)
    }
    func stop() { onEnd = nil; if synth.isSpeaking { synth.stopSpeaking(at: .immediate) } }
    nonisolated func speechSynthesizer(_ s: AVSpeechSynthesizer, didFinish u: AVSpeechUtterance) {
        Task { @MainActor in let f = self.onEnd; self.onEnd = nil; f?() }
    }
}
