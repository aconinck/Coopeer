import SwiftUI
import VisionKit

/// Every way into a club ends here: QR scan, typed code, or a coopeer://join/<code> link.
struct JoinFlowSheet: View {
    enum Mode { case scan, code }

    @Environment(\.dismiss) private var dismiss
    @Environment(AppStore.self) private var store
    @State private var mode: Mode
    @State private var code: String
    @State private var isLookingUp = false
    @State private var notFound = false
    @State private var found: Club?

    init(entry: JoinEntry) {
        switch entry {
        case .scan:
            _mode = State(initialValue: .scan)
            _code = State(initialValue: "")
        case .code(let prefill):
            _mode = State(initialValue: .code)
            _code = State(initialValue: prefill ?? "")
        }
    }

    var body: some View {
        NavigationStack {
            Group {
                switch mode {
                case .scan:
                    ScanStep { scanned in
                        code = scanned
                        mode = .code
                        lookUp()
                    } onTypeInstead: {
                        mode = .code
                    }
                case .code:
                    codeStep
                }
            }
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close", systemImage: "xmark") { dismiss() }
                }
            }
        }
        .sheet(item: $found) { club in
            JoinFoundSheet(club: club) { dismiss() }
        }
        .task {
            if code.count == TeamCode.length { lookUp() }
        }
    }

    private var codeStep: some View {
        StepScaffold(
            title: "Team code",
            subtitle: "Ask the club organizer for their 8-digit code.",
            progress: 0.5,
            canContinue: code.count == TeamCode.length,
            isLoading: isLookingUp,
            onNext: lookUp
        ) {
            VStack(alignment: .leading, spacing: Space.lg) {
                CodeField(code: $code, length: TeamCode.length, groupSize: 2, isError: notFound)
                if notFound {
                    Text("Wrong code — no club found. Check the digits and try again.")
                        .font(.footnote.weight(.medium))
                        .foregroundStyle(Color.live)
                }
                Button("Scan QR code instead", systemImage: Glyph.qr) { mode = .scan }
                    .font(.subheadline.weight(.semibold))
            }
        }
        .onChange(of: code) { _, newValue in
            if newValue.count < TeamCode.length { notFound = false }
            if newValue.count == TeamCode.length { lookUp() }
        }
    }

    private func lookUp() {
        guard !isLookingUp, code.count == TeamCode.length else { return }
        Task {
            isLookingUp = true
            defer { isLookingUp = false }
            if let club = await store.findClub(code: code) {
                found = club
            } else {
                notFound = true
            }
        }
    }
}

private struct ScanStep: View {
    var onCode: (String) -> Void
    var onTypeInstead: () -> Void
    @State private var invalidScan = false

    private var canScan: Bool {
        DataScannerViewController.isSupported && DataScannerViewController.isAvailable
    }

    var body: some View {
        ZStack {
            if canScan {
                QRScannerView { payload in
                    guard let code = TeamCode.extract(from: payload) else {
                        invalidScan = true
                        return false
                    }
                    onCode(code)
                    return true
                }
                .ignoresSafeArea()

                RoundedRectangle(cornerRadius: 32)
                    .strokeBorder(.white, lineWidth: 4)
                    .frame(width: 250, height: 250)
                    .shadow(radius: 8)
                    .allowsHitTesting(false)
            } else {
                ContentUnavailableView(
                    "Camera unavailable",
                    systemImage: "camera.metering.unknown",
                    description: Text("Scanning needs a device camera. You can type the club's code instead.")
                )
            }
        }
        .navigationTitle("Scan QR code")
        .navigationBarTitleDisplayMode(.inline)
        .actionBar(caption: invalidScan ? "That QR isn't a Coopeer club code." : "Point at the club's QR code.") {
            SecondaryButton(title: "Enter code instead", systemImage: Glyph.code, action: onTypeInstead)
        }
        .sensoryFeedback(.error, trigger: invalidScan) { _, new in new }
    }
}

/// Wraps VisionKit's scanner. `onScan` returns true to stop, false to keep scanning.
struct QRScannerView: UIViewControllerRepresentable {
    var onScan: (String) -> Bool

    func makeUIViewController(context: Context) -> DataScannerViewController {
        let scanner = DataScannerViewController(
            recognizedDataTypes: [.barcode(symbologies: [.qr])],
            qualityLevel: .balanced,
            recognizesMultipleItems: false,
            isHighFrameRateTrackingEnabled: false,
            isHighlightingEnabled: true
        )
        scanner.delegate = context.coordinator
        return scanner
    }

