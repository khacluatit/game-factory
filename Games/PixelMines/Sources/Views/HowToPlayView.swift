import SwiftUI

/// Màn "Cách chơi": giải thích luật bằng chữ ngắn + bàn mẫu 3×3 minh hoạ.
struct HowToPlayView: View {
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Text(L("How to play", "Cách chơi")).font(Theme.font(30, .black)).foregroundColor(Theme.ink)
                Spacer()
                RoundIconButton(system: "xmark", label: L("Close", "Đóng")) { dismiss() }
            }
            .padding(.horizontal, 20).padding(.top, 24).padding(.bottom, 12)

            ScrollView(showsIndicators: false) {
                VStack(spacing: 14) {
                    section(
                        title: L("Goal", "Mục tiêu"),
                        text: L("Each tile is one pixel of a hidden picture. Open every safe tile without touching an ink bomb, and the whole picture appears.",
                                "Mỗi ô là một điểm ảnh của bức tranh ẩn. Mở hết các ô an toàn mà không chạm vào bom mực, bức tranh sẽ hiện ra trọn vẹn."),
                        example: nil)

                    section(
                        title: L("Tile colours", "Màu của ô"),
                        text: L("Purple tiles are still closed. A coloured tile is open: its colour is simply that pixel of the picture. Colours are never a clue, only the numbers are.",
                                "Ô màu tím là ô chưa mở. Ô có màu là ô đã mở: màu đó chính là điểm ảnh của bức tranh. Màu không phải gợi ý, chỉ con số mới là gợi ý."),
                        example: MiniBoard(cells: [.open(0, "#FFE8EE"), .open(1, "#FF4D5E"), .covered,
                                                   .open(0, "#4CC36B"), .open(1, "#FF4D5E"), .covered,
                                                   .open(0, "#FFE8EE"), .open(1, "#C62F45"), .covered],
                                           caption: L("Open tiles show the picture", "Ô đã mở hiện màu tranh")))

                    section(
                        title: L("What the numbers mean", "Con số nghĩa là gì"),
                        text: L("A number tells how many ink bombs touch that tile, counting all 8 neighbours: up, down, left, right and the 4 diagonals. An open tile with no number has no bombs around it, so its neighbours open automatically.",
                                "Con số cho biết có bao nhiêu bom mực nằm quanh ô đó, tính cả 8 ô xung quanh: trên, dưới, trái, phải và 4 ô chéo. Ô đã mở không có số nghĩa là xung quanh không có bom, nên các ô cạnh nó tự mở ra."),
                        example: MiniBoard(cells: [.covered, .covered, .covered,
                                                   .covered, .open(2, "#FF4D5E", highlight: true), .covered,
                                                   .covered, .covered, .covered],
                                           caption: L("2 = two bombs among the 8 purple tiles", "2 = có 2 bom trong 8 ô tím quanh nó")))

                    section(
                        title: L("Finding a bomb", "Cách tìm ra bom"),
                        text: L("If a 1 touches only one closed tile, that tile must be the bomb. Flag it.",
                                "Nếu số 1 chỉ chạm đúng một ô chưa mở, ô đó chắc chắn là bom. Hãy cắm cờ lên nó."),
                        example: MiniBoard(cells: [.open(0, "#FFE8EE"), .open(0, "#FFE8EE"), .open(0, "#FFE8EE"),
                                                   .open(0, "#FFE8EE"), .open(1, "#FF4D5E", highlight: true), .open(1, "#FF4D5E"),
                                                   .open(0, "#FFE8EE"), .open(1, "#FF4D5E"), .flag],
                                           caption: L("The only closed tile next to the 1 is a bomb", "Ô chưa mở duy nhất cạnh số 1 là bom")))

                    section(
                        title: L("Finding safe tiles", "Cách tìm ô an toàn"),
                        text: L("If a number already has that many flags around it, every other closed tile around it is safe. Open them.",
                                "Nếu quanh một con số đã có đủ chừng ấy cờ, mọi ô chưa mở còn lại quanh nó đều an toàn. Hãy mở chúng."),
                        example: MiniBoard(cells: [.flag, .safe, .safe,
                                                   .open(1, "#FF4D5E"), .open(1, "#FF4D5E", highlight: true), .safe,
                                                   .open(0, "#FFE8EE"), .open(0, "#FFE8EE"), .open(0, "#FFE8EE")],
                                           caption: L("The 1 already has its flag, so the green tiles are safe", "Số 1 đã đủ 1 cờ, nên các ô xanh đều an toàn")))

                    section(
                        title: L("What flags do", "Cắm cờ để làm gì"),
                        text: L("A flag marks a tile you are sure hides a bomb. Flagged tiles can't be opened by mistake. Tap a number whose bombs are all flagged to open every other tile around it at once. Flags are your notes: the game doesn't tell you if a flag is wrong.",
                                "Cờ đánh dấu ô bạn chắc chắn có bom. Ô đã cắm cờ không bị mở nhầm khi chạm vào. Chạm vào một con số đã đủ cờ xung quanh để mở nhanh mọi ô còn lại quanh nó. Cờ là ghi chú của bạn: game không báo cờ cắm đúng hay sai."),
                        example: nil)

                    section(
                        title: L("Controls", "Thao tác"),
                        text: L("• Tap a purple tile: open it\n• Press and hold a tile, or switch to Flag and tap: plant or remove a flag\n• Tap a number with all its flags: open the rest around it",
                                "• Chạm ô tím: mở ô\n• Chạm giữ ô, hoặc chuyển sang Cờ rồi chạm: cắm hoặc gỡ cờ\n• Chạm vào số đã đủ cờ: mở nhanh các ô còn lại quanh nó"),
                        example: nil)

                    section(
                        title: L("Never guess", "Không bao giờ phải đoán"),
                        text: L("Every board can be solved with logic alone. If you're stuck, look for a number that touches only a few closed tiles. You can also use the Hint lamp (shows one safe tile) or a Shield (blocks one bomb).",
                                "Mọi bàn đều giải được chỉ bằng logic. Nếu bí, hãy tìm con số chỉ chạm vài ô chưa mở. Bạn cũng có thể dùng Đèn soi (chỉ ra một ô an toàn) hoặc Khiên (chặn một lần trúng bom)."),
                        example: nil)

                    section(
                        title: L("Bombs and stars", "Trúng bom và số sao"),
                        text: L("Open a bomb and the board is lost. Continue for \(Price.continueGame) coins (the bomb becomes a flag) or play the picture again.\n3 stars: no helpers · 2 stars: used Hint or Shield · 1 star: used Continue.",
                                "Mở trúng bom là thua bàn. Bấm Tiếp tục với \(Price.continueGame) xu (quả bom thành cờ) hoặc chơi lại bức tranh.\n3 sao: không dùng công cụ · 2 sao: có dùng Đèn soi hoặc Khiên · 1 sao: có dùng Tiếp tục."),
                        example: nil)

                    Button(L("Let's play", "Chơi thôi")) { dismiss() }
                        .buttonStyle(ChunkyButtonStyle())
                        .padding(.top, 6)
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 28)
            }
        }
        .background(Theme.cream.ignoresSafeArea())
    }

    private func section(title: String, text: String, example: MiniBoard?) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(title).font(Theme.font(19, .black)).foregroundColor(Theme.ink)
            Text(text).font(Theme.font(16, .semibold)).foregroundColor(Theme.ink.opacity(0.85))
                .fixedSize(horizontal: false, vertical: true)
            if let example {
                HStack { Spacer(); example; Spacer() }.padding(.top, 4)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .card(20)
    }
}

