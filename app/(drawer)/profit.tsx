import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Alert, FlatList, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { db } from '../../auth/firebaseConfig';

interface ProfitHistory {
  id: string;
  period: string;
  totalProfit: number;
  totalLoanProfit: number;
  totalRiceProfit: number;
  startDate: string;
  endDate: string;
  createdAt: string;
}

interface CurrentProfit {
  id: string;
  profitAmount: number;
  profitType: 'loan' | 'rice';
  description: string;
  createdAt: any;
}

export default function ProfitCollection() {
  const [profitAmount, setProfitAmount] = useState('');
  const [profitType, setProfitType] = useState<'loan' | 'rice'>('loan');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [totalProfit, setTotalProfit] = useState(0);
  const [totalLoanProfit, setTotalLoanProfit] = useState(0);
  const [totalRiceProfit, setTotalRiceProfit] = useState(0);
  const [profitHistory, setProfitHistory] = useState<ProfitHistory[]>([]);
  const [currentProfits, setCurrentProfits] = useState<CurrentProfit[]>([]);
  const [currentPeriodStart, setCurrentPeriodStart] = useState<Date>(new Date());
  const [isLoadingTotals, setIsLoadingTotals] = useState(true);
  
  // Calendar states
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [markedDates, setMarkedDates] = useState<{[date: string]: any}>({});
  const [filteredProfits, setFilteredProfits] = useState<CurrentProfit[]>([]);
  const [showCalendar, setShowCalendar] = useState(false);

  // Get Philippine time (UTC+8)
  const getPhilippineTime = () => {
    const now = new Date();
    const philippineTime = new Date(now.getTime() + (8 * 60 * 60 * 1000)); // UTC+8
    return philippineTime;
  };

  // Calculate period start date (today in Philippine time)
  const calculatePeriodStart = () => {
    const philippineTime = getPhilippineTime();
    // Set to start of day (midnight) in Philippine time
    const periodStart = new Date(philippineTime);
    periodStart.setHours(0, 0, 0, 0);
    return periodStart;
  };

  // Check if current period should reset (1 month and 15 days from start)
  const shouldResetPeriod = () => {
    const philippineTime = getPhilippineTime();
    const periodEnd = new Date(currentPeriodStart);
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    periodEnd.setDate(periodEnd.getDate() + 15);
    
    return philippineTime >= periodEnd;
  };

  // Save current period to history and reset
  const savePeriodToHistory = async () => {
    if (totalProfit > 0) {
      const periodEnd = new Date(currentPeriodStart);
      periodEnd.setMonth(periodEnd.getMonth() + 1);
      periodEnd.setDate(periodEnd.getDate() + 15);
      
      const periodData = {
        period: `${currentPeriodStart.toLocaleDateString('en-PH')} - ${periodEnd.toLocaleDateString('en-PH')}`,
        totalProfit: totalProfit,
        totalLoanProfit: totalLoanProfit,
        totalRiceProfit: totalRiceProfit,
        startDate: currentPeriodStart.toISOString(),
        endDate: periodEnd.toISOString(),
        createdAt: new Date().toISOString(),
      };

      try {
        await db.collection('profitHistory').add(periodData);
        console.log('Period saved to history');
      } catch (err: any) {
        console.error('Error saving period to history:', err);
      }
    }
  };

  // Reset current period
  const resetCurrentPeriod = async () => {
    // Clear all current profit records
    try {
      const snapshot = await db.collection('profitCollection').get();
      const batch = db.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      
      // Reset totals immediately
      setTotalProfit(0);
      setTotalLoanProfit(0);
      setTotalRiceProfit(0);
      setCurrentProfits([]);
      
      // Set new period start to today
      const newPeriodStart = calculatePeriodStart();
      setCurrentPeriodStart(newPeriodStart);
      
      console.log('Period reset successfully');
    } catch (err: any) {
      console.error('Error resetting period:', err);
    }
  };

  const fetchCurrentProfits = async () => {
    try {
      const snapshot = await db.collection('profitCollection')
        .orderBy('createdAt', 'desc')
        .get();
      
      const profits: CurrentProfit[] = [];
      snapshot.forEach(doc => {
        profits.push({
          id: doc.id,
          ...doc.data()
        } as CurrentProfit);
      });
      
      setCurrentProfits(profits);
    } catch (err: any) {
      console.error('Error fetching current profits:', err);
    }
  };

  const fetchTotals = async () => {
    try {
      setIsLoadingTotals(true);
      const snapshot = await db.collection('profitCollection').get();
      let total = 0;
      let loanTotal = 0;
      let riceTotal = 0;
      
      if (!snapshot.empty) {
        snapshot.forEach(doc => {
          const data = doc.data();
          const amount = Number(data.profitAmount) || 0;
          total += amount;
          
          if (data.profitType === 'loan') {
            loanTotal += amount;
          } else if (data.profitType === 'rice') {
            riceTotal += amount;
          }
        });
      }
      
      // Always update totals, even if they are 0
      setTotalProfit(total);
      setTotalLoanProfit(loanTotal);
      setTotalRiceProfit(riceTotal);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to fetch profit totals.');
      // Set totals to 0 on error
      setTotalProfit(0);
      setTotalLoanProfit(0);
      setTotalRiceProfit(0);
    } finally {
      setIsLoadingTotals(false);
    }
  };

  const fetchProfitHistory = async () => {
    try {
      const snapshot = await db.collection('profitHistory')
        .orderBy('createdAt', 'desc')
        .get();
      
      const history: ProfitHistory[] = [];
      snapshot.forEach(doc => {
        history.push({
          id: doc.id,
          ...doc.data()
        } as ProfitHistory);
      });
      
      setProfitHistory(history);
    } catch (err: any) {
      console.error('Error fetching profit history:', err);
    }
  };

  const deleteProfit = async (profitId: string) => {
    Alert.alert(
      'Delete Profit Entry',
      'Are you sure you want to delete this profit entry?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await db.collection('profitCollection').doc(profitId).delete();
              Alert.alert('Success', 'Profit entry deleted successfully!');
              // Update totals and current profits immediately
              await fetchTotals();
              await fetchCurrentProfits();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete profit entry.');
            }
          },
        },
      ]
    );
  };

  // Real-time update function
  const updateTotalsFromCurrentProfits = () => {
    let total = 0;
    let loanTotal = 0;
    let riceTotal = 0;
    
    currentProfits.forEach(profit => {
      total += profit.profitAmount;
      if (profit.profitType === 'loan') {
        loanTotal += profit.profitAmount;
      } else if (profit.profitType === 'rice') {
        riceTotal += profit.profitAmount;
      }
    });
    
    setTotalProfit(total);
    setTotalLoanProfit(loanTotal);
    setTotalRiceProfit(riceTotal);
  };

  // Calendar functions
  const onDayPress = (day: any) => {
    setSelectedDate(day.dateString);
    filterProfitsByDate(day.dateString);
  };

  const filterProfitsByDate = (dateString: string) => {
    const filtered = currentProfits.filter(profit => {
      const profitDate = profit.createdAt?.toDate?.()?.toISOString().split('T')[0] || 
                        new Date(profit.createdAt).toISOString().split('T')[0];
      return profitDate === dateString;
    });
    setFilteredProfits(filtered);
  };

  const updateMarkedDates = () => {
    const marked: {[date: string]: any} = {};
    
    currentProfits.forEach(profit => {
      const profitDate = profit.createdAt?.toDate?.()?.toISOString().split('T')[0] || 
                        new Date(profit.createdAt).toISOString().split('T')[0];
      
      if (marked[profitDate]) {
        marked[profitDate].dots.push({
          key: profit.id,
          color: profit.profitType === 'loan' ? '#10b981' : '#f59e0b',
          selectedDotColor: profit.profitType === 'loan' ? '#10b981' : '#f59e0b'
        });
      } else {
        marked[profitDate] = {
          dots: [{
            key: profit.id,
            color: profit.profitType === 'loan' ? '#10b981' : '#f59e0b',
            selectedDotColor: profit.profitType === 'loan' ? '#10b981' : '#f59e0b'
          }]
        };
      }
    });
    
    // Mark selected date
    if (marked[selectedDate]) {
      marked[selectedDate].selected = true;
      marked[selectedDate].selectedColor = '#0ea5e9';
    } else {
      marked[selectedDate] = {
        selected: true,
        selectedColor: '#0ea5e9'
      };
    }
    
    setMarkedDates(marked);
  };

  useEffect(() => {
    const initializePeriod = () => {
      const periodStart = calculatePeriodStart();
      setCurrentPeriodStart(periodStart);
    };

    initializePeriod();
    fetchTotals();
    fetchCurrentProfits();
    fetchProfitHistory();

    // Check for period reset every time the component mounts or totals change
    const checkPeriodReset = () => {
      if (shouldResetPeriod()) {
        Alert.alert(
          'Period Reset',
          'The current profit period has ended. The totals will be saved to history and reset.',
          [
            {
              text: 'OK',
              onPress: async () => {
                await savePeriodToHistory();
                await resetCurrentPeriod();
                await fetchProfitHistory();
              }
            }
          ]
        );
      }
    };

    checkPeriodReset();
  }, []);

  // Update totals whenever current profits change
  useEffect(() => {
    updateTotalsFromCurrentProfits();
    updateMarkedDates();
    filterProfitsByDate(selectedDate);
  }, [currentProfits, selectedDate]);

  const handleAddProfit = async () => {
    if (!profitAmount) {
      Alert.alert('Error', 'Please enter the profit amount.');
      return;
    }

    if (isNaN(Number(profitAmount)) || Number(profitAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid profit amount.');
      return;
    }

    setLoading(true);
    try {
      const newProfit = {
        profitAmount: parseFloat(profitAmount),
        profitType: profitType,
        description: description || `${profitType} profit`,
        createdAt: new Date(),
      };

      await db.collection('profitCollection').add(newProfit);
      
      Alert.alert('Success', 'Profit added successfully!');
      setProfitAmount('');
      setDescription('');
      setProfitType('loan');
      
      // Update data immediately
      await fetchTotals();
      await fetchCurrentProfits();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add profit.');
    } finally {
      setLoading(false);
    }
  };

  const renderHistoryItem = ({ item }: { item: ProfitHistory }) => (
    <View style={styles.historyItem}>
      <View style={styles.historyHeader}>
        <Text style={styles.historyPeriod}>{item.period}</Text>
        <Text style={styles.historyTotal}>₱{item.totalProfit.toLocaleString()}</Text>
      </View>
      <View style={styles.historyDetails}>
        <View style={styles.historyDetail}>
          <Ionicons name="cash-outline" size={16} color="#10b981" />
          <Text style={styles.historyDetailText}>Loan: ₱{item.totalLoanProfit.toLocaleString()}</Text>
        </View>
        <View style={styles.historyDetail}>
          <Ionicons name="leaf-outline" size={16} color="#f59e0b" />
          <Text style={styles.historyDetailText}>Rice: ₱{item.totalRiceProfit.toLocaleString()}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.mainContainer}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <Text style={styles.text}>Profit Collection</Text>
          
          {/* Current Period Info */}
          <View style={styles.periodInfo}>
            <Text style={styles.periodLabel}>Current Period:</Text>
            <Text style={styles.periodDate}>
              {currentPeriodStart.toLocaleDateString('en-PH')} - {
                (() => {
                  const periodEnd = new Date(currentPeriodStart);
                  periodEnd.setMonth(periodEnd.getMonth() + 1);
                  periodEnd.setDate(periodEnd.getDate() + 15);
                  return periodEnd.toLocaleDateString('en-PH');
                })()
              }
            </Text>
          </View>
          
          {/* Calendar Section */}
          <View style={styles.calendarContainer}>
            <TouchableOpacity
              style={styles.calendarToggle}
              onPress={() => setShowCalendar(!showCalendar)}
            >
              <Ionicons name="calendar-outline" size={20} color="#0ea5e9" />
              <Text style={styles.calendarToggleText}>
                {showCalendar ? 'Hide Calendar' : 'Show Calendar'}
              </Text>
              <Ionicons 
                name={showCalendar ? "chevron-up-outline" : "chevron-down-outline"} 
                size={20} 
                color="#0ea5e9" 
              />
            </TouchableOpacity>
            
            {/* Period Management Buttons */}
            <View style={styles.periodManagement}>
              <TouchableOpacity
                style={styles.periodButton}
                onPress={async () => {
                  Alert.alert(
                    'Reset Current Period',
                    'This will save the current period to history and start a new period. Continue?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Reset',
                        style: 'destructive',
                        onPress: async () => {
                          await savePeriodToHistory();
                          await resetCurrentPeriod();
                          await fetchProfitHistory();
                          Alert.alert('Success', 'Period reset successfully!');
                        }
                      }
                    ]
                  );
                }}
              >
                <Ionicons name="refresh-outline" size={16} color="#ef4444" />
                <Text style={styles.periodButtonText}>Reset Period</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.periodButton}
                onPress={() => {
                  const periodEnd = new Date(currentPeriodStart);
                  periodEnd.setMonth(periodEnd.getMonth() + 1);
                  periodEnd.setDate(periodEnd.getDate() + 15);
                  
                  Alert.alert(
                    'Current Period Info',
                    `Period: ${currentPeriodStart.toLocaleDateString('en-PH')} - ${periodEnd.toLocaleDateString('en-PH')}\n\nTotal Profit: ₱${totalProfit.toLocaleString()}\nLoan Profit: ₱${totalLoanProfit.toLocaleString()}\nRice Profit: ₱${totalRiceProfit.toLocaleString()}\n\nEntries: ${currentProfits.length}`,
                    [{ text: 'OK' }]
                  );
                }}
              >
                <Ionicons name="information-circle-outline" size={16} color="#0ea5e9" />
                <Text style={styles.periodButtonText}>Period Info</Text>
              </TouchableOpacity>
            </View>
            
            {showCalendar && (
              <View style={styles.calendarWrapper}>
                <Calendar
                  onDayPress={onDayPress}
                  markedDates={markedDates}
                  markingType={'multi-dot'}
                  theme={{
                    backgroundColor: '#ffffff',
                    calendarBackground: '#ffffff',
                    textSectionTitleColor: '#0f172a',
                    selectedDayBackgroundColor: '#0ea5e9',
                    selectedDayTextColor: '#ffffff',
                    todayTextColor: '#0ea5e9',
                    dayTextColor: '#0f172a',
                    textDisabledColor: '#d1d5db',
                    dotColor: '#0ea5e9',
                    selectedDotColor: '#ffffff',
                    arrowColor: '#0ea5e9',
                    monthTextColor: '#0f172a',
                    indicatorColor: '#0ea5e9',
                    textDayFontWeight: '300',
                    textMonthFontWeight: 'bold',
                    textDayHeaderFontWeight: '300',
                    textDayFontSize: 16,
                    textMonthFontSize: 16,
                    textDayHeaderFontSize: 13
                  }}
                />
                
                {/* Selected Date Profits */}
                {filteredProfits.length > 0 && (
                  <View style={styles.selectedDateProfits}>
                    <Text style={styles.selectedDateTitle}>
                      Profits on {new Date(selectedDate).toLocaleDateString('en-PH')}
                    </Text>
                    {filteredProfits.map((profit, index) => (
                      <View key={profit.id} style={styles.selectedDateProfitItem}>
                        <View style={styles.selectedDateProfitInfo}>
                          <View style={styles.selectedDateProfitLeft}>
                            <Ionicons 
                              name={profit.profitType === 'loan' ? 'cash-outline' : 'leaf-outline'} 
                              size={16} 
                              color={profit.profitType === 'loan' ? '#10b981' : '#f59e0b'} 
                            />
                            <Text style={styles.selectedDateProfitType}>
                              {profit.profitType.charAt(0).toUpperCase() + profit.profitType.slice(1)}
                            </Text>
                          </View>
                          <View style={styles.selectedDateProfitRight}>
                            <Text style={styles.selectedDateProfitAmount}>
                              ₱{profit.profitAmount.toLocaleString()}
                            </Text>
                            <TouchableOpacity
                              style={styles.selectedDateDeleteButton}
                              onPress={() => deleteProfit(profit.id)}
                            >
                              <Ionicons name="trash-outline" size={16} color="#ef4444" />
                            </TouchableOpacity>
                          </View>
                        </View>
                        {profit.description && (
                          <Text style={styles.selectedDateProfitDescription}>
                            {profit.description}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
          
          {/* Totals Display */}
          <View style={styles.totalsRow}>
            <View style={styles.totalProfitBox}>
              <Ionicons name="trending-up-outline" size={28} color="#0ea5e9" style={styles.icon} />
              <Text style={styles.totalsLabel}>Total Profit</Text>
              <Text style={styles.totalsValue}>
                {isLoadingTotals ? 'Loading...' : `₱${totalProfit.toLocaleString()}`}
              </Text>
            </View>
          </View>
          
          <View style={styles.totalsRow}>
            <View style={styles.totalsBox}>
              <Ionicons name="cash-outline" size={24} color="#10b981" style={styles.icon} />
              <Text style={styles.totalsLabel}>Loan Profit</Text>
              <Text style={styles.totalsValue}>
                {isLoadingTotals ? 'Loading...' : `₱${totalLoanProfit.toLocaleString()}`}
              </Text>
            </View>
            <View style={styles.totalsBox}>
              <Ionicons name="leaf-outline" size={24} color="#f59e0b" style={styles.icon} />
              <Text style={styles.totalsLabel}>Rice Profit</Text>
              <Text style={styles.totalsValue}>
                {isLoadingTotals ? 'Loading...' : `₱${totalRiceProfit.toLocaleString()}`}
              </Text>
            </View>
          </View>

          {/* Profit Type Selection */}
          <View style={styles.typeContainer}>
            <Text style={styles.typeLabel}>Profit Type:</Text>
            <View style={styles.typeButtons}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  profitType === 'loan' && styles.typeButtonActive
                ]}
                onPress={() => setProfitType('loan')}
              >
                <Ionicons 
                  name="cash-outline" 
                  size={20} 
                  color={profitType === 'loan' ? '#fff' : '#0ea5e9'} 
                />
                <Text style={[
                  styles.typeButtonText,
                  profitType === 'loan' && styles.typeButtonTextActive
                ]}>
                  Loan
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  profitType === 'rice' && styles.typeButtonActive
                ]}
                onPress={() => setProfitType('rice')}
              >
                <Ionicons 
                  name="leaf-outline" 
                  size={20} 
                  color={profitType === 'rice' ? '#fff' : '#0ea5e9'} 
                />
                <Text style={[
                  styles.typeButtonText,
                  profitType === 'rice' && styles.typeButtonTextActive
                ]}>
                  Rice
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Input Fields */}
          <TextInput
            style={styles.input}
            placeholder="Profit Amount (₱)"
            value={profitAmount}
            onChangeText={setProfitAmount}
            keyboardType="numeric"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Description (optional)"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={2}
          />

          {/* Done Button */}
          <TouchableOpacity 
            style={styles.button} 
            onPress={handleAddProfit} 
            disabled={loading}
          >
            <Ionicons name="checkmark-circle-outline" size={24} color="#fff" />
            <Text style={styles.buttonText}>
              {loading ? 'Adding...' : 'Done'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Profit History Section */}
      <View style={styles.historyContainer}>
        <Text style={styles.historyTitle}>Profit History</Text>
        {profitHistory.length > 0 ? (
          <FlatList
            data={profitHistory}
            renderItem={renderHistoryItem}
            keyExtractor={(item) => item.id}
            style={styles.historyList}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyHistory}>
            <Ionicons name="time-outline" size={48} color="#94a3b8" />
            <Text style={styles.emptyHistoryText}>No profit history yet</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    alignItems: 'center',
    padding: 24,
    marginTop: 16,
    backgroundColor: '#fff',
  },
  text: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    marginBottom: 16,
    color: '#0f172a'
  },
  periodInfo: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    width: '100%',
    maxWidth: 300,
  },
  periodLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  periodDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
    width: '100%',
    maxWidth: 300,
  },
  totalsBox: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    minWidth: 120,
    alignItems: 'center',
    marginHorizontal: 4,
    flex: 1,
  },
  icon: {
    marginBottom: 6,
  },
  totalsLabel: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 2,
    textAlign: 'center',
  },
  totalsValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0ea5e9',
  },
  typeContainer: {
    width: '100%',
    maxWidth: 300,
    marginBottom: 20,
  },
  typeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    textAlign: 'center',
  },
  typeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#fff',
    gap: 8,
  },
  typeButtonActive: {
    backgroundColor: '#0ea5e9',
    borderColor: '#0ea5e9',
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0ea5e9',
  },
  typeButtonTextActive: {
    color: '#fff',
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
    backgroundColor: '#10b981',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    maxWidth: 300,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: 24,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 18,
  },
  totalProfitBox: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    width: '100%',
    alignItems: 'center',
  },
  historyContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    padding: 16,
    textAlign: 'center',
  },
  historyList: {
    flex: 1,
  },
  historyItem: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyPeriod: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  historyTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0ea5e9',
  },
  historyDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  historyDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historyDetailText: {
    fontSize: 12,
    color: '#64748b',
  },
  emptyHistory: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyHistoryText: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 12,
  },
  calendarContainer: {
    width: '100%',
    maxWidth: 300,
    marginBottom: 20,
  },
  calendarToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  calendarToggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0ea5e9',
  },
  calendarWrapper: {
    marginTop: 12,
  },
  selectedDateProfits: {
    marginTop: 12,
  },
  selectedDateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 12,
  },
  selectedDateProfitItem: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  selectedDateProfitInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  selectedDateProfitLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedDateProfitRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedDateProfitType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  selectedDateProfitAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0ea5e9',
  },
  selectedDateProfitDescription: {
    fontSize: 12,
    color: '#64748b',
  },
  selectedDateDeleteButton: {
    padding: 4,
  },
  periodManagement: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 8,
  },
  periodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    gap: 6,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
});
