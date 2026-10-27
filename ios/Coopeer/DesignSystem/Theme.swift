import SwiftUI

// Design tokens. The brand orange is the only accent; everything else is system
// materials (Liquid Glass) and semantic colors so Light/Dark mode come for free.

extension Color {
    static let brand = Color(hex: 0xFF6100)
    static let soccer = Color(hex: 0x30B35A)
    static let pickleball = Color(hex: 0x5B5BD6)
    static let live = Color(hex: 0xFF3B30)
    static let going = Color(hex: 0x30B35A)

    init(hex: UInt32, opacity: Double = 1) {
        self.init(
            .sRGB,
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255,
            opacity: opacity
        )
    }
}

enum Space {
    static let xs: CGFloat = 4
    static let sm: CGFloat = 8
    static let md: CGFloat = 12
    static let lg: CGFloat = 16
    static let xl: CGFloat = 24
    static let xxl: CGFloat = 32
}

enum Radius {
    static let card: CGFloat = 22
    static let tile: CGFloat = 14
    static let sheet: CGFloat = 32
}

// One icon per concept, used everywhere so people learn them.
enum Glyph {
    static let place = "mappin.and.ellipse"
    static let game = "calendar"
    static let club = "person.3.fill"
    static let members = "person.2.fill"
    static let qr = "qrcode.viewfinder"
    static let code = "number"
    static let directions = "arrow.triangle.turn.up.right.diamond.fill"
    static let share = "square.and.arrow.up"
}

struct CardBackground: ViewModifier {
    var highlighted = false

    func body(content: Content) -> some View {
        content
            .background(Color(.secondarySystemGroupedBackground), in: .rect(cornerRadius: Radius.card))
            .overlay {
                RoundedRectangle(cornerRadius: Radius.card)
                    .strokeBorder(highlighted ? Color.brand.opacity(0.5) : Color.primary.opacity(0.06), lineWidth: 1)
            }
    }
}

extension View {
    func card(highlighted: Bool = false) -> some View {
        modifier(CardBackground(highlighted: highlighted))
    }
}
