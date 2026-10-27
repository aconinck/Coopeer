import SwiftUI
import CoreLocation

// Domain:
// - Place: where people play. Every map pin is a Place.
// - Club:  a recurring group ("every Friday 8 PM"). Join once, get all its games.
// - Game:  one occurrence at a Place and time. Hosted by a Club, or open (pickup).

enum Sport: String, CaseIterable, Identifiable, Codable, Hashable {
    case soccer, pickleball

    var id: String { rawValue }

    var label: String {
        switch self {
        case .soccer: "Soccer"
        case .pickleball: "Pickleball"
        }
    }

    var symbol: String {
        switch self {
        case .soccer: "figure.soccer"
        case .pickleball: "figure.pickleball"
        }
    }

    var color: Color {
        switch self {
        case .soccer: .soccer
        case .pickleball: .pickleball
        }
    }

    var placeNoun: String {
        switch self {
        case .soccer: "Field"
        case .pickleball: "Courts"
        }
    }
}

struct Member: Identifiable, Hashable {
    let id: String
    var name: String

    var initials: String {
        name.split(separator: " ").prefix(2).compactMap(\.first).map(String.init).joined()
    }

    static let me = Member(id: "me", name: "You")
}

struct Place: Identifiable, Hashable {
    let id: String
    var name: String
    var address: String
    var latitude: Double
    var longitude: Double
    var sports: [Sport]

    var coordinate: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
    }
}

struct ClubLink: Identifiable, Hashable {
    var id: String { url.absoluteString }
    var title: String
    var url: URL
}

enum SkillLevel: String, Hashable {
    case casual = "Casual"
    case mixed = "All levels"
    case competitive = "Competitive"
}

struct Club: Identifiable, Hashable {
    let id: String
    var name: String
    var sport: Sport
    var homePlaceID: String
    var cadence: String
    var about: String
    var links: [ClubLink]
    var members: [Member]
    var memberCount: Int
    var monthlyPrice: Int
    var level: SkillLevel
    var code: String
    var isNew: Bool = false

    var inviteURL: URL { URL(string: "coopeer://join/\(code)")! }

    var formattedCode: String {
        stride(from: 0, to: code.count, by: 2).map { i in
            let start = code.index(code.startIndex, offsetBy: i)
            let end = code.index(start, offsetBy: 2, limitedBy: code.endIndex) ?? code.endIndex
            return String(code[start..<end])
        }.joined(separator: " ")
    }
}

enum RSVP: Hashable {
    case going, declined, noResponse
}

enum GameStatus: Hashable {
    case live, soon, today, later, ended
}

struct Game: Identifiable, Hashable {
    let id: String
    var sport: Sport
    var placeID: String
    var clubID: String?
    var title: String
    var details: String
    var start: Date
    var end: Date
    var capacity: Int
    var going: [Member]
    var declined: [Member]
    var noResponse: [Member]
    var dropInPrice: Int
    var level: SkillLevel
    var myRSVP: RSVP = .noResponse
    var isCanceled: Bool = false
    var isNew: Bool = false

    var isOpen: Bool { clubID == nil }
    var spotsLeft: Int { max(capacity - going.count, 0) }

    func status(at now: Date = .now) -> GameStatus {
        if end < now { return .ended }
        if start <= now { return .live }
        if start.timeIntervalSince(now) < 2 * 3600 { return .soon }
        if Calendar.current.isDate(start, inSameDayAs: now) { return .today }
        return .later
    }
}

struct PaymentMethod: Identifiable, Hashable {
    let id: String
    var clubName: String
    var amount: Int
    var method: String
}

struct User: Codable, Hashable {
    var id: String
    var phone: String
    var name: String

    var firstName: String { name.split(separator: " ").first.map(String.init) ?? name }
}

extension Int {
    var dollars: String { "$\(self)" }
}