/// Bàn mẫu 3×3 dùng trong hướng dẫn.
struct MiniBoard: View {
    enum Cell {
        case covered
        case flag
        case safe
        case open(Int, String, highlight: Bool = false)
    }

    let cells: [Cell]
    let caption: String

    var body: some View {
        VStack(spacing: 8) {
            LazyVGrid(columns: Array(repeating: GridItem(.fixed(48), spacing: 3), count: 3), spacing: 3) {
                ForEach(0..<cells.count, id: \.self) { i in tile(cells[i]) }
            }
            .padding(5)
            .background(RoundedRectangle(cornerRadius: 12).fill(Theme.line))
            .accessibilityHidden(true)
            Text(caption).font(Theme.font(13, .bold)).foregroundColor(Theme.sub).multilineTextAlignment(.center)
        }
    }

    @ViewBuilder private func tile(_ c: Cell) -> some View {
        switch c {
        case .covered, .flag:
            ZStack {
                RoundedRectangle(cornerRadius: 9).fill(Color(hex: "#B3ABE6"))
                RoundedRectangle(cornerRadius: 9).fill(Color(hex: "#C9C3F2")).padding(.bottom, 4)
                if case .flag = c {
                    Image(systemName: "flag.fill").font(.system(size: 20, weight: .bold)).foregroundColor(Theme.flag)
                }
            }
            .frame(width: 48, height: 48)
        case .safe:
            RoundedRectangle(cornerRadius: 9).fill(Color(hex: "#C9F2D2"))
                .overlay(RoundedRectangle(cornerRadius: 9).stroke(Color(hex: "#2E8B4A"), lineWidth: 3))
                .overlay(Image(systemName: "checkmark").font(.system(size: 18, weight: .black)).foregroundColor(Color(hex: "#2E8B4A")))
                .frame(width: 48, height: 48)
        case .open(let n, let hex, let highlight):
            RoundedRectangle(cornerRadius: 8).fill(Color(hex: hex))
                .overlay(RoundedRectangle(cornerRadius: 8).stroke(Theme.coin, lineWidth: highlight ? 4 : 0))
                .overlay(
                    Text(n > 0 ? "\(n)" : "")
                        .font(Theme.font(26, .black)).foregroundColor(.white)
                        .shadow(color: Theme.ink, radius: 0, x: 1.5, y: 1.5)
                        .shadow(color: Theme.ink, radius: 0, x: -1.5, y: -1.5)
                        .shadow(color: Theme.ink, radius: 0, x: 1.5, y: -1.5)
                        .shadow(color: Theme.ink, radius: 0, x: -1.5, y: 1.5)
                )
                .frame(width: 48, height: 48)
        }
    }
}
