// App.js — Fixed: no more native/JS driver conflict on tab bar animations
// ROOT CAUSE: dotW used useNativeDriver:false while other anims on the same
// component used useNativeDriver:true. React Native forbids mixing drivers on
// the same animated node.
// FIX: Replace width animation (JS-only) with scaleX + opacity (fully native).

import React, { useCallback, useEffect } from 'react';
import {
  View, StatusBar, Platform, Text, Pressable, StyleSheet, Animated,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  useFonts,
  Syne_500Medium, Syne_600SemiBold, Syne_700Bold, Syne_800ExtraBold,
} from '@expo-google-fonts/syne';
import {
  DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold,
} from '@expo-google-fonts/dm-sans';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { AppProvider, useApp }      from './AppContext';
import { ThemeProvider, useTheme }  from './ThemeContext';
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

// ── Tab definitions ────────────────────────────────────────────────────────
const TABS = [
  { name: 'Home',        icon: '🏠', label: 'Home'    },
  { name: 'Money',       icon: '💵', label: 'Money'   },
  { name: 'Growth',      icon: '🚀', label: 'Growth'  },
  { name: 'Calculators', icon: '🧮', label: 'Calc'    },
  { name: 'Profile',     icon: '👤', label: 'Profile' },
];

// ── Single animated tab item ───────────────────────────────────────────────
// ALL animations now use useNativeDriver:true — no more mixed-driver crash.
// The dot "width expand" effect is replaced by scaleX on a fixed-width pill,
// which is 100% native-driver compatible.
function TabItem({ tab, isActive, onPress }) {
  const { T } = useTheme();

  // ── Stable animated value refs ────────────────────────────────────────
  const scale   = React.useRef(new Animated.Value(isActive ? 1.08 : 1)).current;
  const labelO  = React.useRef(new Animated.Value(isActive ? 1 : 0)).current;
  const labelY  = React.useRef(new Animated.Value(isActive ? 0 : 4)).current;
  // Dot: opacity + scaleX (native-driver OK — no width mutation)
  const dotO    = React.useRef(new Animated.Value(isActive ? 1 : 0)).current;
  const dotSX   = React.useRef(new Animated.Value(isActive ? 1 : 0.2)).current;

  React.useEffect(() => {
    if (isActive) {
      // Icon bounce
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

      // Label + dot animate in — all native
      Animated.parallel([
        Animated.spring(labelY, {
          toValue: 0,
          useNativeDriver: true,
          speed: 28,
          bounciness: 4,
        }),
        Animated.timing(labelO, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(dotO, {
          toValue: 1,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.spring(dotSX, {
          toValue: 1,
          useNativeDriver: true,
          speed: 30,
          bounciness: 6,
        }),
      ]).start();
    } else {
      // Icon shrinks back
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 30,
        bounciness: 0,
      }).start();

      // Label + dot animate out — all native
      Animated.parallel([
        Animated.timing(labelO, {
          toValue: 0,
          duration: 130,
          useNativeDriver: true,
        }),
        Animated.spring(labelY, {
          toValue: 4,
          useNativeDriver: true,
          speed: 30,
          bounciness: 0,
        }),
        Animated.timing(dotO, {
          toValue: 0,
          duration: 130,
          useNativeDriver: true,
        }),
        Animated.spring(dotSX, {
          toValue: 0.2,
          useNativeDriver: true,
          speed: 30,
          bounciness: 0,
        }),
      ]).start();
    }
  }, [isActive]);

  return (
    <Pressable
      onPress={() => {
        if (!isActive) {
          try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (_) {}
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

        {/* ── Label (animated in/out) ── */}
        <Animated.Text
          style={[
            st.tabLabel,
            {
              color: '#4F8CFF',
              opacity: labelO,
              transform: [{ translateY: labelY }],
            },
          ]}
          numberOfLines={1}
        >
          {tab?.label}
        </Animated.Text>

        {/* ── Dot indicator: fixed width pill, scaleX animates 0.2 → 1 ── */}
        {/*    This replaces the old width animation that required JS driver  */}
        <Animated.View
          style={[
            st.tabDot,
            {
              backgroundColor: '#4F8CFF',
              opacity: dotO,
              transform: [{ scaleX: dotSX }],
            },
          ]}
        />
      </View>
    </Pressable>
  );
}

// ── Bottom Tab Bar ─────────────────────────────────────────────────────────
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

// ── HomeStack ──────────────────────────────────────────────────────────────
function HomeStack() {
  const { T } = useTheme();
  const hdr = {
    headerStyle:         { backgroundColor: T.bg },
    headerTintColor:     T.t1,
    headerTitleStyle:    { fontWeight: '700', fontSize: 17 },
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

// ── Main Tabs ──────────────────────────────────────────────────────────────
function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={p => <TabBar {...p} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home"        component={HomeStack}         />
      <Tab.Screen name="Money"       component={MoneyScreen}       />
      <Tab.Screen name="Growth"      component={GrowthScreen}      />
      <Tab.Screen name="Calculators" component={CalculatorsScreen} />
      <Tab.Screen name="Profile"     component={ProfileScreen}     />
    </Tab.Navigator>
  );
}

// ── Auto smart notifications on launch ────────────────────────────────────
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

// ── Daily login trigger ────────────────────────────────────────────────────
function DailyLoginTrigger() {
  const { dispatch } = useApp();
  React.useEffect(() => {
    dispatch({ type: 'DAILY_LOGIN' });
  }, []);
  return null;
}

// ── Themed app root ────────────────────────────────────────────────────────
function ThemedApp() {
  const { T, mode } = useTheme();
  return (
    <>
      <StatusBar
        barStyle={mode === 'light' ? 'dark-content' : 'light-content'}
        backgroundColor={T.bg}
      />
      <NavigationContainer
        theme={{
          dark: mode !== 'light',
          colors: {
            primary:      '#4F8CFF',
            background:   T.bg,
            card:         T.l1,
            text:         T.t1,
            border:       T.border,
            notification: '#EF4444',
          },
        }}
      >
        <NotifTrigger />
        <DailyLoginTrigger />
        <MainTabs />
      </NavigationContainer>
    </>
  );
}

// ── App root ───────────────────────────────────────────────────────────────
export default function App() {
  const [showSplash, setShowSplash] = React.useState(true);
  const [fontsLoaded, fontError] = useFonts({
    Syne_500Medium,
    Syne_600SemiBold,
    Syne_700Bold,
    Syne_800ExtraBold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
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

// ── Styles ─────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  bar: {
    flexDirection:    'row',
    borderTopWidth:   1,
    paddingTop:       10,
    paddingBottom:    Platform.OS === 'ios' ? 28 : 12,
    paddingHorizontal: 4,
    shadowColor:      '#000',
    shadowOffset:     { width: 0, height: -4 },
    shadowOpacity:    0.10,
    shadowRadius:     16,
    elevation:        24,
  },

  tabItem: {
    flex:            1,
    alignItems:      'center',
    justifyContent:  'center',
    minHeight:       52,
  },

  tabInner: {
    alignItems:      'center',
    justifyContent:  'center',
    gap:             2,
    minHeight:       48,
  },

  tabIcon: {
    fontSize:   22,
    lineHeight: 28,
    textAlign:  'center',
  },

  tabLabel: {
    fontSize:    11,
    fontWeight:  '700',
    letterSpacing: 0.1,
    textAlign:   'center',
    // Fixed height keeps layout stable while opacity animates
    height:      14,
    lineHeight:  14,
  },

  // Fixed-size pill — scaleX transforms 0.2→1 instead of width mutation
  // This is the key fix: width is static so no JS driver is needed
  tabDot: {
    width:        18,
    height:       3,
    borderRadius: 99,
    marginTop:    2,
  },
});
