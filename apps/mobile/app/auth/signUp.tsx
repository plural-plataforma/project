import {
  AuthButton,
  Button,
  CheckboxWithLabel,
  DividerWithText,
  InputField,
  Logo,
  SignupLink
} from '@/packages/ui/components'
import { colors, fontSizes } from '@/packages/ui/theme/theme'
import { useRouter } from 'expo-router'
import { navigate } from 'expo-router/build/global-state/routing'
import { CaretLeft } from 'phosphor-react-native'
import {
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
  ScrollView
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function SignUp() {
  const router = useRouter()
  return (
    <SafeAreaView style={styles.appContainer}>
      <ScrollView>
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
          <Logo width={172} height={60.54} />
        </View>
        <View style={styles.groupContainer}>
          <Text style={styles.title}>Crie sua conta</Text>
          <InputField
            label="Nome de usuário"
            placeholder="Seu nome de usuário"
          />
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
          <View style={styles.authSection}>
            <DividerWithText text="Entre com" />
            <AuthButton
              title="Google"
              onPress={() => {}}
              iconName="google"
              isGoogle={true}
            />
            <SignupLink
              onPress={() => {
                router.back()
              }}
              labelQuestion="Já tem uma conta?"
              labelAction="Entrar"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export const styles = StyleSheet.create({
  appContainer: {
    flex: 1
  },
  appTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 40,
    gap: 30,
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
    width: '90%',
    alignSelf: 'center'
  },
  title: {
    color: colors.primary,
    paddingTop: 20,

    fontSize: fontSizes.xxxl,
    fontWeight: '400' as const,
    fontFamily: 'Nunito_400Regular'
  },
  checkboxRow: {},
  authSection: {
    alignItems: 'center'
  }
})
