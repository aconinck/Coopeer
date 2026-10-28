import { StyleSheet, Text, View } from 'react-native';
import { colors, space, type } from '../src/constants/theme';
import { useStore } from '../src/state/store';
import { confirmDestructive, dollars } from '../src/lib/format';
import { TextButton } from '../src/ui/Buttons';
import { SectionHeader, card } from '../src/ui/Display';
import { Screen } from '../src/ui/Screen';

/** Figma "Pagamento": the clubs you pay for and how. */
export default function PaymentsScreen() {
  const store = useStore();

  return (
    <Screen title="Payments">
      <SectionHeader title="Memberships" />
      {store.payments.length === 0 ? (
        <Text style={[type.footnote, styles.secondary]}>Clubs you join will show up here.</Text>
      ) : (
        <View style={card}>
          {store.payments.map((payment, index) => (
            <View key={payment.id} style={[styles.row, index > 0 && styles.divider]}>
              <View style={styles.flex}>
                <Text style={type.headline}>{payment.clubName}</Text>
                <Text style={[type.subhead, styles.secondary]}>{payment.method}</Text>
              </View>
              <View style={styles.trailing}>
                <Text style={[type.headline, { fontVariant: ['tabular-nums'] }]}>{dollars(payment.amount)}/mo</Text>
                <TextButton
                  title="Manage"
                  onPress={() =>
                    confirmDestructive(
                      `Cancel ${payment.clubName} membership?`,
                      "You'll keep access until the end of this billing period.",
                      'Cancel membership',
                      () => store.cancelPayment(payment.id),
                    )
                  }
                />
              </View>
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator },
  flex: { flex: 1, gap: 2 },
  trailing: { alignItems: 'flex-end', gap: space.xs },
  secondary: { color: colors.label2 },
});
