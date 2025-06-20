import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import React, { useState, useEffect } from 'react';
import { db } from '../../auth/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';

export default function RiceInventory() {
  const [pieces, setPieces] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [totalSacks, setTotalSacks] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);

  const fetchTotals = async () => {
    try {
      const snapshot = await db.collection('riceInventory').get();
      let sacks = 0;
      let priceSum = 0;
      snapshot.forEach(doc => {
        const data = doc.data();
        sacks += Number(data.pieces) || 0;
        priceSum += Number(data.price) || 0;
      });
      setTotalSacks(sacks);
      setTotalPrice(priceSum);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to fetch totals.');
    }
  };

  useEffect(() => {
    fetchTotals();
  }, []);

  const handleAdd = async () => {
    if (!pieces || !price) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      await db.collection('riceInventory').add({
        pieces: parseFloat(pieces),
        price: parseFloat(price),
        createdAt: new Date(),
      });
      Alert.alert('Success', 'Rice inventory added!');
      setPieces('');
      setPrice('');
      fetchTotals(); // Refresh totals after adding
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.text}>Rice Inventory Page</Text>
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
        <TextInput
          style={styles.input}
          placeholder="Pieces of Sack (e.g. 1, 0.5, 1.5)"
          value={pieces}
          onChangeText={setPieces}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          placeholder="Price"
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
        />
        <TouchableOpacity style={styles.button} onPress={handleAdd} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Adding...' : 'Add'}</Text>
        </TouchableOpacity>
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
});
