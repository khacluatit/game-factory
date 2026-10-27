import UIKit
import AppTrackingTransparency
import GoogleMobileAds
import UserMessagingPlatform

/// Điểm vào duy nhất. Gọi `GameCore.shared.start()` khi app vào trạng thái active.
@MainActor
public final class GameCore {
    public static let shared = GameCore()

    public private(set) var config = GameConfig.fromInfoPlist()
    public let ads = AdsManager()
    public let store = IAPManager()
    public let save = SaveStore()

    private var started = false
    private var adsStarted = false

    private init() {}

    /// Thứ tự bắt buộc: UMP consent (EU) → ATT → khởi động AdMob → load ads.
    public func start() {
        guard !started else { return }
        started = true
        Analytics.log("session_start")
        store.start(productID: config.removeAdsProductID)

        Task {
            await requestConsentIfNeeded()
            // Apple yêu cầu app đang active khi hiện ATT; đợi 1 nhịp cho chắc.
            try? await Task.sleep(nanoseconds: 600_000_000)
            _ = await ATTrackingManager.requestTrackingAuthorization()
            startAds()
        }
    }

    private func requestConsentIfNeeded() async {
        let params = RequestParameters()
        await withCheckedContinuation { (cont: CheckedContinuation<Void, Never>) in
            ConsentInformation.shared.requestConsentInfoUpdate(with: params) { _ in
                Task { @MainActor in
                    guard let vc = UIApplication.topViewController else { cont.resume(); return }
                    ConsentForm.loadAndPresentIfRequired(from: vc) { _ in cont.resume() }
                }
            }
        }
    }

    private func startAds() {
        guard !adsStarted else { return }
        guard ConsentInformation.shared.canRequestAds else { return }
        adsStarted = true
        MobileAds.shared.start { [weak self] _ in
            Task { @MainActor in
                guard let self else { return }
                self.ads.configure(config: self.config, adsRemoved: { [weak self] in self?.store.adsRemoved ?? false })
            }
        }
    }
}

extension UIApplication {
    static var topViewController: UIViewController? {
        let scene = shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .first { $0.activationState == .foregroundActive } ??
            shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first
        var vc = scene?.windows.first { $0.isKeyWindow }?.rootViewController
        while let presented = vc?.presentedViewController { vc = presented }
        return vc
    }
}
