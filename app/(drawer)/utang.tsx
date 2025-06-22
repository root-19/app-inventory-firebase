import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { db } from '../../auth/firebaseConfig';

export default function Utang() {
  type UtangEntry = {
    id: string;
    pera: string;
    name: string;
    startDate: string;
    endDate: string;
  };
  const [pera, setPera] = useState('');
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [utangList, setUtangList] = useState<UtangEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalUtang, setTotalUtang] = useState(0);
  const [totalPerUser, setTotalPerUser] = useState<{ [key: string]: number }>({});
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  };

  const onStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };

  const onEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  const calculateTotals = (list: UtangEntry[]) => {
    let total = 0;
    const perUser: { [key: string]: number } = {};
    list.forEach(item => {
      const amount = parseFloat(item.pera) || 0;
      total += amount;
      if (!perUser[item.name]) perUser[item.name] = 0;
      perUser[item.name] += amount;
    });
    setTotalUtang(total);
    setTotalPerUser(perUser);
  };

  const fetchUtang = async () => {
    setLoading(true);
    try {
      const snapshot = await db.collection('utangCollection').orderBy('createdAt', 'desc').get();
      const data: UtangEntry[] = snapshot.docs.map(doc => ({
        id: doc.id,
        pera: doc.data().pera,
        name: doc.data().name,
        startDate: doc.data().startDate,
        endDate: doc.data().endDate,
      }));
      setUtangList(data);
      calculateTotals(data);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to fetch utang entries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUtang();
  }, []);

  const addUtang = async () => {
    if (!pera || !name) return;
    setLoading(true);
    try {
      await db.collection('utangCollection').add({
        pera,
        name,
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        createdAt: new Date(),
      });
      Alert.alert('Success', 'Utang entry added!');
      setPera('');
      setName('');
      setStartDate(new Date());
      setEndDate(new Date());
      fetchUtang();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add utang entry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.text}>Utang Collection Page</Text>
        <View style={styles.totalsRow}>
          <View style={styles.totalsBox}>
            <Ionicons name="cash-outline" size={28} color="#0ea5e9" style={styles.icon} />
            <Text style={styles.totalsLabel}>Total Utang</Text>
            <Text style={styles.totalsValue}>₱{totalUtang.toLocaleString()}</Text>
          </View>
          <View style={styles.totalsBox}>
            <Ionicons name="people-outline" size={28} color="#0ea5e9" style={styles.icon} />
            <Text style={styles.totalsLabel}>Total Users</Text>
            <Text style={styles.totalsValue}>{Object.keys(totalPerUser).length}</Text>
          </View>
        </View>
        <TextInput
          style={styles.input}
          placeholder="Name"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Pera (Amount)"
          value={pera}
          onChangeText={setPera}
          keyboardType="numeric"
        />
        <TouchableOpacity style={styles.dateInput} onPress={() => setShowStartDatePicker(true)}>
          <Text style={styles.dateText}>Start Date: {formatDate(startDate)}</Text>
          <Ionicons name="calendar-outline" size={20} color="#0ea5e9" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.dateInput} onPress={() => setShowEndDatePicker(true)}>
          <Text style={styles.dateText}>End Date: {formatDate(endDate)}</Text>
          <Ionicons name="calendar-outline" size={20} color="#0ea5e9" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={addUtang} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Saving...' : 'Add Utang'}</Text>
        </TouchableOpacity>
        {showStartDatePicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display="default"
            onChange={onStartDateChange}
          />
        )}
        {showEndDatePicker && (
          <DateTimePicker
            value={endDate}
            mode="date"
            display="default"
            onChange={onEndDateChange}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 24,
    marginTop: 16,
    backgroundColor: '#fff',
  },
  text: { fontSize: 20, fontWeight: 'bold', marginBottom: 24 },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
  },
  totalsBox: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 12,
    padding: 18,
    width: 170,
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0ea5e9',
  },
  input: {
    width: '100%',
    maxWidth: 300,
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    padding: 14,
    borderRadius: 12,
    marginBottom: 18,
    fontSize: 16,
    color: '#0f172a',
  },
  dateInput: {
    width: '100%',
    maxWidth: 300,
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    padding: 14,
    borderRadius: 12,
    marginBottom: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    color: '#0f172a',
  },
  button: {
    backgroundColor: '#0ea5e9',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    maxWidth: 300,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  item: { width: '100%', backgroundColor: '#f9f9f9', padding: 10, borderRadius: 5, marginBottom: 10 },
  subtext: { fontSize: 14, color: '#555' },
});
