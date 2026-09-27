import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Platform,
  Switch,
  ActivityIndicator,
  Share,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { useGeneratorStore, GeneratorTab } from './useGeneratorStore';
import { HistoryRepository } from '../../core/storage/historyRepository';
import { AdManager } from '../../core/ads/adManager';
import { theme } from '../../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Generator'>;

const TABS: { id: GeneratorTab; label: string; icon: string }[] = [
  { id: 'text', label: 'Text', icon: '📄' },
  { id: 'url', label: 'URL', icon: '🌐' },
  { id: 'wifi', label: 'Wi-Fi', icon: '📶' },
  { id: 'vcard', label: 'Contact', icon: '👤' },
  { id: 'upi', label: 'UPI', icon: '💳' },
];

export const GeneratorScreen: React.FC<Props> = ({ navigation }) => {
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
      Alert.alert('Required Fields Missing', 'Please fill in the required inputs before generating.');
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
      showToast('🎉 Custom colors unlocked for this session!');
    });

    if (!shown) {
      // In dev or if ad not filled yet, grant reward
      setIsStyleUnlocked(true);
      showToast('🎉 Custom colors unlocked!');
    }
  };

  const handleSaveToGallery = async () => {
    if (!qrRef.current) return;
    setIsSaving(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Gallery permission is needed to save the generated QR code.'
        );
        setIsSaving(false);
        return;
      }

      const uri = await captureRef(qrRef, {
        format: 'png',
        quality: 1.0,
      });

      await MediaLibrary.saveToLibraryAsync(uri);
      showToast('Saved to photos gallery!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save QR code image.');
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
      Alert.alert('Error', 'Failed to share QR image.');
    }
  };

  const handleCopyValue = async () => {
    if (generatedValue) {
      await Clipboard.setStringAsync(generatedValue);
      showToast('Content copied to clipboard!');
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
        <Text style={styles.headerTitle}>Create QR Code</Text>
        <View style={styles.iconButtonPlaceholder} />
      </View>

      {feedbackToast && (
        <View style={styles.toastContainer}>
          <Text style={styles.toastText}>✓ {feedbackToast}</Text>
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
                style={[styles.tabItem, isSelected && styles.tabItemSelected]}
                onPress={() => setActiveTab(tab.id)}
              >
                <Text style={styles.tabIcon}>{tab.icon}</Text>
                <Text style={[styles.tabLabel, isSelected && styles.tabLabelSelected]}>
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
          <View style={styles.card}>
            <Text style={styles.inputLabel}>Plain Text / Note</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter message, note, or barcode value..."
              placeholderTextColor={theme.colors.textSecondary}
              value={textInput}
              onChangeText={setTextInput}
              multiline
              numberOfLines={4}
            />
          </View>
        )}

        {/* TAB 2: URL */}
        {activeTab === 'url' && (
          <View style={styles.card}>
            <Text style={styles.inputLabel}>Website URL</Text>
            <TextInput
              style={styles.input}
              placeholder="https://example.com"
              placeholderTextColor={theme.colors.textSecondary}
              value={urlInput}
              onChangeText={setUrlInput}
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>
        )}

        {/* TAB 3: WI-FI */}
        {activeTab === 'wifi' && (
          <View style={styles.card}>
            <Text style={styles.inputLabel}>Network Name (SSID) *</Text>
            <TextInput
              style={styles.input}
              placeholder="MyHomeWiFi"
              placeholderTextColor={theme.colors.textSecondary}
              value={wifiInput.ssid}
              onChangeText={(text) => setWifiInput({ ssid: text })}
            />

            <Text style={[styles.inputLabel, { marginTop: theme.spacing.md }]}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Wi-Fi Password (leave empty for open)"
              placeholderTextColor={theme.colors.textSecondary}
              value={wifiInput.password}
              onChangeText={(text) => setWifiInput({ password: text })}
              secureTextEntry
            />

            <Text style={[styles.inputLabel, { marginTop: theme.spacing.md }]}>Security Type</Text>
            <View style={styles.chipRow}>
              {(['WPA', 'WEP', 'nopass'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.chip,
                    wifiInput.authType === type && styles.chipSelected,
                  ]}
                  onPress={() => setWifiInput({ authType: type })}
                >
                  <Text
                    style={[
                      styles.chipText,
                      wifiInput.authType === type && styles.chipTextSelected,
                    ]}
                  >
                    {type === 'nopass' ? 'Open' : type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Hidden Network</Text>
              <Switch
                value={wifiInput.hidden}
                onValueChange={(val) => setWifiInput({ hidden: val })}
                trackColor={{ false: theme.colors.surfaceHover, true: theme.colors.primary }}
              />
            </View>
          </View>
        )}

        {/* TAB 4: VCARD */}
        {activeTab === 'vcard' && (
          <View style={styles.card}>
            <Text style={styles.inputLabel}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Jane Doe"
              placeholderTextColor={theme.colors.textSecondary}
              value={vcardInput.name}
              onChangeText={(text) => setVcardInput({ name: text })}
            />

            <Text style={[styles.inputLabel, { marginTop: theme.spacing.md }]}>Phone</Text>
            <TextInput
              style={styles.input}
              placeholder="+1 234 567 8900"
              placeholderTextColor={theme.colors.textSecondary}
              value={vcardInput.phone}
              onChangeText={(text) => setVcardInput({ phone: text })}
              keyboardType="phone-pad"
            />

            <Text style={[styles.inputLabel, { marginTop: theme.spacing.md }]}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="jane@example.com"
              placeholderTextColor={theme.colors.textSecondary}
              value={vcardInput.email}
              onChangeText={(text) => setVcardInput({ email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={[styles.inputLabel, { marginTop: theme.spacing.md }]}>Organization</Text>
            <TextInput
              style={styles.input}
              placeholder="Company / Team"
              placeholderTextColor={theme.colors.textSecondary}
              value={vcardInput.organization}
              onChangeText={(text) => setVcardInput({ organization: text })}
            />
          </View>
        )}

        {/* TAB 5: UPI */}
        {activeTab === 'upi' && (
          <View style={styles.card}>
            <Text style={styles.inputLabel}>Payee UPI ID (VPA) *</Text>
            <TextInput
              style={styles.input}
              placeholder="merchant@upi"
              placeholderTextColor={theme.colors.textSecondary}
              value={upiInput.pa}
              onChangeText={(text) => setUpiInput({ pa: text })}
              autoCapitalize="none"
            />

            <Text style={[styles.inputLabel, { marginTop: theme.spacing.md }]}>Payee Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Store or Person Name"
              placeholderTextColor={theme.colors.textSecondary}
              value={upiInput.pn}
              onChangeText={(text) => setUpiInput({ pn: text })}
            />

            <Text style={[styles.inputLabel, { marginTop: theme.spacing.md }]}>Amount (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="250.00"
              placeholderTextColor={theme.colors.textSecondary}
              value={upiInput.am}
              onChangeText={(text) => setUpiInput({ am: text })}
              keyboardType="decimal-pad"
            />

            <Text style={[styles.inputLabel, { marginTop: theme.spacing.md }]}>Transaction Note</Text>
            <TextInput
              style={styles.input}
              placeholder="Payment for goods"
              placeholderTextColor={theme.colors.textSecondary}
              value={upiInput.tn}
              onChangeText={(text) => setUpiInput({ tn: text })}
            />
          </View>
        )}

        {/* Action Button: Generate */}
        <TouchableOpacity style={styles.generateButton} activeOpacity={0.85} onPress={handleGenerate}>
          <Text style={styles.generateButtonText}>Generate QR Code</Text>
        </TouchableOpacity>

        {/* Rendered QR Code Preview Container */}
        {generatedValue && (
          <View style={styles.resultContainer}>
            <Text style={styles.previewTitle}>Generated Code Preview</Text>

            {/* Rewarded Feature: Custom QR Colors */}
            <View style={styles.stylingCard}>
              <View style={styles.stylingHeader}>
                <Text style={styles.stylingTitle}>QR Styling</Text>
                {!isStyleUnlocked ? (
                  <TouchableOpacity
                    style={styles.unlockBadge}
                    onPress={handleUnlockStyling}
                  >
                    <Text style={styles.unlockBadgeText}>🎁 Unlock Colors (Ad)</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.unlockedTag}>✓ Colors Unlocked</Text>
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
                <Text style={styles.lockedTip}>
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
              <Text style={styles.qrWatermark}>QR & Barcode Scanner</Text>
            </View>

            {/* Actions for generated QR */}
            <View style={styles.resultActions}>
              <TouchableOpacity
                style={styles.actionButtonPrimary}
                onPress={handleSaveToGallery}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.actionButtonText}>💾 Save to Gallery</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButtonSecondary} onPress={handleShareImage}>
                <Text style={styles.actionButtonSecondaryText}>↗️ Share Image</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButtonSecondary} onPress={handleCopyValue}>
                <Text style={styles.actionButtonSecondaryText}>📋 Copy Text</Text>
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
