import SwiftUI

struct PlaceDetailView: View {
    let placeID: String
    @Environment(AppStore.self) private var store
    @Environment(\.openURL) private var openURL
    @State private var openGame: Route?

    var body: some View {
        if let place = store.place(placeID) {
            let games = store.upcomingGames(at: place.id)
            let clubs = store.clubs(at: place.id)
            ScrollView {
                VStack(alignment: .leading, spacing: Space.lg) {
                    header(place)

                    SectionHeader(title: "Games here", caption: "One-time. Tap one, say you're in, show up.")
                    if games.isEmpty {
                        Text("No games scheduled here yet.")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                    ForEach(games) { game in
                        Button { openGame = .game(game.id) } label: {
                            GameRow(game: game, showsPlace: false)
                        }
                        .buttonStyle(.plain)
                    }

                    if !clubs.isEmpty {
                        SectionHeader(title: "Clubs that play here", caption: "Recurring groups. Join once, play every week.")
                            .padding(.top, Space.sm)
                        ForEach(clubs) { club in
                            NavigationLink(value: Route.club(club.id)) { ClubRow(club: club) }
                                .buttonStyle(.plain)
                        }
                    }
                }
                .padding(Space.lg)
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle(place.name)
            .navigationBarTitleDisplayMode(.inline)
            .actionBar {
                PrimaryButton(title: "Directions", systemImage: Glyph.directions) {
                    openURL(Directions.url(to: place))
                }
            }
            .detailSheet($openGame)
        }
    }

    private func header(_ place: Place) -> some View {
        HStack(spacing: Space.md) {
            HStack(spacing: -8) {
                ForEach(place.sports) { SportIcon(sport: $0, size: 44).overlay(Circle().stroke(.background, lineWidth: 2)) }
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(place.name).font(.title2.bold())
                Text(place.address).font(.subheadline).foregroundStyle(.secondary)
            }
        }
    }
}

enum Directions {
    static func url(to place: Place) -> URL {
        URL(string: "https://maps.apple.com/?daddr=\(place.latitude),\(place.longitude)&dirflg=d")!
    }
}
