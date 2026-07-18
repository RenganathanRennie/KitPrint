/**
 * KitPrint App with Biometric Authentication
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';

const Stack = createStackNavigator();

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              animationEnabled: false,
            }}
          >
            {!isLoggedIn ? (
              <Stack.Screen
                name="Login"
                options={{
                  gestureEnabled: false,
                  cardStyle: { backgroundColor: '#fff' },
                }}
              >
                {() => <LoginScreen onLogin={handleLogin} />}
              </Stack.Screen>
            ) : (
              <Stack.Screen
                name="Home"
                options={{
                  gestureEnabled: false,
                }}
              >
                {() => <HomeScreen onLogout={handleLogout} />}
              </Stack.Screen>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </Provider>
  );
}

export default App;
