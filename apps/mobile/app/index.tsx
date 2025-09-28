<<<<<<< HEAD
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

=======
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
>>>>>>> 51fe25d65a4986d951f44b633b0b17e73155ce4d
  return <Login />
}
