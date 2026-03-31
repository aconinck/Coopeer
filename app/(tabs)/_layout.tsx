import { Tabs } from 'expo-router';

// Tabs are rendered without the default tab bar — we use our custom NavBar overlay
// in each screen. The tab navigator is still needed for routing.
export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}>
      <Tabs.Screen name="discover" />
      <Tabs.Screen name="teams" />
      <Tabs.Screen name="feed" />
      <Tabs.Screen name="ranking" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
