import Foundation
import Observation

// In-memory data layer. Replace the bodies of these methods with real API calls;
// views only depend on this type's public surface.
@Observable
final class AppStore {
    var places: [Place]
    var clubs: [Club]
    var games: [Game]
    var memberships: Set<String>
    var payments: [PaymentMethod]

    init() {
        let data = MockData.make(now: .now)
        places = data.places
        clubs = data.clubs
        games = data.games
        memberships = ["c1", "c4"]
        payments = [
            PaymentMethod(id: "pm1", clubName: "Bentonville Strikers", amount: 29, method: "Apple Pay"),
            PaymentMethod(id: "pm2", clubName: "Dink & Drive", amount: 24, method: "Visa •••• 2315"),
        ]
    }

    // MARK: Lookups

    func place(_ id: String) -> Place? { places.first { $0.id == id } }
    func club(_ id: String) -> Club? { clubs.first { $0.id == id } }
    func game(_ id: String) -> Game? { games.first { $0.id == id } }

    func upcomingGames(at placeID: String) -> [Game] {
        games
            .filter { $0.placeID == placeID && $0.status() != .ended && !$0.isCanceled }
            .sorted { $0.start < $1.start }
    }

    func clubs(at placeID: String) -> [Club] {
        clubs.filter { $0.homePlaceID == placeID }
    }

    func games(for clubID: String) -> [Game] {
        games
            .filter { $0.clubID == clubID && $0.status() != .ended }
            .sorted { $0.start < $1.start }
    }

    func nextGame(for clubID: String) -> Game? {
        games(for: clubID).first { !$0.isCanceled }
    }

    var myClubs: [Club] {
        clubs.filter { memberships.contains($0.id) }
    }

    var mySchedule: [Game] {
        games
            .filter { game in
                game.status() != .ended
                    && (game.myRSVP == .going || game.clubID.map(memberships.contains) == true)
            }
            .sorted { $0.start < $1.start }
    }

    func isMember(of clubID: String) -> Bool {
        memberships.contains(clubID)
    }

    // MARK: Actions

    func join(clubID: String) {
        guard let index = clubs.firstIndex(where: { $0.id == clubID }), !memberships.contains(clubID) else { return }
        memberships.insert(clubID)
        clubs[index].memberCount += 1
        clubs[index].members.insert(.me, at: 0)
    }

    func leave(clubID: String) {
        guard let index = clubs.firstIndex(where: { $0.id == clubID }), memberships.contains(clubID) else { return }
        memberships.remove(clubID)
        clubs[index].memberCount -= 1
        clubs[index].members.removeAll { $0.id == Member.me.id }
    }

    func setRSVP(_ rsvp: RSVP, gameID: String) {
        guard let index = games.firstIndex(where: { $0.id == gameID }) else { return }
        var game = games[index]
        game.going.removeAll { $0.id == Member.me.id }
        game.declined.removeAll { $0.id == Member.me.id }
        game.noResponse.removeAll { $0.id == Member.me.id }
        switch rsvp {
        case .going: game.going.insert(.me, at: 0)
        case .declined: game.declined.insert(.me, at: 0)
        case .noResponse: break
        }
        game.myRSVP = rsvp
        games[index] = game
    }

    func findClub(code: String) async -> Club? {
        try? await Task.sleep(for: .milliseconds(600))
        return clubs.first { $0.code == code }
    }
}

// MARK: - Mock data (Bentonville, AR)

private enum MockData {
    struct Bundle {
        var places: [Place]
        var clubs: [Club]
        var games: [Game]
    }

    static let people: [Member] = [
        "Alex Rivera", "Jordan Lee", "Sam Torres", "Casey Wong", "Taylor Brooks", "Morgan Diaz",
        "Riley Chen", "Jamie Patel", "Drew Carter", "Avery Kim", "Quinn Foster", "Parker Hughes",
        "Reese Morgan", "Skyler Ward", "Emerson Hale", "Rowan Price",
    ].enumerated().map { Member(id: "m\($0.offset)", name: $0.element) }

    static func crowd(_ count: Int, offset: Int = 0) -> [Member] {
        (0..<count).map { people[($0 + offset) % people.count] }
    }

