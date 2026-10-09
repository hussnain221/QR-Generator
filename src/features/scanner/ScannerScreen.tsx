import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Linking,
  Platform,
  Vibration,
  ActivityIndicator,
  Modal,
  FlatList,
  Image,
  ScrollView,
} from 'react-native';
import {
  CameraView,
  useCameraPermissions,
  BarcodeScanningResult,
} from 'expo-camera';
import { captureRef } from 'react-native-view-shot';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { ScannerService } from '../../core/scan/scannerService';
import { ResultParser } from '../../core/scan/resultParser';
import { decodeQRFromBase64 } from '../../core/scan/imageDecoder';
import { PrefsRepository } from '../../core/storage/prefsRepository';
import { useScannerStore } from './useScannerStore';
import { AppIcon } from '../../shared/components/AppIcon';
import { showDialog } from '../../shared/components/AppDialog';
import { theme, useTheme } from '../../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Scanner'>;

// Screen dimensions for scanning reticle
const { width } = Dimensions.get('window');
const SCAN_AREA_SIZE = width * 0.72;
const NUM_COLUMNS = 3;
const ITEM_SPACING = 6;
const ITEM_SIZE = (width - 32 - ITEM_SPACING * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

export const ScannerScreen: React.FC<Props> = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [hasShownExplainer, setHasShownExplainer] = useState(false);
  const [mountError, setMountError] = useState<string | null>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [analyzingAssetUri, setAnalyzingAssetUri] = useState<string | null>(null);
  const hiddenCaptureRef = useRef<View>(null);
  const analysisTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
    };
  }, []);

  const scannerServiceRef = useRef<ScannerService>(new ScannerService());
  const {
    isScanning,
    torchEnabled,
    setIsScanning,
    toggleTorch,
    resumeScanning,
  } = useScannerStore();

  // Resume scanning whenever this screen regains focus
  useFocusEffect(
    useCallback(() => {
      resumeScanning();
      scannerServiceRef.current.setScanningActive(true);
      scannerServiceRef.current.resetCooldown();
    }, [resumeScanning])
  );

  // Manage permission request flow
  useEffect(() => {
    if (!permission) return;

    if (!permission.granted && !hasShownExplainer && permission.canAskAgain) {
      setHasShownExplainer(true);
      showDialog({
        title: 'Camera Access',
        message: 'To scan QR codes and barcodes, this app requires camera access. No photo or video data is ever saved or shared.',
        type: 'info',
        icon: 'camera',
        confirmText: 'Continue',
        onConfirm: async () => {
          await requestPermission();
        },
      });
    }
  }, [permission, hasShownExplainer]);

  const handleGrantPermission = async () => {
    if (permission?.canAskAgain) {
      await requestPermission();
    } else {
      Linking.openSettings();
    }
  };

  const handleBarcodeScanned = (scanningResult: BarcodeScanningResult) => {
    if (!isScanning) return;

    scannerServiceRef.current.handleBarcodeScan(scanningResult, async (parsed) => {
      setIsScanning(false);
      try {
        const shouldVibrate = await PrefsRepository.getInstance().getVibrateOnScan();
        if (shouldVibrate) {
          Vibration.vibrate(60);
        }
      } catch {
        // Haptic feedback graceful fallback
      }
      navigation.navigate('ScanResult', { parsedResult: parsed });
    });
  };

  const handlePickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const selectedUri = result.assets[0].uri;
      setIsScanning(false);
      scannerServiceRef.current.setScanningActive(false);
      setIsAnalyzingImage(true);
      setAnalyzingAssetUri(selectedUri);

      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
      analysisTimeoutRef.current = setTimeout(() => {
        setIsAnalyzingImage(false);
        setAnalyzingAssetUri(null);
        setIsScanning(true);
        scannerServiceRef.current.setScanningActive(true);
        showDialog({
          title: 'No QR Code Found',
          message: 'Could not detect a clear QR or barcode in this image. Please try another image.',
          type: 'warning',
          icon: 'warning',
          confirmText: 'OK',
        });
      }, 7000);
    } catch (err: any) {
      showDialog({
        title: 'Gallery Error',
        message: err?.message || 'Could not pick photo from gallery.',
        type: 'danger',
        icon: 'warning',
        confirmText: 'OK',
      });
    }
  };

  const onCaptureImageLoaded = async () => {
    try {
      // 80ms buffer for native view texture to fully bind
      await new Promise((resolve) => setTimeout(resolve, 80));

      if (!hiddenCaptureRef.current) {
        throw new Error('Capture view ref missing');
      }

      // Capture high-fidelity 768x768 frame for crystal clear module detection
      const base64 = await captureRef(hiddenCaptureRef.current, {
        format: 'jpg',
        quality: 0.85,
        width: 768,
        height: 768,
        result: 'base64',
      });

      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
        analysisTimeoutRef.current = null;
      }

      const qrData = decodeQRFromBase64(base64);

      if (qrData) {
        const parsed = ResultParser.parse(qrData);
        try {
          const shouldVibrate = await PrefsRepository.getInstance().getVibrateOnScan();
          if (shouldVibrate) {
            Vibration.vibrate(60);
          }
        } catch {
          // Graceful fallback
        }
        setIsAnalyzingImage(false);
        setAnalyzingAssetUri(null);
        navigation.navigate('ScanResult', { parsedResult: parsed });
      } else {
        setIsAnalyzingImage(false);
        setAnalyzingAssetUri(null);
        setIsScanning(true);
        scannerServiceRef.current.setScanningActive(true);
        showDialog({
          title: 'No Code Found',
          message: 'Could not find any readable QR code in the selected photo. Please choose a clearer image.',
          type: 'warning',
          icon: 'warning',
          confirmText: 'Try Another',
        });
      }
    } catch (err: any) {
      console.warn('Capture & decode error:', err);
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
        analysisTimeoutRef.current = null;
      }
      setIsAnalyzingImage(false);
      setAnalyzingAssetUri(null);
      setIsScanning(true);
      scannerServiceRef.current.setScanningActive(true);
      showDialog({
        title: 'Scan Error',
        message: 'Unable to process QR code from this image. Please try another photo.',
        type: 'danger',
        icon: 'warning',
        confirmText: 'OK',
      });
    }
  };

  const onCaptureImageError = () => {
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
      analysisTimeoutRef.current = null;
    }
    setIsAnalyzingImage(false);
    setAnalyzingAssetUri(null);
    setIsScanning(true);
    scannerServiceRef.current.setScanningActive(true);
    showDialog({
      title: 'Image Load Error',
      message: 'Could not load the selected photo. Please try another image.',
      type: 'danger',
      icon: 'warning',
      confirmText: 'OK',
    });
  };

  // 1. Loading permission state
  if (!permission) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>Initializing camera...</Text>
      </View>
    );
  }

  // 2. Permission Denied View
  if (!permission.granted) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.deniedCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.deniedTitle, { color: colors.textPrimary }]}>Camera Access Required</Text>
          <Text style={[styles.deniedDescription, { color: colors.textSecondary }]}>
            Camera permission is required to scan QR codes and barcodes. We don't save or upload any camera footage.
          </Text>
          {permission.canAskAgain ? (
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
              onPress={handleGrantPermission}
            >
              <Text style={styles.buttonText}>Grant Permission</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
              onPress={() => Linking.openSettings()}
            >
              <Text style={styles.buttonText}>Open Device Settings</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.textSecondary }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 2b. Camera Hardware Mount Error
  if (mountError) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.deniedCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.deniedTitle, { color: colors.textPrimary }]}>Camera Error</Text>
          <Text style={[styles.deniedDescription, { color: colors.textSecondary }]}>
            Could not start camera preview: {mountError}. Please ensure no other app is using the camera.
          </Text>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              setMountError(null);
              resumeScanning();
            }}
          >
            <Text style={styles.buttonText}>Retry Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.textSecondary }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 3. Main Scanner View
  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={torchEnabled}
        barcodeScannerSettings={{
          barcodeTypes: [
            'qr',
            'ean13',
            'ean8',
            'code128',
            'code39',
            'upc_a',
            'upc_e',
            'pdf417',
            'aztec',
            'datamatrix',
          ],
        }}
        onBarcodeScanned={isScanning ? handleBarcodeScanned : undefined}
        onMountError={(err) => setMountError(err.message)}
      />

      {isAnalyzingImage && (
        <View style={styles.analyzingOverlay}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.analyzingText}>Scanning photo...</Text>
        </View>
      )}

      {/* Target Framing Overlay */}
      <View style={styles.overlay}>
        {/* Top bar controls */}
        <View style={styles.topControls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <AppIcon name="arrow-left" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Scan Code</Text>

          <View style={styles.topRightActions}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={handlePickFromGallery}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <AppIcon name="image" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, torchEnabled && styles.torchActiveButton]}
              onPress={toggleTorch}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <AppIcon
                name={torchEnabled ? 'flashlight' : 'flashlight-off'}
                size={20}
                color={torchEnabled ? '#000000' : '#FFFFFF'}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Viewfinder center box */}
        <View style={styles.viewfinder}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>

        {/* Bottom guidance hint */}
        <View style={styles.bottomHintContainer}>
          <Text style={styles.bottomHintText}>Align QR code or barcode inside the frame</Text>
        </View>
      </View>



      {/* Offscreen image capture container for pure-JS QR decoding */}
      {analyzingAssetUri && (
        <View
          collapsable={false}
          ref={hiddenCaptureRef}
          style={styles.hiddenCaptureContainer}
        >
          <Image
            source={{ uri: analyzingAssetUri }}
            style={styles.hiddenCaptureImage}
            resizeMode="contain"
            onLoad={onCaptureImageLoaded}
            onError={onCaptureImageError}
          />
        </View>
      )}

      {/* Analyzing Photo Loading Overlay */}
      {isAnalyzingImage && (
        <View style={styles.analyzingOverlay}>
          <View style={[styles.analyzingBox, { backgroundColor: colors.surface }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.analyzingText, { color: colors.textPrimary }]}>
              Scanning photo...
            </Text>
            <Text style={[styles.analyzingSubtext, { color: colors.textSecondary }]}>
              Detecting QR code
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  infoText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
  },
  deniedCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
  },
  deniedTitle: {
    color: theme.colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  deniedDescription: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: theme.borderRadius.md,
    width: '100%',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  secondaryButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Platform.OS === 'ios' ? 54 : 36,
  },
  topControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: theme.spacing.lg,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  torchActiveButton: {
    backgroundColor: '#F59E0B',
  },
  controlIconText: {
    color: '#FFF',
    fontSize: 20,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  viewfinder: {
    width: SCAN_AREA_SIZE,
    height: SCAN_AREA_SIZE,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: theme.colors.primary,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 6,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 6,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 6,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 6,
  },
  bottomHintContainer: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: theme.borderRadius.full,
    marginBottom: theme.spacing.lg,
  },
  bottomHintText: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '500',
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  analyzingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  analyzingBox: {
    paddingHorizontal: 28,
    paddingVertical: 24,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  analyzingText: {
    marginTop: 14,
    fontSize: 16,
    fontWeight: '700',
  },
  analyzingSubtext: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '500',
  },
  galleryModalContainer: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
  },
  galleryModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  galleryModalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  galleryCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryLoadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  galleryLoadingText: {
    fontSize: 14,
  },
  galleryEmptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 8,
  },
  galleryEmptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
  },
  galleryEmptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
  galleryGrid: {
    padding: 16,
  },
  galleryItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    marginRight: ITEM_SPACING,
    marginBottom: ITEM_SPACING,
  },
  galleryThumb: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  limitedBanner: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  limitedBannerTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  limitedBannerText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  manageAccessButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  manageAccessButtonText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '700',
  },
  albumsContainer: {
    paddingVertical: 8,
  },
  albumsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  albumChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  albumChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  hiddenCaptureContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 768,
    height: 768,
    backgroundColor: '#FFFFFF',
    zIndex: 0,
    opacity: 1,
  },
  hiddenCaptureImage: {
    width: 768,
    height: 768,
  },
});
