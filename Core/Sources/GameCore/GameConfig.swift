import Foundation

/// Cấu hình mỗi game, đọc từ Info.plist (giá trị được bơm vào từ game.env qua XcodeGen).
public struct GameConfig {
    public let interstitialID: String
    public let rewardedID: String
    public let removeAdsProductID: String
    /// Hiện interstitial sau mỗi N lần game over.
    public let interstitialEvery: Int
    /// Không hiện interstitial trong N giây đầu phiên chơi.
    public let interstitialGraceSeconds: TimeInterval

    public static func fromInfoPlist(_ bundle: Bundle = .main) -> GameConfig {
        func str(_ key: String, _ fallback: String) -> String {
            let v = (bundle.object(forInfoDictionaryKey: key) as? String) ?? ""
            return v.isEmpty || v.hasPrefix("$(") ? fallback : v
        }
        func int(_ key: String, _ fallback: Int) -> Int {
            Int(str(key, "\(fallback)")) ?? fallback
        }
        #if DEBUG
        // Luôn dùng test ID của Google khi debug để tránh bị khoá tài khoản AdMob.
        let inter = "ca-app-pub-3940256099942544/4411468910"
        let reward = "ca-app-pub-3940256099942544/1712485313"
        #else
        let inter = str("GCInterstitialID", "ca-app-pub-3940256099942544/4411468910")
        let reward = str("GCRewardedID", "ca-app-pub-3940256099942544/1712485313")
        #endif
        return GameConfig(
            interstitialID: inter,
            rewardedID: reward,
            removeAdsProductID: str("GCRemoveAdsProductID", "removeads"),
            interstitialEvery: int("GCInterstitialEvery", 3),
            interstitialGraceSeconds: TimeInterval(int("GCInterstitialGrace", 60))
        )
    }
}
