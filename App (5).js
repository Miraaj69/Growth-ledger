// App.js — Updated to include CalculatorsScreen
// Drop-in replacement for your existing App.js
import React, { useCallback } from 'react';
import { View, StatusBar, Platform, Text, Pressable, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  useFonts, Syne_500Medium, Syne_600SemiBold, Syne_700Bold, Syne_800ExtraBold,
} from '@expo-google-fonts/syne';
import { DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold } from '@expo-google-fonts/dm-sans';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppProvider }             from './AppContext';
import { ThemeProvider, useTheme } from './ThemeContext';

import HomeScreen          from './HomeScreen';
import MoneyScreen         from './MoneyScreen';
import InsightsScreen      from './InsightsScreen';
import ProfileScreen       from './ProfileScreen';
import TaxScreen           from './TaxScreen';
import SimulatorScreen     from './SimulatorScreen';
import DecisionScreen      from './DecisionScreen';
import CashFlowScreen      from './CashFlowScreen';
import GrowthScreen        from './GrowthScreen';
import CalculatorsScreen   from './CalculatorsScreen'; // ← NEW

SplashScreen.preventAutoHideAsync().catch(() => {});

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ── 5 tabs: replace Insights with Calculators, keep Growth ──
const TABS = [
  { name: 'Home',        icon: '🏠', label: 'Home'    },
  { name: 'Money',       icon: '💵', label: 'Money'   },
  { name: 'Growth',      icon: '🚀', label: 'Growth'  },
  { name: 'Calculators', icon: '🧮', label: 'Calc'    },
  { name: 'Profile',     icon: '👤', label: 'Profile' },
];

function TabBar({ state, navigation }) {
  const { T } = useTheme();
  return (
    <View style={[st.tabBar, {
      backgroundColor: T.mode === 'amoled' ? '#000' : T.mode === 'light' ? '#fff' : 'rgba(8,13,26,0.97)',
      borderTopColor: T.border,
    }]}>
      {state.routes.map((route, i) => {
        const tab = TABS.find(t => t.name === route.name);
        const on  = state.index === i;
        return (
          <Pressable key={route.key}
            onPress={() => { if (!on) navigation.navigate(route.name); }}
            style={st.tabItem}
            android_ripple={{ color: T.blueD, borderless: true }}>
            <View style={[st.tabPill, on && { backgroundColor: '#4F8CFF22' }]}>
              <Text style={{ fontSize: 20, opacity: on ? 1 : 0.32 }}>{tab?.icon}</Text>
            </View>
            <Text style={{ fontSize: 10, fontWeight: on ? '700' : '500', color: on ? '#4F8CFF' : T.t3, letterSpacing: 0.2 }}>
              {tab?.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function HomeStack() {
  const { T } = useTheme();
  const headerOpts = {
    headerStyle: { backgroundColor: T.bg },
    headerTintColor: T.t1,
    headerTitleStyle: { fontWeight: '700', fontSize: 17 },
    headerShadowVisible: false,
  };
  return (
    <Stack.Navigator screenOptions={headerOpts}>
      <Stack.Screen name="Dashboard"  component={HomeScreen}      options={{ headerShown: false }} />
      <Stack.Screen name="Tax"        component={TaxScreen}       options={{ title: '🧾 Tax Estimator'  }} />
      <Stack.Screen name="Simulator"  component={SimulatorScreen} options={{ title: '📊 Simulator'       }} />
      <Stack.Screen name="Decisions"  component={DecisionScreen}  options={{ title: '🧠 AI Decisions'    }} />
      <Stack.Screen name="CashFlow"   component={CashFlowScreen}  options={{ title: '🌊 Cash Flow'       }} />
      <Stack.Screen name="Insights"   component={InsightsScreen}  options={{ title: '📊 Insights'        }} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator tabBar={p => <TabBar {...p} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home"        component={HomeStack}          />
      <Tab.Screen name="Money"       component={MoneyScreen}        />
      <Tab.Screen name="Growth"      component={GrowthScreen}       />
      <Tab.Screen name="Calculators" component={CalculatorsScreen}  />
      <Tab.Screen name="Profile"     component={ProfileScreen}      />
    </Tab.Navigator>
  );
}

function ThemedApp() {
  const { T, mode } = useTheme();
  return (
    <>
      <StatusBar barStyle={mode === 'light' ? 'dark-content' : 'light-content'} backgroundColor={T.bg} />
      <NavigationContainer theme={{
        dark: mode !== 'light',
        colors: { primary: '#4F8CFF', background: T.bg, card: T.l1, text: T.t1, border: T.border, notification: '#EF4444' },
      }}>
        <MainTabs />
      </NavigationContainer>
    </>
  );
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Syne_500Medium, Syne_600SemiBold, Syne_700Bold, Syne_800ExtraBold,
    DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold,
  });

  const onLayout = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayout}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppProvider>
            <ThemedApp />
          </AppProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const st = StyleSheet.create({
  tabBar: {
    flexDirection: 'row', borderTopWidth: 1,
    paddingTop: 10, paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    paddingHorizontal: 4, elevation: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.4, shadowRadius: 10,
  },
  tabItem: { flex: 1, alignItems: 'center', gap: 3 },
  tabPill: { width: 44, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
