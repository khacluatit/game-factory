import SwiftUI

@main
struct PixelMinesApp: App {
    @StateObject private var app = AppModel.shared

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(app)
                .environmentObject(app.store)
                .preferredColorScheme(.light)
                .statusBarHidden()
                .task { await app.store.start() }
        }
    }
}

struct RootView: View {
    @EnvironmentObject var app: AppModel
    @EnvironmentObject var store: Store

    var body: some View {
        ZStack {
            Theme.cream.ignoresSafeArea()
            switch app.route {
            case .home:
                HomeView().transition(.opacity)
            case .album:
                AlbumView().transition(.move(edge: .trailing))
            case .chapter(let id):
                ChapterView(chapterID: id).transition(.move(edge: .trailing))
            case .game:
                if let g = app.game {
                    GameView(game: g).id(ObjectIdentifier(g)).transition(.opacity)
                }
            }
        }
        .animation(.easeInOut(duration: 0.22), value: app.route)
        .sheet(item: $app.sheet) { sheet in
            Group {
                switch sheet {
                case .shop: ShopView()
                case .settings: SettingsView()
                case .locked(let id): LockedChapterView(chapterID: id)
                case .starter: StarterOfferView()
                case .howTo: HowToPlayView()
                }
            }
            .environmentObject(app)
            .environmentObject(store)
        }
        .alert(store.message ?? "", isPresented: Binding(get: { store.message != nil }, set: { if !$0 { store.message = nil } })) {
            Button("OK", role: .cancel) {}
        }
        .onAppear(perform: openShot)
    }

    /// Ảnh App Store: dựng sẵn màn hình theo tham số -shot.
    private func openShot() {
        switch app.shot {
        case "board", "win":
            if let lv = app.pack.level("c1-07") { app.play(lv) }
        case "masterpiece":
            if let lv = app.pack.level("c5-10") { app.play(lv) }
        case "album":
            app.route = .album
        case "shop":
            app.sheet = .shop
        default:
            break
        }
    }
}
