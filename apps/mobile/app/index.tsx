import * as React from 'react'
import { View, StyleSheet } from 'react-native'
import { BottomNavigation, Text } from 'react-native-paper'
import { StatusBar } from 'expo-status-bar'
import { text } from 'stream/consumers'

const DashboardRoute = () => <Text>dashboard</Text>

const AlunosRoute = () => <Text>Alunos</Text>

const PlanejamentoRoute = () => <Text>Planejamento</Text>

const ReportsRoute = () => <Text>Reports</Text>

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
