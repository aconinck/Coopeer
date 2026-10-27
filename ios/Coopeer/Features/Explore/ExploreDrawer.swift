import SwiftUI

/// Bottom glass drawer over the map: search + filters always visible,
/// drag up (or tap search) to see what's happening as a list.
struct ExploreDrawer: View {
    @Environment(AppStore.self) private var store
    @Binding var query: String
    @Binding var sport: Sport?
    @Binding var liveOnly: Bool
    @Binding var isExpanded: Bool
    let listHeight: CGFloat
    let places: [Place]
    var onOpen: (Route) -> Void
    @FocusState private var isSearching: Bool
    @AppStorage("explainer.dismissed") private var explainerDismissed = false

    private var placeIDs: Set<String> { Set(places.map(\.id)) }

    private var games: [Game] {
        store.games
            .filter { placeIDs.contains($0.placeID) && !$0.isCanceled }
            .filter { sport == nil || $0.sport == sport }
            .filter { [.live, .soon, .today].contains($0.status()) }
            .filter { !liveOnly || $0.status() == .live }
            .filter { matches($0.title) || matches(store.place($0.placeID)?.name) }
            .sorted { $0.start < $1.start }
    }

    private var clubs: [Club] {
        store.clubs
            .filter { placeIDs.contains($0.homePlaceID) }
            .filter { sport == nil || $0.sport == sport }
            .filter { matches($0.name) || matches(store.place($0.homePlaceID)?.name) }
    }

    var body: some View {
        VStack(spacing: Space.md) {
            header
            if isExpanded {
                list
                    .frame(height: listHeight)
                    .transition(.move(edge: .bottom).combined(with: .opacity))
            }
        }
        .padding(.horizontal, Space.lg)
        .padding(.bottom, Space.md)
        .glassEffect(.regular, in: .rect(cornerRadius: Radius.sheet))
        .padding(.horizontal, Space.sm)
        .padding(.bottom, Space.xs)
        .onChange(of: isSearching) { _, searching in
            if searching { setExpanded(true) }
        }
    }

    private var header: some View {
        VStack(spacing: Space.md) {
            Capsule()
                .fill(Color.secondary.opacity(0.5))
                .frame(width: 36, height: 5)
                .padding(.top, Space.sm)

            HStack(spacing: Space.sm) {
                Image(systemName: "magnifyingglass").foregroundStyle(.secondary)
                TextField("Search places, clubs, games", text: $query)
                    .focused($isSearching)
                    .submitLabel(.search)
                if !query.isEmpty {
                    Button("Clear", systemImage: "xmark.circle.fill") { query = "" }
                        .labelStyle(.iconOnly)
                        .foregroundStyle(.secondary)
                }
            }
            .padding(.horizontal, 14)
            .frame(height: 44)
            .background(Color(.tertiarySystemFill), in: .capsule)

            ScrollView(.horizontal) {
                HStack(spacing: Space.sm) {
                    Chip(title: "All", isSelected: sport == nil && !liveOnly) {
                        sport = nil
                        liveOnly = false
                    }
                    ForEach(Sport.allCases) { item in
                        Chip(title: item.label, systemImage: item.symbol, color: item.color, isSelected: sport == item) {
                            sport = sport == item ? nil : item
                        }
                    }
                    Chip(title: "Live now", systemImage: "dot.radiowaves.left.and.right", color: .live, isSelected: liveOnly) {
                        liveOnly.toggle()
                    }
                }
            }
            .scrollIndicators(.hidden)

            if !isExpanded {
                Text(summaryLine)
                    .font(.footnote.weight(.medium))
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
        .contentShape(.rect)
        .gesture(
            DragGesture(minimumDistance: 12).onEnded { value in
                if value.translation.height < -30 { setExpanded(true) }
                if value.translation.height > 30 { setExpanded(false) }
            }
        )
        .onTapGesture { if !isExpanded { setExpanded(true) } }
    }

    private var list: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: Space.md) {
                if !explainerDismissed {
                    GamesVsClubsCard { withAnimation { explainerDismissed = true } }
                }

                let live = games.filter { $0.status() == .live }
                let later = games.filter { $0.status() != .live }

                if !live.isEmpty {
                    SectionHeader(title: "Happening now", caption: "Live games you can still jump into.")
                    ForEach(live) { game in
                        Button { onOpen(.game(game.id)) } label: { GameRow(game: game) }
                            .buttonStyle(.plain)
                    }
                }
                if !later.isEmpty {
                    SectionHeader(title: "Later today", caption: "One-time games. Show up and play.")
                    ForEach(later) { game in
                        Button { onOpen(.game(game.id)) } label: { GameRow(game: game) }
                            .buttonStyle(.plain)
                    }
                }
                if !clubs.isEmpty && !liveOnly {
                    SectionHeader(title: "Clubs nearby", caption: "Groups that play every week.")
                    ForEach(clubs) { club in
                        Button { onOpen(.club(club.id)) } label: { ClubRow(club: club) }
                            .buttonStyle(.plain)
                    }
                }
                if games.isEmpty && (clubs.isEmpty || liveOnly) {
                    ContentUnavailableView(
                        "Nothing here yet",
                        systemImage: "sportscourt",
                        description: Text("Try another sport or clear your search.")
                    )
                }
            }
            .padding(.bottom, Space.xl)
        }
        .scrollIndicators(.hidden)
        .scrollDismissesKeyboard(.immediately)
    }

    private var summaryLine: String {
        let live = games.filter { $0.status() == .live }.count
        let today = games.count - live
        var parts: [String] = []
        if live > 0 { parts.append("\(live) live now") }
        if today > 0 { parts.append("\(today) later today") }
        parts.append("\(clubs.count) clubs nearby")
        return parts.joined(separator: " · ")
    }

    private func matches(_ text: String?) -> Bool {
        let needle = query.trimmingCharacters(in: .whitespaces)
        guard !needle.isEmpty else { return true }
        return text?.localizedCaseInsensitiveContains(needle) ?? false
    }

    private func setExpanded(_ expanded: Bool) {
        withAnimation(.snappy) { isExpanded = expanded }
        if !expanded { isSearching = false }
    }
}

/// Teaches the core concept once: games are one-time, clubs are recurring.
struct GamesVsClubsCard: View {
    var onDismiss: (() -> Void)?

    var body: some View {
        VStack(alignment: .leading, spacing: Space.md) {
            HStack {
                Text("How Coopeer works")
                    .font(.headline)
                Spacer()
                if let onDismiss {
                    Button("Got it", action: onDismiss)
                        .font(.subheadline.weight(.semibold))
                }
            }
            HStack(alignment: .top, spacing: Space.md) {
                explainer(
                    icon: Glyph.game,
                    title: "Game",
                    text: "Happens once. Tap “I'm in”, show up, play. No commitment."
                )
                explainer(
                    icon: Glyph.club,
                    title: "Club",
                    text: "Plays every week. Join once and all its games land in your schedule."
                )
            }
            Label("Every pin is a place. Many clubs and games can share one.", systemImage: Glyph.place)
                .font(.footnote)
                .foregroundStyle(.secondary)
        }
        .padding(Space.lg)
        .card()
    }

    private func explainer(icon: String, title: String, text: String) -> some View {
        VStack(alignment: .leading, spacing: Space.xs) {
            Label(title, systemImage: icon)
                .font(.subheadline.weight(.bold))
                .foregroundStyle(Color.brand)
            Text(text)
                .font(.footnote)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}
