import SwiftUI

/// Figma "Seus Clubes": the clubs you belong to. "+" is how you join a new one.
struct ClubsView: View {
    @Environment(AppStore.self) private var store
    @Environment(Session.self) private var session
    @Environment(AppRouter.self) private var router

    private let columns = [GridItem(.flexible(), spacing: Space.md), GridItem(.flexible(), spacing: Space.md)]

    var body: some View {
        NavigationStack {
            ScrollView {
                if session.isSignedIn && !store.myClubs.isEmpty {
                    LazyVGrid(columns: columns, spacing: Space.md) {
                        ForEach(store.myClubs) { club in
                            NavigationLink(value: Route.club(club.id)) { ClubCard(club: club) }
                                .buttonStyle(.plain)
                        }
                    }
                    .padding(Space.lg)
                } else {
                    VStack(spacing: Space.xl) {
                        ContentUnavailableView {
                            Label("No clubs yet", systemImage: Glyph.club)
                        } description: {
                            Text("Got a code or QR from a club organizer? Join in seconds. Or find clubs that play near you on the map.")
                        } actions: {
                            Button("Scan QR code", systemImage: Glyph.qr) { router.joinEntry = .scan }
                                .buttonStyle(.glassProminent)
                            Button("Enter team code", systemImage: Glyph.code) { router.joinEntry = .code(prefill: nil) }
                                .buttonStyle(.glass)
                        }
                        GamesVsClubsCard()
                    }
                    .padding(Space.lg)
                }
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("Your Clubs")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Menu("Join a club", systemImage: "plus") {
                        Button("Scan QR code", systemImage: Glyph.qr) { router.joinEntry = .scan }
                        Button("Enter team code", systemImage: Glyph.code) { router.joinEntry = .code(prefill: nil) }
                        Divider()
                        Button("Find clubs on the map", systemImage: "map") { router.selectedTab = .explore }
                    }
                }
            }
            .navigationDestination(for: Route.self) { RouteView(route: $0) }
        }
    }
}

struct ClubCard: View {
    @Environment(AppStore.self) private var store
    let club: Club

    var body: some View {
        VStack(alignment: .leading, spacing: Space.sm) {
            HStack(alignment: .top) {
                ClubLogo(club: club, size: 40)
                Spacer()
                if club.isNew { StatusBadge(badge: .new) }
            }
            Text(club.name)
                .font(.headline)
                .lineLimit(2, reservesSpace: true)
            VStack(alignment: .leading, spacing: 1) {
                Text("Next game").font(.caption).foregroundStyle(.secondary)
                Text(nextGameText)
                    .font(.subheadline.weight(.medium))
                    .foregroundStyle(store.nextGame(for: club.id)?.status() == .live ? Color.live : .primary)
                    .lineLimit(1)
            }
            AvatarStack(members: club.members, total: club.memberCount, size: 22, limit: 3)
        }
        .padding(Space.md)
        .frame(maxWidth: .infinity, alignment: .leading)
        .card(highlighted: club.isNew)
    }

    private var nextGameText: String {
        guard let game = store.nextGame(for: club.id) else { return "Nothing scheduled" }
        switch game.status() {
        case .live: return "Live now"
        case .soon, .today: return "Today · \(game.start.formatted(date: .omitted, time: .shortened))"
        case .later, .ended:
            return game.start.formatted(.dateTime.weekday(.abbreviated).hour().minute())
        }
    }
}
