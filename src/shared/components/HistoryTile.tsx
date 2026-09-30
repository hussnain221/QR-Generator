import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { HistoryItem } from '../../core/storage/historyRepository';
import { ResultTypeIcon } from './ResultTypeIcon';
import { ResultParser } from '../../core/scan/resultParser';
import { theme, useTheme } from '../../theme/theme';
import { AppIcon } from './AppIcon';

interface Props {
  item: HistoryItem;
  onPress: (item: HistoryItem) => void;
  onDelete?: (id: number) => void;
}

export const HistoryTile: React.FC<Props> = ({ item, onPress, onDelete }) => {
  const { colors, isDark } = useTheme();
  const parsed = ResultParser.parse(item.rawContent);

  const formatTimestamp = (ts: number): string => {
    const date = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDisplayHeading = (): string => {
    switch (item.type) {
      case 'url':
        return parsed.metadata.url || item.rawContent;
      case 'wifi':
        return parsed.metadata.ssid ? `Wi-Fi: ${parsed.metadata.ssid}` : item.rawContent;
      case 'vcard':
        return parsed.metadata.name ? `Contact: ${parsed.metadata.name}` : item.rawContent;
      case 'upi':
        return parsed.metadata.pa ? `UPI: ${parsed.metadata.pa}` : item.rawContent;
      case 'plainText':
      default:
        return item.rawContent;
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface }]}
      activeOpacity={0.7}
      onPress={() => onPress(item)}
    >
      <ResultTypeIcon type={item.type} size={42} />

      <View style={styles.textContainer}>
        <View style={styles.topRow}>
          <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
            {getDisplayHeading()}
          </Text>
        </View>

        <View style={styles.bottomRow}>
          <View
            style={[
              styles.badge,
              item.isScanOrGenerate === 'scan' ? styles.scanBadge : styles.generateBadge,
            ]}
          >
            <Text style={[styles.badgeText, { color: isDark ? '#E2E8F0' : '#1E293B' }]}>
              {item.isScanOrGenerate === 'scan' ? 'Scanned' : 'Created'}
            </Text>
          </View>
          <Text style={[styles.timeText, { color: colors.textSecondary }]}>{formatTimestamp(item.timestamp)}</Text>
        </View>
      </View>

      {onDelete && item.id !== undefined && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDelete(item.id!)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <AppIcon name="close" size={14} color={colors.danger} strokeWidth={2.5} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};


const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  textContainer: {
    flex: 1,
    marginLeft: theme.spacing.md,
    marginRight: theme.spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: theme.borderRadius.sm,
  },
  scanBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
  },
  generateBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  badgeText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '600',
  },
  timeText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteIconText: {
    color: theme.colors.danger,
    fontSize: 13,
    fontWeight: '700',
  },
});
