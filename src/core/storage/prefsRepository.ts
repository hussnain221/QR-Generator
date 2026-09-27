import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'dark' | 'light' | 'system';

export class PrefsRepository {
  private static instance: PrefsRepository;
  private readonly THEME_KEY = '@pref_theme_mode';
  private readonly VIBRATE_KEY = '@pref_vibrate_on_scan';
  private readonly BEEP_KEY = '@pref_beep_on_scan';

  private constructor() {}

  public static getInstance(): PrefsRepository {
    if (!PrefsRepository.instance) {
      PrefsRepository.instance = new PrefsRepository();
    }
    return PrefsRepository.instance;
  }

  public async getThemeMode(): Promise<ThemeMode> {
    try {
      const mode = await AsyncStorage.getItem(this.THEME_KEY);
      if (mode === 'light' || mode === 'dark' || mode === 'system') {
        return mode;
      }
      return 'dark';
    } catch {
      return 'dark';
    }
  }

  public async setThemeMode(mode: ThemeMode): Promise<void> {
    try {
      await AsyncStorage.setItem(this.THEME_KEY, mode);
    } catch (err) {
      console.warn('Failed to persist theme mode:', err);
    }
  }

  public async getVibrateOnScan(): Promise<boolean> {
    try {
      const val = await AsyncStorage.getItem(this.VIBRATE_KEY);
      return val !== null ? val === 'true' : true;
    } catch {
      return true;
    }
  }

  public async setVibrateOnScan(enabled: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(this.VIBRATE_KEY, enabled ? 'true' : 'false');
    } catch (err) {
      console.warn('Failed to persist vibration setting:', err);
    }
  }

  public async getBeepOnScan(): Promise<boolean> {
    try {
      const val = await AsyncStorage.getItem(this.BEEP_KEY);
      return val === 'true';
    } catch {
      return false;
    }
  }

  public async setBeepOnScan(enabled: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(this.BEEP_KEY, enabled ? 'true' : 'false');
    } catch (err) {
      console.warn('Failed to persist beep setting:', err);
    }
  }
}
