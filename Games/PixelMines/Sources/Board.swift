import Foundation

/// Trạng thái bàn đang chơi, lưu lại để thoát app vào lại vẫn chơi tiếp.
struct BoardState: Codable, Equatable {
    var opened: [Bool]
    var flagged: [Bool]
    var shieldActive = false
    var usedHint = false
    var usedShield = false
    var usedContinue = false
}

/// Luật dò mìn trên một bức tranh. Không biết gì về hình ảnh, chỉ ô / bom / số.
final class Board {
    let w: Int
    let h: Int
    let isMine: [Bool]
    let counts: [Int]
    let start: Int
    let mineCount: Int
    var state: BoardState

    init(w: Int, h: Int, mines: [Int], start: Int, state: BoardState? = nil) {
        self.w = w
        self.h = h
        self.start = start
        var m = Array(repeating: false, count: w * h)
        for i in mines where i >= 0 && i < w * h { m[i] = true }
        isMine = m
        mineCount = mines.count
        var c = Array(repeating: 0, count: w * h)
        for i in 0..<(w * h) {
            c[i] = Board.neighbors(i, w: w, h: h).filter { m[$0] }.count
        }
        counts = c
        if let s = state, s.opened.count == w * h, s.flagged.count == w * h {
            self.state = s
        } else {
            self.state = BoardState(opened: Array(repeating: false, count: w * h),
                                    flagged: Array(repeating: false, count: w * h))
        }
    }

    static func neighbors(_ i: Int, w: Int, h: Int) -> [Int] {
        let x = i % w, y = i / w
        var out: [Int] = []
        out.reserveCapacity(8)
        for dy in -1...1 {
            for dx in -1...1 where dx != 0 || dy != 0 {
                let nx = x + dx, ny = y + dy
                if nx >= 0, nx < w, ny >= 0, ny < h { out.append(ny * w + nx) }
            }
        }
        return out
    }

    func neighbors(_ i: Int) -> [Int] { Board.neighbors(i, w: w, h: h) }

    var safeTotal: Int { w * h - mineCount }
    var openedCount: Int { state.opened.filter { $0 }.count }
    var progress: Double { safeTotal == 0 ? 1 : Double(openedCount) / Double(safeTotal) }
    var isWon: Bool { openedCount >= safeTotal }
    var isFresh: Bool { openedCount == 0 }

    /// Mở một ô an toàn, lan ra các ô số 0. Trả về các "vòng" ô mới mở theo khoảng cách để tạo hiệu ứng dây chuyền.
    func flood(from i: Int) -> [[Int]] {
        guard !state.opened[i], !state.flagged[i], !isMine[i] else { return [] }
        var rings: [[Int]] = []
        var frontier = [i]
        state.opened[i] = true
        while !frontier.isEmpty {
            rings.append(frontier)
            var next: [Int] = []
            for c in frontier where counts[c] == 0 {
                for n in neighbors(c) where !state.opened[n] && !state.flagged[n] && !isMine[n] {
                    state.opened[n] = true
                    next.append(n)
                }
            }
            frontier = next
        }
        return rings
    }

    /// Ô chưa mở, chưa cắm cờ quanh một ô số khi số cờ xung quanh đã đủ (chording). Rỗng nếu chưa đủ cờ.
    func chordTargets(_ i: Int) -> [Int] {
        guard state.opened[i], counts[i] > 0 else { return [] }
        let nb = neighbors(i)
        let flags = nb.filter { state.flagged[$0] }.count
        guard flags == counts[i] else { return [] }
        return nb.filter { !state.opened[$0] && !state.flagged[$0] }
    }

    func toggleFlag(_ i: Int) {
        guard !state.opened[i] else { return }
        state.flagged[i].toggle()
    }

    /// Một ô an toàn suy ra được từ những gì đang thấy (dùng cho Đèn soi). Bỏ qua cờ của người chơi vì cờ có thể sai.
    func deducibleSafeCell() -> Int? {
        if let c = Logic.nextSafe(w: w, h: h, counts: counts, opened: state.opened) { return c }
        // Phòng hờ: bàn đã kiểm tra không cần đoán nên hiếm khi tới đây.
        return (0..<(w * h)).first { !state.opened[$0] && !isMine[$0] }
    }
}

