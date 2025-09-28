import {
  Button,
  CheckboxWithLabel,
  InputField,
  Logo
} from '@/packages/ui/components'
import { colors, fontSizes } from '@/packages/ui/theme/theme'
import { navigate } from 'expo-router/build/global-state/routing'
import { CaretLeft } from 'phosphor-react-native'
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native'

export default function SignUp() {
  return (
    <View style={styles.appContainer}>
      <View style={styles.appTopBar}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            navigate('./login')
          }}
        >
          <CaretLeft
            size={32}
            color={colors.primary}
            style={{ margin: 8, marginRight: 4, marginLeft: 4 }}
          />
        </TouchableOpacity>
        <Logo />
      </View>
      <View style={styles.groupContainer}>
        <Text style={styles.title}>Crie sua conta</Text>
        <InputField label="Nome de usuário" placeholder="Seu nome de usuário" />
        <InputField label="Email" placeholder="Seu e-mail" />

        <InputField
          label="Senha"
          placeholder="Informe sua senha"
          secureTextEntry={true}
        />
        <InputField
          label="Escola/Instituição"
          placeholder="Nome da Escola/Instituição"
        />

        <View style={styles.checkboxRow}>
          <CheckboxWithLabel label="Aceito os termos e a política de privacidade" />
        </View>
        <Button
          title="Cadastrar"
          onPress={() => {}}
          buttonColor={{ backgroundColor: colors.tertiary }}
        ></Button>
      </View>
    </View>
  )
}

export const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    margin: 12
  },
  appTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 40,
    gap: 30,
    paddingBottom: 30,
    paddingHorizontal: 12
  },
  button: {
    backgroundColor: '#fff',
    width: '7%',
    borderWidth: 1,
    alignItems: 'center',
    marginHorizontal: 12,
    opacity: 0.6,
    height: 40,
    borderColor: colors.primary,
    borderRadius: 8
  },
  groupContainer: {
    width: '72%',
    alignSelf: 'center'
  },
  title: {
    color: colors.primary,
    paddingTop: 20,

    fontSize: fontSizes.xxxl,
    fontWeight: '400' as const,
    fontFamily: 'Nunito_400Regular'
  },
  checkboxRow: {}
})
