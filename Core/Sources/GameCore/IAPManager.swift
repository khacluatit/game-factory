import Foundation
import StoreKit

/// StoreKit 2: một sản phẩm non-consumable "Remove Ads" + Restore (Apple bắt buộc có nút Restore).
@MainActor
public final class IAPManager: ObservableObject {
    @Published public private(set) var adsRemoved: Bool
    @Published public private(set) var product: Product?

    private var productID = ""
    private var updatesTask: Task<Void, Never>?
    private let key = "gc.adsRemoved"

    init() {
        adsRemoved = UserDefaults.standard.bool(forKey: key)
    }

    func start(productID: String) {
        self.productID = productID
        updatesTask = Task { [weak self] in
            for await update in Transaction.updates {
                if case .verified(let t) = update {
                    await t.finish()
                    await self?.refresh()
                }
            }
        }
        Task {
            product = try? await Product.products(for: [productID]).first
            await refresh()
        }
    }

    public var priceText: String { product?.displayPrice ?? "" }

    public func buyRemoveAds() async -> Bool {
        guard let product else { return false }
        do {
            let result = try await product.purchase()
            if case .success(.verified(let t)) = result {
                await t.finish()
                await refresh()
                Analytics.log("iap_remove_ads_purchased")
            }
        } catch {
            Analytics.log("iap_error")
        }
        return adsRemoved
    }

    public func restore() async {
        try? await AppStore.sync()
        await refresh()
    }

    private func refresh() async {
        var owned = false
        for await entitlement in Transaction.currentEntitlements {
            if case .verified(let t) = entitlement, t.productID == productID, t.revocationDate == nil {
                owned = true
            }
        }
        adsRemoved = owned
        UserDefaults.standard.set(owned, forKey: key)
    }
}
