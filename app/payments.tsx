import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, shadow, space, type } from '../src/constants/theme';
import { useStore } from '../src/state/store';
import { confirmDestructive, dollars } from '../src/lib/format';
import { type CardBrand, type PaymentMethod } from '../src/state/models';
import { SectionHeader, card } from '../src/ui/Display';
import { Screen } from '../src/ui/Screen';
import { OptionRow, OptionSheet } from '../src/create/ui';

// ─── Brand helpers ─────────────────────────────────────────────────────────────

const brandLabel: Record<CardBrand, string> = {
  visa:       'Visa',
  mastercard: 'MC',
  amex:       'Amex',
  discover:   'Disc.',
  applepay:   'Apple Pay',
  googlepay:  'Google Pay',
};

const brandColor: Record<CardBrand, string> = {
  visa:       '#1A1F71',
  mastercard: '#EB001B',
  amex:       '#007BC1',
  discover:   '#FF6600',
  applepay:   '#000000',
  googlepay:  '#4285F4',
};

function detectBrand(digits: string): CardBrand {
  if (digits.startsWith('4')) return 'visa';
  if (digits.startsWith('5') || digits.startsWith('2')) return 'mastercard';
  if (digits.startsWith('3')) return 'amex';
  if (digits.startsWith('6')) return 'discover';
  return 'visa';
}

