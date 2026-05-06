// ─── GROWTH LEDGER — APP NAVIGATOR v4.0 ──────────────────────────────────────
// Tabs: Home | Portfolio | +(FAB) | Markets | More
// Gold theme: tab bar uses gold accent

import React, { useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Platform, Pressable,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator }     from '@react-navigation/stack';
import { useSafeAreaInsets }        from 'react-native-safe-area-context';
import { useTheme }                 from './Context_ThemeContext';
import { SPACING, RADIUS, FONT, SHADOW, FF } from './Constants_theme';

// ── Screens ──────────────────────────────────────────────────────────────────
import HomeScreen      from './Screens_HomeScreen';
import SipScreen       from './SipScreen';
import GoalsScreen     from './GoalsScreen';
import ProfileScreen   from './ProfileScreen';
import SettingsScreen  from './Screens_SettingsScreen';
import MoneyScreen     from './MoneyScreen';

const Tab   = createBottomTabNavigator();
const Stack = createStackNavigator();

// ─────────────────────────────────────────────────────────────────────────────
// PORTFOLIO PLACEHOLDER (use SipScreen for now)
// ─────────────────────────────────────────────────────────────────────────────
function PortfolioScreen(props) { return <SipScreen {...props} />; }
function MarketsScreen(props) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 32, marginBottom: 12 }}>📊</Text>
      <Text style={{ color: colors.textMuted, fontSize: 14, fontFamily: FF.body }}>Markets — Coming Soon</Text>
    </View>
  );
}
function MoreScreen({ navigation }) {
  const { colors, setTheme, theme } = useTheme();
  const THEMES_LIST = [
    { key: 'light',  label: 'Light',  icon: '☀️'  },
    { key: 'dark',   label: 'Dark',   icon: '🌙'  },
    { key: 'amoled', label: 'AMOLED', icon: '⚫'  },
    { key: 'gold',   label: 'Gold ✨', icon: '🏆'  },
  ];
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingHorizontal: 20, paddingTop: 60 }}>
      <Text style={{ color: colors.text, fontSize: 22, fontWeight: '700', marginBottom: 24, fontFamily: FF.heading }}>
        More
      </Text>
      <Text style={{ color: colors.textMuted, fontSize: 10, letterSpacing: 1.5, fontWeight: '600', marginBottom: 12, fontFamily: FF.ui, textTransform: 'uppercase' }}>
        Theme
      </Text>
      <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
        {THEMES_LIST.map(t => (
          <TouchableOpacity
            key={t.key}
            onPress={() => setTheme(t.key)}
            style={{
              paddingHorizontal: 14, paddingVertical: 10,
              borderRadius: RADIUS.lg,
              borderWidth: 1.5,
              borderColor: theme === t.key ? colors.accent : colors.border,
              backgroundColor: theme === t.key ? colors.accentDim : colors.bgCard,
              flexDirection: 'row', alignItems: 'center', gap: 6,
            }}
          >
            <Text style={{ fontSize: 14 }}>{t.icon}</Text>
            <Text style={{
              fontSize: 12, fontWeight: '600', fontFamily: FF.ui,
              color: theme === t.key ? colors.accentText : colors.textSub,
            }}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={{ color: colors.textMuted, fontSize: 10, letterSpacing: 1.5, fontWeight: '600', marginBottom: 12, fontFamily: FF.ui, textTransform: 'uppercase' }}>
        Settings
      </Text>
      {[
        { label: 'Settings',   icon: '⚙️', screen: 'Settings' },
        { label: 'Profile',    icon: '👤', screen: 'Profile'  },
        { label: 'Cash Flow',  icon: '💸', screen: 'CashFlow' },
        { label: 'Goals',      icon: '🎯', screen: 'Goals'    },
      ].map(item => (
        <TouchableOpacity
          key={item.label}
          onPress={() => navigation.navigate(item.screen)}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 12,
            paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border,
          }}
        >
          <Text style={{ fontSize: 16 }}>{item.icon}</Text>
          <Text style={{ color: colors.text, fontSize: 14, fontFamily: FF.body, flex: 1 }}>{item.label}</Text>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>›</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB ITEM — individual tab button
// ─────────────────────────────────────────────────────────────────────────────
function TabItem({ icon, label, focused, onPress, accent }) {
  const scale = useRef(new Animated.Value(1)).current;

  const onIn  = () => Animated.spring(scale, { toValue: 0.82, useNativeDriver: true, ...{ tension: 400, friction: 7 } }).start();
  const onOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, ...{ tension: 300, friction: 7 } }).start();

  return (
    <Pressable
      style={ts.tabItem}
      onPress={onPress}
      onPressIn={onIn}
      onPressOut={onOut}
      android_ripple={{ color: 'transparent' }}
      accessible
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: focused }}
    >
      <Animated.View style={{ transform: [{ scale }], alignItems: 'center', gap: 3 }}>
        <View style={[
          ts.iconWrap,
          focused && { backgroundColor: `${accent}18` },
        ]}>
          <Text style={[ts.tabIcon, { opacity: focused ? 1 : 0.45 }]}>{icon}</Text>
        </View>
        <Text style={[
          ts.tabLabel,
          { color: focused ? accent : 'rgba(200,200,220,0.40)' },
          focused && { fontWeight: FONT.semibold },
        ]}>
          {label}
        </Text>
        {/* Active dot */}
        {focused && (
          <View style={[ts.activeDot, { backgroundColor: accent }]} />
        )}
      </Animated.View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FAB CENTER BUTTON
// ─────────────────────────────────────────────────────────────────────────────
function FABTab({ onPress, accent, isGold }) {
  const scale = useRef(new Animated.Value(1)).current;
  const onIn  = () => Animated.spring(scale, { toValue: 0.88, useNativeDriver: true, tension: 400, friction: 7 }).start();
  const onOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, tension: 300, friction: 7 }).start();

  return (
    <View style={ts.fabWrap}>
      <Pressable
        onPress={onPress}
        onPressIn={onIn}
        onPressOut={onOut}
        android_ripple={{ color: 'transparent', borderless: true }}
        accessibilityRole="button"
        accessibilityLabel="Add transaction"
      >
        <Animated.View style={[
          ts.fab,
          { backgroundColor: accent, transform: [{ scale }] },
          isGold ? SHADOW.fabGold : SHADOW.fab,
        ]}>
          <Text style={ts.fabIcon}>＋</Text>
        </Animated.View>
      </Pressable>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOM TAB BAR
// ─────────────────────────────────────────────────────────────────────────────
function CustomTabBar({ state, navigation }) {
  const { colors } = useTheme();
  const insets     = useSafeAreaInsets();
  const accent     = colors.accent;

  const TABS = [
    { name: 'Home',      icon: '🏠', label: 'Home'      },
    { name: 'Portfolio', icon: '📈', label: 'Portfolio' },
    { name: 'FAB',       icon: null,  label: ''          }, // center FAB slot
    { name: 'Markets',   icon: '📊', label: 'Markets'   },
    { name: 'More',      icon: '⋯',  label: 'More'      },
  ];

  return (
    <View style={[
      ts.tabBar,
      {
        backgroundColor: colors.tabBar,
        borderTopColor:  colors.tabBarBorder,
        paddingBottom:   Math.max(insets.bottom, 8),
      },
    ]}>
      {TABS.map((tab, index) => {
        if (tab.name === 'FAB') {
          return (
            <FABTab
              key="FAB"
              accent={accent}
              isGold={colors.isGold}
              onPress={() => {
                // Navigate to add/FAB sheet — use Money screen for now
                navigation.navigate('Home');
              }}
            />
          );
        }

        const route   = state.routes.find(r => r.name === tab.name);
        const focused = route ? state.index === state.routes.indexOf(route) : false;

        return (
          <TabItem
            key={tab.name}
            icon={tab.icon}
            label={tab.label}
            focused={focused}
            accent={accent}
            onPress={() => route && navigation.navigate(tab.name)}
          />
        );
      })}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN TABS
// ─────────────────────────────────────────────────────────────────────────────
function HomeTabs() {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home"      component={HomeScreen}      />
      <Tab.Screen name="Portfolio" component={PortfolioScreen} />
      <Tab.Screen name="Markets"   component={MarketsScreen}   />
      <Tab.Screen name="More"      component={MoreScreen}      />
    </Tab.Navigator>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// APP NAVIGATOR
// ─────────────────────────────────────────────────────────────────────────────
export default function AppNavigator() {
  const { colors } = useTheme();

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: colors.bg },
          cardStyleInterpolator: ({ current }) => ({
            cardStyle: { opacity: current.progress },
          }),
          transitionSpec: {
            open:  { animation: 'timing', config: { duration: 240 } },
            close: { animation: 'timing', config: { duration: 200 } },
          },
        }}
      >
        <Stack.Screen name="Main"     component={HomeTabs}      />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Profile"  component={ProfileScreen}  />
        <Stack.Screen name="CashFlow" component={MoneyScreen}    />
        <Stack.Screen name="Goals"    component={GoalsScreen}    />
        <Stack.Screen
          name="SipDetail"
          component={SipScreen}
          options={{
            presentation: 'modal',
            cardStyleInterpolator: ({ current, layouts }) => ({
              cardStyle: {
                transform: [{
                  translateY: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [layouts.screen.height, 0],
                  }),
                }],
              },
            }),
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const ts = StyleSheet.create({
  tabBar: {
    flexDirection:  'row',
    borderTopWidth: 1,
    paddingTop:     8,
    paddingHorizontal: SPACING.xs,
    alignItems:     'flex-start',
  },
  tabItem: {
    flex:           1,
    alignItems:     'center',
    paddingTop:     2,
  },
  iconWrap: {
    width:          40,
    height:         28,
    alignItems:     'center',
    justifyContent: 'center',
    borderRadius:   RADIUS.md,
    marginBottom:   1,
  },
  tabIcon: {
    fontSize: 18,
  },
  tabLabel: {
    fontSize:      9,
    fontWeight:    FONT.medium,
    letterSpacing: 0.2,
  },
  activeDot: {
    width:        3,
    height:       3,
    borderRadius: 2,
    marginTop:    2,
  },

  // FAB
  fabWrap: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'flex-start',
    marginTop:      -18,
  },
  fab: {
    width:        52,
    height:       52,
    borderRadius: 18,
    alignItems:   'center',
    justifyContent: 'center',
  },
  fabIcon: {
    fontSize:   26,
    color:      '#fff',
    fontWeight: '300',
    lineHeight: 30,
  },
});
