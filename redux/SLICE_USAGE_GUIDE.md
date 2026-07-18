// Redux Slice Usage Guide - KitPrint

// LOCATION: redux/slices/ordersSlice.ts

// ============================================
// EXPORTED ASYNC THUNKS (API Calls)
// ============================================

// 1. Fetch all orders from API
export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async (_, { rejectWithValue }) => { ... }
);
// Usage: await dispatch(fetchOrders());
// Returns: Array of FoodOrder objects
// Updates state.orders.items with fetched orders
// Handles: loading, error states automatically


// 2. Cancel an order
export const cancelOrderAsync = createAsyncThunk(
  'orders/cancelOrder',
  async (orderId: string, { rejectWithValue }) => { ... }
);
// Usage: await dispatch(cancelOrderAsync('ORD-001'));
// Returns: Order ID if successful
// Updates: Sets order status to 'cancelled'
// Handles: loading, error states automatically


// 3. Delete an order
export const deleteOrderAsync = createAsyncThunk(
  'orders/deleteOrder',
  async (orderId: string, { rejectWithValue }) => { ... }
);
// Usage: await dispatch(deleteOrderAsync('ORD-001'));
// Returns: Order ID if successful
// Removes: Order from state.orders.items
// Handles: loading, error states automatically


// ============================================
// EXPORTED ACTIONS (Synchronous)
// ============================================

// 1. Update order from MQTT message
export const { updateOrderFromMQTT } = ordersSlice.actions;
// Usage: dispatch(updateOrderFromMQTT(newOrderObject));
// Updates: Existing order or adds new order in real-time
// Perfect for: MQTT message handling


// 2. Clear all orders
export const { clearOrders } = ordersSlice.actions;
// Usage: dispatch(clearOrders());
// Clears: All orders from Redux state
// Perfect for: Logout, reset scenarios


// ============================================
// REDUX STATE STRUCTURE
// ============================================

const state = {
  orders: {
    items: [],        // Array of FoodOrder objects
    loading: false,   // Loading state for API calls
    error: null,      // Error message string
  }
};


// ============================================
// HOW TO USE IN COMPONENTS
// ============================================

import { useAppDispatch, useAppSelector } from '../redux/hooks';
import {
  fetchOrders,
  cancelOrderAsync,
  deleteOrderAsync,
  updateOrderFromMQTT,
} from '../redux/slices/ordersSlice';

function MyComponent() {
  const dispatch = useAppDispatch();
  const { items: orders, loading, error } = useAppSelector((state) => state.orders);

  // Example 1: Fetch orders on mount
  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch]);

  // Example 2: Cancel an order
  const handleCancel = async (orderId: string) => {
    const result = await dispatch(cancelOrderAsync(orderId));
    if (result.payload) {
      console.log('Order cancelled:', orderId);
    } else {
      console.log('Failed to cancel order:', result.error);
    }
  };

  // Example 3: Delete an order
  const handleDelete = async (orderId: string) => {
    const result = await dispatch(deleteOrderAsync(orderId));
    if (result.payload) {
      console.log('Order deleted:', orderId);
    }
  };

  // Example 4: Handle MQTT updates
  const handleMQTTMessage = (newOrder) => {
    dispatch(updateOrderFromMQTT(newOrder));
  };

  // Render with Redux state
  return (
    <View>
      {loading && <Text>Loading orders...</Text>}
      {error && <Text>Error: {error}</Text>}
      {orders.map((order) => (
        <Text key={order.id}>{order.name}</Text>
      ))}
    </View>
  );
}


// ============================================
// CURRENT INTEGRATION IN HomeScreen.tsx
// ============================================

// Initialize on mount
useEffect(() => {
  const initializeApp = async () => {
    // Fetch initial data from Redux
    await dispatch(fetchOrders());

    // Subscribe to MQTT
    const onMQTTMessage = (newOrder) => {
      dispatch(updateOrderFromMQTT(newOrder));
    };

    mqttClientRef.current = connectAndSubscribeMQTT(onMQTTMessage);
  };

  initializeApp();

  // Handle app lifecycle
  const subscription = AppState.addEventListener('change', handleAppStateChange);

  return () => {
    subscription.remove();
    disconnectMQTT(mqttClientRef.current);
  };
}, [dispatch, handleAppStateChange]);


// ============================================
// FILES TO REFERENCE
// ============================================

// 1. redux/slices/ordersSlice.ts       - Slice definition
// 2. redux/store.ts                    - Store configuration
// 3. redux/hooks.ts                    - Custom hooks (useAppDispatch, useAppSelector)
// 4. screens/HomeScreen.tsx            - Live implementation example
