import SwiftUI
import MapKit

struct ExploreView: View {
    @Environment(AppStore.self) private var store
    @State private var position: MapCameraPosition = .region(.bentonville)
    @State private var sport: Sport?
    @State private var liveOnly = false
    @State private var query = ""
    @State private var isExpanded = false
    @State private var route: Route?
    @State private var locationManager = CLLocationManager()

    var body: some View {
        GeometryReader { proxy in
            Map(position: $position) {
                UserAnnotation()
                ForEach(visiblePlaces) { place in
                    Annotation(place.name, coordinate: place.coordinate, anchor: .bottom) {
                        PlacePin(summary: summary(for: place), isSelected: route == .place(place.id))
                            .onTapGesture { open(place) }
                    }
                }
            }
            .mapStyle(.standard(pointsOfInterest: .excludingAll))
            .mapControls {
                MapUserLocationButton()
                MapCompass()
            }
            .safeAreaInset(edge: .bottom, spacing: 0) {
                ExploreDrawer(
                    query: $query,
                    sport: $sport,
                    liveOnly: $liveOnly,
                    isExpanded: $isExpanded,
                    listHeight: proxy.size.height * 0.5,
                    places: visiblePlaces,
                    onOpen: { route = $0 }
                )
            }
        }
        .sheet(item: $route) { route in
            DetailSheet(root: route)
                .presentationDetents([.medium, .large])
                .presentationBackgroundInteraction(.enabled(upThrough: .medium))
        }
        .onAppear { locationManager.requestWhenInUseAuthorization() }
    }

    private var visiblePlaces: [Place] {
        store.places.filter { place in
            let summary = summary(for: place)
            let matchesSport = sport.map { place.sports.contains($0) } ?? true
            let matchesLive = !liveOnly || summary.liveGame != nil
            return matchesSport && matchesLive && matchesQuery(summary)
        }
    }

    private func summary(for place: Place) -> PlaceSummary {
        PlaceSummary(
            place: place,
            games: store.upcomingGames(at: place.id).filter { sport == nil || $0.sport == sport },
            clubs: store.clubs(at: place.id).filter { sport == nil || $0.sport == sport },
            sports: place.sports.filter { sport == nil || $0 == sport }
        )
    }

    private func matchesQuery(_ summary: PlaceSummary) -> Bool {
        let needle = query.trimmingCharacters(in: .whitespaces)
        guard !needle.isEmpty else { return true }
        let haystack = [summary.place.name, summary.place.address]
            + summary.sports.map(\.label)
            + summary.clubs.map(\.name)
            + summary.games.map(\.title)
        return haystack.contains { $0.localizedCaseInsensitiveContains(needle) }
    }

    private func open(_ place: Place) {
        route = .place(place.id)
        withAnimation(.smooth) {
            position = .region(MKCoordinateRegion(
                center: CLLocationCoordinate2D(latitude: place.latitude - 0.006, longitude: place.longitude),
                latitudinalMeters: 2500,
                longitudinalMeters: 2500
            ))
        }
    }
}

struct PlaceSummary {
    let place: Place
    let games: [Game]
    let clubs: [Club]
    let sports: [Sport]

    var liveGame: Game? { games.first { $0.status() == .live } }
    var nextGame: Game? { games.first { $0.status() == .soon || $0.status() == .today } }
}

extension MKCoordinateRegion {
    static let bentonville = MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: 36.3600, longitude: -94.2110),
        span: MKCoordinateSpan(latitudeDelta: 0.06, longitudeDelta: 0.06)
    )
}

/// Map pin = a place. Shows its sports, plus the most useful thing happening there:
/// LIVE now, the time of today's next game, or how many clubs play there.
struct PlacePin: View {
    let summary: PlaceSummary
    var isSelected = false
    @State private var pulse = false

    private var isLive: Bool { summary.liveGame != nil }

    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 6) {
                HStack(spacing: -8) {
                    ForEach(summary.sports) { sport in
                        SportIcon(sport: sport, size: 30)
                            .overlay(Circle().stroke(.white, lineWidth: 2))
                    }
                }
                if let label {
                    Text(label)
                        .font(.footnote.weight(.bold))
                        .monospacedDigit()
                        .foregroundStyle(isLive ? Color.white : Color.primary)
                        .padding(.trailing, 6)
                }
            }
            .padding(4)
            .glassEffect(isLive ? Glass.regular.tint(Color.live) : Glass.regular, in: .capsule)
            .background {
                if isLive {
                    Capsule()
                        .fill(Color.live.opacity(0.35))
                        .scaleEffect(pulse ? 1.35 : 1)
                        .opacity(pulse ? 0 : 1)
                }
            }
            Triangle()
                .fill(isLive ? Color.live : Color(.systemBackground))
                .frame(width: 12, height: 7)
                .shadow(color: .black.opacity(0.15), radius: 1, y: 1)
        }
        .scaleEffect(isSelected ? 1.2 : 1, anchor: .bottom)
        .animation(.spring(duration: 0.3), value: isSelected)
        .onAppear {
            guard isLive else { return }
            withAnimation(.easeOut(duration: 1.6).repeatForever(autoreverses: false)) { pulse = true }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(accessibilityText)
        .accessibilityAddTraits(.isButton)
    }

    private var label: String? {
        if isLive { return "LIVE" }
        if let next = summary.nextGame { return next.start.formatted(date: .omitted, time: .shortened) }
        if !summary.clubs.isEmpty { return summary.clubs.count == 1 ? "1 club" : "\(summary.clubs.count) clubs" }
        return nil
    }

    private var accessibilityText: String {
        var parts = [summary.place.name, summary.sports.map(\.label).joined(separator: " and ")]
        if let label { parts.append(label) }
        return parts.joined(separator: ", ")
    }
}

private struct Triangle: Shape {
    func path(in rect: CGRect) -> Path {
        Path { path in
            path.move(to: CGPoint(x: rect.minX, y: rect.minY))
            path.addLine(to: CGPoint(x: rect.maxX, y: rect.minY))
            path.addLine(to: CGPoint(x: rect.midX, y: rect.maxY))
            path.closeSubpath()
        }
    }
}
