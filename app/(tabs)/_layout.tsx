import { Tabs } from 'expo-router';
import { TabBar } from '../../src/ui/TabBar';
import { TourProvider } from '../../src/tour/Tour';

export default function TabsLayout() {
  return (
    <TourProvider>
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen name="map" />
      <Tabs.Screen name="clubs" />
      <Tabs.Screen name="explore" />
      <Tabs.Screen name="schedule" />
      <Tabs.Screen name="profile" />
    </Tabs>
    </TourProvider>
  );
}
