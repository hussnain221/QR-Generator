import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { HistoryRepository, HistoryItem } from '../../core/storage/historyRepository';
import { HistoryTile } from '../../shared/components/HistoryTile';
import { ResultParser } from '../../core/scan/resultParser';
import { AppBannerAd } from '../../shared/components/AppBannerAd';
import { AppIcon } from '../../shared/components/AppIcon';
import { showDialog } from '../../shared/components/AppDialog';
import { theme, useTheme } from '../../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'History'>;
type FilterTab = 'all' | 'scan' | 'generate';

export const HistoryScreen: React.FC<Props> = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [isLoading, setIsLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      if (searchQuery.trim()) {
        const results = await HistoryRepository.getInstance().search(
          searchQuery,
          activeFilter
        );
        setItems(results);
      } else {
        const all = await HistoryRepository.getInstance().getAll();
        if (activeFilter === 'all') {
          setItems(all);
        } else {
          setItems(all.filter((i) => i.isScanOrGenerate === activeFilter));
        }
      }
    } catch (err) {
      console.warn('Failed to load history:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, activeFilter]);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  const handleDeleteItem = async (id: number) => {
    try {
      await HistoryRepository.getInstance().delete(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch {
      showDialog({
        title: 'Delete Failed',
        message: 'Failed to delete history item.',
        type: 'danger',
        icon: 'warning',
        confirmText: 'OK',
      });
    }
  };

  const handleClearAll = () => {
    if (items.length === 0) return;

    showDialog({
      title: 'Clear All History',
      message: 'Are you sure you want to delete all scan and generation history? This action cannot be undone.',
      type: 'danger',
      icon: 'trash',
      cancelText: 'Cancel',
      confirmText: 'Clear All',
      isDestructive: true,
      onConfirm: async () => {
        await HistoryRepository.getInstance().clear();
        setItems([]);
        showDialog({
          title: 'History Cleared',
          message: 'All records have been permanently removed.',
          type: 'success',
          icon: 'check',
          confirmText: 'Done',
        });
      },
    });
  };

  const handleSelectTile = (item: HistoryItem) => {
    const parsed = ResultParser.parse(item.rawContent);
    navigation.navigate('ScanResult', { parsedResult: parsed });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: colors.surface }]}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <AppIcon name="arrow-left" size={20} color={colors.textPrimary} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>History</Text>

        <TouchableOpacity
          style={[
            styles.iconButton,
            { backgroundColor: colors.surface },
            items.length === 0 && { opacity: 0.4 },
          ]}
          onPress={handleClearAll}
          disabled={items.length === 0}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <AppIcon
            name="trash"
            size={19}
            color={items.length === 0 ? colors.textSecondary : colors.danger}
          />
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: colors.surface,
              color: colors.textPrimary,
              borderColor: colors.border,
            },
          ]}
          placeholder="Search history by content..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={[styles.clearSearchButton, { backgroundColor: colors.surfaceHover }]}
            onPress={() => setSearchQuery('')}
          >
            <AppIcon name="close" size={14} color={colors.textSecondary} strokeWidth={2.5} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        {(['all', 'scan', 'generate'] as const).map((filter) => {
          const isSelected = activeFilter === filter;
          const labels: Record<FilterTab, string> = {
            all: 'All',
            scan: 'Scanned',
            generate: 'Generated',
          };
          return (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterChip,
                {
                  backgroundColor: isSelected ? colors.primary : colors.surface,
                },
              ]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: isSelected ? '#FFFFFF' : colors.textSecondary },
                ]}
              >
                {labels[filter]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* History List / Loading / Empty */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <HistoryTile
              item={item}
              onPress={handleSelectTile}
              onDelete={handleDeleteItem}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={{ marginBottom: theme.spacing.md }}>
                <AppIcon name="history" size={48} color={colors.textSecondary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                {searchQuery ? 'No matching results' : 'No history yet'}
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                {searchQuery
                  ? 'Try searching with a different keyword.'
                  : 'Codes you scan or generate will be securely stored here.'}
              </Text>
            </View>
          }
        />
      )}

      {/* Bottom Banner Ad */}
      <View style={styles.bannerWrapper}>
        <AppBannerAd />
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: 50,
  },
  bannerWrapper: {
    paddingBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    color: '#FFF',
    fontSize: 20,
  },
  headerTitle: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  searchContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    position: 'relative',
  },
  searchInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: theme.colors.textPrimary,
    fontSize: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  clearSearchButton: {
    position: 'absolute',
    right: 28,
    top: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceHover,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearSearchText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    gap: 8,
    marginBottom: theme.spacing.md,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface,
  },
  filterChipSelected: {
    backgroundColor: theme.colors.primary,
  },
  filterChipText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  filterChipTextSelected: {
    color: '#FFF',
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: theme.spacing.xl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  emptyTitle: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
