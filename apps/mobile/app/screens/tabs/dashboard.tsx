import * as React from 'react'
import { View, Image, StyleSheet, ScrollView } from 'react-native'
import { Text } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { List } from 'phosphor-react-native'
import { colors } from '@/packages/ui/theme/theme'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'

export default function Dashboard() {
  return (
    <View style={styles.container}>
      <StatusBar />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={require('@/packages/ui/assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.text}>
            Plural <Text style={styles.textSecondary}>PLATAFORMA</Text>
          </Text>
        </View>
        <View style={styles.headerRight}></View>
      </View>
      <SafeAreaProvider>
        <SafeAreaView edges={['top']}>
          <ScrollView>
            <Text>Bem-vindo à Plural Plataforma!</Text>
          </ScrollView>
        </SafeAreaView>
      </SafeAreaProvider>
    </View>
  )
}

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },

  header: {
    backgroundColor: colors.tertiary,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 60,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  text: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: 'Nunito_700Bold'
  },
  textSecondary: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.primary,
    fontFamily: 'Nunito_400Regular',
    textTransform: 'uppercase'
  },
  logo: {
    width: 42.79,
    height: 33.65,
    marginRight: 10
  }
})
