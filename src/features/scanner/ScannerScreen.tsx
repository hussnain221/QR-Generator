import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Linking,
  Modal,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { ScannerService } from '../../core/scan/scannerService';
import { useScannerStore } from './useScannerStore';
import { theme } from '../../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Scanner'>;

const { width } = Dimensions.get('window');
const SCAN_AREA_SIZE = width * 0.72;

export const ScannerScreen: React.FC<Props> = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [hasShownExplainer, setHasShownExplainer] = useState(false);
  const [explainerVisible, setExplainerVisible] = useState(false);
  const [mountError, setMountError] = useState<string | null>(null);

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
      setExplainerVisible(true);
    }
  }, [permission, hasShownExplainer]);

  const handleGrantPermission = async () => {
    setExplainerVisible(false);
    setHasShownExplainer(true);
    await requestPermission();
  };

  const handleBarcodeScanned = (scanningResult: BarcodeScanningResult) => {
    if (!isScanning) return;

    scannerServiceRef.current.handleBarcodeScan(scanningResult, (parsed) => {
      setIsScanning(false);
      navigation.navigate('ScanResult', { parsedResult: parsed });
    });
  };

  // 1. Loading permission state
  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.infoText}>Initializing camera...</Text>
      </View>
    );
  }

  // 2. Permission Denied View
  if (!permission.granted) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.deniedCard}>
          <Text style={styles.deniedTitle}>Camera Access Required</Text>
          <Text style={styles.deniedDescription}>
            Camera permission is required to scan QR codes and barcodes. We don't save or upload any camera footage.
          </Text>
          {permission.canAskAgain ? (
            <TouchableOpacity style={styles.primaryButton} onPress={handleGrantPermission}>
              <Text style={styles.buttonText}>Grant Permission</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => Linking.openSettings()}
            >
              <Text style={styles.buttonText}>Open Device Settings</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.secondaryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 2b. Camera Hardware Mount Error
  if (mountError) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.deniedCard}>
          <Text style={styles.deniedTitle}>Camera Error</Text>
          <Text style={styles.deniedDescription}>
            Could not start camera preview: {mountError}. Please ensure no other app is using the camera.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
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
            <Text style={styles.secondaryButtonText}>Go Back</Text>
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

      {/* Target Framing Overlay */}
      <View style={styles.overlay}>
        {/* Top bar controls */}
        <View style={styles.topControls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.controlIconText}>←</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Scan Code</Text>

          <TouchableOpacity
            style={[styles.controlButton, torchEnabled && styles.torchActiveButton]}
            onPress={toggleTorch}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.controlIconText}>{torchEnabled ? '⚡' : '🔦'}</Text>
          </TouchableOpacity>
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

      {/* In-app pre-permission explainer dialog */}
      <Modal visible={explainerVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.explainerCard}>
            <Text style={styles.explainerTitle}>Camera Permission</Text>
            <Text style={styles.explainerText}>
              To scan QR codes and barcodes with your device camera, this app requires camera access. No video or photo data is ever collected or stored remotely.
            </Text>
            <TouchableOpacity style={styles.primaryButton} onPress={handleGrantPermission}>
              <Text style={styles.buttonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  explainerCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  explainerTitle: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
  },
  explainerText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
});
