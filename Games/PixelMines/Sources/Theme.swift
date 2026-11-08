import SwiftUI
import UIKit

/// Ngôn ngữ giao diện: tiếng Việt nếu máy dùng tiếng Việt, còn lại tiếng Anh.
enum Lang {
    static let isVI: Bool = (Locale.preferredLanguages.first ?? "en").hasPrefix("vi")
}

/// Chuỗi hai ngôn ngữ ngay trong code (app nhỏ, không cần file .strings).
func L(_ en: String, _ vi: String) -> String { Lang.isVI ? vi : en }

extension UIColor {
    convenience init(hex: String) {
        var s = hex.trimmingCharacters(in: .whitespaces)
        if s.hasPrefix("#") { s.removeFirst() }
        var v: UInt64 = 0
        Scanner(string: s).scanHexInt64(&v)
        self.init(red: CGFloat((v >> 16) & 0xFF) / 255, green: CGFloat((v >> 8) & 0xFF) / 255,
                  blue: CGFloat(v & 0xFF) / 255, alpha: 1)
    }
}

extension Color {
    init(hex: String) { self.init(uiColor: UIColor(hex: hex)) }
}

enum Theme {
    static let cream = Color(hex: "#FFF7EC")
    static let ink = Color(hex: "#2B2340")
    static let sub = Color(hex: "#6B6480")
    static let card = Color.white
    static let line = Color(hex: "#EDE6DA")
    static let primary = Color(hex: "#5B4BDB")
    static let primaryDark = Color(hex: "#3F31B0")
    static let primarySoft = Color(hex: "#E7E3FF")
    static let coin = Color(hex: "#FFC83D")
    static let coinDark = Color(hex: "#E0A400")
    static let coinSoft = Color(hex: "#FFF1C2")
    static let flag = Color(hex: "#FF6B6B")
    static let danger = Color(hex: "#B42318")

    static func font(_ size: CGFloat, _ weight: Font.Weight = .heavy) -> Font {
        .system(size: size, weight: weight, design: .rounded)
    }

    static func uiFont(_ size: CGFloat, _ weight: UIFont.Weight = .black) -> UIFont {
        let base = UIFont.systemFont(ofSize: size, weight: weight)
        if let d = base.fontDescriptor.withDesign(.rounded) { return UIFont(descriptor: d, size: size) }
        return base
    }

    static func rarityColor(_ r: Rarity) -> Color {
        switch r {
        case .common: return Color(hex: "#D8D1C4")
        case .rare: return Color(hex: "#3FA7F5")
        case .precious: return Color(hex: "#9B7BE0")
        case .legendary: return coin
        }
    }
}

/// Nút chính: nền tím, bóng đổ phẳng phía dưới như mockup.
struct ChunkyButtonStyle: ButtonStyle {
    var fill: Color = Theme.primary
    var shadow: Color = Theme.primaryDark
    var text: Color = .white
    var height: CGFloat = 64
    var size: CGFloat = 21

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(Theme.font(size, .black))
            .foregroundColor(text)
            .frame(maxWidth: .infinity, minHeight: height)
            .background(RoundedRectangle(cornerRadius: 20).fill(fill))
            .background(RoundedRectangle(cornerRadius: 20).fill(shadow).offset(y: configuration.isPressed ? 1 : 5))
            .offset(y: configuration.isPressed ? 4 : 0)
            .animation(.easeOut(duration: 0.08), value: configuration.isPressed)
    }
}

/// Thẻ trắng có bóng phẳng.
struct CardBackground: ViewModifier {
    var radius: CGFloat = 24
    func body(content: Content) -> some View {
        content
            .background(RoundedRectangle(cornerRadius: radius).fill(Theme.card))
            .background(RoundedRectangle(cornerRadius: radius).fill(Theme.line).offset(y: 4))
    }
}

extension View {
    func card(_ radius: CGFloat = 24) -> some View { modifier(CardBackground(radius: radius)) }
}
