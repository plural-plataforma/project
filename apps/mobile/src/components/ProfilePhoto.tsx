import { StyleSheet, TouchableOpacity, View, Image, Text } from "react-native"
import * as ImagePicker from 'expo-image-picker';
import { useState } from "react";
import { Camera } from "phosphor-react-native";
import { colors } from "@/packages/ui/theme/theme";
import { useCustomAlert, CustomAlert } from '../hooks/useCustomAlert';


export default function ProfilePhoto() {
  const { showAlert, handleDismiss, visible, config } = useCustomAlert();

  const [fotoUri, setFotoUri] = useState<string | null>(null);

  const selecionarFoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAlert('Permissão negada', 'Precisamos de acesso à galeria para foto.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setFotoUri(result.assets[0].uri);
    }
  };

  return (
    <TouchableOpacity style={styles.fotoContainer} onPress={selecionarFoto}>
      <View style={styles.fotoCircle}>
        {fotoUri ? (
          <Image source={{ uri: fotoUri }} style={styles.fotoImage} />
        ) : (
          <Camera size={32} weight="fill" color={colors.primary} />
        )}
      </View>
      <Text style={styles.fotoLabel}>Escolher foto</Text>
      <CustomAlert
        visible={visible}
        title={config.title}
        message={config.message}
        buttons={config.buttons}
        onDismiss={handleDismiss}
      />
    </TouchableOpacity>
  )
};

export const styles = StyleSheet.create({
  fotoContainer: {
    alignItems: 'center',
    marginBottom: 30
  },
  fotoCircle: {
    width: 96,
    height: 96,
    borderRadius: 60,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10
  },
  fotoImage: {
    width: 120,
    height: 120,
    borderRadius: 60
  },
  fotoLabel: {
    color: '#F59E0B',
    fontWeight: '500'
  },
})