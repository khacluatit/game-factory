import StoreKit

/// StoreKit 2: 3 vật phẩm dâng (consumable) + 3 gói giữ vĩnh viễn (non-consumable), đều $0.99.
@MainActor
final class Store {
    static let shared = Store()
    static let ids = [
        "com.beemob.mangalmandir.deepmala", "com.beemob.mangalmandir.flowers", "com.beemob.mangalmandir.sphatik",
        "com.beemob.mangalmandir.chandan", "com.beemob.mangalmandir.goldmala"
    ]
    private var products: [String: Product] = [:]
    private var listener: Task<Void, Never>?
    var onUpdate: (([String]) -> Void)?

    func loadProducts() async -> [[String: String]] {
        if let list = try? await Product.products(for: Self.ids) {
            for p in list { products[p.id] = p }
        }
        return products.values.map { ["id": $0.id, "price": $0.displayPrice] }
    }

    func buy(_ id: String) async -> Bool {
        if products[id] == nil, let p = try? await Product.products(for: [id]).first { products[id] = p }
        guard let product = products[id] else { return false }
        do {
            let result = try await product.purchase()
            switch result {
            case .success(let verification):
                guard case .verified(let tx) = verification else { return false }
                await tx.finish()
                return true
            default:
                return false
            }
        } catch {
            return false
        }
    }

    func owned() async -> [String] {
        var out: [String] = []
        for await result in Transaction.currentEntitlements {
            if case .verified(let tx) = result, tx.revocationDate == nil, tx.productType == .nonConsumable {
                out.append(tx.productID)
            }
        }
        return out
    }

    func restore() async -> [String] {
        try? await AppStore.sync()
        return await owned()
    }

    /// Giao dịch đến ngoài luồng mua (Ask to Buy, mua trên máy khác…).
    func startListening() {
        listener?.cancel()
        listener = Task { [weak self] in
            for await result in Transaction.updates {
                guard case .verified(let tx) = result else { continue }
                await tx.finish()
                if tx.productType == .nonConsumable, let self {
                    let owned = await self.owned()
                    self.onUpdate?(owned)
                }
            }
        }
    }
}
