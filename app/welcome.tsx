import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, space, type } from '../src/constants/theme';
import { useSession } from '../src/state/session';
import { ActionBar, PrimaryButton, SecondaryButton } from '../src/ui/Buttons';
import { HeroBackground, Logo } from '../src/ui/Hero';

export default function Welcome() {
  const session = useSession();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <HeroBackground />
      <View style={[styles.content, { paddingTop: insets.top + space.xl }]}>
        <Logo size={88} />
        <View style={{ flex: 1 }} />
        <Text style={[type.hero, styles.white]}>Discover a{'\n'}new world!</Text>
        <Text style={[type.title3, styles.subtitle]}>
          Don&apos;t play alone. Find a game nearby tonight, or a club that plays every week.
        </Text>
      </View>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.md) }]}>
        <ActionBar>
          <SecondaryButton
            title="Look around"
            onPress={() => {
              session.continueAsGuest();
              router.replace('/explore');
            }}
          />
          <PrimaryButton title="Get started" onPress={() => router.push('/auth?from=welcome')} />
        </ActionBar>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.heroDark },
  content: { flex: 1, paddingHorizontal: space.xl, gap: space.md, paddingBottom: space.xl },
  white: { color: colors.white },
  subtitle: { color: colors.white, opacity: 0.8, fontWeight: '400' },
  footer: { paddingHorizontal: space.md },
});
