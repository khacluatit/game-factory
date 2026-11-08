import StoreKit

/// StoreKit 2: 4 gói tiêu hao (xu, gói khởi đầu) + 3 gói vĩnh viễn (chương 4, chương 5, trọn bộ).
@MainActor
final class Store: ObservableObject {
    enum ID {
        static let coins300 = "com.beemob.pixelmines.coins300"
        static let coins1000 = "com.beemob.pixelmines.coins1000"
        static let coins2200 = "com.beemob.pixelmines.coins2200"
        static let starter = "com.beemob.pixelmines.starter"
        static let chapter4 = "com.beemob.pixelmines.chapter4"
        static let chapter5 = "com.beemob.pixelmines.chapter5"
        static let all = "com.beemob.pixelmines.allchapters"
        static let every = [coins300, coins1000, coins2200, starter, chapter4, chapter5, all]
    }

    /// Giá hiển thị khi chưa tải được sản phẩm từ App Store (đúng với bảng giá đã duyệt).
    static let fallbackPrice: [String: String] = [
        ID.coins300: "$0.99", ID.coins1000: "$2.99", ID.coins2200: "$4.99", ID.starter: "$1.99",
        ID.chapter4: "$1.99", ID.chapter5: "$1.99", ID.all: "$4.99",
    ]

    /// Khoá chương trong SaveData.owned ứng với từng sản phẩm vĩnh viễn.
    static let unlockKey: [String: String] = [ID.chapter4: "chapter4", ID.chapter5: "chapter5", ID.all: "all"]

    @Published private(set) var products: [String: Product] = [:]
    @Published var busy: String?
    @Published var message: String?

    private var listener: Task<Void, Never>?
    private var started = false

    func start() async {
        guard !started else { return }
        started = true
        listener = Task { [weak self] in
            for await result in Transaction.updates {
                guard case .verified(let tx) = result else { continue }
                await self?.handle(tx)
            }
        }
        if let list = try? await Product.products(for: ID.every) {
            var map: [String: Product] = [:]
            for p in list { map[p.id] = p }
            products = map
        }
        await syncEntitlements()
    }

    func price(_ id: String) -> String { products[id]?.displayPrice ?? Self.fallbackPrice[id] ?? "" }

    func buy(_ id: String) async -> Bool {
        if products[id] == nil, let p = try? await Product.products(for: [id]).first { products[id] = p }
        guard let product = products[id] else {
            message = L("The App Store is not available right now. Please try again.",
                        "Chưa kết nối được App Store. Bạn thử lại sau nhé.")
            return false
        }
        busy = id
        defer { busy = nil }
        do {
            let result = try await product.purchase()
            switch result {
            case .success(let verification):
                guard case .verified(let tx) = verification else { return false }
                await handle(tx)
                return true
            case .pending:
                message = L("Your purchase is waiting for approval.", "Giao dịch đang chờ được duyệt.")
                return false
            default:
                return false
            }
        } catch {
            message = L("The purchase could not be completed.", "Không hoàn tất được giao dịch.")
            return false
        }
    }

    func restore() async {
        busy = "restore"
        defer { busy = nil }
        try? await AppStore.sync()
        await syncEntitlements()
        message = L("Purchases restored.", "Đã khôi phục giao dịch.")
    }

    /// Giao hàng cho một giao dịch đã xác minh rồi đánh dấu hoàn tất.
    private func handle(_ tx: Transaction) async {
        if tx.revocationDate == nil { deliver(tx.productID) }
        await tx.finish()
        if tx.productType == .nonConsumable { await syncEntitlements() }
    }

    private func deliver(_ id: String) {
        let app = AppModel.shared
        switch id {
        case ID.coins300: app.earn(300)
        case ID.coins1000: app.earn(1000)
        case ID.coins2200: app.earn(2200)
        case ID.starter:
            app.earn(800)
            app.data.shields += 3
            app.data.starterBought = true
        default:
            if let key = Self.unlockKey[id] { app.data.owned.insert(key) }
        }
    }

    /// Đồng bộ các gói vĩnh viễn với App Store (cũng là cách Restore hoạt động).
    private func syncEntitlements() async {
        var owned = Set<String>()
        for await result in Transaction.currentEntitlements {
            if case .verified(let tx) = result, tx.revocationDate == nil, let key = Self.unlockKey[tx.productID] {
                owned.insert(key)
            }
        }
        let app = AppModel.shared
        if app.shot == nil { app.data.owned = owned }
    }
}
