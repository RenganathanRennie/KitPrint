import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import ReactNativeBiometrics from 'react-native-biometrics';
import { loginScreenStyles as styles } from '../styles/customStyles';

interface LoginScreenProps {
  onLogin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const rnBiometrics = new ReactNativeBiometrics();
      const { available, biometryType } = await rnBiometrics.isSensorAvailable();
      setIsBiometricAvailable(available);
      if (available) {
        console.log('Biometric available:', biometryType);
      }
    } catch (error) {
      console.error('Error checking biometrics:', error);
      setIsBiometricAvailable(false);
    }
  };

  const handleBiometricLogin = async () => {
    if (!isBiometricAvailable) {
      Alert.alert('Error', 'Biometric authentication is not available on this device');
      return;
    }

    // Prevent multiple taps while loading
    if (loading) {
      return;
    }

    setLoading(true);
    try {
      const rnBiometrics = new ReactNativeBiometrics();
      const { success } = await rnBiometrics.simplePrompt({
        promptMessage: 'Authenticate to access KitPrint',
      });

      // Strict check: only proceed if authentication was successful
      if (success) {
        setLoading(false);
        onLogin();
      } else {
        // Authentication failed or was cancelled
        setLoading(false);
        Alert.alert('Login Failed', 'Authentication was not successful. Please try again.');
      }
    } catch (error) {
      setLoading(false);
      let errorMessage = 'Authentication failed. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('User cancelled') || error.message.includes('cancelled')) {
          errorMessage = 'Login cancelled. Please authenticate to continue.';
        } else if (error.message.includes('Biometric locked')) {
          errorMessage = 'Biometric authentication is temporarily locked. Please try again later.';
        }
      }
      
      Alert.alert('Login Required', errorMessage);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>KitPrint</Text>
        <Text style={styles.subtitle}>Welcome Back</Text>

        {loading && <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />}

        {isBiometricAvailable && (
          <TouchableOpacity
            style={styles.biometricButton}
            onPress={handleBiometricLogin}
            disabled={loading}
          >
            <Text style={styles.biometricButtonText}>Login with Biometric</Text>
          </TouchableOpacity>
        )}

      

        {!isBiometricAvailable && (
          <Text style={styles.warningText}>
            Biometric authentication not available on this device
          </Text>
        )}
      </View>
    </View>
  );
};

export default LoginScreen;
