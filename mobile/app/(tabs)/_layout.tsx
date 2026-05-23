/**
 * Tabs Layout — Bottom tab navigation
 * Dark premium tab bar matching the reference design
 */
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false, // minimalist look without text labels
        tabBarBackground: () => (
          <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
        ),
        tabBarActiveTintColor: Colors.text,
        tabBarInactiveTintColor: Colors.textTertiary || 'rgba(255,255,255,0.4)',
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
              {focused && <View style={[styles.activeDot, { backgroundColor: Colors.positive }]} />}
            </View>
          ),
        }}
        listeners={() => ({ tabPress: () => Haptics.selectionAsync().catch(() => { }) })}
      />
      <Tabs.Screen
        name="markets"
        options={{
          title: 'Market',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <Ionicons name={focused ? 'stats-chart' : 'stats-chart-outline'} size={24} color={color} />
              {focused && <View style={[styles.activeDot, { backgroundColor: Colors.positive }]} />}
            </View>
          ),
        }}
        listeners={() => ({ tabPress: () => Haptics.selectionAsync().catch(() => { }) })}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <Ionicons name={focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'} size={24} color={color} />
              {focused && <View style={[styles.activeDot, { backgroundColor: Colors.positive }]} />}
            </View>
          ),
        }}
        listeners={() => ({ tabPress: () => Haptics.selectionAsync().catch(() => { }) })}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
              {focused && <View style={[styles.activeDot, { backgroundColor: Colors.positive }]} />}
            </View>
          ),
        }}
        listeners={() => ({ tabPress: () => Haptics.selectionAsync().catch(() => { }) })}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'transparent',
    position: 'absolute',
    borderTopWidth: 0,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    height: Platform.OS === 'ios' ? 76 : 64,
    bottom: Platform.OS === 'ios' ? 32 : 16,
    left: 24,
    right: 24,
    borderRadius: 38,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  tabItem: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 14 : 0,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  activeDot: {
    position: 'absolute',
    bottom: -10,
    width: 4,
    height: 4,
    borderRadius: 2,
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
});
