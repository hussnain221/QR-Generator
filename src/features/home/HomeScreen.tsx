import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { HistoryRepository, HistoryItem } from '../../core/storage/historyRepository';
import { HistoryTile } from '../../shared/components/HistoryTile';
import { ResultParser } from '../../core/scan/resultParser';
import { AppBannerAd } from '../../shared/components/AppBannerAd';
import { theme } from '../../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const [recentItems, setRecentItems] = useState<HistoryItem[]>([]);

  useFocusEffect(
    useCallback(() => {
      HistoryRepository.getInstance()
        .getRecent(3)
        .then((items) => setRecentItems(items))
        .catch(() => {});
    }, [])
  );

  const handleSelectRecent = (item: HistoryItem) => {
    const parsed = ResultParser.parse(item.rawContent);
    navigation.navigate('ScanResult', { parsedResult: parsed });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.appTitle}>QR & Barcode</Text>
          <Text style={styles.appSubtitle}>Fast, secure, offline scanning</Text>
        </View>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate('Settings')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.iconText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Primary Action Buttons */}
        <View style={styles.actionsContainer}>
          {/* Scan Button */}
          <TouchableOpacity
            style={[styles.actionCard, styles.scanCard]}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Scanner')}
          >
            <View style={styles.cardIconBadge}>
              <Text style={styles.cardEmoji}>📷</Text>
            </View>
            <View>
              <Text style={styles.cardTitle}>Scan Code</Text>
              <Text style={styles.cardSubtitle}>Camera QR & Barcode detection</Text>
            </View>
          </TouchableOpacity>

          {/* Generate Button */}
          <TouchableOpacity
            style={[styles.actionCard, styles.generateCard]}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Generator')}
          >
            <View style={styles.cardIconBadge}>
              <Text style={styles.cardEmoji}>✨</Text>
            </View>
            <View>
              <Text style={styles.cardTitle}>Generate QR</Text>
              <Text style={styles.cardSubtitle}>URL, Wi-Fi, Contact, UPI, Text</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Recent History Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity onPress={() => navigation.navigate('History')}>
            <Text style={styles.seeAllText}>See All →</Text>
          </TouchableOpacity>
        </View>

        {recentItems.length > 0 ? (
          <View style={styles.recentList}>
            {recentItems.map((item) => (
              <HistoryTile
                key={item.id ?? item.timestamp}
                item={item}
                onPress={handleSelectRecent}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyHistoryCard}>
            <Text style={styles.emptyHistoryEmoji}>🕒</Text>
            <Text style={styles.emptyHistoryText}>No scans or generated codes yet</Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Banner Ad pinned like HistoryScreen */}
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
    paddingTop: 54,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  appTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  appSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 18,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  actionsContainer: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
  },
  scanCard: {
    backgroundColor: '#4F46E5',
  },
  generateCard: {
    backgroundColor: '#059669',
  },
  cardIconBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  cardEmoji: {
    fontSize: 24,
  },
  cardTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  seeAllText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  recentList: {
    marginBottom: theme.spacing.lg,
  },
  emptyHistoryCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  emptyHistoryEmoji: {
    fontSize: 32,
    marginBottom: theme.spacing.sm,
  },
  emptyHistoryText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  bannerWrapper: {
    paddingBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
