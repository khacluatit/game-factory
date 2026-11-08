import SpriteKit
import UIKit

/// Cách một ô đang hiển thị.
enum CellLook: Equatable {
    case covered
    case flagged
    case hint
    case open(Int)
    case boom
    case finished
}

private enum Palette {
    static let cover = UIColor(hex: "#C9C3F2")
    static let coverHi = UIColor(hex: "#DCD7FA")
    static let coverLo = UIColor(hex: "#B3ABE6")
    static let grid = UIColor(hex: "#EDE6DA")
    static let ink = UIColor(hex: "#2B2340")
    static let flag = UIColor(hex: "#FF6B6B")
    static let hint = UIColor(hex: "#FFF1C2")
    static let hintRing = UIColor(hex: "#FFC83D")
}

/// Một ô trên bàn: lớp úp tím, mặt điểm ảnh, con số, cờ.
final class CellNode: SKNode {
    private let base = SKShapeNode()
    private let cover = SKShapeNode()
    private let label = SKLabelNode()
    private let badge = SKShapeNode()
    private let flag = SKNode()
    private(set) var look: CellLook = .covered
    private var size: CGFloat = 30
    var pixel: UIColor = .white

    override init() {
        super.init()
        addChild(base)
        addChild(cover)
        addChild(badge)
        addChild(label)
        addChild(flag)
        label.verticalAlignmentMode = .center
        label.horizontalAlignmentMode = .center
    }

    required init?(coder aDecoder: NSCoder) { fatalError() }

    func layout(size s: CGFloat) {
        size = s
        let r = s * 0.2
        base.path = CGPath(roundedRect: CGRect(x: -s / 2, y: -s / 2, width: s, height: s),
                           cornerWidth: r, cornerHeight: r, transform: nil)
        base.lineWidth = 0
        let ch = s * 0.9
        cover.path = CGPath(roundedRect: CGRect(x: -s / 2, y: -s / 2 + (s - ch), width: s, height: ch),
                            cornerWidth: r, cornerHeight: r, transform: nil)
        cover.lineWidth = 0
        badge.path = CGPath(ellipseIn: CGRect(x: -s * 0.33, y: -s * 0.33, width: s * 0.66, height: s * 0.66), transform: nil)
        badge.fillColor = UIColor(white: 0, alpha: 0.35)
        badge.lineWidth = 0
        flag.removeAllChildren()
        let pole = SKShapeNode(rect: CGRect(x: -s * 0.2, y: -s * 0.3, width: s * 0.08, height: s * 0.62))
        pole.fillColor = Palette.ink
        pole.lineWidth = 0
        let tri = CGMutablePath()
        tri.move(to: CGPoint(x: -s * 0.13, y: s * 0.31))
        tri.addLine(to: CGPoint(x: s * 0.3, y: s * 0.14))
        tri.addLine(to: CGPoint(x: -s * 0.13, y: -s * 0.02))
        tri.closeSubpath()
        let cloth = SKShapeNode(path: tri)
        cloth.fillColor = Palette.flag
        cloth.strokeColor = Palette.ink
        cloth.lineWidth = max(1, s * 0.04)
        cloth.lineJoin = .round
        flag.addChild(pole)
        flag.addChild(cloth)
        apply(look, highContrast: badge.isHidden == false)
    }

    func apply(_ newLook: CellLook, highContrast: Bool) {
        look = newLook
        base.strokeColor = .clear
        base.lineWidth = 0
        cover.isHidden = true
        label.isHidden = true
        badge.isHidden = true
        flag.isHidden = true
        switch newLook {
        case .covered, .flagged:
            base.fillColor = Palette.coverLo
            cover.isHidden = false
            cover.fillColor = Palette.cover
            flag.isHidden = newLook != .flagged
        case .hint:
            base.fillColor = Palette.hint
            base.strokeColor = Palette.hintRing
            base.lineWidth = max(2, size * 0.08)
        case .open(let n):
            base.fillColor = pixel
            if n > 0 {
                label.isHidden = false
                badge.isHidden = !highContrast
                label.attributedText = NSAttributedString(string: "\(n)", attributes: [
                    .font: Theme.uiFont(size * 0.58),
                    .foregroundColor: UIColor.white,
                    .strokeColor: Palette.ink,
                    .strokeWidth: -6,
                ])
            }
        case .boom:
            base.fillColor = Palette.ink
        case .finished:
            base.fillColor = pixel
        }
    }
}

