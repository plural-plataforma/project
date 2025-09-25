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
      const isAuthenticated = true // Altere isso conforme sua lógica de autenticação real
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
}