/// Bộ suy luận dò mìn: luật đơn, luật tập con và đếm tổng bom. Dùng cho Đèn soi và sinh tranh hằng ngày.
enum Logic {
    private static func deduce(w: Int, h: Int, counts: [Int], opened: [Bool], mines: Set<Int>) -> (safe: Set<Int>, mines: Set<Int>) {
        var safe = Set<Int>()
        var newMines = Set<Int>()
        var constraints: [(cells: Set<Int>, need: Int)] = []
        for i in 0..<(w * h) where opened[i] && counts[i] > 0 {
            let nb = Board.neighbors(i, w: w, h: h)
            let unknown = nb.filter { !opened[$0] && !mines.contains($0) }
            if unknown.isEmpty { continue }
            let need = counts[i] - nb.filter { mines.contains($0) }.count
            if need == 0 {
                safe.formUnion(unknown)
            } else if need == unknown.count {
                newMines.formUnion(unknown)
            } else {
                constraints.append((Set(unknown), need))
            }
        }
        if !safe.isEmpty || !newMines.isEmpty { return (safe, newMines) }
        for a in constraints {
            for b in constraints where a.cells != b.cells && a.cells.isSubset(of: b.cells) {
                let rest = b.cells.subtracting(a.cells)
                let diff = b.need - a.need
                if diff == 0 { safe.formUnion(rest) }
                else if diff == rest.count { newMines.formUnion(rest) }
            }
            if !safe.isEmpty || !newMines.isEmpty { break }
        }
        return (safe, newMines)
    }

    /// Ô an toàn kế tiếp suy ra được từ các ô đã mở.
    static func nextSafe(w: Int, h: Int, counts: [Int], opened: [Bool]) -> Int? {
        var mines = Set<Int>()
        for _ in 0..<(w * h) {
            let r = deduce(w: w, h: h, counts: counts, opened: opened, mines: mines)
            if let s = r.safe.first(where: { !opened[$0] }) { return s }
            if r.mines.subtracting(mines).isEmpty { return nil }
            mines.formUnion(r.mines)
        }
        return nil
    }

    /// Cả bàn có giải được từ ô bắt đầu mà không cần đoán không.
    static func solvable(w: Int, h: Int, mines: [Int], start: Int) -> Bool {
        let board = Board(w: w, h: h, mines: mines, start: start)
        guard !board.isMine[start], board.counts[start] == 0 else { return false }
        _ = board.flood(from: start)
        var known = Set<Int>()
        var guardCount = 0
        while !board.isWon {
            guardCount += 1
            if guardCount > w * h * 4 { return false }
            let r = deduce(w: w, h: h, counts: board.counts, opened: board.state.opened, mines: known)
            if !r.safe.isEmpty {
                for s in r.safe where !board.state.opened[s] { _ = board.flood(from: s) }
                continue
            }
            if !r.mines.subtracting(known).isEmpty {
                known.formUnion(r.mines)
                continue
            }
            let unknown = (0..<(w * h)).filter { !board.state.opened[$0] && !known.contains($0) }
            let left = mines.count - known.count
            if left == 0 {
                for s in unknown { _ = board.flood(from: s) }
                continue
            }
            if left == unknown.count { return true }
            return false
        }
        return true
    }
}

/// Bộ sinh số giả ngẫu nhiên có seed, để tranh hằng ngày giống nhau trên mọi máy trong cùng một ngày.
struct SeededRNG: RandomNumberGenerator {
    private var state: UInt64
    init(seed: UInt64) { state = seed &+ 0x9E3779B97F4A7C15 }
    mutating func next() -> UInt64 {
        state &+= 0x9E3779B97F4A7C15
        var z = state
        z = (z ^ (z >> 30)) &* 0xBF58476D1CE4E5B9
        z = (z ^ (z >> 27)) &* 0x94D049BB133111EB
        return z ^ (z >> 31)
    }
}

enum Generator {
    /// Đặt bom mới cho một bức tranh, đảm bảo giải được bằng logic.
    static func layout(w: Int, h: Int, density: Double, seed: UInt64) -> (mines: [Int], start: Int)? {
        var rng = SeededRNG(seed: seed)
        let start = (h / 2) * w + w / 2
        let banned = Set([start] + Board.neighbors(start, w: w, h: h))
        let candidates = (0..<(w * h)).filter { !banned.contains($0) }
        let k = max(2, Int((Double(w * h) * density).rounded()))
        for _ in 0..<3000 {
            let mines = Array(candidates.shuffled(using: &rng).prefix(k)).sorted()
            if Logic.solvable(w: w, h: h, mines: mines, start: start) { return (mines, start) }
        }
        return nil
    }
}
