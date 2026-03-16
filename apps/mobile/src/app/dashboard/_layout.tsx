import { colors } from '@packages/ui/theme/theme'
import { Tabs, useSegments } from 'expo-router'
import { House } from 'phosphor-react-native'

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
          title: 'Início',
          tabBarIcon: ({ color, focused }) => (
            <House size={32} color={color} weight={focused ? 'fill' : 'regular'} />
          )
        }}
      />
      
      <Tabs.Screen name="planejamento" options={{ href: null, title: 'Planejamento' }} />
      <Tabs.Screen name="reports" options={{ href: null, title: 'Relatórios' }} />
      <Tabs.Screen name="perfil" options={{ href: null, title: 'Perfil' }} />
    </Tabs>
  )
}

// Example: get active segment (selected tab) elsewhere in the tree
export function useActiveTab() {
  const segments = useSegments()
  // segments is an array like ['dashboard', 'index'] depending on route depth
  return segments[0] || null
}
