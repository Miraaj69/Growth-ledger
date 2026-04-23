import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from './Context_ThemeContext';
import { SEMANTIC, FONT, RADIUS, SPACING } from './Constants_theme';

import HomeScreen       from './Screens_HomeScreen';
import TasksScreen      from './Screens_TasksScreen';
import MasterScreen     from './Screens_MasterScreen';
import ReportsScreen    from './Screens_ReportsScreen';
import SettingsScreen   from './Screens_SettingsScreen';
import TaskDetailScreen from './Screens_TaskDetailScreen';

const Tab   = createBottomTabNavigator();
const Stack = createStackNavigator();

const TABS = [
  { name: 'Home',     icon: '⚡',  label: 'Home'     },
  { name: 'Tasks',    icon: '✓',   label: 'Tasks'    },
  { name: 'Master',   icon: '⊞',   label: 'Master'   },
  { name: 'Reports',  icon: '↗',   label: 'Reports'  },
  { name: 'Settings', icon: '⚙',   label: 'Settings' },
];

// ─── TAB ITEM ─────────────────────────────────────────────────────────────────
function TabItem({ tab, focused, onPress }) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const onIn  = () => Animated.spring(scale, { toValue: 0.85, useNativeDriver: true, tension: 400, friction: 7 }).start();
  const onOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, tension: 300, friction: 7 }).start();

  return (
    <TouchableOpacity
      style={styles.tabItem}
      onPress={onPress}
      onPressIn={onIn}
      onPressOut={onOut}
      activeOpacity={1}
      accessible
      accessibilityRole="tab"
      accessibilityLabel={tab.label}
      accessibilityState={{ selected: focused }}
    >
      <Animated.View
        style={[
          styles.tabIconWrap,
          {
            backgroundColor: focused ? SEMANTIC.primaryDim : 'transparent',
            borderRadius:    RADIUS.md,
          },
          { transform: [{ scale }] },
        ]}
      >
        <Text style={[
          styles.tabIcon,
          { color: focused ? SEMANTIC.primary : colors.textMuted },
        ]}>
          {tab.icon}
        </Text>
      </Animated.View>
      <Text style={[
        styles.tabLabel,
        { color: focused ? SEMANTIC.primary : colors.textMuted },
        focused && { fontWeight: FONT.semibold },
      ]}>
        {tab.label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── CUSTOM TAB BAR ──────────────────────────────────────────────────────────
function CustomTabBar({ state, navigation }) {
  const { colors } = useTheme();

  return (
    <View style={[
      styles.tabBar,
      {
        backgroundColor: colors.tabBar,
        borderTopColor:  colors.tabBarBorder,
      },
    ]}>
      {state.routes.map((route, index) => {
        const tab     = TABS.find(t => t.name === route.name) || {};
        const focused = state.index === index;

        return (
          <TabItem
            key={route.key}
            tab={tab}
            focused={focused}
            onPress={() => navigation.navigate(route.name)}
          />
        );
      })}
    </View>
  );
}

// ─── MAIN TABS ────────────────────────────────────────────────────────────────
function HomeTabs() {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home"     component={HomeScreen}     />
      <Tab.Screen name="Tasks"    component={TasksScreen}    />
      <Tab.Screen name="Master"   component={MasterScreen}   />
      <Tab.Screen name="Reports"  component={ReportsScreen}  />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

// ─── APP NAVIGATOR ────────────────────────────────────────────────────────────
export default function AppNavigator() {
  const { colors } = useTheme();

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle:   { backgroundColor: colors.bg },
          // Smooth slide-up for modals, fade for stack
          cardStyleInterpolator: ({ current }) => ({
            cardStyle: {
              opacity: current.progress,
            },
          }),
          transitionSpec: {
            open:  { animation: 'timing', config: { duration: 250 } },
            close: { animation: 'timing', config: { duration: 220 } },
          },
        }}
      >
        <Stack.Screen
          name="Main"
          component={HomeTabs}
        />
        <Stack.Screen
          name="TaskDetail"
          component={TaskDetailScreen}
          options={{
            presentation: 'modal',
            cardStyle:    { backgroundColor: colors.bg },
            cardStyleInterpolator: ({ current, layouts }) => ({
              cardStyle: {
                transform: [
                  {
                    translateY: current.progress.interpolate({
                      inputRange:  [0, 1],
                      outputRange: [layouts.screen.height, 0],
                    }),
                  },
                ],
              },
            }),
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  tabBar: {
    flexDirection:     'row',
    borderTopWidth:    1,
    paddingBottom:     18,
    paddingTop:        8,
    paddingHorizontal: SPACING.sm,
  },
  tabItem: {
    flex:           1,
    alignItems:     'center',
    gap:            3,
  },
  tabIconWrap: {
    width:          38,
    height:         28,
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   1,
  },
  tabIcon: {
    fontSize:   17,
    lineHeight: 22,
  },
  tabLabel: {
    fontSize:   9,
    fontWeight: FONT.medium,
    letterSpacing: 0.1,
  },
});
