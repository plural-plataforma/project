// Re-exporta o store global como hook para manter compatibilidade
// com os componentes que chamam useToast()
export { useToastStore as useToast } from '@/stores/toastStore'
