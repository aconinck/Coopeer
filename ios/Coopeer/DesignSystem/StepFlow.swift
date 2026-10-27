import SwiftUI

/// Layout for one step of a flow (login, sign up, team code), matching the Figma:
/// progress bar in the nav bar, big title, underline input, round next button.
struct StepScaffold<Content: View>: View {
    let title: String
    var subtitle: String?
    let progress: Double
    var canContinue: Bool
    var isLoading = false
    var onNext: () -> Void
    @ViewBuilder var content: Content

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Space.xl) {
                VStack(alignment: .leading, spacing: Space.sm) {
                    Text(title)
                        .font(.largeTitle.bold())
                    if let subtitle {
                        Text(subtitle)
                            .font(.body)
                            .foregroundStyle(.secondary)
                    }
                }
                content
            }
            .padding(.horizontal, Space.xl)
            .padding(.top, Space.lg)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .scrollDismissesKeyboard(.never)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .principal) {
                StepProgress(value: progress)
            }
        }
        .safeAreaInset(edge: .bottom) {
            HStack {
                Spacer()
                NextButton(isEnabled: canContinue, isLoading: isLoading, action: onNext)
            }
            .padding(.horizontal, Space.xl)
            .padding(.bottom, Space.md)
        }
    }
}

struct StepProgress: View {
    let value: Double

    var body: some View {
        GeometryReader { proxy in
            ZStack(alignment: .leading) {
                Capsule().fill(Color(.systemFill))
                Capsule().fill(.primary).frame(width: proxy.size.width * min(max(value, 0), 1))
            }
        }
        .frame(width: 200, height: 3)
        .animation(.snappy, value: value)
        .accessibilityElement()
        .accessibilityLabel("Step progress")
        .accessibilityValue("\(Int(value * 100)) percent")
    }
}

/// Underline-style field from the Figma (no box border).
struct UnderlineField<Leading: View>: View {
    let placeholder: String
    @Binding var text: String
    var isError = false
    @ViewBuilder var leading: Leading
    @FocusState private var isFocused: Bool

    var body: some View {
        VStack(spacing: Space.sm) {
            HStack(spacing: Space.md) {
                leading
                TextField(placeholder, text: $text)
                    .focused($isFocused)
                    .onAppear { isFocused = true }
            }
            .font(.title2.weight(.medium))
            Rectangle()
                .fill(isError ? Color.live : Color.primary.opacity(0.15))
                .frame(height: 1)
        }
    }
}

extension UnderlineField where Leading == EmptyView {
    init(placeholder: String, text: Binding<String>, isError: Bool = false) {
        self.init(placeholder: placeholder, text: text, isError: isError) { EmptyView() }
    }
}

/// Big grouped digits ("12 35 56 54"). Typed digits turn orange, red on error.
struct CodeField: View {
    @Binding var code: String
    let length: Int
    var groupSize = 2
    var isError = false
    var contentType: UITextContentType?
    @FocusState private var isFocused: Bool

    var body: some View {
        VStack(spacing: Space.sm) {
            ZStack {
                TextField("", text: $code)
                    .keyboardType(.numberPad)
                    .textContentType(contentType)
                    .focused($isFocused)
                    .foregroundStyle(.clear)
                    .tint(.clear)
                    .accessibilityLabel("Code")
                Text(display)
                    .font(.system(size: 36, weight: .semibold, design: .rounded))
                    .monospacedDigit()
                    .allowsHitTesting(false)
            }
            Rectangle()
                .fill(isError ? Color.live : Color.primary.opacity(0.15))
                .frame(height: 1)
        }
        .contentShape(.rect)
        .onTapGesture { isFocused = true }
        .onAppear { isFocused = true }
        .onChange(of: code) { _, newValue in
            let digits = String(newValue.filter(\.isNumber).prefix(length))
            if digits != newValue { code = digits }
        }
        .sensoryFeedback(.error, trigger: isError) { _, new in new }
    }

    private var display: AttributedString {
        let typed = Array(code)
        var result = AttributedString()
        for index in 0..<length {
            if index > 0, index % groupSize == 0 { result += AttributedString(" ") }
            let isTyped = index < typed.count
            var digit = AttributedString(isTyped ? String(typed[index]) : "0")
            let color: Color = isTyped ? (isError ? .live : .brand) : Color(.systemGray3)
            digit.foregroundColor = color
            result += digit
        }
        return result
    }
}
