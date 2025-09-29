// app/index.tsx
import { useRouter } from 'expo-router'
import { useEffect } from 'react'

export default function Index() {
  const router = useRouter()

  useEffect(() => {
    // Exemplo: sempre vai para Home primeiro
    router.replace('/(auth)/home/page')
  }, [router])

  return null
}
