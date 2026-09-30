import { create } from 'zustand';
import { Appearance } from 'react-native';
import { PrefsRepository, ThemeMode } from '../core/storage/prefsRepository';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceHover: string;
  primary: string;
  primaryHover: string;
  accent: string;
  warning: string;
  danger: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  card: string;
  inputBg: string;
}

export const darkColors: ThemeColors = {
  background: '#0F172A',
  surface: '#1E293B',
  surfaceHover: '#334155',
  primary: '#6366F1',
  primaryHover: '#4F46E5',
  accent: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  border: '#334155',
  card: '#1E293B',
  inputBg: '#0F172A',
};

export const lightColors: ThemeColors = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceHover: '#F1F5F9',
  primary: '#4F46E5',
  primaryHover: '#4338CA',
  accent: '#059669',
  warning: '#D97706',
  danger: '#DC2626',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  card: '#FFFFFF',
  inputBg: '#F1F5F9',
};

interface ThemeState {
  mode: ThemeMode;
  colors: ThemeColors;
  isDark: boolean;
  initTheme: () => Promise<void>;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
}

export const useTheme = create<ThemeState>((set, get) => ({
  mode: 'dark',
  colors: darkColors,
  isDark: true,

  initTheme: async () => {
    try {
      const savedMode = await PrefsRepository.getInstance().getThemeMode();
      const isSystemDark = Appearance.getColorScheme() === 'dark';
      const isDark = savedMode === 'system' ? isSystemDark : savedMode === 'dark';

      set({
        mode: savedMode,
        colors: isDark ? darkColors : lightColors,
        isDark,
      });

      // System theme change listener
      Appearance.addChangeListener(({ colorScheme }) => {
        const currentMode = get().mode;
        if (currentMode === 'system') {
          const dark = colorScheme === 'dark';
          set({
            colors: dark ? darkColors : lightColors,
            isDark: dark,
          });
        }
      });
    } catch (e) {
      console.warn('Failed to load theme preference:', e);
    }
  },

  setThemeMode: async (mode: ThemeMode) => {
    const isSystemDark = Appearance.getColorScheme() === 'dark';
    const isDark = mode === 'system' ? isSystemDark : mode === 'dark';

    set({
      mode,
      colors: isDark ? darkColors : lightColors,
      isDark,
    });

    await PrefsRepository.getInstance().setThemeMode(mode);
  },
}));

// Static theme tokens for layout constants
export const theme = {
  get colors(): ThemeColors {
    return useTheme.getState().colors;
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    full: 9999,
  },
};
