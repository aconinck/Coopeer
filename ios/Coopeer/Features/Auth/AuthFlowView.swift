import SwiftUI

/// Phone-only login: number → SMS code → (new people only) name. No passwords.
struct AuthFlowView: View {
    enum Step: Hashable {
        case code
        case name
        case welcome(String)
    }

    @Environment(\.dismiss) private var dismiss
    @State private var path: [Step] = []
    @State private var phone = ""

    private var e164: String { "+1" + phone.filter(\.isNumber) }

    var body: some View {
        NavigationStack(path: $path) {
            PhoneStep(phone: $phone) { path.append(.code) }
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) {
                        Button("Close", systemImage: "xmark") { dismiss() }
                    }
                }
                .navigationDestination(for: Step.self) { step in
                    switch step {
                    case .code:
                        CodeStep(phone: e164, displayPhone: phone) { needsName in
                            if needsName { path.append(.name) }
                        }
                    case .name:
                        NameStep { name in path.append(.welcome(name)) }
                    case .welcome(let name):
                        WelcomeDoneStep(name: name)
                    }
                }
        }
    }
}

private struct PhoneStep: View {
    @Binding var phone: String
    var onSent: () -> Void
    @Environment(Session.self) private var session
    @State private var isSending = false
    @State private var errorMessage: String?

    private var digits: String { phone.filter(\.isNumber) }

    var body: some View {
        StepScaffold(
            title: "Phone number",
            subtitle: "We'll text you a code. No password, ever.",
            progress: 0.33,
            canContinue: digits.count == 10,
            isLoading: isSending,
            onNext: send
        ) {
            VStack(alignment: .leading, spacing: Space.md) {
                UnderlineField(placeholder: "(479) 555-0123", text: $phone, isError: errorMessage != nil) {
                    Text("+1").foregroundStyle(.secondary)
                }
                .keyboardType(.phonePad)
                .textContentType(.telephoneNumber)

                if let errorMessage {
                    Text(errorMessage).font(.footnote).foregroundStyle(Color.live)
                }
                Text("By continuing you agree to Coopeer's Terms and Privacy Policy.")
                    .font(.footnote)
                    .foregroundStyle(.tertiary)
            }
        }
        .onChange(of: phone) { _, newValue in
            errorMessage = nil
            let formatted = PhoneFormat.us(newValue)
            if formatted != newValue { phone = formatted }
        }
    }

    private func send() {
        Task {
            isSending = true
            defer { isSending = false }
            do {
                try await session.sendCode(to: "+1" + digits)
                onSent()
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }
}

private struct CodeStep: View {
    let phone: String
    let displayPhone: String
    var onVerified: (_ needsName: Bool) -> Void
    @Environment(Session.self) private var session
    @State private var code = ""
    @State private var isVerifying = false
    @State private var errorMessage: String?
    @State private var resendIn = 30
    @State private var resendToken = 0

    var body: some View {
        StepScaffold(
            title: "Confirmation",
            subtitle: "Enter the 6-digit code we sent to +1 \(displayPhone).",
            progress: 0.66,
            canContinue: code.count == 6,
            isLoading: isVerifying,
            onNext: verify
        ) {
            VStack(alignment: .leading, spacing: Space.lg) {
                CodeField(code: $code, length: 6, groupSize: 3, isError: errorMessage != nil, contentType: .oneTimeCode)
                if let errorMessage {
                    Text(errorMessage).font(.footnote).foregroundStyle(Color.live)
                }
                Button(resendIn > 0 ? "Resend code in \(resendIn)s" : "Resend code", action: resend)
                    .font(.subheadline.weight(.semibold))
                    .disabled(resendIn > 0)
            }
        }
        .onChange(of: code) { _, newValue in
            if newValue.count < 6 { errorMessage = nil }
            if newValue.count == 6 { verify() }
        }
        .task(id: resendToken) {
            resendIn = 30
            while resendIn > 0 {
                try? await Task.sleep(for: .seconds(1))
                resendIn -= 1
            }
        }
    }

    private func verify() {
        guard !isVerifying, code.count == 6 else { return }
        Task {
            isVerifying = true
            defer { isVerifying = false }
            do {
                let needsName = try await session.verify(phone: phone, code: code)
                onVerified(needsName)
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }

    private func resend() {
        code = ""
        errorMessage = nil
        resendToken += 1
        Task { try? await session.sendCode(to: phone) }
    }
}

private struct NameStep: View {
    var onDone: (String) -> Void
    @State private var name = ""

    private var trimmed: String { name.trimmingCharacters(in: .whitespaces) }

    var body: some View {
        StepScaffold(
            title: "Full name",
            subtitle: "So your teammates know who's coming.",
            progress: 0.9,
            canContinue: trimmed.count >= 2,
            onNext: { onDone(trimmed) }
        ) {
            UnderlineField(placeholder: "Alex Rivera", text: $name)
                .textContentType(.name)
                .textInputAutocapitalization(.words)
                .submitLabel(.continue)
                .onSubmit { if trimmed.count >= 2 { onDone(trimmed) } }
        }
    }
}

private struct WelcomeDoneStep: View {
    let name: String
    @Environment(Session.self) private var session
    @Environment(AppRouter.self) private var router

    private var firstName: String { name.split(separator: " ").first.map(String.init) ?? name }

    var body: some View {
        VStack(spacing: Space.md) {
            Spacer()
            Text("Welcome,\n\(firstName)!")
                .font(.system(size: 40, weight: .bold))
                .multilineTextAlignment(.center)
            Text("Find a game near you tonight, or join a club with its code.")
                .font(.title3)
                .foregroundStyle(.white.opacity(0.8))
                .multilineTextAlignment(.center)
            Spacer().frame(height: Space.xl)
        }
        .foregroundStyle(.white)
        .padding(.horizontal, Space.xl)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background { HeroBackground() }
        .navigationBarBackButtonHidden()
        .actionBar {
            SecondaryButton(title: "Join a club") {
                router.selectedTab = .clubs
                session.completeProfile(name: name)
            }
            PrimaryButton(title: "Explore") {
                router.selectedTab = .explore
                session.completeProfile(name: name)
            }
        }
        .preferredColorScheme(.dark)
    }
}

enum PhoneFormat {
    /// Formats progressively as "(479) 555-0123".
    static func us(_ raw: String) -> String {
        let digits = Array(raw.filter(\.isNumber).prefix(10))
        let area = String(digits.prefix(3))
        let prefix = String(digits.dropFirst(3).prefix(3))
        let line = String(digits.dropFirst(6))
        switch digits.count {
        case 0: return ""
        case 1...3: return "(\(area)"
        case 4...6: return "(\(area)) \(prefix)"
        default: return "(\(area)) \(prefix)-\(line)"
        }
    }
}
