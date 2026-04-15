// App.js
import React, { useCallback } from 'react';
import { View, Text, StatusBar, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts, Syne_500Medium, Syne_600SemiBold, Syne_700Bold, Syne_800ExtraBold } from '@expo-google-fonts/syne';
import { DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold } from '@expo-google-fonts/dm-sans';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BlurView } from 'expo-blur';

import { AppProvider } from './AppContext';
import { Colors, Spacing, Radius } from './theme';

import HomeScreen     from './HomeScreen';
import MoneyScreen    from './MoneyScreen';
import CashFlowScreen from './CashFlowScreen';
import GrowthScreen   from './GrowthScreen';
import InsightsScreen from './InsightsScreen';
import ProfileScreen  from './ProfileScreen';

SplashScreen.preventAutoHideAsync();

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TAB_ICONS = {
  Home: '🏠', Money: '💵', Flow: '🌊', Growth: '🚀', Insights: '📊', Profile: '👤',
};

function CustomTabBar({ state, descriptors, navigation }) {
  return (
    <View style={tbStyles.container}>
      <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFillObject} />
      <View style={tbStyles.inner}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
          };
          return (
            <View key={route.key} style={tbStyles.tab}>
              <View onStartShouldSetResponder={() => true} onResponderGrant={onPress}
                style={[tbStyles.tabInner, isFocused && tbStyles.tabActive]}>
                <Text style={[tbStyles.icon, { opacity: isFocused ? 1 : 0.35 }]}>
                  {TAB_ICONS[route.name]}
                </Text>
              </View>
              <Text style={[tbStyles.label, isFocused && tbStyles.labelActive]}>{route.name}</Text>
            </View>
          );
        })}
      </View>
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
  const [fontsLoaded] = useFonts({
    Syne_500Medium, Syne_600SemiBold, Syne_700Bold, Syne_800ExtraBold,
    DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) await SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <AppProvider>
        <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
        <NavigationContainer theme={{ colors: { background: Colors.bg }, dark: true }}>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Main" component={MainTabs} />
          </Stack.Navigator>
        </NavigationContainer>
        <View style={appStyles.ambientTop}  pointerEvents="none" />
        <View style={appStyles.ambientBottom} pointerEvents="none" />
      </AppProvider>
    </GestureHandlerRootView>
  );
}

const appStyles = StyleSheet.create({
  ambientTop: {
    position: 'absolute', top: -150, left: '50%', marginLeft: -190,
    width: 380, height: 380, borderRadius: 190,
    backgroundColor: 'rgba(59,130,246,0.07)', zIndex: -1,
  },
  ambientBottom: {
    position: 'absolute', bottom: -100, right: -60,
    width: 250, height: 250, borderRadius: 125,
    backgroundColor: 'rgba(34,197,94,0.05)', zIndex: -1,
  },
});

const tbStyles = StyleSheet.create({
  container:    { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Platform.OS === 'android' ? 'rgba(8,13,26,0.95)' : 'transparent' },
  inner:        { flexDirection: 'row', paddingTop: 10, paddingBottom: Platform.OS === 'ios' ? 24 : 12, paddingHorizontal: 4 },
  tab:          { flex: 1, alignItems: 'center', gap: 4 },
  tabInner:     { width: 44, height: 29, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  tabActive:    { backgroundColor: Colors.blueDim },
  icon:         { fontSize: 20 },
  label:        { fontSize: 10, fontWeight: '500', color: Colors.t3, letterSpacing: 0.2 },
  labelActive:  { color: Colors.blue, fontWeight: '700' },
});
