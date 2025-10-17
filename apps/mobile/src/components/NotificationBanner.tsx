import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { colors, fontSizes } from '@/packages/ui/theme/theme'; // Ajuste o caminho conforme necessário
import { Warning } from 'phosphor-react-native';

interface NotificationBannerProps {
  onPress: () => void;
}

const NotificationBanner: React.FC<NotificationBannerProps> = ({ onPress }) => {
  return (
    <SafeAreaView style={styles.viewBg}>
      <View style={[styles.view, styles.viewBg]}>
        <View style={[styles.div, styles.divLayout]}>
          <Warning style={styles.iIcon} size={18} weight='fill' />
          <View style={[styles.sectionDiv, styles.buttonLayout]}>
            <Text style={[styles.finalizeSeuCadastro, styles.concluirAgoraTypo]}>Finalize seu cadastro!</Text>
            <Text style={[styles.concluaAConfigurao, styles.concluaAConfiguraoFlexBox]}>Conclua a configuração do seu perfil para acessar todos os recursos da plataforma</Text>
            <TouchableOpacity style={[styles.button, styles.buttonLayout]}>
              <Text style={[styles.concluirAgora, styles.concluirAgoraTypo]} onPress={onPress}>Concluir agora</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>);
};
const styles = StyleSheet.create({
  section: {
    backgroundColor: "#ffd4d4",
    width:'100%'
  },
  viewBg: {
    backgroundColor: "#ffd4d4",

    borderRadius: 8
  },
  divLayout: {
    height: 104,
    backgroundColor: "rgba(0, 0, 0, 0)"
  },
  buttonLayout: {
    width: 292,
    position: "absolute"
  },
  concluirAgoraTypo: {
    height: 20,
    fontSize: 14,
    fontFamily: 'Nunito_700Bold',
    position: "absolute"
  },
  concluaAConfiguraoFlexBox: {
    textAlign: "left",
    left: 0
  },
  view: {
    
    borderStyle: "solid",
    borderColor: "rgba(255, 0, 0, 0.76)",
    borderLeftWidth: 4,
    height: 136
  },
  div: {
    top: 16,
    left: 20,
    width: 322,
    position: "absolute",
    height: 104,
    backgroundColor: "rgba(0, 0, 0, 0)"
  },
  iIcon: {
    top: 4,
    width: 18,
    height: 18,
    color: colors.danger,
    left: 0,
    position: "absolute"
  },
  sectionDiv: {
    left: 30,
    top: 0,
    height: '100%',
    backgroundColor: "rgba(0, 0, 0, 0)"
  },
  finalizeSeuCadastro: {
    lineHeight: 20,
    color: colors.primary,
    width: 186,
    textAlign: "left",
    fontWeight: "600",
    left: 0,
    top: 0
  },
  concluaAConfigurao: {
    top: 24,
    fontSize: 12,
    lineHeight: 16,
    color: colors.primary,
    width: 291,
    height: 32,
    fontFamily: "Nunito_400Regular",
    textAlign: "left",
    position: "absolute"
  },
  button: {
    top: 68,
    left: -1,
    borderRadius: 8,
    backgroundColor: "#276678",
    height: 36
  },
  concluirAgora: {
    marginLeft: -76,
    top: 9,
    left: "50%",
    textAlign: "center",
    width: 152,
    color: "#fff"
  }
});

export default NotificationBanner;