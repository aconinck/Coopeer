import SwiftUI

/// Figma club page: Games / About / Members. Non-members see "Join club" in the action bar.
struct ClubDetailView: View {
    enum Tab: String, CaseIterable, Identifiable {
        case games = "Games"
        case about = "About"
        case members = "Members"
        var id: String { rawValue }
    }

    let clubID: String
    @Environment(AppStore.self) private var store
    @Environment(Session.self) private var session
    @State private var tab: Tab = .games
    @State private var openGame: Route?
    @State private var showsInvite = false
    @State private var confirmsLeave = false
    @State private var authRequest: AuthRequest?

    var body: some View {
        if let club = store.club(clubID) {
            let isMember = store.isMember(of: club.id)
            ScrollView {
                VStack(alignment: .leading, spacing: Space.lg) {
                    header(club)
                    Picker("Section", selection: $tab) {
                        ForEach(Tab.allCases) { Text($0.rawValue).tag($0) }
                    }
                    .pickerStyle(.segmented)

                    switch tab {
                    case .games: ClubGamesTab(club: club, openGame: $openGame)
                    case .about: ClubAboutTab(club: club)
                    case .members: ClubMembersTab(club: club)
                    }
                }
                .padding(Space.lg)
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle(club.name)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Menu("More", systemImage: "ellipsis") {
                        Button("Invite with QR code", systemImage: "qrcode") { showsInvite = true }
                        ShareLink(item: club.inviteURL) {
                            Label("Share invite link", systemImage: Glyph.share)
                        }
                        if isMember {
                            Divider()
                            Button("Leave club", systemImage: "rectangle.portrait.and.arrow.right", role: .destructive) {
                                confirmsLeave = true
                            }
                        }
                    }
                }
            }
            .actionBar(caption: isMember ? nil : "\(club.monthlyPrice.dollars)/month · all club games included · cancel anytime") {
                if !isMember {
                    if let next = store.nextGame(for: club.id) {
                        SecondaryButton(title: "Try a game") { openGame = .game(next.id) }
                    }
                    PrimaryButton(title: "Join club") {
                        session.whenSignedIn($authRequest) { store.join(clubID: club.id) }
                    }
                }
            }
            .confirmationDialog("Leave \(club.name)?", isPresented: $confirmsLeave, titleVisibility: .visible) {
                Button("Leave club", role: .destructive) { store.leave(clubID: club.id) }
            } message: {
                Text("Its games will disappear from your schedule. You can rejoin anytime.")
            }
            .sheet(isPresented: $showsInvite) { InviteSheet(club: club) }
            .detailSheet($openGame)
            .authGate($authRequest)
            .sensoryFeedback(.success, trigger: isMember) { _, new in new }
        }
    }

    private func header(_ club: Club) -> some View {
        HStack(spacing: Space.lg) {
            ClubLogo(club: club, size: 72)
            VStack(alignment: .leading, spacing: 4) {
                KindTag(kind: .club)
                Text(club.name).font(.title2.bold())
                Text(club.cadence).font(.subheadline).foregroundStyle(.secondary)
                if store.isMember(of: club.id) {
                    Label("You're a member", systemImage: "checkmark.circle.fill")
                        .font(.footnote.weight(.semibold))
                        .foregroundStyle(Color.going)
                }
            }
        }
    }
}

private struct ClubGamesTab: View {
    let club: Club
    @Binding var openGame: Route?
    @Environment(AppStore.self) private var store

    var body: some View {
        let games = store.games(for: club.id)
        let today = games.filter { [.live, .soon, .today].contains($0.status()) }
        let upcoming = games.filter { $0.status() == .later }

        VStack(alignment: .leading, spacing: Space.md) {
            if games.isEmpty {
                ContentUnavailableView("No games scheduled", systemImage: Glyph.game)
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
    }

    private func rows(_ games: [Game]) -> some View {
        ForEach(games) { game in
            Button { openGame = .game(game.id) } label: { GameRow(game: game) }
                .buttonStyle(.plain)
        }
    }
}

private struct ClubAboutTab: View {
    let club: Club
    @Environment(AppStore.self) private var store
    @Environment(\.openURL) private var openURL
    @State private var isExpanded = false

    var body: some View {
        VStack(alignment: .leading, spacing: Space.lg) {
            VStack(alignment: .leading, spacing: Space.xs) {
                Text("Description").font(.headline)
                Text(club.about)
                    .foregroundStyle(.secondary)
                    .lineLimit(isExpanded ? nil : 3)
                Button(isExpanded ? "Show less" : "Read more") { withAnimation { isExpanded.toggle() } }
                    .font(.footnote.weight(.semibold))
            }

            Grid(alignment: .leading, horizontalSpacing: Space.lg, verticalSpacing: Space.sm) {
                GridRow {
                    Text("Plays").foregroundStyle(.secondary)
                    Text(club.cadence)
                }
                GridRow {
                    Text("Level").foregroundStyle(.secondary)
                    Text(club.level.rawValue)
                }
                GridRow {
                    Text("Members").foregroundStyle(.secondary)
                    Text("\(club.memberCount)")
                }
                GridRow {
                    Text("Price").foregroundStyle(.secondary)
                    Text("\(club.monthlyPrice.dollars)/month")
                }
            }
            .font(.subheadline)
            .padding(Space.lg)
            .frame(maxWidth: .infinity, alignment: .leading)
            .card()

            if let place = store.place(club.homePlaceID) {
                VStack(alignment: .leading, spacing: Space.sm) {
                    Text("Home").font(.headline)
                    NavigationLink(value: Route.place(place.id)) {
                        LinkRow(title: place.name, subtitle: place.address, systemImage: Glyph.place)
                    }
                    .buttonStyle(.plain)
                }
            }

            if !club.links.isEmpty {
                VStack(alignment: .leading, spacing: Space.sm) {
                    Text("Links").font(.headline)
                    ForEach(club.links) { link in
                        Button { openURL(link.url) } label: {
                            LinkRow(title: link.title, subtitle: link.url.host() ?? link.url.absoluteString, systemImage: "link")
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
    }
}

struct LinkRow: View {
    let title: String
    let subtitle: String
    let systemImage: String

    var body: some View {
        HStack(spacing: Space.md) {
            Image(systemName: systemImage)
                .foregroundStyle(Color.brand)
                .frame(width: 28)
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.subheadline.weight(.semibold))
                Text(subtitle).font(.footnote).foregroundStyle(.secondary).lineLimit(1)
            }
            Spacer()
            Image(systemName: "chevron.right").font(.footnote.weight(.bold)).foregroundStyle(.tertiary)
        }
        .padding(Space.md)
        .card()
        .contentShape(.rect)
    }
}

private struct ClubMembersTab: View {
    let club: Club
    @State private var query = ""

    private var filtered: [Member] {
        query.isEmpty ? club.members : club.members.filter { $0.name.localizedCaseInsensitiveContains(query) }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: Space.md) {
            HStack(spacing: Space.sm) {
                Image(systemName: "magnifyingglass").foregroundStyle(.secondary)
                TextField("Search members", text: $query)
            }
            .padding(.horizontal, 14)
            .frame(height: 40)
            .background(Color(.tertiarySystemFill), in: .capsule)

            Text("\(club.memberCount) members").font(.headline)

            LazyVStack(alignment: .leading, spacing: 0) {
                ForEach(filtered) { member in
                    HStack(spacing: Space.md) {
                        Avatar(member: member, size: 36)
                        Text(member.name)
                        Spacer()
                    }
                    .padding(.vertical, Space.sm)
                }
            }
        }
    }
}