    static func make(now: Date) -> Bundle {
        let places = [
            Place(id: "p1", name: "Lawrence Plaza Field", address: "100 NW 1st St, Bentonville, AR", latitude: 36.3729, longitude: -94.2088, sports: [.soccer]),
            Place(id: "p2", name: "Memorial Park", address: "800 SW 14th St, Bentonville, AR", latitude: 36.3592, longitude: -94.2185, sports: [.soccer, .pickleball]),
            Place(id: "p3", name: "Crystal Bridges Courts", address: "600 Museum Way, Bentonville, AR", latitude: 36.3818, longitude: -94.1990, sports: [.pickleball]),
            Place(id: "p4", name: "Orchard Park Courts", address: "800 SW Bark Park Dr, Bentonville, AR", latitude: 36.3668, longitude: -94.2033, sports: [.pickleball]),
            Place(id: "p5", name: "Phillips Park", address: "2001 SE J St, Bentonville, AR", latitude: 36.3462, longitude: -94.1994, sports: [.soccer]),
            Place(id: "p6", name: "Community Center", address: "1101 SW Citizens Cir, Bentonville, AR", latitude: 36.3631, longitude: -94.2290, sports: [.soccer, .pickleball]),
        ]

        let clubs = [
            Club(id: "c1", name: "Bentonville Strikers", sport: .soccer, homePlaceID: "p1", cadence: "Every Fri · 8 PM",
                 about: "Casual Friday night soccer. All skill levels welcome — we split teams fairly and grab drinks after.",
                 links: [ClubLink(title: "Group chat", url: URL(string: "https://chat.whatsapp.com/strikers")!)],
                 members: crowd(12), memberCount: 34, monthlyPrice: 29, level: .casual, code: "12355654"),
            Club(id: "c2", name: "Sunday League", sport: .soccer, homePlaceID: "p2", cadence: "Every Sun · 10 AM",
                 about: "11v11 on full-size fields. Intermediate to competitive. Referee every match.",
                 links: [], members: crowd(10, offset: 3), memberCount: 48, monthlyPrice: 35, level: .competitive, code: "22446688"),
            Club(id: "c3", name: "Crystal Bridges Picklers", sport: .pickleball, homePlaceID: "p3", cadence: "Every Sat · 9 AM",
                 about: "Weekend round robins next to the museum trails. Beginners get paired with experienced players.",
                 links: [], members: crowd(8, offset: 5), memberCount: 22, monthlyPrice: 24, level: .mixed, code: "33557799", isNew: true),
            Club(id: "c4", name: "Dink & Drive", sport: .pickleball, homePlaceID: "p2", cadence: "Tue & Thu · 6 PM",
                 about: "After-work doubles ladder. Rotating partners, ratings 3.0–4.0.",
                 links: [ClubLink(title: "Ladder standings", url: URL(string: "https://dinkanddrive.club/ladder")!)],
                 members: crowd(9, offset: 7), memberCount: 26, monthlyPrice: 24, level: .mixed, code: "44668800"),
            Club(id: "c5", name: "Phillips Park FC", sport: .soccer, homePlaceID: "p5", cadence: "Every Wed · 7 PM",
                 about: "Midweek 7v7 under the lights.", links: [], members: crowd(10, offset: 2), memberCount: 30,
                 monthlyPrice: 29, level: .mixed, code: "55779911"),
            Club(id: "c6", name: "Lunch Pickleball", sport: .pickleball, homePlaceID: "p6", cadence: "Mon & Wed · 12 PM",
                 about: "Indoor open play over lunch. Paddles available to borrow.", links: [], members: crowd(7, offset: 9),
                 memberCount: 18, monthlyPrice: 18, level: .casual, code: "66881133"),
            Club(id: "c7", name: "NWA Futsal", sport: .soccer, homePlaceID: "p6", cadence: "Every Thu · 8 PM",
                 about: "Indoor 5v5 futsal. Fast, technical, fun.", links: [], members: crowd(8, offset: 11),
                 memberCount: 20, monthlyPrice: 32, level: .competitive, code: "77992244", isNew: true),
        ]

        func at(_ minutes: Double) -> Date { now.addingTimeInterval(minutes * 60) }
        func day(_ days: Int, hour: Int) -> Date {
            let base = Calendar.current.date(byAdding: .day, value: days, to: now) ?? now
            return Calendar.current.date(bySettingHour: hour, minute: 0, second: 0, of: base) ?? base
        }

        let games = [
            Game(id: "g1", sport: .soccer, placeID: "p1", clubID: "c1", title: "Friday Night Soccer",
                 details: "Weekly 7v7. Bring a light and a dark shirt.", start: at(-25), end: at(65), capacity: 14,
                 going: crowd(11), declined: crowd(2, offset: 12), noResponse: crowd(3, offset: 14), dropInPrice: 7, level: .casual),
            Game(id: "g2", sport: .pickleball, placeID: "p4", clubID: nil, title: "Open Play · Doubles",
                 details: "Rotating doubles, winners stay on. Balls provided.", start: at(40), end: at(160), capacity: 8,
                 going: crowd(5, offset: 4), declined: [], noResponse: [], dropInPrice: 7, level: .mixed, isNew: true),
            Game(id: "g3", sport: .pickleball, placeID: "p2", clubID: "c4", title: "Doubles Ladder",
                 details: "Ladder night. Check in 10 minutes early.", start: at(180), end: at(300), capacity: 12,
                 going: crowd(6, offset: 7), declined: crowd(1, offset: 2), noResponse: crowd(4, offset: 9), dropInPrice: 7, level: .mixed),
            Game(id: "g4", sport: .soccer, placeID: "p5", clubID: nil, title: "Pickup 7v7",
                 details: "Open pickup game. Teams picked on the spot.", start: at(300), end: at(390), capacity: 14,
                 going: crowd(9, offset: 1), declined: [], noResponse: [], dropInPrice: 7, level: .mixed),
            Game(id: "g5", sport: .pickleball, placeID: "p3", clubID: "c3", title: "Saturday Round Robin",
                 details: "Round robin, 15-minute games.", start: day(1, hour: 9), end: day(1, hour: 11), capacity: 16,
                 going: crowd(10, offset: 5), declined: [], noResponse: crowd(3), dropInPrice: 7, level: .mixed),
            Game(id: "g6", sport: .soccer, placeID: "p2", clubID: "c2", title: "League Match",
                 details: "Sunday League round 6.", start: day(2, hour: 10), end: day(2, hour: 12), capacity: 22,
                 going: crowd(15, offset: 3), declined: crowd(2), noResponse: crowd(4, offset: 6), dropInPrice: 10, level: .competitive),
            Game(id: "g7", sport: .pickleball, placeID: "p6", clubID: nil, title: "Lunch Open Play",
                 details: "Indoor courts 3 and 4.", start: at(-15), end: at(45), capacity: 8,
                 going: crowd(7, offset: 8), declined: [], noResponse: [], dropInPrice: 7, level: .casual),
            Game(id: "g8", sport: .soccer, placeID: "p6", clubID: "c7", title: "Futsal Night",
                 details: "5v5, 8-minute games.", start: day(1, hour: 20), end: day(1, hour: 22), capacity: 15,
                 going: crowd(8, offset: 11), declined: [], noResponse: crowd(2, offset: 1), dropInPrice: 8, level: .competitive),
            Game(id: "g9", sport: .soccer, placeID: "p1", clubID: "c1", title: "Friday Night Soccer",
                 details: "Weekly 7v7. Bring a light and a dark shirt.", start: day(7, hour: 20), end: day(7, hour: 22), capacity: 14,
                 going: crowd(4), declined: [], noResponse: crowd(8, offset: 4), dropInPrice: 7, level: .casual, isNew: true),
            Game(id: "g10", sport: .pickleball, placeID: "p2", clubID: "c4", title: "Doubles Ladder",
                 details: "Ladder night.", start: day(2, hour: 18), end: day(2, hour: 20), capacity: 12,
                 going: crowd(3, offset: 7), declined: [], noResponse: crowd(6, offset: 2), dropInPrice: 7, level: .mixed, isCanceled: true),
        ]

        return Bundle(places: places, clubs: clubs, games: games)
    }
}
