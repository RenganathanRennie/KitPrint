import { Platform, PermissionsAndroid, NativeModules } from 'react-native';

const RNBluetoothClassic = NativeModules.RNBluetoothClassic || {};

interface BluetoothPrinter {
  name: string;
  address: string;
}

/**
 * Check if Bluetooth is enabled
 */
export const isBluetoothEnabled = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'android') {
      const BluetoothManager = NativeModules.BluetoothManager || {};
      return await BluetoothManager.isBluetoothEnabled?.();
    }
    return false;
  } catch (error) {
    console.error('Error checking Bluetooth status:', error);
    return false;
  }
};

/**
 * Enable Bluetooth
 */
export const enableBluetooth = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'android') {
      const BluetoothManager = NativeModules.BluetoothManager || {};
      return await BluetoothManager.enableBluetooth?.();
    }
    return false;
  } catch (error) {
    console.error('Error enabling Bluetooth:', error);
    return false;
  }
};

/**
 * Find available Bluetooth printers
 */
export const findBluetoothPrinters = async (): Promise<BluetoothPrinter[]> => {
  try {
    if (Platform.OS === 'android') {
      const permissions = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ]);

      if (
        permissions[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] ===
          PermissionsAndroid.RESULTS.GRANTED &&
        permissions[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] ===
          PermissionsAndroid.RESULTS.GRANTED
      ) {
        const BluetoothManager = NativeModules.BluetoothManager || {};
        const devices = await BluetoothManager.getDeviceList?.();
        return devices || [];
      }
    }
    return [];
  } catch (error) {
    console.error('Error finding Bluetooth printers:', error);
    return [];
  }
};

/**
 * Connect to Bluetooth printer and print
 */
export const printViaBluetooth = async (
  address: string,
  data: string
): Promise<boolean> => {
  try {
    if (Platform.OS === 'android') {
      const BluetoothManager = NativeModules.BluetoothManager || {};
      
      // Connect to device
      const connected = await BluetoothManager.connect?.(address);
      
      if (!connected) {
        throw new Error('Failed to connect to printer');
      }

      // Send data to printer
      const printed = await BluetoothManager.write?.(data);
      
      // Disconnect
      await BluetoothManager.disconnect?.();
      
      return printed;
    }
    return false;
  } catch (error) {
    console.error('Error printing via Bluetooth:', error);
    return false;
  }
};
