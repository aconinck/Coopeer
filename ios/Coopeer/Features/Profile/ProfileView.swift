import SwiftUI

/// Figma "Perfil": who you are, payments, and sign out.
struct ProfileView: View {
    @Environment(AppStore.self) private var store
    @Environment(Session.self) private var session
    @Environment(AppRouter.self) private var router
    @State private var confirmsSignOut = false

    var body: some View {
        NavigationStack {
            List {
                Section {
                    header
                }
                .listRowBackground(Color.clear)
                .listRowInsets(EdgeInsets())

                if session.isSignedIn {
                    Section {
                        NavigationLink {
                            PersonalInfoView()
                        } label: {
                            Label("Personal info", systemImage: "person.text.rectangle")
                        }
                        NavigationLink {
                            PaymentsView()
                        } label: {
                            Label("Payments", systemImage: "creditcard")
                        }
                    }
                }

                Section {
                    NavigationLink {
                        ScrollView { GamesVsClubsCard().padding(Space.lg) }
                            .background(Color(.systemGroupedBackground))
                            .navigationTitle("How Coopeer works")
                    } label: {
                        Label("How Coopeer works", systemImage: "questionmark.circle")
                    }
                }

                if session.isSignedIn {
                    Section {
                        Button("Sign out", role: .destructive) { confirmsSignOut = true }
                    }
                }
            }
            .navigationTitle("Profile")
            .confirmationDialog("Sign out of Coopeer?", isPresented: $confirmsSignOut, titleVisibility: .visible) {
                Button("Sign out", role: .destructive) { session.signOut() }
            }
        }
    }

    @ViewBuilder
    private var header: some View {
        VStack(spacing: Space.md) {
            if let user = session.user {
                Avatar(member: Member(id: user.id, name: user.name), size: 88)
                Text(user.name).font(.title2.bold())
                Text("\(store.myClubs.count) clubs · \(store.mySchedule.filter { $0.myRSVP == .going }.count) games coming up")
                    .font(.subheadline)
                    .foregroundStyle(.white.opacity(0.85))
            } else {
                Image(systemName: "person.crop.circle.fill")
                    .font(.system(size: 72))
                Text("You're browsing as a guest").font(.title3.bold())
                Button("Sign in with phone") { router.isAuthPresented = true }
                    .buttonStyle(.glass)
            }
        }
        .foregroundStyle(.white)
        .frame(maxWidth: .infinity)
        .padding(.vertical, Space.xl)
        .background(Color.brand.gradient, in: .rect(cornerRadius: Radius.card))
    }
}

struct PersonalInfoView: View {
    @Environment(Session.self) private var session
    @Environment(\.dismiss) private var dismiss
    @State private var name = ""

    private var trimmed: String { name.trimmingCharacters(in: .whitespaces) }

    var body: some View {
        Form {
            Section("Name") {
                TextField("Full name", text: $name)
                    .textContentType(.name)
                    .textInputAutocapitalization(.words)
            }
            Section {
                LabeledContent("Phone", value: session.user?.phone ?? "")
            } footer: {
                Text("Your phone number is how you sign in. No password needed.")
            }
        }
        .navigationTitle("Personal info")
        .onAppear { name = session.user?.name ?? "" }
        .actionBar {
            PrimaryButton(title: "Save") {
                session.updateName(trimmed)
                dismiss()
            }
            .disabled(trimmed.count < 2 || trimmed == session.user?.name)
        }
    }
}

/// Figma "Pagamento": the clubs you pay for and how.
struct PaymentsView: View {
    @Environment(AppStore.self) private var store
    @State private var cancelling: PaymentMethod?

    var body: some View {
        List {
            Section {
                ForEach(store.payments) { payment in
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(payment.clubName).font(.headline)
                            Text(payment.method).font(.subheadline).foregroundStyle(.secondary)
                        }
                        Spacer()
                        VStack(alignment: .trailing, spacing: 2) {
                            Text("\(payment.amount.dollars)/mo").font(.headline).monospacedDigit()
                            Button("Manage") { cancelling = payment }
                                .font(.subheadline)
                                .buttonStyle(.borderless)
                        }
                    }
                }
            } header: {
                Text("Memberships")
            } footer: {
                if store.payments.isEmpty {
                    Text("Clubs you join will show up here.")
                }
            }
        }
        .navigationTitle("Payments")
        .confirmationDialog(
            "Cancel \(cancelling?.clubName ?? "") membership?",
            isPresented: Binding(get: { cancelling != nil }, set: { if !$0 { cancelling = nil } }),
            titleVisibility: .visible,
            presenting: cancelling
        ) { payment in
            Button("Cancel membership", role: .destructive) {
                store.payments.removeAll { $0.id == payment.id }
            }
        } message: { _ in
            Text("You'll keep access until the end of this billing period.")
        }
    }
}
