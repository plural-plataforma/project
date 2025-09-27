import { colors, fontSizes } from '@/packages/ui/theme/theme'
import {
  Text,
  View,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity
} from 'react-native'
import { CheckCircle } from 'phosphor-react-native'
import Icon from 'react-native-vector-icons/FontAwesome'

// Definindo a interface para as props
interface DividerWithTextProps {
  text: string
}

const DividerWithText = ({ text }: DividerWithTextProps) => {
  return (
    <View style={styles.dividerContainer}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerText}>{text}</Text>
      <View style={styles.dividerLine} />
    </View>
  )
}

export default function Login() {
  return (
    <View style={styles.appContainer}>
      <View style={styles.container}>
        <Image
          source={require('../../assets/images/logo-plural-plataforma.png')}
          style={styles.logo}
        />
        <View style={{ margin: 0, padding: 0 }}>
          <Text style={styles.text}>Seja bem vindo!</Text>
          <View style={{ margin: 0, padding: 0 }}>
            <Text style={styles.textLabel}>E-mail</Text>
            <TextInput
              placeholder="Informe seu e-mail"
              style={styles.input}
              placeholderTextColor={colors.secondary}
            />
          </View>
        </View>
        <View style={{ margin: 0, padding: 0 }}>
          <Text style={styles.textLabel}>Senha</Text>
          <TextInput
            placeholder="Informe sua senha"
            style={styles.input}
            placeholderTextColor={colors.secondary}
          />
        </View>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            margin: 0,
            padding: 0,
            width: '90%'
          }}
        >
          <View style={styles.checkboxContainer}>
            <TouchableOpacity style={styles.checkbox}>
              <CheckCircle size={32} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.textSecondary}>Lembrar-me</Text>
          </View>
          <TouchableOpacity>
            <Text style={styles.textSecondary}>Esqueci minha senha?</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.button}>Entrar</TouchableOpacity>
      </View>
      <View style={{ alignItems: 'center' }}>
        <DividerWithText text="Entre com" />

        <TouchableOpacity style={styles.buttonAuth}>
          <Icon
            name="google"
            size={20}
            color={colors.primary}
            style={styles.icon}
          />
          <Text style={styles.buttonAuthText}>Google</Text>
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={[styles.textSecondary, { fontSize: fontSizes.md }]}>
            Não tem uma conta?
            <TouchableOpacity>
              <Text
                style={[
                  styles.textLabel,
                  { fontSize: fontSizes.md, fontWeight: '700' }
                ]}
              >
                Inscreva-se
              </Text>
            </TouchableOpacity>
          </Text>
        </View>
      </View>
    </View>
  )
}

export const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: colors.background
  },
  container: {
    width: '72%',
    alignSelf: 'center'
  },
  logo: {
    width: 248,
    height: 87.29,
    alignSelf: 'center',
    resizeMode: 'contain'
  },
  text: {
    color: colors.primary,
    paddingTop: 20,
    margin: 12,
    fontSize: fontSizes.xxxl,
    fontWeight: '400',
    fontFamily: 'Nunito_400Regular'
  },
  textLabel: {
    color: colors.primary,
    marginHorizontal: 12,
    fontSize: fontSizes.base,
    fontFamily: 'Nunito_400Regular'
  },
  textSecondary: {
    color: colors.primary,
    margin: 12,
    fontSize: fontSizes.base,
    fontFamily: 'Nunito_400Regular'
  },
  input: {
    paddingLeft: 16,
    height: 55,
    width: '90%',
    color: colors.primary,
    borderColor: colors.primary,
    borderWidth: 1,
    margin: 12,
    borderRadius: 8,
    fontFamily: 'Nunito_400Regular'
  },
  button: {
    marginLeft: 12,
    marginRight: 12,
    backgroundColor: colors.tertiary,
    height: 55,
    width: '90%',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: 'Nunito_700Bold',
    borderRadius: 8
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 12
  },
  checkbox: {
    marginRight: 0 // Espaçamento entre o ícone e o texto
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '72%',
    alignSelf: 'center',
    marginVertical: 40,
    margin: 0
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.secondary // Alinha com o tema
  },
  dividerText: {
    paddingHorizontal: 10,
    color: colors.primary,
    fontSize: fontSizes.base,
    fontFamily: 'Nunito_400Regular'
  },
  buttonAuth: {
    marginLeft: 12,
    marginRight: 12,
    backgroundColor: '#fff', // Cor típica do Google
    borderColor: colors.primary,
    borderWidth: 1,
    height: 55,
    width: '40%', // Mesmo tamanho dos outros botões
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginTop: 20,
    flexDirection: 'row'
  },
  buttonAuthText: {
    color: colors.primary,
    fontSize: fontSizes.base,
    fontFamily: 'Nunito_700Bold'
  },
  icon: {
    marginRight: 8
  }
})
