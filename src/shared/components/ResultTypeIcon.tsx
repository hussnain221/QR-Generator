import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { QrResultType } from '../../core/scan/resultParser';

interface Props {
  type: QrResultType;
  size?: number;
}

export const ResultTypeIcon: React.FC<Props> = ({ type, size = 44 }) => {
  const getDetails = (): { emoji: string; bg: string } => {
    switch (type) {
      case 'url':
        return { emoji: '🌐', bg: '#2563EB' };
      case 'wifi':
        return { emoji: '📶', bg: '#059669' };
      case 'vcard':
        return { emoji: '👤', bg: '#7C3AED' };
      case 'upi':
        return { emoji: '💳', bg: '#D97706' };
      case 'plainText':
      default:
        return { emoji: '📄', bg: '#475569' };
    }
  };

  const { emoji, bg } = getDetails();

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Text style={{ fontSize: size * 0.48 }}>{emoji}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
