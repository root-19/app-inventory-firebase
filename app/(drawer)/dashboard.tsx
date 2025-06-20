import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { Drawer } from 'expo-router/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { db } from '../../auth/firebaseConfig';
import { PieChart } from 'react-native-gifted-charts';

const screenWidth = Dimensions.get('window').width;

function ManualBarChart({ labels, data }: { labels: string[]; data: number[] }) {
  const chartHeight = 140;
  const max = Math.max(...data, 1);
  return (
    <View style={{ alignItems: 'center', marginVertical: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: chartHeight, justifyContent: 'center' }}>
        {data.map((value, idx) => (
          <View key={labels[idx]} style={{ alignItems: 'center', marginHorizontal: 6 }}>
            <Text style={{ fontSize: 12, color: '#0ea5e9', marginBottom: 2 }}>{value}</Text>
            <View
              style={{
                width: 24,
                height: chartHeight * (value / max),
                backgroundColor: '#0ea5e9',
                borderRadius: 6,
                marginBottom: 4,
              }}
            />
            <Text style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>{labels[idx]}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function RiceDashboardBox() {
  const [loading, setLoading] = useState(true);
  const [totalSacks, setTotalSacks] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [monthlyData, setMonthlyData] = useState<{ labels: string[]; data: number[] }>({ labels: [], data: [] });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const snapshot = await db.collection('riceInventory').get();
        let sacks = 0;
        let priceSum = 0;
        const monthly: Record<string, number> = {};
        snapshot.forEach(doc => {
          const data = doc.data();
          sacks += Number(data.pieces) || 0;
          priceSum += Number(data.price) || 0;
          if (data.createdAt) {
            const date = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            // Only count data for the current year
            const currentYear = new Date().getFullYear();
            if (year === currentYear) {
              const key = month;
              if (!monthly[key]) monthly[key] = 0;
              monthly[key] += Number(data.pieces) || 0;
            }
          }
        });
        // Always show all 12 months for the current year
        const allMonths = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
        setMonthlyData({
          labels: allMonths,
          data: allMonths.map(m => monthly[m] || 0),
        });
        setTotalSacks(sacks);
        setTotalPrice(priceSum);
      } catch (err) {
        // handle error
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <ActivityIndicator style={{ margin: 24 }} />;

  // Prepare data for PieChart
  const pieData = monthlyData.labels.map((label, idx) => ({
    value: monthlyData.data[idx],
    label,
    text: `${label}: ${monthlyData.data[idx]}`,
    color: [
      '#0ea5e9', '#16a34a', '#f59e42', '#e11d48', '#6366f1', '#fbbf24', '#10b981', '#f472b6', '#f87171', '#a3e635', '#facc15', '#818cf8'
    ][idx % 12],
  }));

  return (
    <View style={styles.dashboardBox}>
      <Text style={styles.dashboardTitle}>Rice Inventory Summary</Text>
      <View style={styles.totalsRow}>
        <View style={styles.totalsBox}>
          <Ionicons name="cube-outline" size={28} color="#0ea5e9" style={styles.icon} />
          <Text style={styles.totalsLabel}>Total Sacks</Text>
          <Text style={styles.totalsValue}>{totalSacks}</Text>
        </View>
        <View style={styles.totalsBox}>
          <Ionicons name="cash-outline" size={28} color="#0ea5e9" style={styles.icon} />
          <Text style={styles.totalsLabel}>Total Price</Text>
          <Text style={styles.totalsValue}>₱{totalPrice}</Text>
        </View>
      </View>
      <Text style={styles.chartTitle}>Sacks per Month (Pie Chart)</Text>
      <View style={{ alignItems: 'center', marginVertical: 8 }}>
        <PieChart
          data={pieData}
          donut
          showText
          textColor="#0f172a"
          textSize={12}
          radius={80}
          innerRadius={45}
          focusOnPress
          showValuesAsLabels
          labelsPosition="outward"
          centerLabelComponent={() => (
            <Text style={{ fontWeight: 'bold', color: '#0f172a', fontSize: 14 }}>Monthly</Text>
          )}
        />
      </View>
    </View>
  );
}

export default function Layout() {
  const colorScheme = useColorScheme();

  return (
    <>
      <RiceDashboardBox />
      <Drawer
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: '#ffffff', // white header
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
          name="rice-inventory"
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
    </>
  );
}

const styles = StyleSheet.create({
  dashboardBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    margin: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  dashboardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
    marginTop: 12,
    marginBottom: 2,
    textAlign: 'center',
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    gap: 16,
  },
  totalsBox: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 12,
    padding: 18,
    width: 140,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  icon: {
    marginBottom: 6,
  },
  totalsLabel: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 2,
  },
  totalsValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0ea5e9',
  },
});
