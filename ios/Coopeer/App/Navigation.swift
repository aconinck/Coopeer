import SwiftUI

/// Places and clubs push inside the current stack; games always open as a sheet.
enum Route: Hashable, Identifiable {
    case place(String)
    case game(String)
    case club(String)

    var id: Route { self }
}

struct RouteView: View {
    let route: Route

    var body: some View {
        switch route {
        case .place(let id): PlaceDetailView(placeID: id)
        case .game(let id): GameDetailView(gameID: id)
        case .club(let id): ClubDetailView(clubID: id)
        }
    }
}

/// A sheet with its own navigation stack, used for every place/game/club detail.
struct DetailSheet: View {
    let root: Route
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            RouteView(route: root)
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) {
                        Button("Close", systemImage: "xmark") { dismiss() }
                    }
                }
                .navigationDestination(for: Route.self) { RouteView(route: $0) }
        }
    }
}

extension View {
    /// Presents a detail (usually a game) as a full-height sheet.
    func detailSheet(_ route: Binding<Route?>) -> some View {
        sheet(item: route) { route in
            DetailSheet(root: route)
                .presentationDetents([.large])
        }
    }
}

// MARK: - Auth gate

struct AuthRequest: Identifiable {
    let id = UUID()
    let action: () -> Void
}

private struct AuthGate: ViewModifier {
    @Binding var request: AuthRequest?
    @Environment(Session.self) private var session

    func body(content: Content) -> some View {
        content
            .fullScreenCover(item: $request) { _ in
                AuthFlowView()
            }
            .onChange(of: session.isSignedIn) { _, signedIn in
                guard signedIn, let pending = request else { return }
                request = nil
                pending.action()
            }
    }
}

extension View {
    /// Presents phone login when `request` is set, then runs its action once signed in.
    func authGate(_ request: Binding<AuthRequest?>) -> some View {
        modifier(AuthGate(request: request))
    }
}

extension Session {
    func whenSignedIn(_ request: Binding<AuthRequest?>, _ action: @escaping () -> Void) {
        if isSignedIn {
            action()
        } else {
            request.wrappedValue = AuthRequest(action: action)
        }
    }
}