    func updateUIViewController(_ scanner: DataScannerViewController, context: Context) {
        if !scanner.isScanning, !context.coordinator.isDone {
            try? scanner.startScanning()
        }
    }

    static func dismantleUIViewController(_ scanner: DataScannerViewController, coordinator: Coordinator) {
        scanner.stopScanning()
    }

    func makeCoordinator() -> Coordinator { Coordinator(onScan: onScan) }

    final class Coordinator: NSObject, DataScannerViewControllerDelegate {
        let onScan: (String) -> Bool
        var isDone = false
        private var lastPayload: String?

        init(onScan: @escaping (String) -> Bool) {
            self.onScan = onScan
        }

        func dataScanner(_ dataScanner: DataScannerViewController, didAdd addedItems: [RecognizedItem], allItems: [RecognizedItem]) {
            guard !isDone else { return }
            for item in addedItems {
                guard case .barcode(let barcode) = item, let payload = barcode.payloadStringValue,
                      payload != lastPayload else { continue }
                lastPayload = payload
                if onScan(payload) {
                    isDone = true
                    dataScanner.stopScanning()
                }
                return
            }
        }
    }
}

/// Figma "_join/found": the club behind the code, with Join.
struct JoinFoundSheet: View {
    let club: Club
    var onFinished: () -> Void
    @Environment(\.dismiss) private var dismiss
    @Environment(AppStore.self) private var store
    @Environment(Session.self) private var session
    @State private var authRequest: AuthRequest?

    var body: some View {
        let isMember = store.isMember(of: club.id)
        VStack(spacing: Space.md) {
            ClubLogo(club: club, size: 88)
                .padding(.top, Space.xl)
            Text(club.name).font(.title2.bold())
            Text("\(club.sport.label) · \(club.cadence)")
                .font(.subheadline)
                .foregroundStyle(.secondary)
            AvatarStack(members: club.members, total: club.memberCount, size: 30, limit: 5)
            if let place = store.place(club.homePlaceID) {
                Label(place.name, systemImage: Glyph.place)
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
            Spacer(minLength: 0)
        }
        .frame(maxWidth: .infinity)
        .padding(.horizontal, Space.xl)
        .actionBar(caption: isMember ? "You're in! Its games are now on your schedule." : "\(club.monthlyPrice.dollars)/month · cancel anytime") {
            if isMember {
                PrimaryButton(title: "Done", systemImage: "checkmark") { onFinished() }
            } else {
                SecondaryButton(title: "Cancel") { dismiss() }
                PrimaryButton(title: "Join") {
                    session.whenSignedIn($authRequest) { store.join(clubID: club.id) }
                }
            }
        }
        .presentationDetents([.medium])
        .authGate($authRequest)
        .sensoryFeedback(.success, trigger: isMember) { _, new in new }
    }
}

/// Lets any member share the club: QR for in-person, link + code for chat.
struct InviteSheet: View {
    let club: Club
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            VStack(spacing: Space.lg) {
                if let image = QRCode.image(for: club.inviteURL.absoluteString) {
                    Image(uiImage: image)
                        .interpolation(.none)
                        .resizable()
                        .scaledToFit()
                        .frame(width: 220, height: 220)
                        .padding(Space.lg)
                        .background(.white, in: .rect(cornerRadius: Radius.card))
                        .accessibilityLabel("QR code to join \(club.name)")
                }
                VStack(spacing: Space.xs) {
                    Text("Team code").font(.footnote).foregroundStyle(.secondary)
                    Text(club.formattedCode)
                        .font(.system(size: 34, weight: .semibold, design: .rounded))
                        .monospacedDigit()
                        .foregroundStyle(Color.brand)
                        .textSelection(.enabled)
                }
                Text("Friends can scan this with their iPhone camera, or tap + in Clubs and enter the code.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                Spacer(minLength: 0)
            }
            .padding(Space.xl)
            .navigationTitle("Invite to \(club.name)")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close", systemImage: "xmark") { dismiss() }
                }
            }
            .actionBar {
                ShareLink(item: club.inviteURL, message: Text("Join \(club.name) on Coopeer — code \(club.formattedCode)")) {
                    Label("Share invite", systemImage: Glyph.share)
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 4)
                }
                .buttonStyle(.glassProminent)
                .tint(.brand)
                .controlSize(.large)
            }
        }
        .presentationDetents([.large])
    }
}
