import { FoodOrder } from '../types/FoodOrder';

const API_BASE_URL = 'https://orderprint.lunchbox-online.com/api';

//const API_BASE_URL = 'http://10.147.190.75:5000/api';
const API_KEY = 'AMROBOT123#';

interface ApiResponse<T> {
  success: boolean;
  data: T[];
  count: number;
}

/**
 * Fetch all orders from API
 */
export const fetchOrdersFromAPI = async (id: string): Promise<FoodOrder[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/PrintOrder/bills?kitchenId=${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
          'X-API-Key': API_KEY,
        'accept': '*/*',
      },
    });

    if (response.ok) {
      const data: ApiResponse<FoodOrder> = await response.json();
      console.log('Fetched orders from API:', data.data);
      return data.data || [];
    } else {
      console.error('Failed to fetch orders - Status:', response.status, response.statusText);
      return [];
    }
  } catch (error: any) {
    console.error('API fetch error:', error.message);
    console.error('Full error:', error);
    return [];
  }
};

/**
 * Cancel an order
 */
export const cancelOrder = async (orderId: number): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/PrintOrder/${orderId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
    });
    return response.ok;
  } catch (error) {
    console.error('Cancel error:', error);
    return false;
  }
};

/**
 * Delete an order
 */
export const deleteOrder = async (orderId: number): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/PrintOrder/${orderId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ' x-api-key': API_KEY,
      },
    });
    return response.ok;
  } catch (error) {
    console.error('Delete error:', error);
    return false;
  }
};

/**
 * Update order status
 */
export const updateOrderStatus = async (orderId: number, status: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/PrintOrder/updateStatus`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
      body: JSON.stringify({
        orderId: orderId,
        status: status,
      }),
    });
    return response.ok;
  } catch (error) {
    console.error('Update status error:', error);
    return false;
  }
};
