import React from 'react'
import { View, StyleSheet } from 'react-native'
import InputField from '@src/components/InputField'
import CustomButton from '@src/components/CustomButton'
import { colors } from '@packages/ui/theme/theme'

interface Option {
    value: number
    label: string

}

interface SchoolFilterProps {
    options: Option[]
    selectedValue: number | null
    onChange: (value: number | null) => void
    showClearButton?: boolean
}

export default function SchoolFilter({
  options,
  selectedValue,
  onChange,
}: SchoolFilterProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.inputWrapper}>
        <InputField
          label="Filtro por escola"
          options={options}
          selectedValue={selectedValue}
          onValueChange={(value) =>
            onChange(value ? Number(value) : null)
          }
          placeholder="Selecione uma escola"
        />
      </View>

      {selectedValue !== null && (
        <View style={styles.clearWrapper}>
          <CustomButton
            title="Limpar"
            onPress={() => onChange(null)}
            buttonColor={{ backgroundColor: colors.primary }}
            textColor="#fff"
          />
        </View>
      )}
    </View>
  )
}


const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },

  inputWrapper: {
    minHeight: 56, 
    marginTop: 24,
  },

  clearWrapper: {
    alignSelf: 'stretch',
  },
})

