import React, { ReactNode, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CaretUp, CaretDown } from "phosphor-react-native";
import { colors } from '@/packages/ui/theme/theme';

interface SectionProps {
  title: string;
  children?: ReactNode;
  icon?: React.ReactNode;
}

const SectionGroup: React.FC<SectionProps> = ({ title, children, icon }) => {
  const [isOpen, setIsOpen] = useState(false); // Estado inicial como aberto

  return (
    <View style={styles.sectionContainer}>
      <TouchableOpacity style={styles.sectionHeader} onPress={() => setIsOpen(!isOpen)}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <Text style={styles.sectionTitle}>{title}</Text>
        {isOpen ? <CaretUp size={20} color={colors.primary} /> : <CaretDown size={20} color={colors.primary} />}
      </TouchableOpacity>
      {isOpen && <View style={styles.sectionContent}>{children}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    marginBottom: 10,
    backgroundColor: colors.greyBlur,
    borderRadius: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  iconContainer: {
    marginRight: 8, // Adjusted spacing between icon and title
    paddingBottom: 0, // Removed unnecessary padding
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.primary,
    flex: 1, // Allows title to take available space
  },
  sectionContent: {
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
});

export default SectionGroup;