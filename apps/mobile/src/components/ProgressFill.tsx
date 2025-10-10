import { colors, fontSizes } from "@/packages/ui/theme/theme";
import { Dimensions, StyleSheet, View, Text } from "react-native";

const { width } = Dimensions.get('window');
const screenWidth = width - 80; // Padding lateral
export default function ProgressFill(){

    return (
        <View style={styles.header}>
                <View style={styles.progressContainer}>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      width: '100%',
                    }}
                  >
                    <Text style={styles.progressText}>Progresso</Text>
                    <Text style={styles.progressText}>3 de 4</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View style={styles.progressFill} />
                  </View>
                </View>
              </View>
    )
};

export const styles = StyleSheet.create({
    header: {
    alignItems: 'center'
  },
    progressContainer: {
    alignItems: 'center',
    width: screenWidth,
    paddingTop: 16
  },
    progressText: {
    fontSize: fontSizes.f14,
    marginBottom: 8,
    fontFamily: 'Nunito_400Regular',
    color: colors.primary
  },
    progressBar: {
    height: 8,
    backgroundColor: colors.greyBlur,
    borderRadius: 4,
    width: screenWidth,
    overflow: 'hidden'
  },
    progressFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    width: '75%' // 3 de 4
  },
})
