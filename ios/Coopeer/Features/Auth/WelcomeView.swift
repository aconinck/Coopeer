import SwiftUI

/// First screen for people who haven't signed in (Figma: Login / hero).
struct WelcomeView: View {
    @Environment(Session.self) private var session
    @Environment(AppRouter.self) private var router

    var body: some View {
        VStack(alignment: .leading, spacing: Space.lg) {
            Spacer()
            Image("Logo")
                .resizable()
                .scaledToFit()
                .frame(width: 96, height: 96)
                .padding(.leading, -16)
            Text("Discover a\nnew world!")
                .font(.system(size: 44, weight: .bold))
            Text("Don't play alone. Find a game nearby tonight, or a club that plays every week.")
                .font(.title3)
                .foregroundStyle(.white.opacity(0.8))
            Spacer().frame(height: Space.xl)
        }
        .foregroundStyle(.white)
        .padding(.horizontal, Space.xl)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        .background { HeroBackground() }
        .actionBar(caption: nil) {
            SecondaryButton(title: "Look around") {
                session.continueAsGuest()
            }
            PrimaryButton(title: "Get started") {
                router.isAuthPresented = true
            }
        }
        .preferredColorScheme(.dark)
    }
}

struct HeroBackground: View {
    var body: some View {
        MeshGradient(
            width: 3,
            height: 3,
            points: [
                [0, 0], [0.5, 0], [1, 0],
                [0, 0.5], [0.6, 0.45], [1, 0.5],
                [0, 1], [0.5, 1], [1, 1],
            ],
            colors: [
                .black, Color(hex: 0x1A0E06), .black,
                Color(hex: 0x3A1600), Color(hex: 0xFF6100), Color(hex: 0x6B2400),
                .black, Color(hex: 0x2A1000), .black,
            ]
        )
        .ignoresSafeArea()
    }
}

#Preview {
    WelcomeView()
        .environment(Session())
        .environment(AppRouter())
}
