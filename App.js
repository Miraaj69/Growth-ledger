// App.js — Premium Bottom Nav: vertical icon + label on active tab only
import React, { useCallback, useEffect } from 'react';
import { View, StatusBar, Platform, Text, Pressable, StyleSheet, Animated } from 'react-native';
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
import * as Haptics from 'expo-haptics';

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

// ── Tab definitions ───────────────────────────────────────
const TABS = [
  { name: 'Home',        icon: '🏠', label: 'Home'    },
  { name: 'Money',       icon: '💵', label: 'Money'   },
  { name: 'Growth',      icon: '🚀', label: 'Growth'  },
  { name: 'Calculators', icon: '🧮', label: 'Calc'    },
  { name: 'Profile',     icon: '👤', label: 'Profile' },
];

// ── Single animated tab item ──────────────────────────────
function TabItem({ tab, isActive, onPress }) {
  const { T } = useTheme();

  // Animated values — stable refs, never recreated
  const scale  = React.useRef(new Animated.Value(isActive ? 1.08 : 1)).current;
  const labelO = React.useRef(new Animated.Value(isActive ? 1 : 0)).current;
  const labelY = React.useRef(new Animated.Value(isActive ? 0 : 4)).current;
  const dotO   = React.useRef(new Animated.Value(isActive ? 1 : 0)).current;
  const dotW   = React.useRef(new Animated.Value(isActive ? 18 : 4)).current;

  React.useEffect(() => {
    if (isActive) {
      // Bounce the icon up on activation
      Animated.sequence([
        Animated.spring(scale, {
          toValue: 1.26,
          useNativeDriver: true,
          speed: 45,
          bounciness: 16,
        }),
        Animated.spring(scale, {
          toValue: 1.08,
          useNativeDriver: true,
          speed: 28,
          bounciness: 2,
        }),
      ]).start();

      // Label slides up into view
      Animated.parallel([
        Animated.spring(labelY, { toValue: 0,  useNativeDriver: true, speed: 28, bounciness: 4 }),
        Animated.timing(labelO, { toValue: 1,  duration: 220, useNativeDriver: true }),
        Animated.timing(dotO,   { toValue: 1,  duration: 160, useNativeDriver: true }),
        Animated.spring(dotW,   { toValue: 18, useNativeDriver: false, speed: 30, bounciness: 6 }),
      ]).start();
    } else {
      // Icon shrinks back to rest
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 30,
        bounciness: 0,
      }).start();

      // Label fades + slides down out of view
      Animated.parallel([
        Animated.timing(labelO, { toValue: 0, duration: 130, useNativeDriver: true }),
        Animated.spring(labelY, { toValue: 4, useNativeDriver: true, speed: 30, bounciness: 0 }),
        Animated.timing(dotO,   { toValue: 0, duration: 130, useNativeDriver: true }),
        Animated.spring(dotW,   { toValue: 4, useNativeDriver: false, speed: 30, bounciness: 0 }),
      ]).start();
    }
  }, [isActive]);

  return (
    <Pressable
      onPress={() => {
        if (!isActive) {
          try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
          onPress();
        }
      }}
      style={st.tabItem}
      android_ripple={{ color: 'rgba(79,140,255,0.12)', borderless: true, radius: 36 }}
    >
      <View style={st.tabInner}>

        {/* ── Icon ── */}
        <Animated.Text
          style={[
            st.tabIcon,
            {
              opacity: isActive ? 1 : 0.35,
              transform: [{ scale }],
            },
          ]}
        >
          {tab?.icon}
        </Animated.Text>

        {/* ── Label — only rendered for active tab (animated in/out) ── */}
        <Animated.Text
          style={[
            st.tabLabel,
            { color: '#4F8CFF', opacity: labelO, transform: [{ translateY: labelY }] },
          ]}
          numberOfLines={1}
        >
          {tab?.label}
        </Animated.Text>

        {/* ── Dot indicator — expands into pill when active ── */}
        <Animated.View
          style={[
            st.tabDot,
            { opacity: dotO, width: dotW, backgroundColor: '#4F8CFF' },
          ]}
        />
      </View>
    </Pressable>
  );
}

// ── Bottom Tab Bar container ──────────────────────────────
function TabBar({ state, navigation }) {
  const { T } = useTheme();

  const barBg =
    T.mode === 'amoled' ? '#000000' :
    T.mode === 'light'  ? '#ffffff' :
    'rgba(10,15,28,0.98)';

  return (
    <View style={[st.bar, { backgroundColor: barBg, borderTopColor: T.border }]}>
      {state.routes.map((route, i) => {
        const tab      = TABS.find(t => t.name === route.name);
        const isActive = state.index === i;
        return (
          <TabItem
            key={route.key}
            tab={tab}
            isActive={isActive}
            onPress={() => navigation.navigate(route.name)}
          />
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

// ── Main Tabs ─────────────────────────────────────────────
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
    return <SplashAnimScreen onDone={() => setShowSplash(false)} />;
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

// ── Styles ────────────────────────────────────────────────
const st = StyleSheet.create({
  // Bar container
  bar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    paddingHorizontal: 4,
    // Glass shadow lifting up from bottom
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 24,
  },

  // Each tab takes equal share
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },

  // Inner column: icon → label → dot
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    minHeight: 48,
  },

  // Icon: emoji rendered at base size, scale applied via Animated
  tabIcon: {
    fontSize: 22,
    lineHeight: 28,
    textAlign: 'center',
  },

  // Label: only visible when active (opacity animated)
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.1,
    textAlign: 'center',
    // Fixed height so layout doesn't jump when it fades in
    height: 14,
    lineHeight: 14,
  },

  // Dot indicator: tiny when inactive, pill when active (width animated)
  tabDot: {
    height: 3,
    borderRadius: 99,
    marginTop: 2,
  },
});
