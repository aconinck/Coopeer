import Foundation
import Observation

enum AppTab: Hashable {
    case explore, clubs, schedule, profile
}

enum JoinEntry: Identifiable, Hashable {
    case scan
    case code(prefill: String?)

    var id: String {
        switch self {
        case .scan: "scan"
        case .code(let prefill): "code-\(prefill ?? "")"
        }
    }
}

@Observable
final class AppRouter {
    var selectedTab: AppTab = .explore
    /// Login presented from the root (welcome screen, profile, schedule). Inside sheets use `.authGate`.
    var isAuthPresented = false
    var joinEntry: JoinEntry?

    func handle(url: URL) {
        guard let code = TeamCode.extract(from: url.absoluteString) else { return }
        joinEntry = .code(prefill: code)
    }
}

enum TeamCode {
    static let length = 8

    /// Accepts "12355654", "12 35 56 54", coopeer://join/12355654 or https://coopeer.app/join/12355654.
    static func extract(from raw: String) -> String? {
        let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        let compact = trimmed.replacingOccurrences(of: " ", with: "")
        if compact.count == length, compact.allSatisfy(\.isNumber) { return compact }

        guard let url = URL(string: trimmed), url.scheme != nil else { return nil }
        var parts = url.pathComponents.filter { $0 != "/" }
        if url.scheme == "coopeer", let host = url.host() { parts.insert(host, at: 0) }
        guard let index = parts.firstIndex(of: "join"), index + 1 < parts.count else { return nil }
        let code = parts[index + 1].filter(\.isNumber)
        return code.count == length ? code : nil
    }
}
