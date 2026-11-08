import SwiftUI

/// Mọi thứ cần lưu trên máy. Không có tài khoản, không gửi đi đâu.
struct SaveData: Codable {
    var coins = 100
    var shields = 0
    var stars: [String: Int] = [:]
    var owned: Set<String> = []          // "chapter4", "chapter5", "all"
    var starterBought = false
    var starterOffered = false
    var chapterBonus: Set<Int> = []
    var boards: [String: BoardState] = [:]
    var dailyStreak = 0
    var dailyLastDone: String?
    var sound = true
    var haptics = true
    var flagByLongPress = true
    var highContrast = false
    var tutorialSeen: Set<String> = []

    init() {}

    // Giải mã từng khoá có mặc định, để bản cập nhật sau thêm trường mới không làm mất dữ liệu cũ.
    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        let d = SaveData()
        coins = try c.decodeIfPresent(Int.self, forKey: .coins) ?? d.coins
        shields = try c.decodeIfPresent(Int.self, forKey: .shields) ?? d.shields
        stars = try c.decodeIfPresent([String: Int].self, forKey: .stars) ?? d.stars
        owned = try c.decodeIfPresent(Set<String>.self, forKey: .owned) ?? d.owned
        starterBought = try c.decodeIfPresent(Bool.self, forKey: .starterBought) ?? d.starterBought
        starterOffered = try c.decodeIfPresent(Bool.self, forKey: .starterOffered) ?? d.starterOffered
        chapterBonus = try c.decodeIfPresent(Set<Int>.self, forKey: .chapterBonus) ?? d.chapterBonus
        boards = try c.decodeIfPresent([String: BoardState].self, forKey: .boards) ?? d.boards
        dailyStreak = try c.decodeIfPresent(Int.self, forKey: .dailyStreak) ?? d.dailyStreak
        dailyLastDone = try c.decodeIfPresent(String.self, forKey: .dailyLastDone)
        sound = try c.decodeIfPresent(Bool.self, forKey: .sound) ?? d.sound
        haptics = try c.decodeIfPresent(Bool.self, forKey: .haptics) ?? d.haptics
        flagByLongPress = try c.decodeIfPresent(Bool.self, forKey: .flagByLongPress) ?? d.flagByLongPress
        highContrast = try c.decodeIfPresent(Bool.self, forKey: .highContrast) ?? d.highContrast
        tutorialSeen = try c.decodeIfPresent(Set<String>.self, forKey: .tutorialSeen) ?? d.tutorialSeen
    }
}

enum Route: Equatable {
    case home, album, chapter(Int), game
}

enum Sheet: Identifiable, Equatable {
    case shop, settings, locked(Int), starter
    var id: String {
        switch self {
        case .shop: return "shop"
        case .settings: return "settings"
        case .locked(let c): return "locked\(c)"
        case .starter: return "starter"
        }
    }
}

enum Price {
    static let hint = 30
    static let shield = 40
    static let continueGame = 60
}

@MainActor
final class AppModel: ObservableObject {
    static let shared = AppModel()

    @Published var route: Route = .home
    @Published var sheet: Sheet?
    @Published var game: GameController?
    @Published var data: SaveData {
        didSet { persist() }
    }

    let pack = LevelPack.shared
    let store = Store()
    /// Ảnh chụp App Store: app mở với "-shot <tên>".
    let shot: String? = UserDefaults.standard.string(forKey: "shot")

    private let key = "pm.save.v1"

    private init() {
        if let raw = UserDefaults.standard.data(forKey: key),
           let d = try? JSONDecoder().decode(SaveData.self, from: raw) {
            data = d
        } else {
            data = SaveData()
        }
        if shot != nil { data = Self.demoData() }
    }

    private func persist() {
        guard shot == nil, let raw = try? JSONEncoder().encode(data) else { return }
        UserDefaults.standard.set(raw, forKey: key)
    }

    // MARK: - Tiến trình

    func stars(_ level: Level) -> Int { data.stars[level.id] ?? 0 }
    func isDone(_ level: Level) -> Bool { stars(level) > 0 }

    func completed(in chapter: Int) -> Int {
        pack.levels(in: chapter).filter { isDone($0) }.count
    }

    func starsIn(_ chapter: Int) -> Int {
        pack.levels(in: chapter).reduce(0) { $0 + stars($1) }
    }

    var totalStars: Int { data.stars.values.reduce(0, +) }
    var totalDone: Int { data.stars.values.filter { $0 > 0 }.count }
    var freeLevelCount: Int { pack.chapters.filter { $0.product == nil }.reduce(0) { $0 + $1.count } }

    func ownsChapter(_ ch: Chapter) -> Bool {
        guard let p = ch.product else { return true }
        return data.owned.contains(p) || data.owned.contains("all")
    }

    /// Chương có thể chơi chưa. Chương trả phí chỉ cần mua; chương miễn phí cần xong 8 tranh chương trước.
    func isUnlocked(_ ch: Chapter) -> Bool {
        if ch.product != nil { return ownsChapter(ch) }
        if ch.id == 1 { return true }
        return completed(in: ch.id - 1) >= 8
    }

    func isUnlocked(_ level: Level) -> Bool {
        guard let ch = pack.chapter(level.chapter), isUnlocked(ch) else { return false }
        if level.index == 0 { return true }
        let list = pack.levels(in: level.chapter)
        return level.index < list.count && isDone(list[level.index - 1])
    }

