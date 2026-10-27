import SwiftUI

// Action placement rules (same on every screen):
// 1. A screen's main action lives in the bottom ActionBar: [secondary] [PRIMARY].
// 2. Step-by-step flows (login, team code) use the round NextButton bottom-right.
// 3. The top-right toolbar holds at most one menu ("+" to add, "…" for more).
// 4. Details of a place, game or club always open in a sheet.
// 5. Destructive actions always ask for confirmation.

struct PrimaryButton: View {
    let title: String
    var systemImage: String?
    var isLoading = false
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            ZStack {
                Label {
                    Text(title)
                } icon: {
                    if let systemImage { Image(systemName: systemImage) }
                }
                .opacity(isLoading ? 0 : 1)
                if isLoading { ProgressView().tint(.white) }
            }
            .font(.headline)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 4)
        }
        .buttonStyle(.glassProminent)
        .tint(.brand)
        .controlSize(.large)
        .disabled(isLoading)
    }
}

struct SecondaryButton: View {
    let title: String
    var systemImage: String?
    var role: ButtonRole?
    var action: () -> Void

    var body: some View {
        Button(role: role, action: action) {
            Label {
                Text(title)
            } icon: {
                if let systemImage { Image(systemName: systemImage) }
            }
            .font(.headline)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 4)
        }
        .buttonStyle(.glass)
        .controlSize(.large)
    }
}

struct ActionBar<Content: View>: View {
    var caption: String?
    @ViewBuilder var content: Content

    var body: some View {
        VStack(spacing: Space.sm) {
            if let caption {
                Text(caption)
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }
            GlassEffectContainer(spacing: Space.md) {
                HStack(spacing: Space.md) { content }
            }
        }
        .padding(.horizontal, Space.lg)
        .padding(.top, Space.sm)
        .padding(.bottom, Space.sm)
    }
}

extension View {
    /// Pins the screen's main actions to the bottom, above the keyboard and home indicator.
    func actionBar<Content: View>(caption: String? = nil, @ViewBuilder _ content: () -> Content) -> some View {
        safeAreaInset(edge: .bottom, spacing: 0) {
            ActionBar(caption: caption, content: content)
        }
    }
}

struct NextButton: View {
    var isEnabled: Bool
    var isLoading = false
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            ZStack {
                Image(systemName: "arrow.right")
                    .font(.title3.weight(.bold))
                    .opacity(isLoading ? 0 : 1)
                if isLoading { ProgressView().tint(.white) }
            }
            .frame(width: 30, height: 30)
        }
        .buttonStyle(.glassProminent)
        .buttonBorderShape(.circle)
        .controlSize(.extraLarge)
        .tint(isEnabled ? .brand : Color(.systemGray3))
        .disabled(!isEnabled || isLoading)
        .accessibilityLabel("Continue")
        .animation(.snappy, value: isEnabled)
    }
}

struct Chip: View {
    let title: String
    var systemImage: String?
    var color: Color = .brand
    var isSelected: Bool
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 6) {
                if let systemImage { Image(systemName: systemImage).imageScale(.small) }
                Text(title)
            }
            .font(.subheadline.weight(.semibold))
            .padding(.horizontal, 14)
            .frame(height: 34)
            .foregroundStyle(isSelected ? Color.white : Color.primary)
            .background(isSelected ? AnyShapeStyle(color) : AnyShapeStyle(Color(.tertiarySystemFill)), in: .capsule)
        }
        .buttonStyle(.plain)
        .animation(.snappy, value: isSelected)
    }
}
