<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
import { useEffect } from 'react' // Correção: removido 'use' inválido
import { useRouter } from 'expo-router'
import Login from './auth/login'

export default function Index() {
  const router = useRouter()

  useEffect(() => {
    // Simula uma verificação de autenticação com atraso
    const timeout = setTimeout(() => {
      const isAuthenticated = false // Substitua por sua lógica real de autenticação
      if (isAuthenticated) {
        router.push('/tabs/dashboard') // Redireciona para a dashboard se autenticado
      } else {
        // Não retorna JSX aqui; o componente já renderiza <Login /> por padrão
      }
    }, 1000) // Atraso de 1 segundo

    // Limpa o timeout se o componente for desmontado
    return () => clearTimeout(timeout)
  }, [router]) // Inclui router como dependência

  // Renderiza o componente Login por padrão (se não redirecionado)
  return <Login />
=======
import { Text, View } from 'react-native'
=======
import { Button, Text, View } from 'react-native'
>>>>>>> acf38d1 (fix: configuration expo router [PLUR-14])
=======
import * as React from 'react'
import { View, StyleSheet } from 'react-native'
import { BottomNavigation, Text } from 'react-native-paper'
import { StatusBar } from 'expo-status-bar'
import { text } from 'stream/consumers'

const DashboardRoute = () => <Text>dashboard</Text>

const AlunosRoute = () => <Text>Alunos</Text>

const PlanejamentoRoute = () => <Text>Planejamento</Text>

<<<<<<< HEAD
const NotificationsRoute = () => <Text>Notifications</Text>
>>>>>>> 174b1ae (feat: using react-native-paper ui [PLUR-14])
=======
const ReportsRoute = () => <Text>Reports</Text>
>>>>>>> 61d5e4d (feat: implementação do BarNavigation [PLR-14])

export default function Index() {
  const [index, setIndex] = React.useState(0)
  const [routes] = React.useState([
    {
      key: 'dashboard',
      title: 'Dashboard',
      focusedIcon: 'home-variant',
      unfocusedIcon: 'home-variant-outline'
    },
    {
      key: 'alunos',
      title: 'Alunos',
      focusedIcon: 'account-multiple',
      unfocusedIcon: 'account-multiple-outline'
    },
    {
      key: 'planejamento',
      title: 'Planejamento',
      focusedIcon: 'calendar-month',
      unfocusedIcon: 'calendar-month-outline'
    },
    {
      key: 'reports',
      title: 'Reports',
      focusedIcon: 'chart-box-multiple',
      unfocusedIcon: 'chart-box-multiple-outline'
    }
  ])

  const renderScene = BottomNavigation.SceneMap({
    dashboard: DashboardRoute,
    alunos: AlunosRoute,
    planejamento: PlanejamentoRoute,
    reports: ReportsRoute
  })
  return (
    <View style={styles.app}>
      <View style={styles.container}>
        <StatusBar />
        <View style={styles.header}>
          <View style={styles.headerLeft} />
          <View style={styles.headerRight} />
        </View>
      </View>
      <BottomNavigation
        navigationState={{ index, routes }}
        onIndexChange={setIndex}
        renderScene={renderScene}
        sceneAnimationEnabled={false}
        shifting={false}
        barStyle={styles.barNav}
        inactiveColor="#000000"
        activeColor="#0D141C"
        activeIndicatorStyle={{ backgroundColor: 'none' }}
      />
    </View>
  )
>>>>>>> 4a54cb1 (refactor: reseat-project [PLUR-14])
}

export const styles = StyleSheet.create({
  app: {
    flex: 1,
    paddingTop: 20
  },
  container: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20
  },
  barNav: {
    backgroundColor: '#FFBE33',
    height: 68,
    width: 380,
    alignSelf: 'center',
    marginBottom: 10,
    borderRadius: 35
  },
  header: {
    marginTop: 20,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerLeft: {
    flexDirection: 'row'
  },
  headerRight: {
    flexDirection: 'row'
  },
  text: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0D141C',
    lineHeight: 29
  }
})
