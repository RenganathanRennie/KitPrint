import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { FoodOrder } from '../../types/FoodOrder';
import { fetchOrdersFromAPI as fetchOrdersAPI, cancelOrder, deleteOrder, updateOrderStatus } from '../../services/api';

interface OrdersState {
  items: FoodOrder[];
  loading: boolean;
  error: string | null;
}

const initialState: OrdersState = {
  items: [],
  loading: false,
  error: null,
};

// Async thunk for fetching orders - Initial load from API
export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async (id: string, { rejectWithValue }) => {
    try {
      console.log('📡 Fetching initial orders from API...');
      const apiOrders = await fetchOrdersAPI(id);
      console.log('✅ Initial orders loaded from API:', apiOrders.length, 'orders');
      return apiOrders;
    } catch (error) {
      console.error('❌ Failed to fetch orders from API:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch orders');
    }
  }
);

// Async thunk for cancelling an order
export const cancelOrderAsync = createAsyncThunk(
  'orders/cancelOrder',
  async (orderId: number, { rejectWithValue }) => {
    try {
      const success = await cancelOrder(orderId);
      if (success) {
        return orderId;
      } else {
        return rejectWithValue('Failed to cancel order');
      }
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to cancel order');
    }
  }
);

// Async thunk for deleting an order
export const deleteOrderAsync = createAsyncThunk(
  'orders/deleteOrder',
  async (orderId: number, { rejectWithValue }) => {
    try {
      const success = await deleteOrder(orderId);
      if (success) {
        return orderId;
      } else {
        return rejectWithValue('Failed to delete order');
      }
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete order');
    }
  }
);

// Async thunk for updating order status
export const updateOrderStatusAsync = createAsyncThunk(
  'orders/updateOrderStatus',
  async ({ orderId, status }: { orderId: number; status: string }, { rejectWithValue }) => {
    try {
      const success = await updateOrderStatus(orderId, status);
      if (success) {
        return { orderId, status };
      } else {
        return rejectWithValue('Failed to update order status');
      }
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update order status');
    }
  }
);

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    // Synchronous action to add/update order from MQTT
    updateOrderFromMQTT: (state, action) => {
      const newOrder = action.payload as FoodOrder;
      console.log('📦 Redux updateOrderFromMQTT called with order:', newOrder.orderId);
      const existingIndex = state.items.findIndex((order) => order.orderId === newOrder.orderId);

      if (existingIndex > -1) {
        // Update existing order
        console.log('🔄 Updating existing order:', newOrder.orderId);
        state.items[existingIndex] = newOrder;
      } else {
        // Add new order
        console.log('✨ Adding new order:', newOrder.orderId, 'Total orders now:', state.items.length + 1);
        state.items.push(newOrder);
      }
    },
    clearOrders: (state) => {
      state.items = [];
    },
  },
  extraReducers: (builder) => {
    // Fetch orders
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        // Only update if API returns data, otherwise keep existing state
        if (action.payload && action.payload.length > 0) {
          state.items = action.payload;
        }
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Cancel order
    builder
      .addCase(cancelOrderAsync.pending, (state) => {
        state.error = null;
      })
      .addCase(cancelOrderAsync.fulfilled, (state, action) => {
        const orderId = action.payload;
        // Remove cancelled order from the list
        state.items = state.items.filter((o) => o.orderId !== orderId);
      })
      .addCase(cancelOrderAsync.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Delete order
    builder
      .addCase(deleteOrderAsync.pending, (state) => {
        state.error = null;
      })
      .addCase(deleteOrderAsync.fulfilled, (state, action) => {
        const orderId = action.payload;
        state.items = state.items.filter((o) => o.orderId !== orderId);
      })
      .addCase(deleteOrderAsync.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Update order status
    builder
      .addCase(updateOrderStatusAsync.pending, (state) => {
        state.error = null;
      })
      .addCase(updateOrderStatusAsync.fulfilled, (state, action) => {
        const { orderId, status } = action.payload;
        // If status is Cancel, remove the order from the list
        if (status === 'Cancel') {
          state.items = state.items.filter((o) => o.orderId !== orderId);
        }
        // For other statuses like Printed, keep the order (status will be updated on next MQTT message)
      })
      .addCase(updateOrderStatusAsync.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { updateOrderFromMQTT, clearOrders } = ordersSlice.actions;
export default ordersSlice.reducer;
