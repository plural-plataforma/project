<<<<<<< HEAD
=======
import FontAwesome from '@expo/vector-icons/FontAwesome'
>>>>>>> e49611b (feat: Navegação por tabs e stacks [PLUR-14])
import { Tabs } from 'expo-router'
import {
  Calendar,
  House,
  PresentationChart,
  Users
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
          backgroundColor: '#FFBE33'
        },
        tabBarActiveTintColor: '#193656',
        tabBarInactiveTintColor: '#d9d9d9'
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <House size={32} color={color} />
        }}
      />
      <Tabs.Screen
        name="alunos"
        options={{
          title: 'Alunos',
          tabBarIcon: ({ color }) => <Users size={32} color={color} />
        }}
      />
      <Tabs.Screen
        name="planejamento"
        options={{
          title: 'Planejamento',
          tabBarIcon: ({ color }) => <Calendar size={32} color={color} />
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          tabBarIcon: ({ color }) => (
            <PresentationChart size={32} color={color} />
          )
        }}
      />
    </Tabs>
  )
}
