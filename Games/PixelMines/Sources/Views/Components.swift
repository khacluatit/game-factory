import SwiftUI

/// Vẽ một bức tranh pixel. `revealed` = số hàng đã lộ (còn lại phủ tím), `silhouette` = bóng xám cho tranh khoá.
struct PixelArtView: View {
    let level: Level
    var revealedRows: Int? = nil
    var silhouette = false
    var gap: CGFloat = 1

    var body: some View {
        let hex = level.pixelHex
        let bg = hex.first ?? "#FFFFFF"
        Canvas { ctx, size in
            let cs = min((size.width - gap * CGFloat(level.w - 1)) / CGFloat(level.w),
                         (size.height - gap * CGFloat(level.h - 1)) / CGFloat(level.h))
            let ox = (size.width - (cs * CGFloat(level.w) + gap * CGFloat(level.w - 1))) / 2
            let oy = (size.height - (cs * CGFloat(level.h) + gap * CGFloat(level.h - 1))) / 2
            for i in 0..<(level.w * level.h) {
                let x = i % level.w, y = i / level.w
                let rect = CGRect(x: ox + CGFloat(x) * (cs + gap), y: oy + CGFloat(y) * (cs + gap), width: cs, height: cs)
                let color: Color
                if let r = revealedRows, y >= r {
                    color = Color(hex: "#C9C3F2")
                } else if silhouette {
                    color = hex[i] == bg ? Color(hex: "#F3EEE6") : Color(hex: "#CFC9BE")
                } else {
                    color = Color(hex: hex[i])
                }
                ctx.fill(Path(roundedRect: rect, cornerRadius: cs * 0.12), with: .color(color))
            }
        }
        .aspectRatio(CGFloat(level.w) / CGFloat(level.h), contentMode: .fit)
        .accessibilityElement()
        .accessibilityLabel(silhouette ? L("Locked picture", "Tranh chưa mở") : level.name.text)
    }
}

struct CoinIcon: View {
    var size: CGFloat = 22
    var body: some View {
        ZStack {
            Circle().fill(Theme.coin)
            Circle().stroke(Theme.coinDark, lineWidth: size * 0.09).padding(size * 0.2)
        }
        .frame(width: size, height: size)
        .accessibilityHidden(true)
    }
}

/// Số xu ở góc, chạm để mở cửa hàng.
struct CoinPill: View {
    @EnvironmentObject var app: AppModel
    var body: some View {
        Button { app.sheet = .shop } label: {
            HStack(spacing: 6) {
                CoinIcon()
                Text("\(app.data.coins)").font(Theme.font(17, .heavy)).foregroundColor(Theme.ink)
                    .monospacedDigit()
            }
            .padding(.leading, 8).padding(.trailing, 14)
            .frame(height: 44)
            .background(Capsule().fill(Color.white))
            .background(Capsule().fill(Theme.line).offset(y: 2))
        }
        .accessibilityLabel(L("\(app.data.coins) coins, open shop", "\(app.data.coins) xu, mở cửa hàng"))
    }
}

struct RoundIconButton: View {
    let system: String
    let label: String
    let action: () -> Void
    var body: some View {
        Button(action: action) {
            Image(systemName: system)
                .font(.system(size: 18, weight: .bold))
                .foregroundColor(Theme.ink)
                .frame(width: 44, height: 44)
                .background(Circle().fill(Color.white))
                .background(Circle().fill(Theme.line).offset(y: 2))
        }
        .accessibilityLabel(label)
    }
}

struct StarsRow: View {
    let count: Int
    var size: CGFloat = 16
    var body: some View {
        HStack(spacing: 2) {
            ForEach(0..<3, id: \.self) { k in
                Image(systemName: "star.fill")
                    .font(.system(size: size, weight: .bold))
                    .foregroundColor(k < count ? Theme.coin : Theme.line)
            }
        }
        .accessibilityLabel(L("\(count) of 3 stars", "\(count) trên 3 sao"))
    }
}

struct RarityChip: View {
    let rarity: Rarity
    var body: some View {
        Text(rarity.title)
            .font(Theme.font(12, .black))
            .foregroundColor(rarity == .legendary ? Theme.ink : .white)
            .padding(.horizontal, 9).padding(.vertical, 3)
            .background(Capsule().fill(Theme.rarityColor(rarity)))
            .opacity(rarity == .common ? 0 : 1)
    }
}

struct ProgressBar: View {
    let value: Double
    var height: CGFloat = 12
    var body: some View {
        GeometryReader { g in
            ZStack(alignment: .leading) {
                Capsule().fill(Theme.line)
                Capsule().fill(Theme.primary).frame(width: max(height, g.size.width * value))
                    .opacity(value > 0 ? 1 : 0)
            }
        }
        .frame(height: height)
    }
}

/// Khung tranh theo độ quý: viền trắng, xanh, tím, vàng.
struct RarityFrame: ViewModifier {
    let rarity: Rarity
    func body(content: Content) -> some View {
        content
            .padding(rarity == .common ? 8 : 10)
            .background(RoundedRectangle(cornerRadius: 18).fill(Color.white))
            .overlay(RoundedRectangle(cornerRadius: 18)
                .stroke(Theme.rarityColor(rarity), lineWidth: rarity == .common ? 0 : 4))
    }
}

extension View {
    func rarityFrame(_ r: Rarity) -> some View { modifier(RarityFrame(rarity: r)) }
}
