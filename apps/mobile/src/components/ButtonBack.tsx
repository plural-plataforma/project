import Logo from "@src/components/Logo";
import { colors } from "@/packages/ui/theme/theme";
import { router } from "expo-router";
import { CaretLeft } from "phosphor-react-native";
import { StyleSheet,View, TouchableOpacity } from "react-native";

export default function ButtonBack() {

   return(
    
    <View style={styles.appTopBar}>
      <View style={styles.button}>
          <TouchableOpacity
            style={styles.buttonBack}
            onPress={() => {
              router.back();
            }}
          >
            <CaretLeft
              size={32}
              color={colors.primary}
              style={{paddingTop:'auto', margin:4, }}
            />
          </TouchableOpacity>
          </View>
          
    </View>
   );

}
export const styles = StyleSheet.create({
appTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button:{
     backgroundColor: '#fff',
    borderWidth: 1,
    alignItems: 'center',
    width:38,
    height: 40.140846252441406,
    borderColor: colors.secondary,
    borderRadius: 8
  },
buttonBack: {
   
  },

});