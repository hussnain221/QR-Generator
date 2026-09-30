import React from 'react';
import { View, StyleSheet } from 'react-native';
import { QrResultType } from '../../core/scan/resultParser';
import { AppIcon, IconName } from './AppIcon';

interface Props {
  type: QrResultType;
  size?: number;
}

export const ResultTypeIcon: React.FC<Props> = ({ type, size = 44 }) => {
  const getDetails = (): { icon: IconName; bg: string } => {
    switch (type) {
      case 'url':
        return { icon: 'globe', bg: '#2563EB' };
      case 'wifi':
        return { icon: 'wifi', bg: '#059669' };
      case 'vcard':
        return { icon: 'user', bg: '#7C3AED' };
      case 'upi':
        return { icon: 'credit-card', bg: '#D97706' };
      case 'plainText':
      default:
        return { icon: 'file-text', bg: '#475569' };
    }
  };

  const { icon, bg } = getDetails();

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <AppIcon name={icon} size={size * 0.52} color="#FFFFFF" strokeWidth={2} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
