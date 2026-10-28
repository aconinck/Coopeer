import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { colors } from '../src/constants/theme';
import { SessionProvider } from '../src/state/session';
import { StoreProvider } from '../src/state/store';

const sheet = {
  presentation: 'formSheet',
  sheetGrabberVisible: true,
  sheetCornerRadius: 32,
} as const;

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SessionProvider>
        <StoreProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
            <Stack.Screen name="auth" options={{ presentation: 'fullScreenModal' }} />
            <Stack.Screen name="place/[id]" options={{ ...sheet, sheetAllowedDetents: [0.55, 1], sheetLargestUndimmedDetentIndex: 0 }} />
            <Stack.Screen name="game/[id]" options={{ presentation: 'modal' }} />
            <Stack.Screen name="club/[id]" />
            <Stack.Screen name="attendees/[id]" options={{ ...sheet, sheetAllowedDetents: [0.6, 1] }} />
            <Stack.Screen name="join/index" options={{ presentation: 'modal' }} />
            <Stack.Screen name="join/[code]" options={{ presentation: 'modal' }} />
            <Stack.Screen name="invite/[id]" options={{ presentation: 'modal' }} />
            <Stack.Screen name="personal-info" />
            <Stack.Screen name="payments" />
            <Stack.Screen name="how-it-works" />
          </Stack>
        </StoreProvider>
      </SessionProvider>
    </GestureHandlerRootView>
  );
}
