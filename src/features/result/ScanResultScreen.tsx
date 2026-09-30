import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
  Linking,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { HistoryRepository } from '../../core/storage/historyRepository';
import { ResultTypeIcon } from '../../shared/components/ResultTypeIcon';
import { AppIcon } from '../../shared/components/AppIcon';
import { showDialog } from '../../shared/components/AppDialog';
import { AdManager } from '../../core/ads/adManager';
import { theme, useTheme } from '../../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ScanResult'>;

export const ScanResultScreen: React.FC<Props> = ({ route, navigation }) => {
  const { colors, isDark } = useTheme();
  const parsedResult = route.params?.parsedResult;
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null);

  // Auto-save to SQLite history on screen mount
  useEffect(() => {
    if (!parsedResult) return;

    HistoryRepository.getInstance()
      .insert({
        type: parsedResult.type,
        rawContent: parsedResult.rawContent,
        isScanOrGenerate: 'scan',
        timestamp: Date.now(),
      })
      .catch((err) => {
        console.warn('Failed to auto-save scan result:', err);
      });

    // Trigger frequency-capped interstitial ad
    const adTimer = setTimeout(() => {
      AdManager.getInstance().showInterstitial();
    }, 800);

    return () => clearTimeout(adTimer);
  }, [parsedResult]);

  const showCopyFeedback = (message: string = 'Copied to clipboard!') => {
    setCopiedMessage(message);
    setTimeout(() => setCopiedMessage(null), 2500);
  };

  const copyToClipboard = async (text: string, customMessage?: string) => {
    await Clipboard.setStringAsync(text);
    showCopyFeedback(customMessage);
  };

  const shareContent = async (text: string) => {
    try {
      await Share.share({
        message: text,
      });
    } catch (error) {
      console.warn('Share error:', error);
    }
  };

  const openUrl = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        showDialog({
          title: 'Cannot Open Link',
          message: `No compatible app found on your device to open: ${url}`,
          type: 'warning',
          icon: 'warning',
          confirmText: 'OK',
        });
      }
    } catch {
      showDialog({
        title: 'Failed to Open',
        message: `Could not open: ${url}`,
        type: 'danger',
        icon: 'warning',
        confirmText: 'OK',
      });
    }
  };

  if (!parsedResult) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>No Scan Result</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.primaryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { type, rawContent, metadata, displayTitle } = parsedResult;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.surface }]}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <AppIcon name="arrow-left" size={20} color={colors.textPrimary} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Scan Details</Text>

        <TouchableOpacity
          style={[styles.shareButton, { backgroundColor: colors.surface }]}
          onPress={() => shareContent(rawContent)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <AppIcon name="share" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>


      {/* Copy confirmation toast */}
      {copiedMessage && (
        <View style={styles.toastContainer}>
          <AppIcon name="check" size={15} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.toastText}>{copiedMessage}</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Type Header Card */}
        <View style={[styles.overviewCard, { backgroundColor: colors.surface }]}>
          <ResultTypeIcon type={type} size={54} />
          <View style={styles.overviewTextContainer}>
            <Text style={[styles.typeBadgeTitle, { color: colors.textPrimary }]}>{displayTitle}</Text>
            <Text style={[styles.typeBadgeSubtitle, { color: colors.textSecondary }]}>Auto-detected format</Text>
          </View>
        </View>

        {/* 1. URL SPECIFIC VIEW */}
        {type === 'url' && (
          <View style={[styles.sectionCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Website Address</Text>
            <Text style={[styles.primaryValueText, { color: colors.textPrimary }]} selectable>
              {metadata.url || rawContent}
            </Text>

            <TouchableOpacity
              style={[styles.primaryButton, { marginTop: theme.spacing.md, backgroundColor: colors.primary }]}
              onPress={() => openUrl(metadata.url || rawContent)}
            >
              <Text style={styles.primaryButtonText}>Open in Browser</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton, { backgroundColor: colors.surfaceHover }]}
              onPress={() => copyToClipboard(metadata.url || rawContent, 'URL copied!')}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.textPrimary }]}>Copy Link</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 2. WI-FI SPECIFIC VIEW */}
        {type === 'wifi' && (
          <View style={[styles.sectionCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Network Name (SSID)</Text>
            <Text style={[styles.primaryValueText, { color: colors.textPrimary }]} selectable>
              {metadata.ssid || 'Unknown Network'}
            </Text>

            {metadata.password ? (
              <View style={{ marginTop: theme.spacing.md }}>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Password</Text>
                <View style={[styles.credentialBox, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                  <Text style={[styles.credentialText, { color: colors.textPrimary }]} selectable>
                    {metadata.password}
                  </Text>
                  <TouchableOpacity
                    style={[styles.miniCopyButton, { backgroundColor: colors.surfaceHover }]}
                    onPress={() => copyToClipboard(metadata.password, 'Password copied!')}
                  >
                    <Text style={[styles.miniCopyText, { color: colors.textPrimary }]}>Copy</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}

            <View style={styles.metaRow}>
              <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Security:</Text>
              <Text style={[styles.metaValue, { color: colors.textPrimary }]}>{metadata.authType || 'WPA'}</Text>
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, { marginTop: theme.spacing.md, backgroundColor: colors.primary }]}
              onPress={() =>
                copyToClipboard(metadata.password || metadata.ssid, 'Wi-Fi credentials copied!')
              }
            >
              <Text style={styles.primaryButtonText}>Copy Credentials</Text>
            </TouchableOpacity>

            <View style={styles.infoTipBox}>
              <AppIcon name="wifi" size={16} color={colors.accent} />
              <Text style={styles.infoTipText}>
                Open Wi-Fi settings in your device and paste this password to connect.
              </Text>
            </View>
          </View>
        )}

        {/* 3. VCARD SPECIFIC VIEW */}
        {type === 'vcard' && (
          <View style={[styles.sectionCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Full Name</Text>
            <Text style={[styles.primaryValueText, { color: colors.textPrimary }]} selectable>
              {metadata.name || 'Contact'}
            </Text>

            {metadata.phone ? (
              <View style={styles.detailRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Phone</Text>
                  <Text style={[styles.detailValue, { color: colors.textPrimary }]} selectable>
                    {metadata.phone}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.inlineActionButton, { backgroundColor: colors.primary }]}
                  onPress={() => openUrl(`tel:${metadata.phone}`)}
                >
                  <Text style={styles.inlineActionText}>Call</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {metadata.email ? (
              <View style={styles.detailRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Email</Text>
                  <Text style={[styles.detailValue, { color: colors.textPrimary }]} selectable>
                    {metadata.email}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.inlineActionButton, { backgroundColor: colors.primary }]}
                  onPress={() => openUrl(`mailto:${metadata.email}`)}
                >
                  <Text style={styles.inlineActionText}>Email</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {metadata.organization ? (
              <View style={{ marginTop: theme.spacing.sm }}>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Organization</Text>
                <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{metadata.organization}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.secondaryButton, { marginTop: theme.spacing.md, backgroundColor: colors.surfaceHover }]}
              onPress={() => copyToClipboard(rawContent, 'Contact info copied!')}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.textPrimary }]}>Copy All Details</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 4. UPI SPECIFIC VIEW */}
        {type === 'upi' && (
          <View style={[styles.sectionCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Payee UPI ID</Text>
            <Text style={[styles.primaryValueText, { color: colors.textPrimary }]} selectable>
              {metadata.pa || 'N/A'}
            </Text>

            {metadata.pn ? (
              <View style={{ marginTop: theme.spacing.sm }}>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Payee Name</Text>
                <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{metadata.pn}</Text>
              </View>
            ) : null}

            {metadata.am ? (
              <View style={{ marginTop: theme.spacing.sm }}>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Amount</Text>
                <Text style={[styles.primaryValueText, { color: colors.accent }]}>
                  {metadata.cu || 'INR'} {metadata.am}
                </Text>
              </View>
            ) : null}

            {metadata.tn ? (
              <View style={{ marginTop: theme.spacing.sm }}>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Note</Text>
                <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{metadata.tn}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.primaryButton, { marginTop: theme.spacing.md, backgroundColor: '#059669' }]}
              onPress={() => openUrl(rawContent)}
            >
              <Text style={styles.primaryButtonText}>Open in Payment App</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton, { backgroundColor: colors.surfaceHover }]}
              onPress={() => copyToClipboard(metadata.pa, 'UPI ID copied!')}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.textPrimary }]}>Copy UPI ID</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 5. PLAIN TEXT / BARCODE VIEW */}
        {type === 'plainText' && (
          <View style={[styles.sectionCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Raw Content</Text>
            <View style={[styles.rawContentBox, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
              <Text style={[styles.rawContentText, { color: colors.textPrimary }]} selectable>
                {rawContent}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, { marginTop: theme.spacing.md, backgroundColor: colors.primary }]}
              onPress={() => copyToClipboard(rawContent, 'Text copied!')}
            >
              <Text style={styles.primaryButtonText}>Copy Text</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton, { backgroundColor: colors.surfaceHover }]}
              onPress={() =>
                openUrl(`https://www.google.com/search?q=${encodeURIComponent(rawContent)}`)
              }
            >
              <Text style={[styles.secondaryButtonText, { color: colors.textPrimary }]}>Search on Google</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Universal Actions */}
        <View style={styles.universalActions}>
          <TouchableOpacity
            style={[styles.scanAgainButton, { borderColor: colors.border }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.scanAgainText, { color: colors.textSecondary }]}>Scan Another Code</Text>
          </TouchableOpacity>
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
  centerContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 22,
  },
  headerTitle: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  shareButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareIconText: {
    fontSize: 18,
  },
  toastContainer: {
    position: 'absolute',
    top: 104,
    alignSelf: 'center',
    zIndex: 99,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#10B981',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: theme.borderRadius.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  toastText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  overviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.lg,
  },
  overviewTextContainer: {
    marginLeft: theme.spacing.md,
  },
  typeBadgeTitle: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  typeBadgeSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.lg,
  },
  sectionLabel: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  primaryValueText: {
    color: theme.colors.textPrimary,
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 24,
  },
  credentialBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  credentialText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  miniCopyButton: {
    backgroundColor: theme.colors.surfaceHover,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.sm,
  },
  miniCopyText: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    marginTop: theme.spacing.md,
    alignItems: 'center',
  },
  metaLabel: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginRight: 6,
  },
  metaValue: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  infoTipBox: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoTipText: {
    color: '#C7D2FE',
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
  },
  detailValue: {
    color: theme.colors.textPrimary,
    fontSize: 15,
  },
  inlineActionButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: theme.borderRadius.sm,
  },
  inlineActionText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  rawContentBox: {
    backgroundColor: '#0F172A',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  rawContentText: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    lineHeight: 22,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: theme.colors.surfaceHover,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  secondaryButtonText: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  universalActions: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  scanAgainButton: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  scanAgainText: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: theme.spacing.md,
  },
});
