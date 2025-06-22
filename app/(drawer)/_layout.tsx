import { Ionicons } from '@expo/vector-icons';
import { Drawer } from 'expo-router/drawer';
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
          drawerIcon: ({ color }) => <Ionicons name="home-outline" size={22} color={color} />,
        }}
      />

      <Drawer.Screen
        name="rice"
        options={{
          title: 'Add Rice',
          drawerIcon: ({ color }) => <Ionicons name="add-circle-outline" size={22} color={color} />,
        }}
        
      />

       <Drawer.Screen
        name="riceInventory"
        options={{
          title: 'Rice Inventory',
          drawerIcon: ({ color }) => <Ionicons name="basket-outline" size={22} color={color} />,
        }}
        
      />

      <Drawer.Screen
        name="profit"
        options={{
          title: 'Profit',
          drawerIcon: ({ color }) => <Ionicons name="trending-up-outline" size={22} color={color} />,
        }}
      />

      <Drawer.Screen
        name="utang"
        options={{
          title: 'Add Loans',
          drawerIcon: ({ color }) => <Ionicons name="card-outline" size={22} color={color} />,
        }}
      />

      <Drawer.Screen
        name="utangCollection"
        options={{
          title: 'Loan Collections',
          drawerIcon: ({ color }) => <Ionicons name="wallet-outline" size={22} color={color} />,
        }}
      />

      <Drawer.Screen
        name="utangInventory"
        options={{
          title: 'Loan Inventory',
          drawerIcon: ({ color }) => <Ionicons name="library-outline" size={22} color={color} />,
        }}
      />
    </Drawer>
  );
}
