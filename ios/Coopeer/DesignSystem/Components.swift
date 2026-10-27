import SwiftUI

struct Avatar: View {
    let member: Member
    var size: CGFloat = 36

    private var tint: Color {
        let palette: [Color] = [.brand, .soccer, .pickleball, .teal, .pink, .indigo, .mint]
        let hash = member.id.unicodeScalars.reduce(0) { $0 + Int($1.value) }
        return palette[hash % palette.count]
    }

    var body: some View {
        Text(member.id == Member.me.id ? "You" : member.initials)
            .font(.system(size: size * (member.id == Member.me.id ? 0.3 : 0.38), weight: .semibold, design: .rounded))
            .foregroundStyle(.white)
            .frame(width: size, height: size)
            .background(tint.gradient, in: .circle)
            .accessibilityLabel(member.name)
    }
}

struct AvatarStack: View {
    let members: [Member]
    var total: Int?
    var size: CGFloat = 24
    var limit = 4

    var body: some View {
        let shown = Array(members.prefix(limit))
        let extra = (total ?? members.count) - shown.count
        HStack(spacing: -size * 0.3) {
            ForEach(shown) { member in
                Avatar(member: member, size: size)
                    .overlay(Circle().stroke(Color(.secondarySystemGroupedBackground), lineWidth: 2))
            }
            if extra > 0 {
                Text("+\(extra)")
                    .font(.system(size: size * 0.38, weight: .bold, design: .rounded))
                    .foregroundStyle(.secondary)
                    .frame(width: size, height: size)
                    .background(Color(.tertiarySystemFill), in: .circle)
                    .overlay(Circle().stroke(Color(.secondarySystemGroupedBackground), lineWidth: 2))
            }
        }
        .accessibilityElement()
        .accessibilityLabel("\(total ?? members.count) people")
    }
}

struct SportIcon: View {
    let sport: Sport
    var size: CGFloat = 28

    var body: some View {
        Image(systemName: sport.symbol)
            .font(.system(size: size * 0.5, weight: .semibold))
            .foregroundStyle(.white)
            .frame(width: size, height: size)
            .background(sport.color.gradient, in: .circle)
            .accessibilityLabel(sport.label)
    }
}

/// Clubs are always a rounded square; games are always a date tile.
struct ClubLogo: View {
    let club: Club
    var size: CGFloat = 52

    var body: some View {
        Image(systemName: club.sport.symbol)
            .font(.system(size: size * 0.45, weight: .semibold))
            .foregroundStyle(.white)
            .frame(width: size, height: size)
            .background(club.sport.color.gradient, in: .rect(cornerRadius: size * 0.28))
            .accessibilityHidden(true)
    }
}

struct DateTile: View {
    let game: Game

    var body: some View {
        let status = game.status()
        VStack(spacing: 2) {
            Text(topLine(status))
                .font(.caption2.weight(.heavy))
                .foregroundStyle(status == .live ? Color.live : (status == .soon || status == .today ? Color.brand : .secondary))
            Text(game.start, format: .dateTime.hour().minute())
                .font(.subheadline.weight(.semibold))
                .monospacedDigit()
                .minimumScaleFactor(0.7)
                .lineLimit(1)
        }
        .frame(width: 64, height: 52)
        .background(Color(.tertiarySystemFill), in: .rect(cornerRadius: Radius.tile))
        .accessibilityElement(children: .combine)
    }

    private func topLine(_ status: GameStatus) -> String {
        switch status {
        case .live: "LIVE"
        case .soon, .today: "TODAY"
        case .later, .ended:
            Calendar.current.isDateInTomorrow(game.start)
                ? "TMRW"
                : game.start.formatted(.dateTime.weekday(.abbreviated)).uppercased()
        }
    }
}

enum Badge: Hashable {
    case live, going, notGoing, reply, new, canceled, full

    var title: String {
        switch self {
        case .live: "Live"
        case .going: "Going"
        case .notGoing: "Not going"
        case .reply: "Reply"
        case .new: "New"
        case .canceled: "Canceled"
        case .full: "Full"
        }
    }

    var color: Color {
        switch self {
        case .live, .canceled: .live
        case .going: .going
        case .notGoing, .full: .orange
        case .reply: .secondary
        case .new: .brand
        }
    }
}

