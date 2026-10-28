import { Tabs } from 'expo-router';
import { TabBar } from '../../src/ui/TabBar';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen name="explore" />
      <Tabs.Screen name="clubs" />
      <Tabs.Screen name="schedule" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
