import Foundation
import Observation

enum AuthError: LocalizedError {
    case invalidCode
    case network

    var errorDescription: String? {
        switch self {
        case .invalidCode: "That code didn't work. Check the text and try again."
        case .network: "Couldn't reach Coopeer. Check your connection."
        }
    }
}

enum VerifyResult {
    case existing(User)
    case new(userID: String)
}

// Swap MockAuthService for Firebase Phone Auth or Twilio Verify.
protocol AuthService {
    func sendCode(to phone: String) async throws
    func verify(phone: String, code: String) async throws -> VerifyResult
}

struct MockAuthService: AuthService {
    private let knownUsersKey = "mock.knownUsers"

    func sendCode(to phone: String) async throws {
        try await Task.sleep(for: .milliseconds(700))
    }

    // Any 6-digit code works except 000000, which simulates a wrong code.
    func verify(phone: String, code: String) async throws -> VerifyResult {
        try await Task.sleep(for: .milliseconds(600))
        guard code.count == 6, code != "000000" else { throw AuthError.invalidCode }
        let known = UserDefaults.standard.dictionary(forKey: knownUsersKey) as? [String: String] ?? [:]
        if let name = known[phone] {
            return .existing(User(id: phone, phone: phone, name: name))
        }
        return .new(userID: phone)
    }

    func remember(_ user: User) {
        var known = UserDefaults.standard.dictionary(forKey: knownUsersKey) as? [String: String] ?? [:]
        known[user.phone] = user.name
        UserDefaults.standard.set(known, forKey: knownUsersKey)
    }
}

@Observable
final class Session {
    private(set) var user: User?
    private(set) var isGuest: Bool
    private var pendingPhone: String?

    private let auth = MockAuthService()
    private let userKey = "session.user"
    private let guestKey = "session.guest"

    var isSignedIn: Bool { user != nil }
    var hasOnboarded: Bool { user != nil || isGuest }

    init() {
        let defaults = UserDefaults.standard
        if let data = defaults.data(forKey: userKey) {
            user = try? JSONDecoder().decode(User.self, from: data)
        }
        isGuest = defaults.bool(forKey: guestKey)
    }

    func sendCode(to phone: String) async throws {
        try await auth.sendCode(to: phone)
    }

    /// Returns true when the phone is new and we still need the person's name.
    func verify(phone: String, code: String) async throws -> Bool {
        switch try await auth.verify(phone: phone, code: code) {
        case .existing(let existing):
            signIn(existing)
            return false
        case .new:
            pendingPhone = phone
            return true
        }
    }

    func completeProfile(name: String) {
        guard let phone = pendingPhone else { return }
        let newUser = User(id: phone, phone: phone, name: name.trimmingCharacters(in: .whitespaces))
        auth.remember(newUser)
        signIn(newUser)
    }

    func updateName(_ name: String) {
        guard var current = user else { return }
        current.name = name.trimmingCharacters(in: .whitespaces)
        auth.remember(current)
        signIn(current)
    }

    func continueAsGuest() {
        isGuest = true
        UserDefaults.standard.set(true, forKey: guestKey)
    }

    func signOut() {
        user = nil
        isGuest = false
        pendingPhone = nil
        UserDefaults.standard.removeObject(forKey: userKey)
        UserDefaults.standard.set(false, forKey: guestKey)
    }

    private func signIn(_ newUser: User) {
        user = newUser
        pendingPhone = nil
        if let data = try? JSONEncoder().encode(newUser) {
            UserDefaults.standard.set(data, forKey: userKey)
        }
    }
}
