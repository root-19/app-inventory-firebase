import { Drawer } from 'expo-router/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';

export default function Layout() {
  const colorScheme = useColorScheme();

  return (
    <Drawer
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#0f012a', // white header
        },
        headerTitleStyle: {
          color: '#0f172a', // dark title
        },
        drawerStyle: {
          backgroundColor: '#ffffff', // white drawer
        },
        drawerLabelStyle: {
          color: '#0f172a', // dark text
        },
        drawerActiveTintColor: '#16a34a', // green active icon/text
        drawerInactiveTintColor: '#0f172a', // dark inactive icons/text
      }}
    >
      <Drawer.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          drawerIcon: ({ color }) => <Ionicons name="grid-outline" size={22} color={color} />,
        }}
      />

      <Drawer.Screen
        name="rice"
        options={{
          title: 'Rice Inventory',
          drawerIcon: ({ color }) => <Ionicons name="bag-outline" size={22} color={color} />,
        }}
      />

      <Drawer.Screen
        name="utang"
        options={{
          title: 'Utang',
          drawerIcon: ({ color }) => <Ionicons name="cash-outline" size={22} color={color} />,
        }}
      />
    </Drawer>
  );
}