struct StatusBadge: View {
    let badge: Badge

    var body: some View {
        HStack(spacing: 4) {
            if badge == .live {
                Circle().fill(Color.live).frame(width: 6, height: 6)
            }
            Text(badge.title)
        }
        .font(.caption.weight(.semibold))
        .foregroundStyle(badge.color)
        .padding(.horizontal, 8)
        .padding(.vertical, 3)
        .background(badge.color.opacity(0.14), in: .capsule)
    }
}

extension Game {
    func badge(isMember: Bool) -> Badge? {
        if isCanceled { return .canceled }
        if status() == .live { return .live }
        switch myRSVP {
        case .going: return .going
        case .declined: return .notGoing
        case .noResponse: break
        }
        if spotsLeft == 0 { return .full }
        if isNew { return .new }
        return isMember ? .reply : nil
    }
}

/// Tiny label that teaches the difference between a one-time game and a recurring club.
struct KindTag: View {
    enum Kind { case game, openGame, club }
    let kind: Kind

    var body: some View {
        Label(text, systemImage: kind == .club ? Glyph.club : Glyph.game)
            .font(.caption2.weight(.bold))
            .textCase(.uppercase)
            .foregroundStyle(.secondary)
            .labelStyle(.titleAndIcon)
    }

    private var text: String {
        switch kind {
        case .game: "Club game"
        case .openGame: "Open game"
        case .club: "Club"
        }
    }
}

struct SectionHeader: View {
    let title: String
    var caption: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title).font(.title3.bold())
            if let caption {
                Text(caption).font(.footnote).foregroundStyle(.secondary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .accessibilityAddTraits(.isHeader)
    }
}

/// The one way a game is shown in any list.
struct GameRow: View {
    @Environment(AppStore.self) private var store
    let game: Game
    var showsPlace = true

    var body: some View {
        HStack(spacing: Space.md) {
            DateTile(game: game)
            VStack(alignment: .leading, spacing: 3) {
                HStack(alignment: .firstTextBaseline) {
                    KindTag(kind: game.isOpen ? .openGame : .game)
                    Spacer(minLength: 4)
                    if let badge = game.badge(isMember: game.clubID.map(store.isMember(of:)) ?? false) {
                        StatusBadge(badge: badge)
                    }
                }
                Text(game.title)
                    .font(.headline)
                    .foregroundStyle(.primary)
                    .strikethrough(game.isCanceled)
                    .lineLimit(1)
                Text(subtitle)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
                HStack {
                    Text(game.spotsLeft == 0 ? "\(game.going.count) going · full" : "\(game.going.count) going · \(game.spotsLeft) spots left")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                    Spacer()
                    AvatarStack(members: game.going, size: 20, limit: 3)
                }
            }
        }
        .padding(Space.md)
        .card(highlighted: game.status() == .live)
        .contentShape(.rect)
    }

    private var subtitle: String {
        let host = game.clubID.flatMap(store.club)?.name ?? "Hosted by Coopeer"
        if showsPlace, let place = store.place(game.placeID) {
            return "\(place.name) · \(host)"
        }
        return host
    }
}

/// The one way a club is shown in any list.
struct ClubRow: View {
    @Environment(AppStore.self) private var store
    let club: Club

    var body: some View {
        HStack(spacing: Space.md) {
            ClubLogo(club: club)
            VStack(alignment: .leading, spacing: 3) {
                HStack(alignment: .firstTextBaseline) {
                    KindTag(kind: .club)
                    Spacer(minLength: 4)
                    if store.isMember(of: club.id) {
                        Label("Member", systemImage: "checkmark")
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(Color.going)
                    } else if club.isNew {
                        StatusBadge(badge: .new)
                    }
                }
                Text(club.name)
                    .font(.headline)
                    .foregroundStyle(.primary)
                    .lineLimit(1)
                Text(club.cadence)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                HStack {
                    Text("\(club.memberCount) members · \(club.level.rawValue)")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                    Spacer()
                    AvatarStack(members: club.members, total: club.memberCount, size: 20, limit: 3)
                }
            }
        }
        .padding(Space.md)
        .card()
        .contentShape(.rect)
    }
}
