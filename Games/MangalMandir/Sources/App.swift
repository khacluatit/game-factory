import SwiftUI

@main
@MainActor
struct MangalMandirApp: App {
    @Environment(\.scenePhase) private var scenePhase
    @StateObject private var host = WebHost()

    var body: some Scene {
        WindowGroup {
            PagodaView(host: host)
                .ignoresSafeArea()
                .statusBarHidden()
                .persistentSystemOverlays(.hidden)
                .background(Color(red: 0.11, green: 0.055, blue: 0.035))
        }
        .onChange(of: scenePhase) { phase in
            if phase == .active { host.foreground() }
        }
    }
}
