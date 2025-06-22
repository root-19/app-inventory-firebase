import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { db } from '../../auth/firebaseConfig';

interface RiceItem {
  id: string;
  pieces: number;
  price: number;
  createdAt: any;
}

export default function RiceInventoryList() {
  const [riceList, setRiceList] = useState<RiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editItem, setEditItem] = useState<RiceItem | null>(null);
  const [editPieces, setEditPieces] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  const fetchRiceList = async () => {
    setLoading(true);
    setError('');
    try {
      const snapshot = await db.collection('riceInventory').orderBy('createdAt', 'desc').get();
      const items: RiceItem[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as RiceItem[];
      setRiceList(items);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch rice inventory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiceList();
  }, []);

  const handleDelete = async (id: string) => {
    Alert.alert('Delete', 'Are you sure you want to delete this entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await db.collection('riceInventory').doc(id).delete();
            fetchRiceList();
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to delete entry.');
          }
        }
      }
    ]);
  };

  const openEditModal = (item: RiceItem) => {
    setEditItem(item);
    setEditPieces(item.pieces.toString());
    setEditPrice(item.price.toString());
    setEditModalVisible(true);
  };

  const handleUpdate = async () => {
    if (!editItem) return;
    if (!editPieces || !editPrice) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    setEditLoading(true);
    try {
      await db.collection('riceInventory').doc(editItem.id).update({
        pieces: parseFloat(editPieces),
        price: parseFloat(editPrice),
      });
      setEditModalVisible(false);
      setEditItem(null);
      fetchRiceList();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update entry.');
    } finally {
      setEditLoading(false);
    }
  };

  const renderItem = ({ item }: { item: RiceItem }) => (
    <View style={styles.itemBox}>
      <View style={{ flex: 1 }}>
        <Text style={styles.itemText}>Pieces: {item.pieces}</Text>
        <Text style={styles.itemText}>Price: ₱{item.price}</Text>
        <Text style={styles.itemDate}>Date: {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleString() : new Date(item.createdAt).toLocaleString()}</Text>
      </View>
      <TouchableOpacity style={styles.iconBtn} onPress={() => openEditModal(item)}>
        <Ionicons name="create-outline" size={22} color="#0ea5e9" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.iconBtn} onPress={() => handleDelete(item.id)}>
        <Ionicons name="trash-outline" size={22} color="#e11d48" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rice Inventory List</Text>
      {loading ? <ActivityIndicator style={{ margin: 24 }} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={riceList}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 32 }}
        ListEmptyComponent={!loading ? <Text style={{ textAlign: 'center', marginTop: 32 }}>No rice inventory found.</Text> : null}
      />
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Entry</Text>
            <TextInput
              style={styles.input}
              placeholder="Pieces"
              value={editPieces}
              onChangeText={setEditPieces}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="Price"
              value={editPrice}
              onChangeText={setEditPrice}
              keyboardType="numeric"
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#e2e8f0' }]} onPress={() => setEditModalVisible(false)}>
                <Text style={{ color: '#0f172a' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#0ea5e9' }]} onPress={handleUpdate} disabled={editLoading}>
                <Text style={{ color: '#fff' }}>{editLoading ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16, textAlign: 'center', color: '#0f172a' },
  itemBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  itemText: { fontSize: 16, color: '#0f172a' },
  itemDate: { fontSize: 12, color: '#64748b', marginTop: 4 },
  iconBtn: { marginLeft: 12 },
  error: { color: '#e11d48', textAlign: 'center', marginBottom: 12 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: 300,
    elevation: 5,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#0f172a', textAlign: 'center' },
  input: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    color: '#0f172a',
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 4,
  },
});
