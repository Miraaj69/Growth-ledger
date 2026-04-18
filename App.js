// App.js
import React, { useCallback } from 'react';
import { View, StatusBar, StyleSheet, Platform, Text, Pressable } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  useFonts, Syne_500Medium, Syne_600SemiBold, Syne_700Bold, Syne_800ExtraBold,
} from '@expo-google-fonts/syne';
import {
  DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold,
} from '@expo-google-fonts/dm-sans';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppProvider } from './AppContext';
import { C } from './theme';

import HomeScreen     from './HomeScreen';
import MoneyScreen    from './MoneyScreen';
import CashFlowScreen from './CashFlowScreen';
import GrowthScreen   from './GrowthScreen';
import InsightsScreen from './InsightsScreen';
import ProfileScreen  from './ProfileScreen';

SplashScreen.preventAutoHideAsync().catch(() => {});

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TABS = [
  { name:'Home',     icon:'🏠' },
  { name:'Money',    icon:'💵' },
  { name:'Flow',     icon:'🌊' },
  { name:'Growth',   icon:'🚀' },
  { name:'Insights', icon:'📊' },
  { name:'Profile',  icon:'👤' },
];

// ─── Custom Tab Bar — no BlurView (crashes on some Android) ───
function TabBar({ state, navigation }) {
  return (
    <View style={tb.bar}>
      {state.routes.map((route, i) => {
        const tab = TABS.find(t => t.name === route.name);
        const on  = state.index === i;
        return (
          <Pressable
            key={route.key}
            onPress={() => { if (!on) navigation.navigate(route.name); }}
            style={tb.tab}
            android_ripple={{ color: C.blueDim, borderless: true }}
          >
            <View style={[tb.pill, on && tb.pillActive]}>
              <Text style={{ fontSize: 20, opacity: on ? 1 : 0.32 }}>{tab?.icon}</Text>
            </View>
            <Text style={[tb.label, on && tb.labelOn]}>{route.name}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator tabBar={p => <TabBar {...p} />} screenOptions={{ headerShown: false }}>
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

  const onLayout = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  // Wait for fonts — if fonts fail, still render (fontError fallback)
  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayout}>
      <SafeAreaProvider>
        <AppProvider>
          <StatusBar barStyle="light-content" backgroundColor={C.bg} />
          <NavigationContainer
            theme={{
              dark: true,
              colors: { primary: C.blue, background: C.bg, card: C.l1, text: C.t1, border: C.border, notification: C.red },
            }}
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

const tb = StyleSheet.create({
  bar:       { flexDirection:'row', backgroundColor:'rgba(8,13,26,0.97)', borderTopWidth:1, borderTopColor:'rgba(255,255,255,0.07)', paddingTop:10, paddingBottom: Platform.OS==='ios' ? 28 : 12, paddingHorizontal:4, elevation:20, shadowColor:'#000', shadowOffset:{width:0,height:-3}, shadowOpacity:0.4, shadowRadius:10 },
  tab:       { flex:1, alignItems:'center', gap:3 },
  pill:      { width:44, height:30, borderRadius:10, alignItems:'center', justifyContent:'center' },
  pillActive:{ backgroundColor:'rgba(79,140,255,0.18)' },
  label:     { fontSize:10, fontWeight:'500', color:'#475569', letterSpacing:0.2 },
  labelOn:   { color:'#4F8CFF', fontWeight:'700' },
});
