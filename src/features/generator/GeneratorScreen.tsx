import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  Switch,
  ActivityIndicator,
  Share,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library/legacy';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { useGeneratorStore, GeneratorTab } from './useGeneratorStore';
import { HistoryRepository } from '../../core/storage/historyRepository';
import { AdManager } from '../../core/ads/adManager';
import { AppIcon, IconName } from '../../shared/components/AppIcon';
import { showDialog } from '../../shared/components/AppDialog';
import { theme, useTheme } from '../../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Generator'>;

const TABS: { id: GeneratorTab; label: string; icon: IconName }[] = [
  { id: 'text', label: 'Text', icon: 'file-text' },
  { id: 'url', label: 'URL', icon: 'globe' },
  { id: 'wifi', label: 'Wi-Fi', icon: 'wifi' },
  { id: 'vcard', label: 'Contact', icon: 'user' },
  { id: 'upi', label: 'UPI', icon: 'credit-card' },
];

export const GeneratorScreen: React.FC<Props> = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const qrRef = useRef<View>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);
  const [isStyleUnlocked, setIsStyleUnlocked] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#0F172A');

  const {
    activeTab,
    generatedValue,
    generatedType,
    textInput,
    urlInput,
    wifiInput,
    vcardInput,
    upiInput,
    setActiveTab,
    setTextInput,
    setUrlInput,
    setWifiInput,
    setVcardInput,
    setUpiInput,
    generateCurrent,
    clearGenerated,
  } = useGeneratorStore();

  const showToast = (message: string) => {
    setFeedbackToast(message);
    setTimeout(() => setFeedbackToast(null), 2500);
  };

  const handleGenerate = async () => {
    const result = generateCurrent();
    if (!result) {
      showDialog({
        title: 'Required Fields Missing',
        message: 'Please fill in the required inputs before generating.',
        type: 'warning',
        icon: 'warning',
        confirmText: 'Got It',
      });
      return;
    }

    try {
      await HistoryRepository.getInstance().insert({
        type: result.type,
        rawContent: result.value,
        isScanOrGenerate: 'generate',
        timestamp: Date.now(),
      });
      showToast('QR Code generated & saved to history!');

      // Frequency-capped interstitial ad trigger
      setTimeout(() => {
        AdManager.getInstance().showInterstitial();
      }, 600);
    } catch (err) {
      console.warn('Failed to record generation:', err);
    }
  };

  const handleUnlockStyling = async () => {
    if (isStyleUnlocked) return;
    const shown = await AdManager.getInstance().showRewarded(() => {
      setIsStyleUnlocked(true);
      showToast('Custom colors unlocked for this session!');
    });

    if (!shown) {
      // In dev or if ad not filled yet, grant reward
      setIsStyleUnlocked(true);
      showToast('Custom colors unlocked!');
    }
  };

  const handleSaveToGallery = async () => {
    if (!qrRef.current) return;
    setIsSaving(true);
    try {
      let perm = await MediaLibrary.getPermissionsAsync(true);
      if (perm.status !== 'granted') {
        perm = await MediaLibrary.requestPermissionsAsync(true);
      }
      if (perm.status !== 'granted') {
        showDialog({
          title: 'Permission Required',
          message: 'Storage permission is required to save the QR code to your gallery.',
          type: 'warning',
          icon: 'warning',
          confirmText: 'OK',
        });
        setIsSaving(false);
        return;
      }

      const uri = await captureRef(qrRef, {
        format: 'png',
        quality: 1.0,
        result: 'tmpfile',
      });

      const asset = await MediaLibrary.createAssetAsync(uri);
      try {
        const album = await MediaLibrary.getAlbumAsync('QR Scanner');
        if (album) {
          await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        } else {
          await MediaLibrary.createAlbumAsync('QR Scanner', asset, false);
        }
      } catch (albumErr) {
        console.log('Album grouping optional:', albumErr);
      }

      showToast('Saved to photos gallery!');
      showDialog({
        title: 'Saved to Gallery',
        message: 'QR Code has been saved to your photo gallery.',
        type: 'success',
        icon: 'check',
        confirmText: 'Done',
      });
    } catch (error: any) {
      console.error('Save to gallery error:', error);
      showDialog({
        title: 'Save Failed',
        message: error?.message || 'Failed to save QR code image.',
        type: 'danger',
        icon: 'warning',
        confirmText: 'OK',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleShareImage = async () => {
    if (!qrRef.current) return;
    try {
      const uri = await captureRef(qrRef, {
        format: 'png',
        quality: 1.0,
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share QR Code Image',
        });
      } else if (generatedValue) {
        await Share.share({ message: generatedValue });
      }
    } catch (error) {
      showDialog({
        title: 'Share Failed',
        message: 'Failed to share QR image.',
        type: 'danger',
        icon: 'warning',
        confirmText: 'OK',
      });
    }
  };

  const handleCopyValue = async () => {
    if (generatedValue) {
      await Clipboard.setStringAsync(generatedValue);
      showToast('Content copied to clipboard!');
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
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Create QR Code</Text>
        <View style={styles.iconButtonPlaceholder} />
      </View>

      {feedbackToast && (
        <View style={styles.toastContainer}>
          <AppIcon name="check" size={14} color="#FFF" />
          <Text style={styles.toastText}>{feedbackToast}</Text>
        </View>
      )}

      {/* Segmented Tab Selector */}
      <View style={styles.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabContent}>
          {TABS.map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tabItem,
                  { backgroundColor: isSelected ? colors.primary : colors.surface },
                ]}
                onPress={() => setActiveTab(tab.id)}
              >
                <AppIcon
                  name={tab.icon}
                  size={15}
                  color={isSelected ? '#FFF' : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    { color: isSelected ? '#FFF' : colors.textSecondary },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>


      <ScrollView contentContainerStyle={styles.scrollBody} keyboardShouldPersistTaps="handled">
        {/* TAB 1: TEXT */}
        {activeTab === 'text' && (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Plain Text / Note</Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: colors.inputBg,
                  color: colors.textPrimary,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Enter message, note, or barcode value..."
              placeholderTextColor={colors.textSecondary}
              value={textInput}
              onChangeText={setTextInput}
              multiline
              numberOfLines={4}
            />
          </View>
        )}

        {/* TAB 2: URL */}
        {activeTab === 'url' && (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Website URL</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBg,
                  color: colors.textPrimary,
                  borderColor: colors.border,
                },
              ]}
              placeholder="https://example.com"
              placeholderTextColor={colors.textSecondary}
              value={urlInput}
              onChangeText={setUrlInput}
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>
        )}

        {/* TAB 3: WI-FI */}
        {activeTab === 'wifi' && (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Network Name (SSID) *</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBg,
                  color: colors.textPrimary,
                  borderColor: colors.border,
                },
              ]}
              placeholder="MyHomeWiFi"
              placeholderTextColor={colors.textSecondary}
              value={wifiInput.ssid}
              onChangeText={(text) => setWifiInput({ ssid: text })}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: theme.spacing.md }]}>Password</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBg,
                  color: colors.textPrimary,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Wi-Fi Password (leave empty for open)"
              placeholderTextColor={colors.textSecondary}
              value={wifiInput.password}
              onChangeText={(text) => setWifiInput({ password: text })}
              secureTextEntry
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: theme.spacing.md }]}>Security Type</Text>
            <View style={styles.chipRow}>
              {(['WPA', 'WEP', 'nopass'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.chip,
                    {
                      backgroundColor:
                        wifiInput.authType === type ? colors.primary : colors.surfaceHover,
                    },
                  ]}
                  onPress={() => setWifiInput({ authType: type })}
                >
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color:
                          wifiInput.authType === type ? '#FFF' : colors.textSecondary,
                      },
                    ]}
                  >
                    {type === 'nopass' ? 'Open' : type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.switchRow}>
              <Text style={[styles.switchLabel, { color: colors.textPrimary }]}>Hidden Network</Text>
              <Switch
                value={wifiInput.hidden}
                onValueChange={(val) => setWifiInput({ hidden: val })}
                trackColor={{ false: colors.surfaceHover, true: colors.primary }}
              />
            </View>
          </View>
        )}

        {/* TAB 4: VCARD */}
        {activeTab === 'vcard' && (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Full Name *</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBg,
                  color: colors.textPrimary,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Jane Doe"
              placeholderTextColor={colors.textSecondary}
              value={vcardInput.name}
              onChangeText={(text) => setVcardInput({ name: text })}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: theme.spacing.md }]}>Phone</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBg,
                  color: colors.textPrimary,
                  borderColor: colors.border,
                },
              ]}
              placeholder="+1 234 567 8900"
              placeholderTextColor={colors.textSecondary}
              value={vcardInput.phone}
              onChangeText={(text) => setVcardInput({ phone: text })}
              keyboardType="phone-pad"
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: theme.spacing.md }]}>Email</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBg,
                  color: colors.textPrimary,
                  borderColor: colors.border,
                },
              ]}
              placeholder="jane@example.com"
              placeholderTextColor={colors.textSecondary}
              value={vcardInput.email}
              onChangeText={(text) => setVcardInput({ email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: theme.spacing.md }]}>Organization</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBg,
                  color: colors.textPrimary,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Company / Team"
              placeholderTextColor={colors.textSecondary}
              value={vcardInput.organization}
              onChangeText={(text) => setVcardInput({ organization: text })}
            />
          </View>
        )}

        {/* TAB 5: UPI */}
        {activeTab === 'upi' && (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Payee UPI ID (VPA) *</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBg,
                  color: colors.textPrimary,
                  borderColor: colors.border,
                },
              ]}
              placeholder="merchant@upi"
              placeholderTextColor={colors.textSecondary}
              value={upiInput.pa}
              onChangeText={(text) => setUpiInput({ pa: text })}
              autoCapitalize="none"
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: theme.spacing.md }]}>Payee Name</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBg,
                  color: colors.textPrimary,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Store or Person Name"
              placeholderTextColor={colors.textSecondary}
              value={upiInput.pn}
              onChangeText={(text) => setUpiInput({ pn: text })}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: theme.spacing.md }]}>Amount (Optional)</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBg,
                  color: colors.textPrimary,
                  borderColor: colors.border,
                },
              ]}
              placeholder="250.00"
              placeholderTextColor={colors.textSecondary}
              value={upiInput.am}
              onChangeText={(text) => setUpiInput({ am: text })}
              keyboardType="decimal-pad"
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: theme.spacing.md }]}>Transaction Note</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBg,
                  color: colors.textPrimary,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Payment for goods"
              placeholderTextColor={colors.textSecondary}
              value={upiInput.tn}
              onChangeText={(text) => setUpiInput({ tn: text })}
            />
          </View>
        )}

        {/* Action Button: Generate */}
        <TouchableOpacity
          style={[styles.generateButton, { backgroundColor: colors.primary }]}
          activeOpacity={0.85}
          onPress={handleGenerate}
        >
          <Text style={styles.generateButtonText}>Generate QR Code</Text>
        </TouchableOpacity>

        {/* Rendered QR Code Preview Container */}
        {generatedValue && (
          <View style={[styles.resultContainer, { backgroundColor: colors.surface }]}>
            <Text style={[styles.previewTitle, { color: colors.textPrimary }]}>Generated Code Preview</Text>

            {/* Rewarded Feature: Custom QR Colors */}
            <View style={[styles.stylingCard, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
              <View style={styles.stylingHeader}>
                <Text style={[styles.stylingTitle, { color: colors.textPrimary }]}>QR Styling</Text>
                {!isStyleUnlocked ? (
                  <TouchableOpacity
                    style={styles.unlockBadge}
                    onPress={handleUnlockStyling}
                  >
                    <AppIcon name="palette" size={13} color="#000" />
                    <Text style={styles.unlockBadgeText}>Unlock Colors (Ad)</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.unlockedRow}>
                    <AppIcon name="check" size={14} color={colors.accent} />
                    <Text style={[styles.unlockedTag, { color: colors.accent }]}>Colors Unlocked</Text>
                  </View>
                )}
              </View>

              {isStyleUnlocked ? (
                <View style={styles.colorPalette}>
                  {[
                    { color: '#0F172A', label: 'Dark Slate' },
                    { color: '#4F46E5', label: 'Indigo' },
                    { color: '#059669', label: 'Emerald' },
                    { color: '#7C3AED', label: 'Violet' },
                    { color: '#DC2626', label: 'Ruby' },
                  ].map((c) => (
                    <TouchableOpacity
                      key={c.color}
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: c.color },
                        selectedColor === c.color && styles.colorSwatchSelected,
                      ]}
                      onPress={() => setSelectedColor(c.color)}
                    />
                  ))}
                </View>
              ) : (
                <Text style={[styles.lockedTip, { color: colors.textSecondary }]}>
                  Watch a short rewarded ad to customize the QR code color.
                </Text>
              )}
            </View>

            {/* Capturable viewshot box */}
            <View ref={qrRef} collapsable={false} style={styles.qrCaptureBox}>
              <QRCode
                value={generatedValue}
                size={210}
                color={selectedColor}
                backgroundColor="#FFFFFF"
              />
              <Text style={styles.qrWatermark}>QR Scanner & Generator</Text>
            </View>

            {/* Actions for generated QR */}
            <View style={styles.resultActions}>
              <TouchableOpacity
                style={[styles.actionButtonPrimary, { backgroundColor: colors.accent }]}
                onPress={handleSaveToGallery}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <View style={styles.btnRow}>
                    <AppIcon name="download" size={18} color="#FFF" />
                    <Text style={styles.actionButtonText}>Save to Gallery</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButtonSecondary, { backgroundColor: colors.surfaceHover }]}
                onPress={handleShareImage}
              >
                <View style={styles.btnRow}>
                  <AppIcon name="share" size={17} color={colors.textPrimary} />
                  <Text style={[styles.actionButtonSecondaryText, { color: colors.textPrimary }]}>Share Image</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButtonSecondary, { backgroundColor: colors.surfaceHover }]}
                onPress={handleCopyValue}
              >
                <View style={styles.btnRow}>
                  <AppIcon name="copy" size={17} color={colors.textPrimary} />
                  <Text style={[styles.actionButtonSecondaryText, { color: colors.textPrimary }]}>Copy Text</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
    fontSize: 22,
  },
  headerTitle: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  iconButtonPlaceholder: {
    width: 42,
  },
  toastContainer: {
    position: 'absolute',
    top: 104,
    alignSelf: 'center',
    zIndex: 99,
    backgroundColor: '#10B981',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: theme.borderRadius.full,
    elevation: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toastText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  tabBar: {
    marginBottom: theme.spacing.md,
  },
  tabContent: {
    paddingHorizontal: theme.spacing.lg,
    gap: 8,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface,
  },
  tabItemSelected: {
    backgroundColor: theme.colors.primary,
  },
  tabIcon: {
    marginRight: 6,
    fontSize: 14,
  },
  tabLabel: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  tabLabelSelected: {
    color: '#FFF',
  },
  scrollBody: {
    padding: theme.spacing.lg,
    paddingBottom: 60,
  },
  card: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.lg,
  },
  inputLabel: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#0F172A',
    borderRadius: theme.borderRadius.md,
    padding: 12,
    color: theme.colors.textPrimary,
    fontSize: 15,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surfaceHover,
  },
  chipSelected: {
    backgroundColor: theme.colors.primary,
  },
  chipText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#FFF',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing.lg,
  },
  switchLabel: {
    color: theme.colors.textPrimary,
    fontSize: 15,
  },
  generateButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  generateButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  resultContainer: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.xl,
  },
  previewTitle: {
    color: theme.colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: theme.spacing.lg,
  },
  qrCaptureBox: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  qrWatermark: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 12,
  },
  resultActions: {
    width: '100%',
    marginTop: theme.spacing.xl,
    gap: 10,
  },
  actionButtonPrimary: {
    backgroundColor: theme.colors.accent,
    paddingVertical: 13,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  actionButtonSecondary: {
    backgroundColor: theme.colors.surfaceHover,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionButtonSecondaryText: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  stylingCard: {
    width: '100%',
    backgroundColor: '#0F172A',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  stylingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  stylingTitle: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  unlockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F59E0B',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.full,
  },
  unlockBadgeText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '700',
  },
  unlockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  unlockedTag: {
    color: theme.colors.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  colorPalette: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorSwatchSelected: {
    borderColor: '#FFF',
    transform: [{ scale: 1.15 }],
  },
  lockedTip: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
});
