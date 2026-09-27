import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Linking,
  Alert,
  Share,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { PrefsRepository, ThemeMode } from '../../core/storage/prefsRepository';
import { HistoryRepository } from '../../core/storage/historyRepository';
import { theme } from '../../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('dark');
  const [vibrate, setVibrate] = useState<boolean>(true);
  const [beep, setBeep] = useState<boolean>(false);

  useEffect(() => {
    const loadSettings = async () => {
      const mode = await PrefsRepository.getInstance().getThemeMode();
      const vib = await PrefsRepository.getInstance().getVibrateOnScan();
      const bp = await PrefsRepository.getInstance().getBeepOnScan();
      setThemeModeState(mode);
      setVibrate(vib);
      setBeep(bp);
    };
    loadSettings();
  }, []);

  const handleThemeChange = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await PrefsRepository.getInstance().setThemeMode(mode);
  };

  const handleVibrateToggle = async (val: boolean) => {
    setVibrate(val);
    await PrefsRepository.getInstance().setVibrateOnScan(val);
  };

  const handleBeepToggle = async (val: boolean) => {
    setBeep(val);
    await PrefsRepository.getInstance().setBeepOnScan(val);
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Clear All History',
      'Are you sure you want to permanently delete all scan and generation history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await HistoryRepository.getInstance().clear();
            Alert.alert('History Cleared', 'All records have been removed.');
          },
        },
      ]
    );
  };

  const handleOpenPrivacyPolicy = async () => {
    const url = 'https://policies.google.com/privacy';
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    }
  };

  const handleRateApp = async () => {
    const playStoreUrl = 'market://details?id=com.example.qr_scanner_app';
    const webUrl = 'https://play.google.com/store/apps/details?id=com.example.qr_scanner_app';
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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.iconText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.iconButtonPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* SECTION 1: APPEARANCE */}
        <Text style={styles.sectionHeader}>Appearance</Text>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Theme</Text>
          <View style={styles.themeRow}>
            {(['dark', 'light', 'system'] as const).map((mode) => {
              const isSelected = themeMode === mode;
              const labels: Record<ThemeMode, string> = {
                dark: '🌙 Dark',
                light: '☀️ Light',
                system: '📱 System',
              };
              return (
                <TouchableOpacity
                  key={mode}
                  style={[styles.themeChip, isSelected && styles.themeChipSelected]}
                  onPress={() => handleThemeChange(mode)}
                >
                  <Text
                    style={[
                      styles.themeChipText,
                      isSelected && styles.themeChipTextSelected,
                    ]}
                  >
                    {labels[mode]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* SECTION 2: SCANNER BEHAVIOR */}
        <Text style={styles.sectionHeader}>Scanner Feedback</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>Vibrate on Scan</Text>
              <Text style={styles.settingSubtitle}>Provide haptic feedback on successful detection</Text>
            </View>
            <Switch
              value={vibrate}
              onValueChange={handleVibrateToggle}
              trackColor={{ false: theme.colors.surfaceHover, true: theme.colors.primary }}
            />
          </View>

          <View style={[styles.settingRow, { borderTopWidth: 1, borderTopColor: theme.colors.border, marginTop: 12, paddingTop: 12 }]}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>Beep on Scan</Text>
              <Text style={styles.settingSubtitle}>Play a short tone when code is captured</Text>
            </View>
            <Switch
              value={beep}
              onValueChange={handleBeepToggle}
              trackColor={{ false: theme.colors.surfaceHover, true: theme.colors.primary }}
            />
          </View>
        </View>

        {/* SECTION 3: STORAGE */}
        <Text style={styles.sectionHeader}>Data Management</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.dangerRow} onPress={handleClearHistory}>
            <Text style={styles.dangerRowText}>🗑️ Clear All Saved History</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* SECTION 4: ABOUT & LEGAL */}
        <Text style={styles.sectionHeader}>About & Legal</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.menuRow} onPress={handleOpenPrivacyPolicy}>
            <Text style={styles.menuRowText}>🔒 Privacy Policy</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuRow, { borderTopWidth: 1, borderTopColor: theme.colors.border }]}
            onPress={handleRateApp}
          >
            <Text style={styles.menuRowText}>⭐ Rate on Google Play</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuRow, { borderTopWidth: 1, borderTopColor: theme.colors.border }]}
            onPress={handleShareApp}
          >
            <Text style={styles.menuRowText}>📤 Share with Friends</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* APP INFO FOOTER */}
        <View style={styles.aboutFooter}>
          <Text style={styles.aboutAppName}>QR & Barcode Scanner</Text>
          <Text style={styles.aboutVersion}>Version 1.0.0 (Build 1)</Text>
          <Text style={styles.aboutTagline}>
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
    color: theme.colors.textSecondary,
    fontSize: 13,
    marginBottom: 10,
  },
  themeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  themeChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surfaceHover,
    alignItems: 'center',
  },
  themeChipSelected: {
    backgroundColor: theme.colors.primary,
  },
  themeChipText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  themeChipTextSelected: {
    color: '#FFF',
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
