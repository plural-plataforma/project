import React, { ReactNode, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CaretUp , CaretDown} from "phosphor-react-native";
import { colors } from '@/packages/ui/theme/theme';

interface SectionProps{
    title: string, 
    children?: ReactNode
}
const SectionGroup: React.FC<SectionProps> = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(true); // Estado inicial como aberto

  return (
    <View style={styles.sectionContainer}>
      <TouchableOpacity style={styles.sectionHeader} onPress={() => setIsOpen(!isOpen)}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {isOpen ? <CaretUp size={20} color="#333" /> : <CaretDown  size={20} color="#333" />}
      </TouchableOpacity>
      {isOpen && <View style={styles.sectionContent}>{children}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    marginBottom: 20,
    paddingBottom: 10,
    backgroundColor:colors.greyBlur,
    borderRadius:8
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
  },
  sectionContent: {
    paddingTop: 10,
  },
});

export default SectionGroup;