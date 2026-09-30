import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Linking,
  Share,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { PrefsRepository, ThemeMode } from '../../core/storage/prefsRepository';
import { HistoryRepository } from '../../core/storage/historyRepository';
import { AppIcon, IconName } from '../../shared/components/AppIcon';
import { showDialog } from '../../shared/components/AppDialog';
import { theme, useTheme } from '../../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: IconName }[] = [
  { mode: 'dark', label: 'Dark', icon: 'moon' },
  { mode: 'light', label: 'Light', icon: 'sun' },
  { mode: 'system', label: 'System', icon: 'smartphone' },
];

export const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const { mode: themeMode, setThemeMode, colors } = useTheme();
  const [vibrate, setVibrate] = useState<boolean>(true);
  const [beep, setBeep] = useState<boolean>(false);

  useEffect(() => {
    const loadSettings = async () => {
      const vib = await PrefsRepository.getInstance().getVibrateOnScan();
      const bp = await PrefsRepository.getInstance().getBeepOnScan();
      setVibrate(vib);
      setBeep(bp);
    };
    loadSettings();
  }, []);

  const handleVibrateToggle = async (val: boolean) => {
    setVibrate(val);
    await PrefsRepository.getInstance().setVibrateOnScan(val);
  };

  const handleBeepToggle = async (val: boolean) => {
    setBeep(val);
    await PrefsRepository.getInstance().setBeepOnScan(val);
  };

  const handleClearHistory = () => {
    showDialog({
      title: 'Clear All History',
      message: 'Are you sure you want to permanently delete all scan and generation history?',
      type: 'danger',
      icon: 'trash',
      cancelText: 'Cancel',
      confirmText: 'Clear All',
      isDestructive: true,
      onConfirm: async () => {
        await HistoryRepository.getInstance().clear();
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

  const handleOpenPrivacyPolicy = async () => {
    const url = 'https://policies.google.com/privacy';
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    }
  };

  const handleRateApp = async () => {
    const playStoreUrl = 'market://details?id=com.stormlogix.qrscanner';
    const webUrl = 'https://play.google.com/store/apps/details?id=com.stormlogix.qrscanner';
    try {
      const supported = await Linking.canOpenURL(playStoreUrl);
      if (supported) {
        await Linking.openURL(playStoreUrl);
      } else {
        await Linking.openURL(webUrl);
      }
    } catch {
      await Linking.openURL(webUrl);
    }
  };

  const handleShareApp = async () => {
    try {
      await Share.share({
        message: 'Check out this offline QR & Barcode Scanner: fast, private, and lightweight!',
      });
    } catch (err) {
      console.warn('Share app error:', err);
    }
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
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Settings</Text>
        <View style={styles.iconButtonPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* SECTION 1: APPEARANCE */}
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>Appearance</Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Theme Mode</Text>
          <View style={styles.themeRow}>
            {THEME_OPTIONS.map((item) => {
              const isSelected = themeMode === item.mode;
              return (
                <TouchableOpacity
                  key={item.mode}
                  style={[
                    styles.themeChip,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.surfaceHover,
                    },
                  ]}
                  onPress={() => setThemeMode(item.mode)}
                >
                  <AppIcon
                    name={item.icon}
                    size={16}
                    color={isSelected ? '#FFFFFF' : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.themeChipText,
                      { color: isSelected ? '#FFFFFF' : colors.textSecondary },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* SECTION 2: SCANNER BEHAVIOR */}
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>Scanner Feedback</Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Vibrate on Scan</Text>
              <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                Provide haptic feedback on successful detection
              </Text>
            </View>
            <Switch
              value={vibrate}
              onValueChange={handleVibrateToggle}
              trackColor={{ false: colors.surfaceHover, true: colors.primary }}
            />
          </View>

          <View
            style={[
              styles.settingRow,
              {
                borderTopWidth: 1,
                borderTopColor: colors.border,
                marginTop: 12,
                paddingTop: 12,
              },
            ]}
          >
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Beep on Scan</Text>
              <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                Play a short tone when code is captured
              </Text>
            </View>
            <Switch
              value={beep}
              onValueChange={handleBeepToggle}
              trackColor={{ false: colors.surfaceHover, true: colors.primary }}
            />
          </View>
        </View>

        {/* SECTION 3: STORAGE */}
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>Data Management</Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <TouchableOpacity style={styles.dangerRow} onPress={handleClearHistory}>
            <View style={styles.rowLeft}>
              <AppIcon name="trash" size={17} color={colors.danger} />
              <Text style={[styles.dangerRowText, { color: colors.danger }]}>Clear All Saved History</Text>
            </View>
            <AppIcon name="chevron-right" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* SECTION 4: ABOUT & LEGAL */}
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>About & Legal</Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <TouchableOpacity style={styles.menuRow} onPress={handleOpenPrivacyPolicy}>
            <View style={styles.rowLeft}>
              <AppIcon name="shield" size={18} color={colors.textPrimary} />
              <Text style={[styles.menuRowText, { color: colors.textPrimary }]}>Privacy Policy</Text>
            </View>
            <AppIcon name="chevron-right" size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuRow, { borderTopWidth: 1, borderTopColor: colors.border }]}
            onPress={handleRateApp}
          >
            <View style={styles.rowLeft}>
              <AppIcon name="star" size={18} color={colors.textPrimary} />
              <Text style={[styles.menuRowText, { color: colors.textPrimary }]}>Rate on Google Play</Text>
            </View>
            <AppIcon name="chevron-right" size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuRow, { borderTopWidth: 1, borderTopColor: colors.border }]}
            onPress={handleShareApp}
          >
            <View style={styles.rowLeft}>
              <AppIcon name="share" size={18} color={colors.textPrimary} />
              <Text style={[styles.menuRowText, { color: colors.textPrimary }]}>Share with Friends</Text>
            </View>
            <AppIcon name="chevron-right" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* APP INFO FOOTER */}
        <View style={styles.aboutFooter}>
          <Text style={[styles.aboutAppName, { color: colors.textPrimary }]}>QR Scanner & Generator</Text>
          <Text style={[styles.aboutVersion, { color: colors.textSecondary }]}>Version 1.0.0 (Build 1)</Text>
          <Text style={[styles.aboutTagline, { color: colors.textSecondary }]}>
            100% on-device processing. No servers, no tracking, complete privacy.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: 50,
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
  iconButtonPlaceholder: {
    width: 42,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: 60,
  },
  sectionHeader: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },
  themeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  themeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.md,
  },
  themeChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  settingTitle: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  settingSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  dangerRowText: {
    color: theme.colors.danger,
    fontSize: 15,
    fontWeight: '600',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  menuRowText: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '500',
  },
  chevron: {
    color: theme.colors.textSecondary,
    fontSize: 20,
    fontWeight: '300',
  },
  aboutFooter: {
    alignItems: 'center',
    marginTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  aboutAppName: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  aboutVersion: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
    marginBottom: 8,
  },
  aboutTagline: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
