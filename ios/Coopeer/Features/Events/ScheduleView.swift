import SwiftUI

/// Figma "Hoje": games from your clubs plus games you said you're in for.
struct ScheduleView: View {
    @Environment(AppStore.self) private var store
    @Environment(Session.self) private var session
    @Environment(AppRouter.self) private var router
    @State private var openGame: Route?

    var body: some View {
        NavigationStack {
            ScrollView {
                if session.isSignedIn {
                    content
                } else {
                    ContentUnavailableView {
                        Label("Your games live here", systemImage: Glyph.game)
                    } description: {
                        Text("Sign in with your phone number to keep track of the games you're playing.")
                    } actions: {
                        Button("Sign in") { router.isAuthPresented = true }
                            .buttonStyle(.glassProminent)
                    }
                    .padding(.top, Space.xxl)
                }
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("Schedule")
            .detailSheet($openGame)
        }
    }

    @ViewBuilder
    private var content: some View {
        let games = store.mySchedule
        let today = games.filter { [.live, .soon, .today].contains($0.status()) }
        let upcoming = games.filter { $0.status() == .later }

        LazyVStack(alignment: .leading, spacing: Space.md) {
            if games.isEmpty {
                ContentUnavailableView {
                    Label("Nothing scheduled", systemImage: Glyph.game)
                } description: {
                    Text("Find a game on the map, or join a club to get its games here automatically.")
                } actions: {
                    Button("Explore the map") { router.selectedTab = .explore }
                        .buttonStyle(.glassProminent)
                }
            }
            if !today.isEmpty {
                SectionHeader(title: "Today")
                rows(today)
            }
            if !upcoming.isEmpty {
                SectionHeader(title: "Upcoming").padding(.top, Space.sm)
                rows(upcoming)
            }
        }
        .padding(Space.lg)
    }

    private func rows(_ games: [Game]) -> some View {
        ForEach(games) { game in
            Button { openGame = .game(game.id) } label: { GameRow(game: game) }
                .buttonStyle(.plain)
        }
    }
}