/// Cảnh SpriteKit của bàn chơi. Chỉ vẽ và báo chạm; luật nằm trong Board/GameController.
final class BoardScene: SKScene {
    var onTap: ((Int) -> Void)?
    var onLongPress: ((Int) -> Void)?
    var longPressEnabled = true
    var highContrast = false

    private let cols: Int
    private let rows: Int
    private let pixels: [UIColor]
    private var cells: [CellNode] = []
    private let board = SKShapeNode()
    private let content = SKNode()
    private var cellSize: CGFloat = 30
    private let gap: CGFloat = 2
    private let pad: CGFloat = 6
    private var frameRect = CGRect.zero

    private var touchCell: Int?
    private var touchStart = CGPoint.zero
    private var longFired = false

    init(level: Level, size: CGSize) {
        cols = level.w
        rows = level.h
        pixels = level.pixelHex.map { UIColor(hex: $0) }
        super.init(size: size)
        backgroundColor = .clear
        scaleMode = .resizeFill
        addChild(board)
        addChild(content)
        for i in 0..<(cols * rows) {
            let c = CellNode()
            c.pixel = pixels[i]
            cells.append(c)
            content.addChild(c)
        }
        layoutGrid()
    }

    required init?(coder aDecoder: NSCoder) { fatalError() }

    override func didChangeSize(_ oldSize: CGSize) {
        super.didChangeSize(oldSize)
        layoutGrid()
    }

    private func layoutGrid() {
        guard size.width > 20, size.height > 20, !cells.isEmpty else { return }
        let availW = size.width - pad * 2 - CGFloat(cols - 1) * gap
        let availH = size.height - pad * 2 - CGFloat(rows - 1) * gap
        cellSize = max(10, min(46, floor(min(availW / CGFloat(cols), availH / CGFloat(rows)))))
        let bw = CGFloat(cols) * cellSize + CGFloat(cols - 1) * gap + pad * 2
        let bh = CGFloat(rows) * cellSize + CGFloat(rows - 1) * gap + pad * 2
        frameRect = CGRect(x: (size.width - bw) / 2, y: (size.height - bh) / 2, width: bw, height: bh)
        board.path = CGPath(roundedRect: frameRect, cornerWidth: 16, cornerHeight: 16, transform: nil)
        board.fillColor = Palette.grid
        board.lineWidth = 0
        for (i, c) in cells.enumerated() {
            c.position = center(of: i)
            c.layout(size: cellSize)
            c.apply(c.look, highContrast: highContrast)
        }
    }

    private func center(of i: Int) -> CGPoint {
        let c = i % cols, r = i / cols
        let x = frameRect.minX + pad + CGFloat(c) * (cellSize + gap) + cellSize / 2
        let y = frameRect.maxY - pad - CGFloat(r) * (cellSize + gap) - cellSize / 2
        return CGPoint(x: x, y: y)
    }

    private func cellIndex(at p: CGPoint) -> Int? {
        let x = p.x - frameRect.minX - pad
        let y = frameRect.maxY - pad - p.y
        guard x >= 0, y >= 0 else { return nil }
        let c = Int(x / (cellSize + gap)), r = Int(y / (cellSize + gap))
        guard c < cols, r < rows else { return nil }
        return r * cols + c
    }

    // MARK: - Vẽ trạng thái

    /// Đặt ngay hình dạng cho mọi ô (khi mở bàn, khi cắm cờ…).
    func render(_ looks: [CellLook]) {
        for (i, l) in looks.enumerated() where i < cells.count && cells[i].look != l {
            cells[i].apply(l, highContrast: highContrast)
        }
    }

