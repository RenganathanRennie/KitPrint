import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  AppState,
  Alert,
  ActivityIndicator,
  FlatList,
  Share,
  Modal,
  AppStateStatus,
  Animated,
  BackHandler,
  PermissionsAndroid,
  Platform,
  TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import mqtt from 'mqtt';
import { homeScreenStyles as styles } from '../styles/customStyles';
import { FoodOrder } from '../types/FoodOrder';
import { connectAndSubscribeMQTT, disconnectMQTT } from '../services/mqtt';
import { printViaBluetooth, findBluetoothPrinters, isBluetoothEnabled, enableBluetooth } from '../services/bluetoothPrint';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import {
  fetchOrders,
  updateOrderFromMQTT,
  updateOrderStatusAsync,
} from '../redux/slices/ordersSlice';

interface HomeScreenProps {
  onLogout: () => void;
}

// Helper function to get status label from numeric status
const getStatusLabel = (status: number): string => {
  switch (status) {
    case 1:
      return 'Pending';
    case 2:
      return 'Processing';
    case 3:
      return 'Completed';
    case 4:
      return 'Cancelled';
    default:
      return 'Unknown';
  }
};

const HomeScreen: React.FC<HomeScreenProps> = ({ onLogout }) => {
  const systemColorScheme = useColorScheme() === 'dark';
  const dispatch = useAppDispatch();
  
  // Theme state - manual override
  const [isDarkMode, setIsDarkMode] = useState<boolean>(systemColorScheme);
  
  // Redux state
  const { items: reduxOrders, loading } = useAppSelector((state) => state.orders);
  
  // Local state
  const [mainOrders, setMainOrders] = useState<FoodOrder[]>([]); // Master list for FlatList
  const [printModalVisible, setPrintModalVisible] = useState(false);
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState<FoodOrder | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [userKeyModalVisible, setUserKeyModalVisible] = useState(false);
  const [userKeyInput, setUserKeyInput] = useState('');
  const appState = useRef(AppState.currentState);
  const mqttClientRef = useRef<mqtt.MqttClient | null>(null);
  const animationRefs = useRef<{ [key: number]: Animated.Value }>({});
  const heightAnimationRefs = useRef<{ [key: number]: Animated.Value }>({});

  // Sync Redux orders to mainOrders - handle both additions and removals
  useEffect(() => {
    setMainOrders((prevOrders) => {
      // First, add any new orders from Redux that aren't in mainOrders
      const existingIds = new Set(prevOrders.map((o) => o.orderId));
      const newOrders = reduxOrders.filter((o) => !existingIds.has(o.orderId));
      
      let updated = [...prevOrders, ...newOrders];
      
      // Then, remove any orders that were deleted (no longer in Redux)
      const reduxIds = new Set(reduxOrders.map((r) => r.orderId));
      updated = updated.filter((order) => reduxIds.has(order.orderId));
      
      return updated;
    });
  }, [reduxOrders]);



  // Handle back button press with confirmation
  useFocusEffect(
    useCallback(() => {
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          Alert.alert(
            'Exit KitPrint',
            'Are you sure you want to exit the app?',
            [
              {
                text: 'Cancel',
                onPress: () => {},
                style: 'cancel',
              },
              {
                text: 'Exit',
                onPress: () => BackHandler.exitApp(),
                style: 'destructive',
              },
            ],
          );
          return true; // Prevent default back behavior
        },
      );

      return () => backHandler.remove(); // Clean up on unmount
    }, []),
  );

  // Handle app state changes
  const handleAppStateChange = useCallback(async (nextAppState: AppStateStatus) => {
    // Just track app state - do not call API
    appState.current = nextAppState;
  }, []);

  // Toggle theme
  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Handle refresh with user key prompt
  const handleRefreshWithKey = () => {
    setUserKeyInput('');
    setUserKeyModalVisible(true);
  };

  // Submit user key
  const submitUserKey = () => {
    if (!userKeyInput || userKeyInput.trim() === '') {
      Alert.alert('Error', 'Please enter a user key');
      return;
    }

    if (!/^\d+$/.test(userKeyInput)) {
      Alert.alert('Error', 'User key must be numeric only');
      return;
    }

    if (userKeyInput.length > 4) {
      Alert.alert('Error', 'User key must be maximum 4 digits');
      return;
    }

    setUserKeyModalVisible(false);
    dispatch(fetchOrders(parseInt(userKeyInput)));
    setUserKeyInput('');
  };

  // Print receipt via Bluetooth or PDF
  const printToBluetooth = async (receiptText: string, orderId: number): Promise<boolean> => {
    try {
      setIsPrinting(true);

      // Check if Bluetooth is enabled
      let btEnabled = await isBluetoothEnabled();
      
      if (!btEnabled) {
        Alert.alert('Bluetooth Disabled', 'Enabling Bluetooth...', [
          {
            text: 'OK',
            onPress: async () => {
              const enabled = await enableBluetooth();
              if (!enabled) {
                throw new Error('Failed to enable Bluetooth');
              }
            },
          },
        ]);
      }

      // Find available printers
      const printers = await findBluetoothPrinters();
      
      if (printers.length === 0) {
        setIsPrinting(false);
        return false; // No printers found, use PDF fallback
      }

      // Use first printer found (or could show selection dialog)
      const selectedPrinter = printers[0];
      
      // Add line breaks for thermal printer formatting
      const formattedReceipt = receiptText + '\n\n\n\n';
      
      // Print to Bluetooth printer
      const success = await printViaBluetooth(selectedPrinter.address, formattedReceipt);
      
      setIsPrinting(false);
      return success;
    } catch (error) {
      console.error('Bluetooth print error:', error);
      setIsPrinting(false);
      return false;
    }
  };

  // Generate PDF as fallback
  const printToPDF = async (receiptText: string, orderId: number): Promise<boolean> => {
    try {
      // Use Share to allow saving as PDF or printing
      await Share.share({
        message: receiptText,
        title: `Order Receipt ${orderId}`,
      });
      return true;
    } catch (error) {
      console.error('PDF fallback error:', error);
      return false;
    }
  };

  // Handle print order with receipt preview
  const handlePrint = (order: FoodOrder) => {
    setSelectedOrderForPrint(order);
    setPrintModalVisible(true);
  };
