import SwiftUI

@main
@MainActor
struct QuietPagodaApp: App {
    @Environment(\.scenePhase) private var scenePhase
    @StateObject private var host = WebHost()

    var body: some Scene {
        WindowGroup {
            PagodaView(host: host)
                .ignoresSafeArea()
                .statusBarHidden()
                .persistentSystemOverlays(.hidden)
                .background(Color(red: 0.071, green: 0.031, blue: 0.024))
        }
        .onChange(of: scenePhase) { phase in
            if phase == .active { host.foreground() }
        }
    }
}
