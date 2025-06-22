import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { db } from '../../auth/firebaseConfig';

export default function UtangInventory() {
  type UtangDoneEntry = {
    id: string;
    pera: string;
    name: string;
    startDate: string;
    endDate: string;
    doneAt: any;
  };

  const [doneList, setDoneList] = useState<UtangDoneEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalDone, setTotalDone] = useState(0);
  const [totalPerUser, setTotalPerUser] = useState<{ [key: string]: number }>({});

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEntry, setEditingEntry] = useState<UtangDoneEntry | null>(null);
  const [pera, setPera] = useState('');
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const formatDate = (date: Date) => date.toISOString().split('T')[0];
  const formatDoneDate = (doneAt: any) => {
    if (!doneAt) return 'Unknown';
    const date = doneAt.toDate ? doneAt.toDate() : new Date(doneAt);
    return date.toLocaleDateString();
  };

  const calculateTotals = (list: UtangDoneEntry[]) => {
    let total = 0;
    const perUser: { [key: string]: number } = {};
    list.forEach(item => {
      const amount = parseFloat(item.pera) || 0;
      total += amount;
      if (!perUser[item.name]) perUser[item.name] = 0;
      perUser[item.name] += amount;
    });
    setTotalDone(total);
    setTotalPerUser(perUser);
  };

  const fetchDoneUtang = async () => {
    setLoading(true);
    try {
      const snapshot = await db.collection('utangDone').orderBy('doneAt', 'desc').get();
      const data: UtangDoneEntry[] = snapshot.docs.map(doc => ({
        id: doc.id,
        pera: doc.data().pera,
        name: doc.data().name,
        startDate: doc.data().startDate,
        endDate: doc.data().endDate,
        doneAt: doc.data().doneAt,
      }));
      setDoneList(data);
      calculateTotals(data);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to fetch done utang entries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoneUtang();
  }, []);

  // Date pickers
  const onStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(Platform.OS === 'ios');
    if (selectedDate) setStartDate(selectedDate);
  };
  const onEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(Platform.OS === 'ios');
    if (selectedDate) setEndDate(selectedDate);
  };

  // Modal helpers
  const openAddModal = () => {
    setEditingEntry(null);
    setPera('');
    setName('');
    setStartDate(new Date());
    setEndDate(new Date());
    setModalVisible(true);
  };
  const openEditModal = (entry: UtangDoneEntry) => {
    setEditingEntry(entry);
    setPera(entry.pera);
    setName(entry.name);
    setStartDate(new Date(entry.startDate));
    setEndDate(new Date(entry.endDate));
    setModalVisible(true);
  };
  const closeModal = () => {
    setEditingEntry(null);
    setPera('');
    setName('');
    setStartDate(new Date());
    setEndDate(new Date());
    setModalVisible(false);
  };

  // CRUD
  const handleSave = async () => {
    if (!pera || !name) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      if (editingEntry) {
        await db.collection('utangDone').doc(editingEntry.id).update({
          pera, name, startDate: formatDate(startDate), endDate: formatDate(endDate)
        });
        Alert.alert('Success', 'Entry updated!');
      } else {
        await db.collection('utangDone').add({
          pera, name, startDate: formatDate(startDate), endDate: formatDate(endDate), doneAt: new Date()
        });
        Alert.alert('Success', 'Entry added!');
      }
      closeModal();
      fetchDoneUtang();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save entry.');
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = (entry: UtangDoneEntry) => {
    Alert.alert('Delete', `Delete utang for ${entry.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        setLoading(true);
        try {
          await db.collection('utangDone').doc(entry.id).delete();
          fetchDoneUtang();
        } catch (err: any) {
          Alert.alert('Error', err.message || 'Failed to delete.');
        } finally {
          setLoading(false);
        }
      }}
    ]);
  };

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.text}>Done Utang Inventory</Text>
        <View style={styles.totalsRow}>
          <View style={styles.totalsBox}>
            <Ionicons name="checkmark-circle-outline" size={28} color="#16a34a" style={styles.icon} />
            <Text style={styles.totalsLabel}>Total Done</Text>
            <Text style={styles.totalsValue}>₱{totalDone.toLocaleString()}</Text>
          </View>
          <View style={styles.totalsBox}>
            <Ionicons name="people-outline" size={28} color="#16a34a" style={styles.icon} />
            <Text style={styles.totalsLabel}>Total Users</Text>
            <Text style={styles.totalsValue}>{Object.keys(totalPerUser).length}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Add Done Utang</Text>
        </TouchableOpacity>
        {loading && <ActivityIndicator style={{ margin: 24 }} />}
        {doneList.length === 0 && !loading && (
          <Text style={styles.emptyText}>No done utang entries found.</Text>
        )}
        {doneList.map(entry => (
          <View key={entry.id} style={styles.item}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemName}>{entry.name}</Text>
              <View style={styles.itemActions}>
                <TouchableOpacity style={styles.editButton} onPress={() => openEditModal(entry)}>
                  <Ionicons name="pencil" size={16} color="#0ea5e9" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(entry)}>
                  <Ionicons name="trash" size={16} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.itemAmount}>Amount: ₱{entry.pera}</Text>
            <Text style={styles.itemDate}>Start: {entry.startDate}</Text>
            <Text style={styles.itemDate}>End: {entry.endDate}</Text>
            <Text style={styles.itemDoneDate}>Completed: {formatDoneDate(entry.doneAt)}</Text>
          </View>
        ))}
        {/* Modal for Add/Edit */}
        <Modal visible={modalVisible} animationType="slide" transparent={true} onRequestClose={closeModal}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{editingEntry ? 'Edit' : 'Add'} Done Utang</Text>
              <TextInput style={styles.modalInput} placeholder="Name" value={name} onChangeText={setName} />
              <TextInput style={styles.modalInput} placeholder="Amount" value={pera} onChangeText={setPera} keyboardType="numeric" />
              <TouchableOpacity style={styles.modalDateInput} onPress={() => setShowStartDatePicker(true)}>
                <Text style={styles.modalDateText}>Start Date: {formatDate(startDate)}</Text>
                <Ionicons name="calendar-outline" size={20} color="#0ea5e9" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalDateInput} onPress={() => setShowEndDatePicker(true)}>
                <Text style={styles.modalDateText}>End Date: {formatDate(endDate)}</Text>
                <Ionicons name="calendar-outline" size={20} color="#0ea5e9" />
              </TouchableOpacity>
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.cancelButton} onPress={closeModal}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
                  <Text style={styles.saveButtonText}>{loading ? 'Saving...' : 'Save'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        {/* Date Pickers */}
        {showStartDatePicker && (
          <DateTimePicker value={startDate} mode="date" display="default" onChange={onStartDateChange} />
        )}
        {showEndDatePicker && (
          <DateTimePicker value={endDate} mode="date" display="default" onChange={onEndDateChange} />
        )}
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
    backgroundColor: '#fff' 
  },
  text: { fontSize: 20, fontWeight: 'bold', marginBottom: 24, color: '#0f172a' },
  totalsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 24, gap: 16 },
  totalsBox: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', borderWidth: 1, borderRadius: 12, padding: 18, width: 170, alignItems: 'center', marginHorizontal: 4 },
  icon: { marginBottom: 6 },
  totalsLabel: { fontSize: 14, color: '#166534', marginBottom: 2 },
  totalsValue: { fontSize: 16, fontWeight: 'bold', color: '#16a34a' },
  addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16a34a', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, marginBottom: 24 },
  addButtonText: { color: '#fff', fontWeight: '600', fontSize: 16, marginLeft: 8 },
  emptyText: { color: '#888', fontSize: 16, marginTop: 24 },
  item: { width: '100%', backgroundColor: '#f0fdf4', padding: 16, borderRadius: 12, marginBottom: 16, borderColor: '#bbf7d0', borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, elevation: 2 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  itemName: { fontWeight: 'bold', fontSize: 18, color: '#166534' },
  itemActions: { flexDirection: 'row', gap: 8 },
  editButton: { padding: 6, backgroundColor: '#f0f9ff', borderRadius: 6, borderColor: '#0ea5e9', borderWidth: 1 },
  deleteButton: { padding: 6, backgroundColor: '#fef2f2', borderRadius: 6, borderColor: '#ef4444', borderWidth: 1 },
  itemAmount: { fontSize: 16, color: '#166534', marginBottom: 4, fontWeight: '600' },
  itemDate: { fontSize: 14, color: '#475569', marginBottom: 2 },
  itemDoneDate: { fontSize: 14, color: '#16a34a', marginTop: 6, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '90%', maxWidth: 400 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#0f172a' },
  modalInput: { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0', borderWidth: 1, padding: 14, borderRadius: 12, marginBottom: 16, fontSize: 16, color: '#0f172a' },
  modalDateInput: { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0', borderWidth: 1, padding: 14, borderRadius: 12, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalDateText: { fontSize: 16, color: '#0f172a' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  cancelButton: { flex: 1, backgroundColor: '#f1f5f9', paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderColor: '#e2e8f0', borderWidth: 1 },
  cancelButtonText: { color: '#64748b', fontWeight: '600', fontSize: 16 },
  saveButton: { flex: 1, backgroundColor: '#16a34a', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
