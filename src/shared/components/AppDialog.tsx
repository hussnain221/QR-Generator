import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { create } from 'zustand';
import { AppIcon, IconName } from './AppIcon';
import { theme, useTheme } from '../../theme/theme';

export type DialogType = 'info' | 'success' | 'warning' | 'danger';

export interface DialogOptions {
  title: string;
  message?: string;
  type?: DialogType;
  icon?: IconName;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  isDestructive?: boolean;
}

interface DialogState {
  isOpen: boolean;
  options: DialogOptions | null;
  show: (options: DialogOptions) => void;
  hide: () => void;
}

export const useDialogStore = create<DialogState>((set) => ({
  isOpen: false,
  options: null,
  show: (options) => set({ isOpen: true, options }),
  hide: () => set({ isOpen: false, options: null }),
}));

export const showDialog = (options: DialogOptions) => {
  useDialogStore.getState().show(options);
};

export const closeDialog = () => {
  useDialogStore.getState().hide();
};

export const AppDialog: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { isOpen, options, hide } = useDialogStore();

  if (!options) return null;

  const type = options.type || (options.isDestructive ? 'danger' : 'info');

  const defaultIcon: IconName =
    options.icon ||
    (type === 'danger'
      ? 'trash'
      : type === 'warning'
      ? 'warning'
      : type === 'success'
      ? 'check'
      : 'sparkles');

  const badgeColor =
    type === 'danger'
      ? colors.danger
      : type === 'warning'
      ? colors.warning
      : type === 'success'
      ? colors.accent
      : colors.primary;

  const badgeBg =
    type === 'danger'
      ? 'rgba(239, 68, 68, 0.15)'
      : type === 'warning'
      ? 'rgba(245, 158, 11, 0.15)'
      : type === 'success'
      ? 'rgba(16, 185, 129, 0.15)'
      : 'rgba(99, 102, 241, 0.15)';

  const badgeBorder =
    type === 'danger'
      ? 'rgba(239, 68, 68, 0.3)'
      : type === 'warning'
      ? 'rgba(245, 158, 11, 0.3)'
      : type === 'success'
      ? 'rgba(16, 185, 129, 0.3)'
      : 'rgba(99, 102, 241, 0.3)';

  const confirmBg =
    options.isDestructive || type === 'danger'
      ? colors.danger
      : type === 'success'
      ? colors.accent
      : colors.primary;

  const hasCancel = Boolean(options.cancelText);

  const handleConfirm = () => {
    const cb = options.onConfirm;
    hide();
    if (cb) {
      setTimeout(() => {
        cb();
      }, 120);
    }
  };

  const handleCancel = () => {
    const cb = options.onCancel;
    hide();
    if (cb) {
      setTimeout(() => {
        cb();
      }, 120);
    }
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleCancel}
    >
      <TouchableWithoutFeedback onPress={hasCancel ? handleCancel : undefined}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View
              style={[
                styles.dialogCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
                },
              ]}
            >
              {/* Type Icon Badge */}
              <View
                style={[
                  styles.iconBadge,
                  { backgroundColor: badgeBg, borderColor: badgeBorder },
                ]}
              >
                <AppIcon name={defaultIcon} size={28} color={badgeColor} strokeWidth={2.2} />
              </View>

              {/* Title & Description */}
              <Text style={[styles.title, { color: colors.textPrimary }]}>{options.title}</Text>
              {options.message ? (
                <Text style={[styles.message, { color: colors.textSecondary }]}>{options.message}</Text>
              ) : null}

              {/* Action Buttons */}
              <View style={styles.actionsContainer}>
                {hasCancel ? (
                  <View style={styles.buttonRow}>
                    <TouchableOpacity
                      style={[
                        styles.cancelButton,
                        {
                          backgroundColor: colors.surfaceHover,
                          borderColor: isDark
                            ? 'rgba(255, 255, 255, 0.06)'
                            : 'rgba(0, 0, 0, 0.06)',
                        },
                      ]}
                      activeOpacity={0.75}
                      onPress={handleCancel}
                    >
                      <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>
                        {options.cancelText || 'Cancel'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.confirmButton, { backgroundColor: confirmBg }]}
                      activeOpacity={0.85}
                      onPress={handleConfirm}
                    >
                      <Text style={styles.confirmButtonText}>
                        {options.confirmText || 'Confirm'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.singleButton, { backgroundColor: confirmBg }]}
                    activeOpacity={0.85}
                    onPress={handleConfirm}
                  >
                    <Text style={styles.confirmButtonText}>
                      {options.confirmText || 'OK'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};


const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 8, 22, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    paddingTop: 28,
    paddingBottom: 22,
    paddingHorizontal: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
  },
  iconBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  message: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  actionsContainer: {
    width: '100%',
    marginTop: 18,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceHover,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  confirmButton: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  singleButton: {
    width: '100%',
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
