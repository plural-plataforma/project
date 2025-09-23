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
import { BottomNavigation, Text } from 'react-native-paper'

const MusicRoute = () => <Text>Music</Text>

const AlbumsRoute = () => <Text>Albums</Text>

const RecentsRoute = () => <Text>Recents</Text>

const NotificationsRoute = () => <Text>Notifications</Text>
>>>>>>> 174b1ae (feat: using react-native-paper ui [PLUR-14])

export default function Index() {
  const [index, setIndex] = React.useState(0)
  const [routes] = React.useState([
    {
      key: 'music',
      title: 'Favorites',
      focusedIcon: 'heart',
      unfocusedIcon: 'heart-outline'
    },
    { key: 'albums', title: 'Albums', focusedIcon: 'album' },
    { key: 'recents', title: 'Recents', focusedIcon: 'history' },
    {
      key: 'notifications',
      title: 'Notifications',
      focusedIcon: 'bell',
      unfocusedIcon: 'bell-outline'
    }
  ])

  const renderScene = BottomNavigation.SceneMap({
    music: MusicRoute,
    albums: AlbumsRoute,
    recents: RecentsRoute,
    notifications: NotificationsRoute
  })
  return (
    <BottomNavigation
      navigationState={{ index, routes }}
      onIndexChange={setIndex}
      renderScene={renderScene}
    />
  )
>>>>>>> 4a54cb1 (refactor: reseat-project [PLUR-14])
}
