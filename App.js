// App.js
import React, { useCallback } from 'react';
import { View, StatusBar, StyleSheet, Platform, Text, Pressable } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts, Syne_500Medium, Syne_600SemiBold, Syne_700Bold, Syne_800ExtraBold } from '@expo-google-fonts/syne';
import { DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold } from '@expo-google-fonts/dm-sans';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppProvider } from './AppContext';
import { Colors } from './theme';

import HomeScreen     from './HomeScreen';
import MoneyScreen    from './MoneyScreen';
import CashFlowScreen from './CashFlowScreen';
import GrowthScreen   from './GrowthScreen';
import InsightsScreen from './InsightsScreen';
import ProfileScreen  from './ProfileScreen';

SplashScreen.preventAutoHideAsync().catch(() => {});

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TAB_ICONS = { Home:'🏠', Money:'💵', Flow:'🌊', Growth:'🚀', Insights:'📊', Profile:'👤' };

function CustomTabBar({ state, navigation }) {
  return (
    <View style={tbStyles.container}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        return (
          <Pressable
            key={route.key}
            onPress={() => { if (!isFocused) navigation.navigate(route.name); }}
            style={tbStyles.tab}
            android_ripple={{ color: Colors.blueDim, borderless: true }}
          >
            <View style={[tbStyles.tabInner, isFocused && tbStyles.tabActive]}>
              <Text style={{ fontSize: 20, opacity: isFocused ? 1 : 0.35 }}>{TAB_ICONS[route.name]}</Text>
            </View>
            <Text style={[tbStyles.label, isFocused && tbStyles.labelActive]}>{route.name}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator tabBar={(props) => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home"     component={HomeScreen}     />
      <Tab.Screen name="Money"    component={MoneyScreen}    />
      <Tab.Screen name="Flow"     component={CashFlowScreen} />
      <Tab.Screen name="Growth"   component={GrowthScreen}   />
      <Tab.Screen name="Insights" component={InsightsScreen} />
      <Tab.Screen name="Profile"  component={ProfileScreen}  />
    </Tab.Navigator>
  );
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Syne_500Medium, Syne_600SemiBold, Syne_700Bold, Syne_800ExtraBold,
    DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <AppProvider>
          <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
          <NavigationContainer
            theme={{ dark: true, colors: { primary: Colors.blue, background: Colors.bg, card: Colors.layer1, text: Colors.t1, border: Colors.border, notification: Colors.red } }}
          >
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Main" component={MainTabs} />
            </Stack.Navigator>
          </NavigationContainer>
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const tbStyles = StyleSheet.create({
  container:   { flexDirection: 'row', backgroundColor: 'rgba(8,13,26,0.97)', borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 10, paddingBottom: Platform.OS === 'ios' ? 28 : 12, paddingHorizontal: 4, elevation: 20 },
  tab:         { flex: 1, alignItems: 'center', gap: 3 },
  tabInner:    { width: 44, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  tabActive:   { backgroundColor: Colors.blueDim },
  label:       { fontSize: 10, fontWeight: '500', color: Colors.t3, letterSpacing: 0.2 },
  labelActive: { color: Colors.blue, fontWeight: '700' },
});
