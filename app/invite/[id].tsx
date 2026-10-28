import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { colors, radius, space, type } from '../../src/constants/theme';
import { shareText } from '../../src/lib/format';
import { formatCode, inviteUrl } from '../../src/state/models';
import { useStore } from '../../src/state/store';
import { ActionBar, PrimaryButton } from '../../src/ui/Buttons';
import { Screen } from '../../src/ui/Screen';

/** Lets any member share the club: QR for in person, link + code for chat. */
export default function Invite() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const club = useStore().club(id ?? '');

  if (!club) {
    return (
      <Screen variant="sheet" title="Invite">
        <Text style={[type.body, { color: colors.label2 }]}>This club no longer exists.</Text>
      </Screen>
    );
  }

  return (
    <Screen
      variant="sheet"
      title={`Invite to ${club.name}`}
      footer={
        <ActionBar>
          <PrimaryButton
            title="Share invite"
            icon="share-outline"
            onPress={() => shareText(`Join ${club.name} on Coopeer — code ${formatCode(club.code)}`, inviteUrl(club))}
          />
        </ActionBar>
      }
    >
      <View style={styles.body}>
        <View style={styles.qrCard} accessibilityLabel={`QR code to join ${club.name}`}>
          <QRCode value={inviteUrl(club)} size={220} color={colors.black} backgroundColor={colors.white} />
        </View>
        <View style={{ alignItems: 'center', gap: space.xs }}>
          <Text style={[type.footnote, { color: colors.label2 }]}>Team code</Text>
          <Text selectable style={[type.code, { color: colors.brand, fontVariant: ['tabular-nums'] }]}>
            {formatCode(club.code)}
          </Text>
        </View>
        <Text style={[type.footnote, styles.help]}>
          Friends can scan this with their phone camera, or tap + in Clubs and enter the code.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { alignItems: 'center', gap: space.lg, paddingTop: space.md },
  qrCard: { padding: space.lg, backgroundColor: colors.white, borderRadius: radius.card },
  help: { color: colors.label2, textAlign: 'center', paddingHorizontal: space.lg },
});