const formatDate = (dateString: string) => {
  const d = new Date(dateString);

  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0") +
    " " +
    String(d.getHours()).padStart(2, "0") +
    ":" +
    String(d.getMinutes()).padStart(2, "0") +
    ":" +
    String(d.getSeconds()).padStart(2, "0")
  );
};
  // Confirm and print
  const confirmPrint = async (order: FoodOrder) => {
    try {
      const itemsList = order.orderDetails
        .map((item) => `• ${item.itemName} (Qty: ${item.quantity}) - $${item.itemTotal.toFixed(2)}`)
        .join('\n');       
console.log('afsdfsd', formatDate(order.createdAt));
      const receiptText = `
TechNow Software
123 Main Street, City, Country
+65 81805352
------------------------------------------------

Order No. ${order.orderId}
Order Date ${formatDate(order.createdAt)}
------------------------------------------------
Customer Info

Customer Name : ${order.customerName ?? ''}
Mobile        : ${order.phone ?? ''}
Delivery Address:
------------------------------------------------
${order.address ?? ''}
------------------------------------------------

Item                    Qty     Amount
------------------------------------------------
${order.orderDetails
  .map(
    item =>
      `${item.itemName.padEnd(20)} ${item.quantity
        .toString()
        .padEnd(5)} ${item.itemTotal.toFixed(2)}`
  )
  .join('\n')}

------------------------------------------------
TOTAL: $${order.invoiceTotal.toFixed(2)}
------------------------------------------------

Payment By: ${order.paymentMethod}

------------------------------------------------
Thank you for your visit!
`;

      setPrintModalVisible(false);

      // Attempt Bluetooth printing
      setIsPrinting(true);
      const bluetoothSuccess = await printToBluetooth(receiptText, order.orderId);
      setIsPrinting(false);

      if (bluetoothSuccess) {
  Alert.alert(
    'Print Successful',
    'Receipt printed successfully.',
    [
      {
        text: 'Reprint',
        onPress: () => {
          confirmPrint(order);
        },
      },
      {
        text: 'Close',
        onPress: async () => {
          setPrintModalVisible(false);

          setMainOrders((prev) =>
            prev.filter((o) => o.orderId !== order.orderId)
          );

          await dispatch(
            updateOrderStatusAsync({
              orderId: order.orderId,
              status: 'Printed',
            })
          );
        },
      },
    ]
  );
} else {
        // Fallback to PDF/Share if Bluetooth fails
        Alert.alert('Bluetooth Failed', 'Printer not found. Using alternate print method...', [
          {
            text: 'Print as PDF',
            onPress: async () => {
              const pdfSuccess = await printToPDF(receiptText, order.orderId);
              
              if (pdfSuccess) {
                // Remove from mainOrders immediately and update status
                setMainOrders((prev) => prev.filter((o) => o.orderId !== order.orderId));
                await dispatch(updateOrderStatusAsync({ orderId: order.orderId, status: 'Printed' }));
                Alert.alert('Success', 'Receipt shared and status updated to Printed');
              } else {
                Alert.alert('Error', 'Failed to process print request');
              }
            },
            style: 'default',
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]);
      }
    } catch (err: any) {
      console.error('Print error:', err);
      setIsPrinting(false);
      Alert.alert('Error', 'Failed to process print request');
    }
  };

  // Handle cancel order
  const handleCancel = (order: FoodOrder) => {
    Alert.alert('Cancel Order', `Cancel order #${order.orderId}?`, [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes',
        onPress: async () => {
          try {
            // Remove from mainOrders immediately
            setMainOrders((prev) => prev.filter((o) => o.orderId !== order.orderId));
            
            const result = await dispatch(updateOrderStatusAsync({ orderId: order.orderId, status: 'Cancel' }));

            if (!result.payload) {
              Alert.alert('Error', 'Failed to cancel order');
            }
          } catch (err: any) {
            console.error('Cancel error:', err);
            Alert.alert('Error', 'Failed to cancel order');
          }
        },
      },
    ]);
  };

  // Handle delete order
  const handleDelete = (order: FoodOrder) => {
    Alert.alert('Delete Order', `Delete order #${order.orderId}?`, [
      { text: 'No', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            // Remove from mainOrders immediately
            setMainOrders((prev) => prev.filter((o) => o.orderId !== order.orderId));
            
            const result = await dispatch(updateOrderStatusAsync({ orderId: order.orderId, status: 'Cancel' }));
            
            if (!result.payload) {
              Alert.alert('Error', 'Failed to delete order');
            }
          } catch (err: any) {
            console.error('Delete error:', err);
            Alert.alert('Error', 'Failed to delete order');
          }
        },
      },
    ]);
  };

  // Animate order removal with pop effect
  const animateRemoval = (orderId: number) => {
    if (!animationRefs.current[orderId]) {
      animationRefs.current[orderId] = new Animated.Value(1);
    }
    if (!heightAnimationRefs.current[orderId]) {
      heightAnimationRefs.current[orderId] = new Animated.Value(150); // Initial height estimate
    }

    Animated.sequence([
      // Pop out animation
      Animated.parallel([
        Animated.timing(animationRefs.current[orderId], {
          toValue: 1.2,
          duration: 150,
          useNativeDriver: true,
        }),
      ]),
      // Fade, scale out, and collapse height
      Animated.parallel([
        Animated.timing(animationRefs.current[orderId], {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(heightAnimationRefs.current[orderId], {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
      ]),
    ]).start();
  };

  // Initialize on mount
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Subscribe to MQTT only - NO API CALL
        const onMQTTMessage = (topic: string, newOrder: FoodOrder) => {
          console.log('📲 MQTT message received on topic:', topic);
          console.log('Order data:', newOrder);
          
          // Add to mainOrders only if not already present
          setMainOrders((prevOrders) => {
            const exists = prevOrders.some((o) => o.orderId === newOrder.orderId);
            if (!exists) {
              return [...prevOrders, newOrder];
            }
            return prevOrders;
          });
          
          // Also update Redux for consistency
          dispatch(updateOrderFromMQTT(newOrder));
        };

        const onMQTTError = (error: Error) => {
          console.error('❌ MQTT Error in HomeScreen:', error);
        };

        console.log('Establishing MQTT connection...');
        mqttClientRef.current = connectAndSubscribeMQTT(onMQTTMessage, onMQTTError);
        
        if (mqttClientRef.current) {
          console.log('✅ MQTT client initialized');
        } else {
          console.warn('⚠️ MQTT client initialization returned null');
        }
      } catch (error) {
        console.error('Error in app initialization:', error);
      }
    };

    initializeApp();

    // Handle app lifecycle
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
      // DO NOT disconnect MQTT here - we want it to stay connected persistently
      // disconnectMQTT(mqttClientRef.current);
    };
  }, [dispatch, handleAppStateChange]);

 const renderOrderItem = ({ item }: { item: FoodOrder }) => {
  const isExpanded = expandedOrderId === item.orderId;
  const primaryItemName = item.orderDetails.length > 0 ? item.orderDetails[0].itemName : 'Order';

  const animatedScale = animationRefs.current[item.orderId]?.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  }) || 1;

  const animatedOpacity = animationRefs.current[item.orderId]?.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  }) || 1;

  return (
    <Animated.View 
      style={[
        {
          height: heightAnimationRefs.current[item.orderId],
          overflow: 'hidden',
        },
      ]}
    >
      <Animated.View 
        style={[
          {
            transform: [{ scale: animatedScale }],
            opacity: animatedOpacity,
          },
        ]}
      >
        <View style={[styles.orderCard, isDarkMode && styles.darkCard]}>
      
      {/* CLICKABLE HEADER */}
      <View style={[styles.orderHeader, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }]}>
        <View style={{ flex: 1 }}>
          <TouchableOpacity
            onPress={() =>
              setExpandedOrderId(isExpanded ? null : item.orderId)
            }
          >
            <View>
              <Text style={[styles.orderName, isDarkMode && styles.darkText]}>
                {primaryItemName}
              </Text>
              <Text style={[styles.orderId, isDarkMode && styles.darkSubText]}>
                Order #: {item.orderId} | Q: {item.qNumber}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
        
        <View style={{ flexDirection: 'column', alignItems: 'center', marginLeft: 10 }}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.printBtn, { width: 50, height: 50, justifyContent: 'center', alignItems: 'center' }]}
            onPress={() => handlePrint(item)}
          >
            <Text style={[styles.actionBtnText, { fontSize: 28 }]}>🖨️</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() =>
              setExpandedOrderId(isExpanded ? null : item.orderId)
            }
            style={{
              marginTop: 8,
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: isDarkMode ? '#333' : '#f0f0f0',
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 1.5,
              borderColor: isDarkMode ? '#555' : '#ddd',
            }}
          >
            <Text style={{ fontSize: 20 }}>{isExpanded ? '⬆️' : '⬇️'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ACCORDION CONTENT */}
      {isExpanded && (
        <>
          <View style={styles.orderDetails}>
            <Text style={[styles.orderInfo, isDarkMode && styles.darkSubText]}>
              Table: {item.tableName} | Guests: {item.guests}
            </Text>
            <Text style={[styles.orderInfo, isDarkMode && styles.darkSubText]}>
              Items: {item.orderDetails.length} | Total: ${item.invoiceTotal.toFixed(2)}
            </Text>
            <Text style={[styles.timestamp, isDarkMode && styles.darkSubText]}>
              {new Date(item.createdAt).toLocaleTimeString()}
            </Text>
            <Text style={[styles.orderInfo, isDarkMode && styles.darkSubText]}>
              Status: {getStatusLabel(item.status)}
            </Text>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.cancelBtn]}
              onPress={() => handleCancel(item)}
            >
              <Text style={styles.actionBtnText}>⛔ Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.deleteBtn]}
              onPress={() => handleDelete(item)}
            >
              <Text style={styles.actionBtnText}>🗑️ Delete</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
      </View>
    </Animated.View>
    </Animated.View>
  );
};

  return (
    <View style={[styles.container, isDarkMode && styles.darkContainer]}>
      {/* Modern Header with Logo */}
      <View
        style={[
          styles.headerContainer,
          isDarkMode && styles.darkHeaderContainer,
        ]}
      >
        <View style={styles.headerGradientBg}>
          <View style={styles.headerContent}>
            <View style={styles.logoSection}>
              <View style={styles.logoCircle}>
                <Text style={styles.logoIcon}>🖨️</Text>
              </View>
              <View style={styles.brandText}>
                <Text style={styles.brandName}>KitPrint</Text>
                <Text style={styles.brandTagline}>Order Management</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={toggleTheme}>
              <View style={styles.logoutBadge}>
                <Text style={styles.logoutText}>
                  {isDarkMode ? '☀️' : '🌙'}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={() => {
                Alert.alert('Logout', 'Are you sure?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Logout', onPress: onLogout, style: 'destructive' },
                ]);
              }}
            >
              <View style={styles.logoutBadge}>
                <Text style={styles.logoutText}>🚪</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Welcome Banner */}
          <View style={styles.welcomeBanner}>
            <Text style={styles.welcomeText}>
              Welcome to Your Kitchen Dashboard
            </Text>
            <Text style={styles.welcomeSubtext}>
              Manage food orders efficiently with real-time updates
            </Text>
          </View>
        </View>
      </View>

      {/* Stats Bar */}
      <View style={[styles.statsBar, isDarkMode && styles.darkStatsBar]}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{mainOrders.length}</Text>
          <Text style={[styles.statLabel, isDarkMode && styles.darkText]}>
            Total Orders
          </Text>
        </View>
      </View>

      {/* Refresh Button */}
      <TouchableOpacity
        style={[styles.refreshButton, isDarkMode && styles.darkRefreshButton]}
        onPress={() => dispatch(fetchOrders('D0001'))}
      >
        <Text style={styles.refreshButtonText}>
          {loading ? '⏳ Refreshing...' : '🔄 Refresh Orders'}
        </Text>
      </TouchableOpacity>

      {loading && (
        <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
      )}

      {isPrinting && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 999,
          }}
        >
          <View
            style={{
              backgroundColor: 'white',
              padding: 20,
              borderRadius: 10,
              alignItems: 'center',
            }}
          >
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={{ marginTop: 10, fontSize: 16, fontWeight: '600' }}>
              Connecting to Printer...
            </Text>
          </View>
        </View>
      )}

      {mainOrders.length === 0 && !loading && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={[styles.emptyText, isDarkMode && styles.darkText]}>
            No orders yet
          </Text>
          <Text style={styles.emptySubtext}>
            Orders will appear here in real-time
          </Text>
        </View>
      )}
      <FlatList
        data={mainOrders
          .filter(
            order =>
              order && order.orderId !== undefined && order.orderId !== null,
          )
          .sort((a, b) => b.orderId - a.orderId)}
        renderItem={renderOrderItem}
        keyExtractor={item => `order-${item.orderId || Math.random()}`}
        contentContainerStyle={styles.listContent}
        scrollEnabled={true}
      />

      {/* Print Receipt Modal */}
      <Modal
        visible={printModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setPrintModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View
            style={[styles.printModal, isDarkMode && styles.darkPrintModal]}
          >
            <View style={styles.receiptHeader}>
              <View>
                <Text style={styles.receiptTitle}>🖨️ KITPRINT</Text>
                <Text style={styles.receiptSubtitle}>Receipt</Text>
              </View>
              <TouchableOpacity
                onPress={() => setPrintModalVisible(false)}
                style={styles.closeBtn}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedOrderForPrint && (
              <ScrollView style={styles.receiptContent}>
                {selectedOrderForPrint && (
                  <View style={{ padding: 15 }}>
                    <Text
                      style={{
                        textAlign: 'center',
                        fontSize: 18,
                        fontWeight: 'bold',
                      }}
                    >
                      TechNow Software
                    </Text>

                    <Text style={{ textAlign: 'center' }}>
                      123 Main Street, City, Country
                    </Text>

                    <Text style={{ textAlign: 'center' }}>+65 81805352</Text>

                    <Text>
                      ------------------------------------------------
                    </Text>

                    <Text>Order No. {selectedOrderForPrint.orderId}</Text>

                    <Text>
                      Order Date{' '}
                      {new Date(
                        selectedOrderForPrint.createdAt,
                      ).toLocaleString()}
                    </Text>

                    <Text>
                      ------------------------------------------------
                    </Text>

                    <Text style={{ fontWeight: 'bold' }}>Customer Info</Text>

                    <Text>
                      Customer Name: {selectedOrderForPrint.customerName || ''}
                    </Text>

                    <Text>Mobile: {selectedOrderForPrint.phone || ''}</Text>

                    <Text>Delivery Address:</Text>

                    <Text>{selectedOrderForPrint.address || ''}</Text>

                    <Text>
                      ------------------------------------------------
                    </Text>

                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        marginBottom: 8,
                      }}
                    >
                      <Text style={{ flex: 3, fontWeight: 'bold' }}>Item</Text>

                      <Text style={{ flex: 1, fontWeight: 'bold' }}>Qty</Text>

                      <Text style={{ flex: 1, fontWeight: 'bold' }}>
                        Amount
                      </Text>
                    </View>

                    <Text>
                      ------------------------------------------------
                    </Text>

                    {selectedOrderForPrint.orderDetails.map((item, index) => (
                      <View
                        key={index}
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          marginVertical: 2,
                        }}
                      >
                        <Text style={{ flex: 3 }}>{item.itemName}</Text>

                        <Text style={{ flex: 1 }}>{item.quantity}</Text>

                        <Text style={{ flex: 1 }}>
                          ${item.itemTotal.toFixed(2)}
                        </Text>
                      </View>
                    ))}

                    <Text>-----------------------------------------------</Text>

                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Text
                        style={{
                          fontWeight: 'bold',
                          fontSize: 18,
                        }}
                      >
                        TOTAL:
                      </Text>

                      <Text
                        style={{
                          fontWeight: 'bold',
                          fontSize: 18,
                        }}
                      >
                        ${selectedOrderForPrint.invoiceTotal.toFixed(2)}
                      </Text>
                    </View>

                    <Text>-----------------------------------------------</Text>

                    <Text>
                      Payment By: {selectedOrderForPrint.paymentMethod}
                    </Text>

                    <Text>-----------------------------------------------</Text>

                    <Text
                      style={{
                        textAlign: 'center',
                        marginTop: 10,
                        fontWeight: '600',
                      }}
                    >
                      Thank you for your visit!
                    </Text>
                  </View>
                )}
              </ScrollView>
            )}

            <View style={styles.printModalButtons}>
              <TouchableOpacity
                style={[styles.printModalBtn, styles.cancelModalBtn]}
                onPress={() => setPrintModalVisible(false)}
              >
                <Text style={[styles.printModalBtnText, styles.cancelBtnText]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.printModalBtn, styles.confirmPrintBtn]}
                onPress={() => confirmPrint(selectedOrderForPrint!)}
              >
                <Text style={styles.printModalBtnText}>🖨️ Print</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* User Key Modal */}
      <Modal
        visible={userKeyModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setUserKeyModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              backgroundColor: isDarkMode ? '#222' : 'white',
              borderRadius: 12,
              padding: 20,
              width: '85%',
              maxWidth: 400,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: '600',
                marginBottom: 8,
                color: isDarkMode ? '#fff' : '#000',
              }}
            >
              Enter User Key
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: isDarkMode ? '#ccc' : '#666',
                marginBottom: 16,
              }}
            >
              Enter your 4-digit user key to fetch orders:
            </Text>

            <TextInput
              style={{
                borderWidth: 1,
                borderColor: isDarkMode ? '#444' : '#ddd',
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
                color: isDarkMode ? '#fff' : '#000',
                backgroundColor: isDarkMode ? '#333' : '#f9f9f9',
                marginBottom: 16,
              }}
              placeholder="Enter 4-digit key"
              placeholderTextColor={isDarkMode ? '#888' : '#999'}
              keyboardType="number-pad"
              maxLength={4}
              value={userKeyInput}
              onChangeText={setUserKeyInput}
            />

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'flex-end',
                gap: 10,
              }}
            >
              <TouchableOpacity
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 6,
                }}
                onPress={() => {
                  setUserKeyModalVisible(false);
                  setUserKeyInput('');
                }}
              >
                <Text
                  style={{ fontSize: 14, fontWeight: '600', color: '#007AFF' }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  backgroundColor: '#007AFF',
                  borderRadius: 6,
                }}
                onPress={submitUserKey}
              >
                <Text
                  style={{ fontSize: 14, fontWeight: '600', color: 'white' }}
                >
                  Fetch
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default HomeScreen;
