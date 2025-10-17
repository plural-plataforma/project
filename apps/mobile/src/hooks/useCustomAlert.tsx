import React, { useState, useCallback } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { colors } from "@/packages/ui/theme/theme"; // Ajuste o path

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface CustomAlertProps {
  visible: boolean;
  title?: string;
  message?: string;
  buttons?: AlertButton[];
  onDismiss?: () => void;
}

const CustomAlert: React.FC<CustomAlertProps> = ({ visible, title, message, buttons = [{ text: 'OK' }], onDismiss }) => {
  const renderButton = (button: AlertButton, index: number) => (
    <Pressable
      key={index}
      onPress={() => {
        button.onPress?.();
        onDismiss?.();
      }}
      style={({ pressed }) => [
        styles.button,
        button.style === 'destructive' && styles.destructiveButton,
        button.style === 'cancel' && styles.cancelButton,
        pressed && styles.buttonPressed,
      ]}
    >
      <Text style={[styles.buttonText, button.style === 'destructive' && styles.destructiveText]}>
        {button.text}
      </Text>
    </Pressable>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {title && <Text style={styles.title}>{title}</Text>}
          {message && <Text style={styles.message}>{message}</Text>}
          <View style={styles.buttonContainer}>
            {buttons.map(renderButton)}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const useCustomAlert = () => {
  const [visible, setVisible] = useState<boolean>(false);
  const [config, setConfig] = useState<{
    title?: string;
    message?: string;
    buttons?: AlertButton[];
    onDismiss?: () => void;
  }>({});

  // Função showAlert tipada explicitamente como callable
  const showAlert = useCallback((
    title?: string, 
    message?: string, 
    buttons?: AlertButton[], 
    options?: { cancelable?: boolean }
  ) => {
    // Validação para evitar chamadas inválidas
    if (typeof title !== 'string' && typeof message !== 'string' && !buttons) {
      console.warn('useCustomAlert: Parâmetros inválidos para showAlert');
      return;
    }
    setConfig({ 
      title, 
      message, 
      buttons: buttons || [{ text: 'OK' }], 
      onDismiss: options?.cancelable ? () => setVisible(false) : undefined 
    });
    setVisible(true);
  }, []);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    config.onDismiss?.();
  }, [config]);

  return { showAlert, handleDismiss, visible, config };
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 20,
    margin: 20,
    maxWidth: 300,
    width: '80%',
    ...Platform.select({
      web: { boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }, // Sombra no Web
    }),
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: colors.textPrimary,
  },
  message: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
    color: colors.placeholder,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    minWidth: 60,
    backgroundColor: colors.primary,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 16,
    textAlign: 'center',
    color: colors.textSecondary,
  },
  destructiveButton: {
    backgroundColor: colors.danger,
  },
  destructiveText: {
    color: colors.textSecondary,
  },
  cancelButton: {
    backgroundColor: colors.greyBlur,
  },
});

export { useCustomAlert, CustomAlert };