function formatExpiry(val: string) {
  const digits = val.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function formatCardNumber(val: string) {
  const digits = val.replace(/\D/g, '').slice(0, 16);
  return digits.match(/.{1,4}/g)?.join(' ') ?? digits;
}

// ─── Card badge ───────────────────────────────────────────────────────────────

function CardBadge({ brand }: { brand: CardBrand }) {
  const isWallet = brand === 'applepay' || brand === 'googlepay';
  return (
    <View style={[styles.brandBadge, { backgroundColor: isWallet ? '#000' : brandColor[brand] }]}>
      {isWallet ? (
        <MaterialCommunityIcons name={brand === 'applepay' ? 'apple' : 'google'} size={16} color="#fff" />
      ) : (
        <Text style={styles.brandText}>{brandLabel[brand]}</Text>
      )}
    </View>
  );
}

function methodLabel(m: PaymentMethod): string {
  if (m.brand === 'applepay') return 'Apple Pay';
  if (m.brand === 'googlepay') return 'Google Pay';
  return `${brandLabel[m.brand]} •••• ${m.last4}`;
}

function methodSub(m: PaymentMethod): string {
  if (m.expMonth && m.expYear) {
    return `Expires ${m.expMonth.toString().padStart(2, '0')}/${m.expYear.toString().slice(-2)}`;
  }
  return 'Digital wallet';
}

// ─── Add card sheet ───────────────────────────────────────────────────────────

function AddCardSheet({ onClose }: { onClose: () => void }) {
  const store = useStore();
  const [number, setNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [name, setName] = useState('');

  const digits = number.replace(/\D/g, '');
  const brand = detectBrand(digits);
  const expiryParts = expiry.replace('/', '');
  const month = parseInt(expiryParts.slice(0, 2), 10);
  const year = parseInt(`20${expiryParts.slice(2, 4)}`, 10);

  const canSave =
    digits.length === 16 &&
    expiry.length === 5 &&
    month >= 1 && month <= 12 &&
    cvc.length >= 3;

  const save = () => {
    if (!canSave) return;
    store.addPaymentMethod({ brand, last4: digits.slice(-4), expMonth: month, expYear: year });
    onClose();
  };

  return (
    <View style={styles.sheetOverlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <View style={styles.sheetHeader}>
          <Text style={type.title3}>Add a card</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={22} color={colors.label2} />
          </Pressable>
        </View>

        {/* Visual card preview */}
        <View style={styles.cardPreview}>
          <CardBadge brand={brand} />
          <Text style={styles.cardPreviewNumber}>
            {digits.length > 0
              ? digits.padEnd(16, '·').match(/.{1,4}/g)?.join('  ')
              : '····  ····  ····  ····'}
          </Text>
          <View style={styles.cardPreviewBottom}>
            <View>
              <Text style={styles.cardPreviewLabel}>CARDHOLDER</Text>
              <Text style={styles.cardPreviewValue}>{name || 'YOUR NAME'}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.cardPreviewLabel}>EXPIRES</Text>
              <Text style={styles.cardPreviewValue}>{expiry || 'MM/YY'}</Text>
            </View>
          </View>
        </View>

        {/* Inputs */}
        <View style={styles.inputGroup}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Card number"
              placeholderTextColor={colors.label3}
              keyboardType="number-pad"
              value={number}
              onChangeText={(t) => setNumber(formatCardNumber(t))}
              maxLength={19}
            />
          </View>
          <View style={styles.inputDivider} />
          <View style={styles.inputHalf}>
            <TextInput
              style={[styles.input, styles.inputHalfField]}
              placeholder="MM/YY"
              placeholderTextColor={colors.label3}
              keyboardType="number-pad"
              value={expiry}
              onChangeText={(t) => setExpiry(formatExpiry(t))}
              maxLength={5}
            />
            <View style={styles.inputHalfDivider} />
            <TextInput
              style={[styles.input, styles.inputHalfField]}
              placeholder="CVC"
              placeholderTextColor={colors.label3}
              keyboardType="number-pad"
              value={cvc}
              onChangeText={(t) => setCvc(t.replace(/\D/g, '').slice(0, 4))}
              maxLength={4}
              secureTextEntry
            />
          </View>
          <View style={styles.inputDivider} />
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Name on card"
              placeholderTextColor={colors.label3}
              autoCapitalize="words"
              value={name}
              onChangeText={setName}
            />
          </View>
        </View>

        <Pressable
          onPress={save}
          style={({ pressed }) => [styles.saveBtn, !canSave && styles.saveBtnDisabled, pressed && { opacity: 0.8 }]}
        >
          <Text style={[styles.saveBtnText, !canSave && { color: colors.label3 }]}>Save card</Text>
        </Pressable>

        {Platform.OS !== 'web' && (
          <Pressable
            onPress={() => { store.addPaymentMethod({ brand: 'applepay' }); onClose(); }}
            style={({ pressed }) => [styles.walletBtn, pressed && { opacity: 0.8 }]}
          >
            <MaterialCommunityIcons name="apple" size={18} color={colors.label} />
            <Text style={type.subhead}>Add Apple Pay</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

// ─── Change method sheet ──────────────────────────────────────────────────────

function ChangeMethodSheet({
  paymentId,
  currentMethodId,
  methods,
  onClose,
}: {
  paymentId: string;
  currentMethodId: string;
  methods: PaymentMethod[];
  onClose: () => void;
}) {
  const store = useStore();
  return (
    <View style={styles.sheetOverlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <View style={styles.sheetHeader}>
          <Text style={type.title3}>Pay with</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={22} color={colors.label2} />
          </Pressable>
        </View>
        <View style={styles.methodList}>
          {methods.map((m, i) => {
            const active = m.id === currentMethodId;
            return (
              <Pressable
                key={m.id}
                style={({ pressed }) => [
                  styles.methodRow,
                  i > 0 && styles.methodDivider,
                  pressed && { backgroundColor: colors.fill },
                ]}
                onPress={() => { store.setMembershipMethod(paymentId, m.id); onClose(); }}
              >
                <CardBadge brand={m.brand} />
                <View style={styles.methodText}>
                  <Text style={type.subhead}>{methodLabel(m)}</Text>
                  <Text style={[type.footnote, { color: colors.label2 }]}>{methodSub(m)}</Text>
                </View>
                {active && <Ionicons name="checkmark-circle" size={22} color={colors.brand} />}
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

/** Payments: saved cards + active memberships with per-membership card picker. */
export default function PaymentsScreen() {
  const store = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [changingPaymentId, setChangingPaymentId] = useState<string | null>(null);
  const [menuMethodId, setMenuMethodId] = useState<string | null>(null);
  const menuMethod = menuMethodId ? (store.paymentMethods.find((m) => m.id === menuMethodId) ?? null) : null;

  const changingPayment = changingPaymentId
    ? store.payments.find((p) => p.id === changingPaymentId)
    : null;

  return (
    <Screen
      title="Payments"
      trailing={
        <Pressable onPress={() => setShowAdd(true)} hitSlop={8} accessibilityLabel="Add payment method">
          <Ionicons name="add" size={26} color={colors.label} />
        </Pressable>
      }
    >
      {/* ── Payment methods ─────────────────────────────────────── */}
      <SectionHeader title="Payment methods" />
      {store.paymentMethods.length === 0 ? (
        <Pressable onPress={() => setShowAdd(true)} style={styles.emptyCard}>
          <Ionicons name="card-outline" size={28} color={colors.label3} />
          <Text style={[type.subhead, { color: colors.label2, textAlign: 'center' }]}>
            No saved cards yet.{'\n'}Tap + to add one.
          </Text>
        </Pressable>
      ) : (
        <View style={card}>
          {store.paymentMethods.map((m, i) => (
            <View key={m.id} style={[styles.row, i > 0 && styles.divider]}>
              <CardBadge brand={m.brand} />
              <View style={styles.flex}>
                <Text style={type.subhead}>{methodLabel(m)}</Text>
                <Text style={[type.footnote, { color: colors.label2 }]}>{methodSub(m)}</Text>
              </View>
              {m.isDefault && (
                <View style={styles.defaultPill}>
                  <Text style={styles.defaultText}>Default</Text>
                </View>
              )}
              <Pressable onPress={() => setMenuMethodId(m.id)} hitSlop={8} accessibilityLabel="Card options">
                <Ionicons name="ellipsis-horizontal" size={20} color={colors.label2} />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {/* ── Memberships ─────────────────────────────────────────── */}
      <View style={{ marginTop: space.xl }}><SectionHeader title="Memberships" /></View>
      {store.payments.length === 0 ? (
        <Text style={[type.footnote, styles.secondary]}>Clubs you join will show up here.</Text>
      ) : (
        <View style={card}>
          {store.payments.map((payment, index) => {
            const method = store.paymentMethods.find((m) => m.id === payment.methodId);
            return (
              <View key={payment.id} style={[styles.row, index > 0 && styles.divider]}>
                <View style={styles.flex}>
                  <Text style={type.headline}>{payment.clubName}</Text>
                  <Pressable
                    onPress={() => setChangingPaymentId(payment.id)}
                    hitSlop={4}
                    style={({ pressed }) => [styles.changeMethodRow, pressed && { opacity: 0.65 }]}
                  >
                    {method ? (
                      <>
                        <CardBadge brand={method.brand} />
                        <Text style={[type.footnote, { color: colors.label2 }]}>
                          {methodLabel(method)}
                        </Text>
                      </>
                    ) : (
                      <Text style={[type.footnote, { color: colors.live }]}>No card — tap to add</Text>
                    )}
                    <Ionicons name="chevron-forward" size={12} color={colors.label3} />
                  </Pressable>
                </View>
                <View style={styles.trailing}>
                  <Text style={[type.headline, { fontVariant: ['tabular-nums'] }]}>
                    {dollars(payment.amount)}/mo
                  </Text>
                  <Pressable
                    onPress={() =>
                      confirmDestructive(
                        `Cancel ${payment.clubName} membership?`,
                        "You'll keep access until the end of this billing period.",
                        'Cancel membership',
                        () => store.cancelPayment(payment.id),
                      )
                    }
                    hitSlop={8}
                  >
                    <Text style={[type.footnote, { color: colors.live }]}>Cancel</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {showAdd && <AddCardSheet onClose={() => setShowAdd(false)} />}
      {changingPayment && (
        <ChangeMethodSheet
          paymentId={changingPayment.id}
          currentMethodId={changingPayment.methodId}
          methods={store.paymentMethods}
          onClose={() => setChangingPaymentId(null)}
        />
      )}
      <OptionSheet visible={!!menuMethodId} onClose={() => setMenuMethodId(null)}>
        {menuMethod && !menuMethod.isDefault && (
          <OptionRow
            title="Set as default"
            leading={<Ionicons name="star-outline" size={20} color={colors.label} />}
            onPress={() => { store.setDefaultPaymentMethod(menuMethodId!); setMenuMethodId(null); }}
          />
        )}
        <OptionRow
          title="Remove"
          destructive
          leading={<Ionicons name="trash-outline" size={20} color={colors.live} />}
          onPress={() => {
            const id = menuMethodId!;
            setMenuMethodId(null);
            confirmDestructive(
              'Remove this card?',
              'Any memberships using it will need a new payment method.',
              'Remove',
              () => store.removePaymentMethod(id),
            );
          }}
        />
      </OptionSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator },
  flex: { flex: 1, gap: 4 },
  trailing: { alignItems: 'flex-end', gap: space.xs },
  secondary: { color: colors.label2 },
  changeMethodRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  defaultPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
    backgroundColor: colors.brandSoft,
  },
  defaultText: { ...type.caption, color: colors.brand, fontWeight: '600' },
  brandBadge: {
    width: 38,
    height: 24,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
  emptyCard: {
    ...card,
    padding: space.xl,
    alignItems: 'center',
    gap: space.md,
  },
  methodList: { paddingHorizontal: space.lg, paddingBottom: space.xl },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
  },
  methodDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator },
  methodText: { flex: 1, gap: 2 },
  // ─── Add card sheet ─────────────────────────────────────────────────────────
  sheetOverlay: {
    position: 'absolute',
    inset: 0,
    zIndex: 200,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: space.sm,
    paddingBottom: space.xl,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.separator,
    marginBottom: space.md,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingBottom: space.lg,
  },
  cardPreview: {
    marginHorizontal: space.lg,
    marginBottom: space.lg,
    padding: space.lg,
    borderRadius: 16,
    backgroundColor: '#1C1A16',
    gap: space.md,
    aspectRatio: 1.6,
    justifyContent: 'space-between',
  },
  cardPreviewNumber: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 3,
    fontVariant: ['tabular-nums'],
  },
  cardPreviewBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  cardPreviewLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 9, letterSpacing: 1, marginBottom: 2 },
  cardPreviewValue: { color: '#fff', fontSize: 13, fontWeight: '600', letterSpacing: 0.5 },
  inputGroup: {
    marginHorizontal: space.lg,
    marginBottom: space.lg,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.separator,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  inputRow: { paddingHorizontal: space.lg, paddingVertical: 14 },
  inputHalf: { flexDirection: 'row' },
  inputHalfField: { flex: 1, paddingHorizontal: space.lg, paddingVertical: 14 },
  inputHalfDivider: { width: StyleSheet.hairlineWidth, backgroundColor: colors.separator },
  inputDivider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.separator },
  input: { ...type.body, color: colors.label },
  saveBtn: {
    marginHorizontal: space.lg,
    paddingVertical: 16,
    borderRadius: radius.full,
    backgroundColor: colors.brand,
    alignItems: 'center',
    marginBottom: space.md,
  },
  saveBtnDisabled: { backgroundColor: colors.fill2 },
  saveBtnText: { ...type.subhead, color: colors.white, fontWeight: '700' },
  walletBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    paddingVertical: 14,
    marginHorizontal: space.lg,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.separator,
  },
});
