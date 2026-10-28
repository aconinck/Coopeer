import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { colors } from '../src/constants/theme';
import { SessionProvider } from '../src/state/session';
import { StoreProvider } from '../src/state/store';
import { SheetProvider } from '../src/ui/Sheet';

// Places, games and clubs tapped in-app open in the global bottom sheet (SheetProvider).
// Their route files only serve deep links, so they present as plain modals.
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SessionProvider>
        <StoreProvider>
          <SheetProvider>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
              <Stack.Screen name="auth" options={{ presentation: 'fullScreenModal' }} />
              <Stack.Screen name="place/[id]" options={{ presentation: 'modal' }} />
              <Stack.Screen name="game/[id]" options={{ presentation: 'modal' }} />
              <Stack.Screen name="club/[id]" />
              <Stack.Screen name="attendees/[id]" options={{ presentation: 'modal' }} />
              <Stack.Screen name="join/index" options={{ presentation: 'modal' }} />
              <Stack.Screen name="join/[code]" options={{ presentation: 'modal' }} />
              <Stack.Screen name="invite/[id]" options={{ presentation: 'modal' }} />
              <Stack.Screen name="create/club" options={{ presentation: 'fullScreenModal' }} />
              <Stack.Screen name="create/game" options={{ presentation: 'modal' }} />
              <Stack.Screen name="personal-info" />
              <Stack.Screen name="payments" />
              <Stack.Screen name="how-it-works" />
            </Stack>
          </SheetProvider>
        </StoreProvider>
      </SessionProvider>
    </GestureHandlerRootView>
  );
}
