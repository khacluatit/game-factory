import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var app: AppModel
    @EnvironmentObject var store: Store
    @Environment(\.dismiss) private var dismiss
    @Environment(\.openURL) private var openURL

    var body: some View {
        VStack(spacing: 16) {
            HStack(spacing: 12) {
                RoundIconButton(system: "xmark", label: L("Close", "Đóng")) { dismiss() }
                Text(L("Settings", "Cài đặt")).font(Theme.font(30, .black)).foregroundColor(Theme.ink)
                Spacer()
            }
            VStack(spacing: 0) {
                toggle(L("Sound", "Âm thanh"), $app.data.sound)
                Divider().padding(.leading, 16)
                toggle(L("Vibration", "Rung"), $app.data.haptics)
                Divider().padding(.leading, 16)
                toggle(L("High-contrast numbers", "Số tương phản cao"), $app.data.highContrast)
            }
            .card(22)

            VStack(alignment: .leading, spacing: 10) {
                Text(L("How to flag", "Cách cắm cờ")).font(Theme.font(17, .heavy)).foregroundColor(Theme.ink)
                Picker(L("How to flag", "Cách cắm cờ"), selection: $app.data.flagByLongPress) {
                    Text(L("Press and hold", "Chạm giữ ô")).tag(true)
                    Text(L("Flag button only", "Chỉ dùng nút Cờ")).tag(false)
                }
                .pickerStyle(.segmented)
            }
            .padding(16)
            .card(22)

            VStack(spacing: 0) {
                Button { app.sheet = .howTo } label: {
                    row(L("How to play", "Cách chơi"))
                }
                Divider().padding(.leading, 16)
                Button { Task { await store.restore() } } label: {
                    row(L("Restore purchases", "Khôi phục giao dịch"), color: Theme.primary, chevron: false)
                }
                .disabled(store.busy != nil)
                Divider().padding(.leading, 16)
                Button { open("PMPrivacyURL") } label: { row(L("Privacy policy", "Chính sách quyền riêng tư")) }
                Divider().padding(.leading, 16)
                Button { open("PMSupportURL") } label: { row(L("Support", "Hỗ trợ")) }
            }
            .card(22)

            Spacer()
            Text("Pixel Mines \(Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "") · "
                 + L("No ads", "Không quảng cáo"))
                .font(Theme.font(13, .bold)).foregroundColor(Theme.sub)
        }
        .padding(.horizontal, 20)
        .padding(.top, 24)
        .padding(.bottom, 16)
        .background(Theme.cream.ignoresSafeArea())
        .onChange(of: app.data.flagByLongPress) { v in app.game?.scene.longPressEnabled = v }
        .onChange(of: app.data.highContrast) { v in app.game?.scene.highContrast = v }
    }

    private func toggle(_ title: String, _ value: Binding<Bool>) -> some View {
        Toggle(isOn: value) {
            Text(title).font(Theme.font(17, .heavy)).foregroundColor(Theme.ink)
        }
        .tint(Theme.primary)
        .padding(.horizontal, 16).frame(minHeight: 60)
    }

    private func row(_ title: String, color: Color = Theme.ink, chevron: Bool = true) -> some View {
        HStack {
            Text(title).font(Theme.font(17, .heavy)).foregroundColor(color)
            Spacer()
            if chevron { Image(systemName: "chevron.right").font(.system(size: 14, weight: .bold)).foregroundColor(Theme.sub) }
        }
        .padding(.horizontal, 16).frame(minHeight: 60)
        .contentShape(Rectangle())
    }

    private func open(_ key: String) {
        if let s = Bundle.main.object(forInfoDictionaryKey: key) as? String, let url = URL(string: s) { openURL(url) }
    }
}