    /// Mở các ô theo từng vòng, mỗi vòng trễ một chút: hiệu ứng mở lan dây chuyền.
    func reveal(rings: [[Int]], looks: [CellLook]) {
        for (k, ring) in rings.enumerated() {
            let delay = Double(k) * 0.025
            for i in ring where i < cells.count {
                let node = cells[i]
                let look = looks[i]
                node.removeAction(forKey: "reveal")
                node.run(.sequence([
                    .wait(forDuration: delay),
                    .run { node.apply(look, highContrast: self.highContrast); node.setScale(0.8) },
                    .scale(to: 1.06, duration: 0.08),
                    .scale(to: 1.0, duration: 0.06),
                ]), withKey: "reveal")
            }
        }
    }

    func pulse(_ i: Int) {
        guard i < cells.count else { return }
        cells[i].run(.sequence([.scale(to: 1.15, duration: 0.08), .scale(to: 1.0, duration: 0.1)]))
    }

    /// Vệt mực loang ra khi trúng bom.
    func splash(at i: Int) {
        guard i < cells.count else { return }
        let p = center(of: i)
        let offsets: [(CGFloat, CGFloat, CGFloat)] = [(0, 0, 0.55), (-0.9, 0.6, 0.18), (0.95, 0.5, 0.15),
                                                      (0.7, -0.9, 0.2), (-0.8, -0.7, 0.13), (0.1, 1.1, 0.11), (-1.2, 0, 0.1)]
        for (k, o) in offsets.enumerated() {
            let r = cellSize * o.2
            let dot = SKShapeNode(circleOfRadius: r)
            dot.fillColor = Palette.ink
            dot.lineWidth = 0
            dot.position = CGPoint(x: p.x + o.0 * cellSize, y: p.y + o.1 * cellSize)
            dot.setScale(0.1)
            dot.zPosition = 5
            dot.name = "ink"
            addChild(dot)
            dot.run(.sequence([.wait(forDuration: Double(k) * 0.02), .scale(to: 1, duration: 0.12)]))
        }
        let shake = SKAction.sequence([
            .moveBy(x: 6, y: 0, duration: 0.04), .moveBy(x: -12, y: 0, duration: 0.06),
            .moveBy(x: 6, y: 0, duration: 0.04),
        ])
        content.run(shake)
        board.run(shake)
    }

    func clearInk() {
        children.filter { $0.name == "ink" }.forEach { $0.removeFromParent() }
    }

    /// Thắng: số mờ đi, bom hiện màu thật, một làn sáng quét chéo qua tranh.
    func celebrate() {
        clearInk()
        for (i, node) in cells.enumerated() {
            let c = i % cols, r = i / cols
            let delay = Double(c + r) * 0.035
            node.run(.sequence([
                .wait(forDuration: delay),
                .run { node.apply(.finished, highContrast: false) },
                .scale(to: 1.1, duration: 0.09),
                .scale(to: 1.0, duration: 0.12),
            ]))
        }
    }

    // MARK: - Chạm

    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let t = touches.first else { return }
        let p = t.location(in: self)
        touchStart = p
        longFired = false
        touchCell = cellIndex(at: p)
        removeAction(forKey: "long")
        guard touchCell != nil, longPressEnabled else { return }
        run(.sequence([.wait(forDuration: 0.3), .run { [weak self] in self?.fireLong() }]), withKey: "long")
    }

    override func touchesMoved(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let t = touches.first else { return }
        let p = t.location(in: self)
        if hypot(p.x - touchStart.x, p.y - touchStart.y) > cellSize * 0.6 {
            removeAction(forKey: "long")
            touchCell = nil
        }
    }

    override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
        removeAction(forKey: "long")
        defer { touchCell = nil }
        guard !longFired, let c = touchCell, let t = touches.first, cellIndex(at: t.location(in: self)) == c else { return }
        let cb = onTap
        Task { @MainActor in cb?(c) }
    }

    override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent?) {
        removeAction(forKey: "long")
        touchCell = nil
    }

    private func fireLong() {
        guard let c = touchCell else { return }
        longFired = true
        let cb = onLongPress
        Task { @MainActor in cb?(c) }
    }
}
