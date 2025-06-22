import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db } from '../../auth/firebaseConfig';

export default function UtangPendingList() {
  type UtangEntry = {
    id: string;
    pera: string;
    name: string;
    startDate: string;
    endDate: string;
  };
  type UtangDoneEntry = UtangEntry & { doneAt?: any };

  const [utangList, setUtangList] = useState<UtangEntry[]>([]);
  const [doneList, setDoneList] = useState<UtangDoneEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUtang = async () => {
    setLoading(true);
    try {
      const [pendingSnap, doneSnap] = await Promise.all([
        db.collection('utangCollection').orderBy('createdAt', 'desc').get(),
        db.collection('utangDone').orderBy('doneAt', 'desc').get(),
      ]);
      const pending: UtangEntry[] = pendingSnap.docs.map(doc => ({
        id: doc.id,
        pera: doc.data().pera,
        name: doc.data().name,
        startDate: doc.data().startDate,
        endDate: doc.data().endDate,
      }));
      const done: UtangDoneEntry[] = doneSnap.docs.map(doc => ({
        id: doc.id,
        pera: doc.data().pera,
        name: doc.data().name,
        startDate: doc.data().startDate,
        endDate: doc.data().endDate,
        doneAt: doc.data().doneAt,
      }));
      setUtangList(pending);
      setDoneList(done);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to fetch utang entries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUtang();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchUtang();
    }, [])
  );

  const handleDone = async (entry: UtangEntry) => {
    setLoading(true);
    try {
      await db.collection('utangDone').add({
        pera: entry.pera,
        name: entry.name,
        startDate: entry.startDate,
        endDate: entry.endDate,
        doneAt: new Date(),
      });
      await db.collection('utangCollection').doc(entry.id).delete();
      fetchUtang();
      Alert.alert('Success', 'Utang marked as done!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to mark as done.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView 
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={true}
    >
      <View style={styles.container}>
        <Text style={styles.text}>Pending Loans Collection</Text>
        {loading && <ActivityIndicator style={{ margin: 24 }} />}
        <Text style={styles.sectionHeader}>Pending</Text>
        {utangList.length === 0 && !loading && (
          <Text style={{ color: '#888', marginTop: 8 }}>No pending utang found.</Text>
        )}
        {utangList.map(entry => (
          <View key={entry.id} style={styles.item}>
            <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{entry.name}</Text>
            <Text style={styles.subtext}>Amount: ₱{entry.pera}</Text>
            <Text style={styles.subtext}>Start: {entry.startDate}</Text>
            <Text style={styles.subtext}>End: {entry.endDate}</Text>
            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => handleDone(entry)}
              disabled={loading}
            >
              <Ionicons name="checkmark-done" size={18} color="#fff" />
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        ))}
        <Text style={styles.sectionHeader}>Done</Text>
        {doneList.length === 0 && !loading && (
          <Text style={{ color: '#888', marginTop: 8 }}>No done utang found.</Text>
        )}
        {doneList.map(entry => (
          <View key={entry.id} style={[styles.item, { backgroundColor: '#e0ffe0', borderColor: '#16a34a', borderWidth: 1 }]}> 
            <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{entry.name}</Text>
            <Text style={styles.subtext}>Amount: ₱{entry.pera}</Text>
            <Text style={styles.subtext}>Start: {entry.startDate}</Text>
            <Text style={styles.subtext}>End: {entry.endDate}</Text>
            <Text style={[styles.subtext, { color: '#16a34a', marginTop: 6 }]}>Done</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    flex: 1,
    paddingBottom: 20,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 24,
    marginTop: 16,
    backgroundColor: '#fff',
  },
  text: { fontSize: 20, fontWeight: 'bold', marginBottom: 24 },
  sectionHeader: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#0ea5e9',
    alignSelf: 'flex-start',
    marginTop: 18,
    marginBottom: 8,
  },
  item: {
    width: '100%',
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  subtext: { fontSize: 14, color: '#555', marginTop: 2 },
  doneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
    alignSelf: 'flex-end',
  },
  doneButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
    marginLeft: 6,
  },
});
