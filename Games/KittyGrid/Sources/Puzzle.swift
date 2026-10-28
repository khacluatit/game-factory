import Foundation

/// RNG có seed để mỗi level luôn ra cùng một đề.
struct SeededRNG: RandomNumberGenerator {
    private var state: UInt64
    init(seed: UInt64) { state = seed &+ 0x9E37_79B9_7F4A_7C15 }
    mutating func next() -> UInt64 {
        state &+= 0x9E37_79B9_7F4A_7C15
        var z = state
        z = (z ^ (z >> 30)) &* 0xBF58_476D_1CE4_E5B9
        z = (z ^ (z >> 27)) &* 0x94D0_49BB_1331_11EB
        return z ^ (z >> 31)
    }
}

/// Đề bài: lưới N×N chia N vùng màu. Mỗi hàng, cột, vùng có đúng 1 mèo; 2 mèo không được chạm nhau (kể cả chéo).
struct Puzzle {
    let size: Int
    let regions: [[Int]]      // regions[row][col] = id vùng 0..<size
    let solution: [Int]       // solution[row] = cột có mèo

    static func size(forLevel level: Int) -> Int {
        switch level {
        case ..<4: return 5
        case ..<11: return 6
        case ..<26: return 7
        default: return 8
        }
    }

    /// Sinh đề có lời giải duy nhất. Deterministic theo level.
    static func generate(level: Int) -> Puzzle {
        let n = size(forLevel: level)
        var rng = SeededRNG(seed: UInt64(level) &* 7919 &+ 12345)
        var best: Puzzle?
        for _ in 0..<4000 {
            guard let sol = randomSolution(n: n, rng: &rng) else { continue }
            let regions = growRegions(n: n, seeds: sol, rng: &rng)
            let p = Puzzle(size: n, regions: regions, solution: sol)
            if p.countSolutions(limit: 2) == 1 { return p }
            best = best ?? p
        }
        // Rất hiếm khi tới đây; vẫn trả về đề hợp lệ (đáp án vẫn đúng, chỉ có thể nhiều lời giải)
        return best ?? Puzzle(size: n, regions: (0..<n).map { r in (0..<n).map { _ in r } },
                              solution: Array(0..<n))
    }

    private static func randomSolution(n: Int, rng: inout SeededRNG) -> [Int]? {
        var cols = [Int](repeating: -1, count: n)
        var used = Set<Int>()
        func place(_ r: Int) -> Bool {
            if r == n { return true }
            for c in (0..<n).shuffled(using: &rng) where !used.contains(c) {
                if r > 0 && abs(cols[r - 1] - c) <= 1 { continue }
                cols[r] = c; used.insert(c)
                if place(r + 1) { return true }
                used.remove(c)
            }
            return false
        }
        return place(0) ? cols : nil
    }

    private static func growRegions(n: Int, seeds: [Int], rng: inout SeededRNG) -> [[Int]] {
        var g = [[Int]](repeating: [Int](repeating: -1, count: n), count: n)
        var frontier: [(Int, Int, Int)] = []
        for (r, c) in seeds.enumerated() { g[r][c] = r; frontier.append((r, c, r)) }
        let dirs = [(0, 1), (1, 0), (0, -1), (-1, 0)]
        var filled = n
        while filled < n * n && !frontier.isEmpty {
            let i = Int.random(in: 0..<frontier.count, using: &rng)
            let (r, c, id) = frontier[i]
            let opts = dirs.map { (r + $0.0, c + $0.1) }
                .filter { $0.0 >= 0 && $0.0 < n && $0.1 >= 0 && $0.1 < n && g[$0.0][$0.1] == -1 }
            if opts.isEmpty { frontier.remove(at: i); continue }
            let (nr, nc) = opts.randomElement(using: &rng)!
            g[nr][nc] = id; filled += 1
            frontier.append((nr, nc, id))
        }
        return g
    }

    /// Đếm số lời giải (dừng khi đạt limit).
    func countSolutions(limit: Int) -> Int {
        var count = 0
        var cols = [Int](repeating: -1, count: size)
        var usedCol = [Bool](repeating: false, count: size)
        var usedReg = [Bool](repeating: false, count: size)
        func place(_ r: Int) {
            if count >= limit { return }
            if r == size { count += 1; return }
            for c in 0..<size where !usedCol[c] {
                let reg = regions[r][c]
                if usedReg[reg] { continue }
                if r > 0 && abs(cols[r - 1] - c) <= 1 { continue }
                cols[r] = c; usedCol[c] = true; usedReg[reg] = true
                place(r + 1)
                usedCol[c] = false; usedReg[reg] = false
            }
        }
        place(0)
        return count
    }

    func isCat(row: Int, col: Int) -> Bool { solution[row] == col }
}
