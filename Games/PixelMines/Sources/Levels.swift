import Foundation

struct LText: Codable, Hashable {
    let en: String
    let vi: String
    var text: String { Lang.isVI ? vi : en }
}

enum Rarity: String, Codable {
    case common, rare, precious, legendary

    var title: String {
        switch self {
        case .common: return L("Common", "Thường")
        case .rare: return L("Rare", "Hiếm")
        case .precious: return L("Precious", "Quý")
        case .legendary: return L("Legendary", "Huyền thoại")
        }
    }
}

struct Chapter: Codable, Identifiable, Hashable {
    let id: Int
    let name: LText
    let rarity: Rarity
    let product: String?
    let count: Int
}

/// Một bức tranh = một bàn chơi. Bố cục bom sinh sẵn lúc build (tools/build_levels.py), luôn giải được bằng logic.
struct Level: Codable, Identifiable, Hashable {
    let id: String
    let chapter: Int
    let index: Int
    let name: LText
    let about: LText?
    let rarity: Rarity
    let w: Int
    let h: Int
    let colors: [String]
    let pixels: String
    let mines: [Int]
    let start: Int

    /// Chỉ số màu của từng ô, theo thứ tự hàng từ trên xuống.
    var pixelIndices: [Int] {
        pixels.map { Int(String($0), radix: 36) ?? 0 }
    }

    var pixelHex: [String] {
        let idx = pixelIndices
        return idx.map { colors[min($0, colors.count - 1)] }
    }

    func with(id: String, mines: [Int], start: Int) -> Level {
        Level(id: id, chapter: chapter, index: index, name: name, about: about, rarity: rarity,
              w: w, h: h, colors: colors, pixels: pixels, mines: mines, start: start)
    }
}

final class LevelPack {
    static let shared = LevelPack()

    let chapters: [Chapter]
    let levels: [Level]

    private init() {
        struct File: Codable { let chapters: [Chapter]; let levels: [Level] }
        guard let url = Bundle.main.url(forResource: "levels", withExtension: "json"),
              let data = try? Data(contentsOf: url),
              let file = try? JSONDecoder().decode(File.self, from: data) else {
            chapters = []
            levels = []
            return
        }
        chapters = file.chapters
        levels = file.levels
    }

    func levels(in chapter: Int) -> [Level] { levels.filter { $0.chapter == chapter } }
    func level(_ id: String) -> Level? { levels.first { $0.id == id } }
    func chapter(_ id: Int) -> Chapter? { chapters.first { $0.id == id } }
}
