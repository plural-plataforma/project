import { colors } from '@/packages/ui/theme/theme'
import { Tabs, useSegments } from 'expo-router'
import {
  Calendar,
  House,
  PresentationChart,
  UserList
} from 'phosphor-react-native'

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
          backgroundColor: colors.primary2
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.secondary
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <House size={32} color={color} weight={focused ? 'fill' : 'regular'} />
          )
        }}
      />
      
      <Tabs.Screen
        name="planejamento"
        options={{
          title: 'Planejamento',
          tabBarIcon: ({ color, focused }) => (
            <Calendar size={32} color={color} weight={focused ? 'fill' : 'regular'} />
          )
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          tabBarIcon: ({ color, focused }) => (
            <PresentationChart size={32} color={color} weight={focused ? 'fill' : 'regular'} />
          )
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, focused }) => (
            <UserList size={32} color={color} weight={focused ? 'fill' : 'regular'} />
          )
        }}
      />
    </Tabs>
  )
}

// Example: get active segment (selected tab) elsewhere in the tree
export function useActiveTab() {
  const segments = useSegments()
  // segments is an array like ['dashboard', 'index'] depending on route depth
  return segments[0] || null
}
