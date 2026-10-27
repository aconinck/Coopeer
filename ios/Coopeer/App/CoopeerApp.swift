import SwiftUI

@main
struct CoopeerApp: App {
    @State private var store = AppStore()
    @State private var session = Session()
    @State private var router = AppRouter()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(store)
                .environment(session)
                .environment(router)
                .tint(.brand)
        }
    }
}

struct RootView: View {
    @Environment(Session.self) private var session
    @Environment(AppRouter.self) private var router

    var body: some View {
        @Bindable var router = router
        Group {
            if session.hasOnboarded {
                MainTabView()
            } else {
                WelcomeView()
            }
        }
        .animation(.smooth, value: session.hasOnboarded)
        .fullScreenCover(isPresented: $router.isAuthPresented) {
            AuthFlowView()
        }
        .sheet(item: $router.joinEntry) { entry in
            JoinFlowSheet(entry: entry)
        }
        .onChange(of: session.isSignedIn) { _, signedIn in
            if signedIn { router.isAuthPresented = false }
        }
        .onOpenURL { router.handle(url: $0) }
    }
}

struct MainTabView: View {
    @Environment(AppRouter.self) private var router

    var body: some View {
        @Bindable var router = router
        TabView(selection: $router.selectedTab) {
            Tab("Explore", systemImage: "map.fill", value: AppTab.explore) {
                ExploreView()
            }
            Tab("Clubs", systemImage: Glyph.club, value: AppTab.clubs) {
                ClubsView()
            }
            Tab("Schedule", systemImage: Glyph.game, value: AppTab.schedule) {
                ScheduleView()
            }
            Tab("Profile", systemImage: "person.crop.circle.fill", value: AppTab.profile) {
                ProfileView()
            }
        }
        .tabBarMinimizeBehavior(.onScrollDown)
    }
}
