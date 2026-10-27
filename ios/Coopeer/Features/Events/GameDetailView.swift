import SwiftUI

/// Figma "Evento": one game, its time and place, who's going, and Decline / I'm in.
struct GameDetailView: View {
    let gameID: String
    @Environment(AppStore.self) private var store
    @Environment(Session.self) private var session
    @Environment(\.openURL) private var openURL
    @State private var showsAttendees = false
    @State private var authRequest: AuthRequest?

    var body: some View {
        if let game = store.game(gameID), let place = store.place(game.placeID) {
            let club = game.clubID.flatMap { store.club($0) }
            let isMember = club.map { store.isMember(of: $0.id) } ?? false

            ScrollView {
                VStack(alignment: .leading, spacing: Space.lg) {
                    VStack(alignment: .leading, spacing: Space.sm) {
                        HStack {
                            KindTag(kind: game.isOpen ? .openGame : .game)
                            Spacer()
                            if let badge = game.badge(isMember: isMember) { StatusBadge(badge: badge) }
                        }
                        Text(game.title)
                            .font(.largeTitle.bold())
                            .strikethrough(game.isCanceled)
                        hostRow(club)
                        Text(game.details)
                            .font(.body)
                            .foregroundStyle(.secondary)
                    }

                    Divider()

                    HStack(spacing: Space.sm) {
                        InfoChip(text: game.start.formatted(.dateTime.weekday(.abbreviated).month(.abbreviated).day()))
                        Spacer()
                        InfoChip(text: game.start.formatted(date: .omitted, time: .shortened))
                        Text("–").foregroundStyle(.secondary)
                        InfoChip(text: game.end.formatted(date: .omitted, time: .shortened))
                    }

                    Button { openURL(Directions.url(to: place)) } label: {
                        HStack(spacing: Space.md) {
                            Image(systemName: Glyph.place)
                                .font(.title3)
                                .foregroundStyle(.secondary)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(place.name).font(.headline)
                                Text(place.address).font(.subheadline).underline().foregroundStyle(.secondary)
                            }
                            Spacer()
                            Image(systemName: Glyph.directions).foregroundStyle(Color.brand)
                        }
                        .contentShape(.rect)
                    }
                    .buttonStyle(.plain)

                    Divider()

                    goingSection(game)
                }
                .padding(Space.lg)
            }
            .navigationTitle("Game")
            .navigationBarTitleDisplayMode(.inline)
            .actionBar(caption: caption(game, isMember: isMember)) {
                actions(game)
            }
            .sheet(isPresented: $showsAttendees) {
                AttendeesSheet(game: game)
            }
            .authGate($authRequest)
            .sensoryFeedback(.success, trigger: game.myRSVP) { _, new in new == .going }
        }
    }

    @ViewBuilder
    private func hostRow(_ club: Club?) -> some View {
        if let club {
            NavigationLink(value: Route.club(club.id)) {
                HStack(spacing: Space.sm) {
                    ClubLogo(club: club, size: 28)
                    Text("Hosted by **\(club.name)**")
                    Image(systemName: "chevron.right").font(.caption.weight(.bold)).foregroundStyle(.tertiary)
                }
                .font(.subheadline)
            }
            .buttonStyle(.plain)
        } else {
            Label("Open game — anyone can join", systemImage: "door.left.hand.open")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
    }

    private func goingSection(_ game: Game) -> some View {
        VStack(alignment: .leading, spacing: Space.md) {
            HStack {
                Text("Going").font(.headline)
                Spacer()
                Text("\(game.going.count) of \(game.capacity)")
                    .font(.subheadline.weight(.semibold))
                    .monospacedDigit()
                    .foregroundStyle(.secondary)
            }
            ProgressView(value: Double(game.going.count), total: Double(max(game.capacity, 1)))
                .tint(.brand)
            HStack(spacing: Space.sm) {
                AvatarStack(members: game.going, size: 28, limit: 5)
                Spacer()
                Button("See who's going") { showsAttendees = true }
                    .buttonStyle(.glass)
                ShareLink(item: URL(string: "coopeer://game/\(game.id)")!) {
                    Label("Share", systemImage: Glyph.share).labelStyle(.iconOnly)
                }
                .buttonStyle(.glass)
                .buttonBorderShape(.circle)
            }
        }
    }

    @ViewBuilder
    private func actions(_ game: Game) -> some View {
        if game.isCanceled || game.status() == .ended {
            EmptyView()
        } else if game.myRSVP == .going {
            SecondaryButton(title: "Can't make it") {
                store.setRSVP(.declined, gameID: game.id)
            }
        } else {
            SecondaryButton(title: game.myRSVP == .declined ? "Not going" : "Decline") {
                session.whenSignedIn($authRequest) { store.setRSVP(.declined, gameID: game.id) }
            }
            .disabled(game.myRSVP == .declined)
            PrimaryButton(title: game.spotsLeft == 0 ? "Full" : "I'm in") {
                session.whenSignedIn($authRequest) { store.setRSVP(.going, gameID: game.id) }
            }
            .disabled(game.spotsLeft == 0)
        }
    }

    private func caption(_ game: Game, isMember: Bool) -> String? {
        if game.isCanceled { return "This game was canceled." }
        if game.status() == .ended { return "This game has ended." }
        if game.myRSVP == .going { return "You're in. See you there!" }
        if isMember { return "Included in your club membership." }
        return "Drop-in \(game.dropInPrice.dollars) · paid at the \(game.sport.placeNoun.lowercased())"
    }
}

struct InfoChip: View {
    let text: String

    var body: some View {
        Text(text)
            .font(.subheadline.weight(.medium))
            .monospacedDigit()
            .padding(.horizontal, Space.md)
            .padding(.vertical, Space.sm)
            .background(Color(.tertiarySystemFill), in: .rect(cornerRadius: 10))
    }
}

/// Figma "Ver confirmados" sheet: searchable Going / Not going / No response.
struct AttendeesSheet: View {
    let game: Game
    @Environment(\.dismiss) private var dismiss
    @State private var query = ""

    var body: some View {
        NavigationStack {
            List {
                section("Going", game.going)
                section("Not going", game.declined)
                section("No response", game.noResponse)
            }
            .searchable(text: $query, placement: .navigationBarDrawer(displayMode: .always))
            .navigationTitle("Who's going")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close", systemImage: "xmark") { dismiss() }
                }
            }
        }
        .presentationDetents([.medium, .large])
    }

    @ViewBuilder
    private func section(_ title: String, _ members: [Member]) -> some View {
        let filtered = query.isEmpty ? members : members.filter { $0.name.localizedCaseInsensitiveContains(query) }
        if !filtered.isEmpty {
            Section("\(title) · \(filtered.count)") {
                ForEach(filtered) { member in
                    HStack(spacing: Space.md) {
                        Avatar(member: member, size: 32)
                        Text(member.name)
                    }
                }
            }
        }
    }
}
