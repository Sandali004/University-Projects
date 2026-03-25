import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function DashboardLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#3B82F6' },
        headerTintColor: '#fff',
        tabBarActiveTintColor: '#3B82F6',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Live Map',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="map-marker-radius" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="system"
        options={{
          title: 'System',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="bus-school" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
