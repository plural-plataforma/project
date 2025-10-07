import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, fontSizes } from '@/packages/ui/theme/theme'; // Ajuste o caminho conforme necessário
import { Warning } from 'phosphor-react-native';
import CustomButton from './CustomButton';

interface NotificationBannerProps {
  onPress: () => void;
}

const NotificationBanner: React.FC<NotificationBannerProps> = ({ onPress }) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Warning size={24} color={colors.danger} />
        <View style={styles.texts}>
            <Text style={styles.text}>Finalize seu cadastro!</Text>
            <Text style={styles.textSecondary}>Conclua a configuração do seu perfil para acessar todos os recursos da plataforma</Text>
        </View>
        </View>
 <CustomButton style={styles.button}  title={'Concluir agora'} onPress={onPress} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFD4D4',
    borderRadius: 8,
    flexDirection: 'column',
    alignItems: 'center',
    padding: 10,
    margin: 10,
    
    borderColor: '#ef5350', // Cor da borda vermelha
    borderLeftWidth: 6, // Borda mais grossa no lado esquerdo
    // Sombra para iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84
  },
  iconContainer: {
    flexDirection: 'row',
    paddingTop:10,
    paddingBottom:10,
  },
  texts:{
    flex: 1,
    fontFamily: 'Nunito_400Regular',
    textAlign: 'left',
    paddingHorizontal:10
  },
  text: {
    fontSize: fontSizes.base,
    color: colors.black,
  },
  textSecondary:{
    fontSize: fontSizes.sm,
    color:colors.blackOff,
    paddingTop:5,
    paddingBottom:5
  },
  button: {
    backgroundColor: colors.black,
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 8,
    width:'100%',
    alignItems:'center'
  },
});

export default NotificationBanner;