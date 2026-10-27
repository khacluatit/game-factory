import UIKit
import GoogleMobileAds

/// Interstitial + Rewarded qua AdMob, có giới hạn tần suất để không bị user ghét / Apple reject.
@MainActor
public final class AdsManager: NSObject, FullScreenContentDelegate {
    private var config: GameConfig?
    private var adsRemoved: () -> Bool = { false }

    private var interstitial: InterstitialAd?
    private var rewarded: RewardedAd?
    private var gameOverCount = 0
    private var sessionStart = Date()
    private var lastInterstitial = Date.distantPast
    private var onDismiss: (() -> Void)?
    private var rewardEarned = false
    private var rewardCompletion: ((Bool) -> Void)?

    public var isRewardedReady: Bool { rewarded != nil }

    func configure(config: GameConfig, adsRemoved: @escaping () -> Bool) {
        self.config = config
        self.adsRemoved = adsRemoved
        sessionStart = Date()
        loadInterstitial()
        loadRewarded()
    }

    // MARK: Interstitial

    private func loadInterstitial() {
        guard let id = config?.interstitialID, !adsRemoved() else { return }
        Task {
            do {
                let ad = try await InterstitialAd.load(with: id, request: Request())
                ad.fullScreenContentDelegate = self
                interstitial = ad
            } catch {
                Analytics.log("ad_inter_load_fail")
                try? await Task.sleep(nanoseconds: 30_000_000_000)
                loadInterstitial()
            }
        }
    }

    /// Gọi mỗi lần game over. Tự quyết định có hiện quảng cáo hay không. `completion` luôn được gọi.
    public func gameOver(completion: @escaping () -> Void) {
        gameOverCount += 1
        guard let config, !adsRemoved(),
              gameOverCount % max(config.interstitialEvery, 1) == 0,
              Date().timeIntervalSince(sessionStart) > config.interstitialGraceSeconds,
              Date().timeIntervalSince(lastInterstitial) > 45,
              let ad = interstitial,
              let vc = UIApplication.topViewController else {
            completion(); return
        }
        onDismiss = completion
        interstitial = nil
        lastInterstitial = Date()
        Analytics.log("ad_inter_show")
        ad.present(from: vc)
    }

    // MARK: Rewarded (vẫn cho xem kể cả khi đã mua Remove Ads — vì user tự chọn)

    private func loadRewarded() {
        guard let id = config?.rewardedID else { return }
        Task {
            do {
                let ad = try await RewardedAd.load(with: id, request: Request())
                ad.fullScreenContentDelegate = self
                rewarded = ad
            } catch {
                Analytics.log("ad_reward_load_fail")
                try? await Task.sleep(nanoseconds: 30_000_000_000)
                loadRewarded()
            }
        }
    }

    public func showRewarded(placement: String, completion: @escaping (Bool) -> Void) {
        guard let ad = rewarded, let vc = UIApplication.topViewController else {
            completion(false); return
        }
        rewarded = nil
        rewardEarned = false
        rewardCompletion = completion
        Analytics.log("ad_reward_show_\(placement)")
        ad.present(from: vc) { [weak self] in
            self?.rewardEarned = true
        }
    }

    // MARK: FullScreenContentDelegate

    nonisolated public func adDidDismissFullScreenContent(_ ad: FullScreenPresentingAd) {
        Task { @MainActor in self.finish(ad) }
    }

    nonisolated public func ad(_ ad: FullScreenPresentingAd,
                               didFailToPresentFullScreenContentWithError error: Error) {
        Task { @MainActor in self.finish(ad) }
    }

    private func finish(_ ad: FullScreenPresentingAd) {
        if ad is InterstitialAd {
            onDismiss?(); onDismiss = nil
            loadInterstitial()
        } else if ad is RewardedAd {
            rewardCompletion?(rewardEarned); rewardCompletion = nil
            loadRewarded()
        }
    }
}
