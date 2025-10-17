// utils/alert.ts
import { Alert, Platform } from 'react-native';

// Tipos para compatibilidade com Alert nativo
type AlertButton = {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

type AlertOptions = {
  cancelable?: boolean;
};

// Polyfill aprimorado para web
const alertPolyfill = (
  title: string,
  message?: string,
  buttons?: AlertButton[],
  options?: AlertOptions
) => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    // Não-web: usa Alert nativo
    Alert.alert(title, message, buttons, options);
    return;
  }

  // Monta mensagem completa
  const fullMessage = [title, message].filter(Boolean).join('\n\n');

  // Lógica baseada no número de botões
  if (!buttons || buttons.length === 0) {
    // Sem botões: alert simples
    window.alert(fullMessage);
    return;
  }

  if (buttons.length === 1) {
    // Um botão: alert e executa onPress
    window.alert(fullMessage);
    buttons[0].onPress?.();
    return;
  }

  if (buttons.length === 2) {
    // Dois botões: usa confirm (aproxima OK/Cancel)
    const [btn1, btn2] = buttons;
    const confirmBtn = btn1.style !== 'cancel' ? btn1 : btn2;
    const cancelBtn = btn1.style === 'cancel' ? btn1 : btn2;
    
    const result = window.confirm(`${fullMessage}\n\n${confirmBtn.text} ou ${cancelBtn.text}?`);
    
    if (result) {
      confirmBtn.onPress?.();
    } else {
      cancelBtn.onPress?.();
    }
    return;
  }

  // Mais de 2 botões: limitado no browser; log e executa o primeiro
  console.warn('Polyfill web limitado para >2 botões. Use sweetalert2 para suporte completo.');
  window.alert(`${fullMessage}\n\nAção executada no primeiro botão.`);
  buttons[0].onPress?.();

  // Suporte a cancelable (aproximado; confirm não tem ESC nativo)
  if (options?.cancelable === false) {
    console.warn('Cancelável desabilitado no polyfill web - comportamento aproximado.');
  }
};

// Exporta a função unificada: polyfill na web, nativa no mobile
const alert = Platform.OS === 'web' ? alertPolyfill : Alert.alert;

export type { AlertButton, AlertOptions };
export default alert;