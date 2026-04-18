// App.js
import React, { useCallback } from 'react';
import { View, StatusBar, Platform, Text, Pressable } from 'react-native';
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

import { AppProvider } from './AppContext';
import { ThemeProvider, useTheme } from './ThemeContext';

import HomeScreen     from './HomeScreen';
import MoneyScreen    from './MoneyScreen';
import InsightsScreen from './InsightsScreen';
import ProfileScreen  from './ProfileScreen';

SplashScreen.preventAutoHideAsync().catch(() => {});

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TABS = [
  { name:'Home',     icon:'🏠' },
  { name:'Money',    icon:'💵' },
  { name:'Insights', icon:'📊' },
  { name:'Profile',  icon:'👤' },
];

function TabBar({ state, navigation }) {
  const { T } = useTheme();
  return (
    <View style={{
      flexDirection:'row',
      backgroundColor: T.mode==='amoled'?'#000':T.mode==='light'?'#fff':'rgba(8,13,26,0.97)',
      borderTopWidth:1, borderTopColor:T.border,
      paddingTop:10, paddingBottom:Platform.OS==='ios'?28:12,
      paddingHorizontal:4,
      elevation:20, shadowColor:'#000',
      shadowOffset:{width:0,height:-3}, shadowOpacity:0.4, shadowRadius:10,
    }}>
      {state.routes.map((route, i) => {
        const tab = TABS.find(t => t.name === route.name);
        const on  = state.index === i;
        return (
          <Pressable key={route.key}
            onPress={() => { if(!on) navigation.navigate(route.name); }}
            style={{ flex:1, alignItems:'center', gap:3 }}
            android_ripple={{ color:T.blueD, borderless:true }}>
            <View style={{
              width:44, height:30, borderRadius:10,
              alignItems:'center', justifyContent:'center',
              backgroundColor: on ? T.blue+'22' : 'transparent',
            }}>
              <Text style={{ fontSize:20, opacity:on?1:0.32 }}>{tab?.icon}</Text>
            </View>
            <Text style={{
              fontSize:10, fontWeight:on?'700':'500',
              color:on?T.blue:T.t3, letterSpacing:0.2,
            }}>{route.name}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator tabBar={p => <TabBar {...p} />} screenOptions={{ headerShown:false }}>
      <Tab.Screen name="Home"     component={HomeScreen}     />
      <Tab.Screen name="Money"    component={MoneyScreen}    />
      <Tab.Screen name="Insights" component={InsightsScreen} />
      <Tab.Screen name="Profile"  component={ProfileScreen}  />
    </Tab.Navigator>
  );
}

function ThemedApp() {
  const { T, mode } = useTheme();
  return (
    <>
      <StatusBar barStyle={mode==='light'?'dark-content':'light-content'} backgroundColor={T.bg} />
      <NavigationContainer theme={{
        dark: mode !== 'light',
        colors: { primary:T.blue, background:T.bg, card:T.l1, text:T.t1, border:T.border, notification:T.red },
      }}>
        <Stack.Navigator screenOptions={{ headerShown:false }}>
          <Stack.Screen name="Main" component={MainTabs} />
        </Stack.Navigator>
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
    <GestureHandlerRootView style={{ flex:1 }} onLayout={onLayout}>
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
