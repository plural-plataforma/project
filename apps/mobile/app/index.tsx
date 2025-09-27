<<<<<<< HEAD
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
import { View, Image, StyleSheet } from 'react-native'
import { Card, Text } from 'react-native-paper'
import { StatusBar } from 'expo-status-bar'
<<<<<<< HEAD
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

=======
import { List } from 'phosphor-react-native'
>>>>>>> 48f7331 (feat: implentação do AppBat, fontes, icones e bibliotecas [PLUR-14])
export default function Index() {
  return (
    <View style={styles.container}>
      <StatusBar />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={require('../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.text}>
            Plural <Text style={styles.textSecondary}>PLATAFORMA</Text>
          </Text>
        </View>
        <View style={styles.headerRight}>
          <List size={24} color="#193656" />
        </View>
      </View>
      <View style={{ flex: 1 }}>
        <Card
          style={{
            height: 136,
            margin: 16,
            padding: 16,
            backgroundColor: '#FF0000'
          }}
        >
          <Text>Bem-vindo à Plural Plataforma!</Text>
        </Card>
      </View>
    </View>
  )
>>>>>>> 4a54cb1 (refactor: reseat-project [PLUR-14])
=======
import Login from './auth/login'
import { use, useEffect } from 'react'
import { useRouter } from 'expo-router'

export default function Index() {
  const router = useRouter()
  useEffect(() => {
    // Aqui você pode adicionar lógica para verificar se o usuário está autenticado
    // e redirecioná-lo para a tela apropriada.
    const timeout = setTimeout(() => {
      // Simulando uma verificação de autenticação
      const isAuthenticated = false // Altere isso conforme sua lógica de autenticação real
      if (isAuthenticated) {
        router.navigate('/tabs/dashboard')
        // Redirecionar para a tela principal (por exemplo, 'alunos')
        // navigation.navigate('alunos'); // Descomente e ajuste conforme sua navegação
      } else {
        return <Login />
        // Redirecionar para a tela de login
        // navigation.navigate('login'); // Descomente e ajuste conforme sua navegação
      }
    }, 1000) // Simula um atraso de 1 segundo

    return () => clearTimeout(timeout) // Limpa o timeout se o componente for desmontado
  }, [])

  return <Login />
>>>>>>> e49611b (feat: Navegação por tabs e stacks [PLUR-14])
}
