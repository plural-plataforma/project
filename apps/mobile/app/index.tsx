import { useEffect } from 'react' // Correção: removido 'use' inválido
import { useRouter } from 'expo-router'
import Login from './auth/login'

export default function Index() {
  const router = useRouter()

  useEffect(() => {
    // Simula uma verificação de autenticação com atraso
    const timeout = setTimeout(() => {
      const isAuthenticated = true // Substitua por sua lógica real de autenticação
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
}
