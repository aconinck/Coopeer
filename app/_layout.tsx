import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { colors } from '../src/constants/theme';
import { SessionProvider, useSession } from '../src/state/session';
import { StoreProvider } from '../src/state/store';
import { SheetProvider } from '../src/ui/Sheet';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SessionProvider>
        <StoreProvider>
          <SheetProvider>
            <StatusBar style="dark" />
            <AppStack />
          </SheetProvider>
        </StoreProvider>
      </SessionProvider>
    </GestureHandlerRootView>
  );
}

// The app is only usable with an account: every screen except the welcome screen and
// phone login is guarded, including deep links. Signed-out users always land on /welcome.
// Places, games and clubs tapped in-app open in the global bottom sheet (SheetProvider);
// their route files only serve deep links, so they present as plain modals.
function AppStack() {
  const session = useSession();
  if (!session.isReady) return null;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="auth" options={{ presentation: 'fullScreenModal' }} />

      <Stack.Protected guard={!session.isSignedIn}>
        <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
      </Stack.Protected>

      <Stack.Protected guard={session.isSignedIn}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="place/[id]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="game/[id]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="club/[id]" />
        <Stack.Screen name="attendees/[id]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="player/[id]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="join/index" options={{ presentation: 'modal' }} />
        <Stack.Screen name="join/[code]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="invite/[id]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="create/club" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="create/game" options={{ presentation: 'modal' }} />
        <Stack.Screen name="personal-info" />
        <Stack.Screen name="payments" />
        <Stack.Screen name="how-it-works" />
      </Stack.Protected>
    </Stack>
  );
}
