// App.js
import React, { useCallback, useEffect } from 'react';
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

import { AppProvider, useApp }       from './AppContext';
import { ThemeProvider, useTheme }   from './ThemeContext';
import { triggerSmartNotifications } from './notifications';

import HomeScreen        from './HomeScreen';
import MoneyScreen       from './MoneyScreen';
import InsightsScreen    from './InsightsScreen';
import ProfileScreen     from './ProfileScreen';
import TaxScreen         from './TaxScreen';
import SimulatorScreen   from './SimulatorScreen';
import DecisionScreen    from './DecisionScreen';
import CashFlowScreen    from './CashFlowScreen';
import GrowthScreen      from './GrowthScreen';
import GoalsScreen       from './GoalsScreen';
import SplashAnimScreen  from './SplashAnimScreen';
import CalculatorsScreen from './CalculatorsScreen';

SplashScreen.preventAutoHideAsync().catch(() => {});

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ── Same 5 tabs as original — Calculators restored ────────
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
    <View style={[st.bar, {
      backgroundColor: T.mode === 'amoled' ? '#000' : T.mode === 'light' ? '#fff' : 'rgba(8,13,26,0.98)',
      borderTopColor: T.border,
    }]}>
      {state.routes.map((route, i) => {
        const tab = TABS.find(t => t.name === route.name);
        const on  = state.index === i;
        return (
          <Pressable key={route.key}
            onPress={() => { if (!on) navigation.navigate(route.name); }}
            style={st.tabItem}
            android_ripple={{ color: 'rgba(79,140,255,0.15)', borderless: true }}>
            {/* Active = pill with blue glow; Inactive = just icon + label */}
            {on ? (
              <View style={st.activePill}>
                <Text style={{ fontSize: 17 }}>{tab?.icon}</Text>
                <Text style={st.activeLabel}>{tab?.label}</Text>
              </View>
            ) : (
              <View style={st.inactiveItem}>
                <Text style={{ fontSize: 20, opacity: 0.35 }}>{tab?.icon}</Text>
                <Text style={[st.inactiveLabel, { color: T.t3 }]}>{tab?.label}</Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

// ── HomeStack — Dashboard + drill-in screens ──────────────
function HomeStack() {
  const { T } = useTheme();
  const hdr = {
    headerStyle:      { backgroundColor: T.bg },
    headerTintColor:  T.t1,
    headerTitleStyle: { fontWeight: '700', fontSize: 17 },
    headerShadowVisible: false,
  };
  return (
    <Stack.Navigator screenOptions={hdr}>
      <Stack.Screen name="Dashboard"  component={HomeScreen}      options={{ headerShown: false }} />
      <Stack.Screen name="Tax"        component={TaxScreen}       options={{ title: '🧾 Tax Estimator' }} />
      <Stack.Screen name="Simulator"  component={SimulatorScreen} options={{ title: '📊 Simulator'     }} />
      <Stack.Screen name="Decisions"  component={DecisionScreen}  options={{ title: '🧠 AI Decisions'  }} />
      <Stack.Screen name="CashFlow"   component={CashFlowScreen}  options={{ title: '🌊 Cash Flow'     }} />
      <Stack.Screen name="Insights"   component={InsightsScreen}  options={{ title: '📊 Insights'      }} />
      <Stack.Screen name="Goals"      component={GoalsScreen}     options={{ title: '🎯 Goal Planner'  }} />
    </Stack.Navigator>
  );
}

// ── Main Tabs — same structure as original ─────────────────
function MainTabs() {
  return (
    <Tab.Navigator tabBar={p => <TabBar {...p} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home"        component={HomeStack}         />
      <Tab.Screen name="Money"       component={MoneyScreen}       />
      <Tab.Screen name="Growth"      component={GrowthScreen}      />
      <Tab.Screen name="Calculators" component={CalculatorsScreen} />
      <Tab.Screen name="Profile"     component={ProfileScreen}     />
    </Tab.Navigator>
  );
}

// ── Auto smart notifications on launch ────────────────────
function NotifTrigger() {
  const { state } = useApp();
  useEffect(() => {
    const t = setTimeout(() => {
      triggerSmartNotifications(state).catch(() => {});
    }, 3000);
    return () => clearTimeout(t);
  }, []);
  return null;
}

// Fires DAILY_LOGIN once per session on mount
function DailyLoginTrigger() {
  const { dispatch } = useApp();
  React.useEffect(() => {
    dispatch({ type: 'DAILY_LOGIN' });
  }, []);
  return null;
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
        <NotifTrigger />
        <DailyLoginTrigger />
        <MainTabs />
      </NavigationContainer>
    </>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = React.useState(true);
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

  if (showSplash) {
    return (
      <SplashAnimScreen
        onDone={() => {
          setShowSplash(false);
        }}
      />
    );
  }

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
  bar: {
    flexDirection: 'row', borderTopWidth: 1,
    paddingTop: 8, paddingBottom: Platform.OS === 'ios' ? 28 : 10,
    paddingHorizontal: 8, elevation: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.4, shadowRadius: 12,
  },
  tabItem: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
  },
  // Active tab — horizontal pill with icon + label
  activePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#4F8CFF',
    borderRadius: 999,
    paddingHorizontal: 14, paddingVertical: 7,
    shadowColor: '#4F8CFF', shadowOpacity: 0.45,
    shadowRadius: 10, shadowOffset: { width: 0, height: 3 },
    elevation: 8,
  },
  activeLabel: {
    fontSize: 12, fontWeight: '700', color: '#fff', letterSpacing: 0.2,
  },
  // Inactive tab — just icon + tiny label below
  inactiveItem: { alignItems: 'center', gap: 2, paddingVertical: 4 },
  inactiveLabel: { fontSize: 10, fontWeight: '500', letterSpacing: 0.2 },
});