    /// Tranh nên chơi tiếp: bàn đang dở, hoặc tranh đầu tiên chưa xong đã mở khoá.
    var nextLevel: Level? {
        if let id = data.boards.keys.sorted().first(where: { !$0.hasPrefix("daily") }),
           let lv = pack.level(id), isUnlocked(lv), !isDone(lv) { return lv }
        return pack.levels.first { isUnlocked($0) && !isDone($0) } ?? pack.levels.last { isUnlocked($0) }
    }

    // MARK: - Ví xu

    func earn(_ n: Int) { data.coins += n }

    @discardableResult
    func spend(_ n: Int) -> Bool {
        guard data.coins >= n else { return false }
        data.coins -= n
        return true
    }

    // MARK: - Điều hướng

    func play(_ level: Level, daily: Bool = false) {
        game = GameController(app: self, level: level, isDaily: daily)
        route = .game
    }

    func playNext() {
        if let lv = nextLevel { play(lv) }
    }

    func openChapter(_ ch: Chapter) {
        if isUnlocked(ch) {
            route = .chapter(ch.id)
        } else if ch.product != nil {
            sheet = .locked(ch.id)
        }
    }

    func leaveGame() {
        game?.saveProgress()
        game = nil
        route = .home
    }

    // MARK: - Tranh hằng ngày

    static var todayKey: String {
        let f = DateFormatter()
        f.calendar = Calendar(identifier: .gregorian)
        f.locale = Locale(identifier: "en_US_POSIX")
        f.dateFormat = "yyyy-MM-dd"
        return f.string(from: Date())
    }

    var dailyDoneToday: Bool { data.dailyLastDone == Self.todayKey }

    /// Thưởng chuỗi ngày: 10, 15, 20… tối đa 40 xu.
    var dailyReward: Int { min(40, 10 + 5 * max(0, nextStreak - 1)) }

    var nextStreak: Int {
        guard let last = data.dailyLastDone else { return 1 }
        if last == Self.todayKey { return data.dailyStreak }
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_US_POSIX")
        f.dateFormat = "yyyy-MM-dd"
        guard let d = f.date(from: last),
              let y = Calendar.current.date(byAdding: .day, value: -1, to: Date()),
              Calendar.current.isDate(d, inSameDayAs: y) else { return 1 }
        return data.dailyStreak + 1
    }

    /// Tranh của hôm nay: lấy một bức trong các chương miễn phí, đặt bom mới theo ngày.
    func dailyLevel() -> Level? {
        let key = Self.todayKey
        let pool = pack.levels.filter { $0.chapter <= 3 }
        guard !pool.isEmpty else { return nil }
        let seed = key.utf8.reduce(UInt64(1469598103934665603)) { ($0 ^ UInt64($1)) &* 1099511628211 }
        let pick = pool[Int(seed % UInt64(pool.count))]
        guard let lay = Generator.layout(w: pick.w, h: pick.h, density: 0.15, seed: seed) else { return pick }
        return pick.with(id: "daily-\(key)", mines: lay.mines, start: lay.start)
    }

    func playDaily() {
        if let lv = dailyLevel() { play(lv, daily: true) }
    }

    // MARK: - Hoàn thành

    struct Reward {
        var coins: Int
        var stars: Int
        var chapterBonus: Bool
        var streak: Int?
    }

    func finish(level: Level, isDaily: Bool, stars: Int) -> Reward {
        data.boards[level.id] = nil
        if isDaily {
            let streak = nextStreak
            let coins = dailyReward
            if !dailyDoneToday {
                data.dailyStreak = streak
                data.dailyLastDone = Self.todayKey
                earn(coins)
                return Reward(coins: coins, stars: stars, chapterBonus: false, streak: streak)
            }
            return Reward(coins: 0, stars: stars, chapterBonus: false, streak: streak)
        }
        let first = !isDone(level)
        let before = self.stars(level)
        var coins = first ? 10 : 0
        if stars == 3 && before < 3 { coins += 5 }
        data.stars[level.id] = max(before, stars)
        var bonus = false
        if starsIn(level.chapter) >= 36, !data.chapterBonus.contains(level.chapter) {
            data.chapterBonus.insert(level.chapter)
            coins += 100
            bonus = true
        }
        earn(coins)
        return Reward(coins: coins, stars: stars, chapterBonus: bonus, streak: nil)
    }

    /// Gói khởi đầu hiện một lần, sau khi người chơi xong bàn thứ 6 (đã quen game).
    func maybeOfferStarter() {
        guard !data.starterOffered, !data.starterBought, totalDone >= 6, shot == nil else { return }
        data.starterOffered = true
        sheet = .starter
    }

    // MARK: - Dữ liệu mẫu cho ảnh App Store

    private static func demoData() -> SaveData {
        var d = SaveData()
        d.coins = 350
        let pack = LevelPack.shared
        for lv in pack.levels where lv.chapter == 1 && lv.index < 9 { d.stars[lv.id] = lv.index % 3 == 1 ? 2 : 3 }
        for lv in pack.levels where lv.chapter == 2 && lv.index < 2 { d.stars[lv.id] = 3 }
        d.dailyStreak = 2
        d.tutorialSeen = ["c1-01", "c1-02", "c1-03"]
        return d
    }
}
