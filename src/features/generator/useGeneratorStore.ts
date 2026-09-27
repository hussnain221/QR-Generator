import { create } from 'zustand';
import { QrResultType } from '../../core/scan/resultParser';
import { QrGeneratorService } from '../../core/generate/qrGeneratorService';
import { WifiConfig } from '../../shared/utils/wifiQrBuilder';
import { VCardConfig } from '../../shared/utils/vcardBuilder';
import { UpiConfig } from '../../shared/utils/upiQrBuilder';

export type GeneratorTab = 'text' | 'url' | 'wifi' | 'vcard' | 'upi';

interface GeneratorState {
  activeTab: GeneratorTab;
  generatedValue: string | null;
  generatedType: QrResultType | null;

  // Inputs
  textInput: string;
  urlInput: string;
  wifiInput: WifiConfig;
  vcardInput: VCardConfig;
  upiInput: UpiConfig;

  // Setters
  setActiveTab: (tab: GeneratorTab) => void;
  setTextInput: (text: string) => void;
  setUrlInput: (url: string) => void;
  setWifiInput: (config: Partial<WifiConfig>) => void;
  setVcardInput: (config: Partial<VCardConfig>) => void;
  setUpiInput: (config: Partial<UpiConfig>) => void;

  generateCurrent: () => { value: string; type: QrResultType } | null;
  clearGenerated: () => void;
}

export const useGeneratorStore = create<GeneratorState>((set, get) => ({
  activeTab: 'text',
  generatedValue: null,
  generatedType: null,

  textInput: '',
  urlInput: '',
  wifiInput: {
    ssid: '',
    password: '',
    authType: 'WPA',
    hidden: false,
  },
  vcardInput: {
    name: '',
    phone: '',
    email: '',
    organization: '',
    title: '',
    url: '',
  },
  upiInput: {
    pa: '',
    pn: '',
    am: '',
    cu: 'INR',
    tn: '',
  },

  setActiveTab: (tab) => set({ activeTab: tab, generatedValue: null, generatedType: null }),
  setTextInput: (text) => set({ textInput: text }),
  setUrlInput: (url) => set({ urlInput: url }),
  setWifiInput: (config) =>
    set((state) => ({ wifiInput: { ...state.wifiInput, ...config } })),
  setVcardInput: (config) =>
    set((state) => ({ vcardInput: { ...state.vcardInput, ...config } })),
  setUpiInput: (config) =>
    set((state) => ({ upiInput: { ...state.upiInput, ...config } })),

  generateCurrent: () => {
    const state = get();
    let value = '';
    let type: QrResultType = 'plainText';

    switch (state.activeTab) {
      case 'text':
        if (!state.textInput.trim()) return null;
        value = QrGeneratorService.buildText(state.textInput);
        type = 'plainText';
        break;
      case 'url':
        if (!state.urlInput.trim()) return null;
        value = QrGeneratorService.buildUrl(state.urlInput);
        type = 'url';
        break;
      case 'wifi':
        if (!state.wifiInput.ssid.trim()) return null;
        value = QrGeneratorService.buildWifi(state.wifiInput);
        type = 'wifi';
        break;
      case 'vcard':
        if (!state.vcardInput.name.trim()) return null;
        value = QrGeneratorService.buildVCard(state.vcardInput);
        type = 'vcard';
        break;
      case 'upi':
        if (!state.upiInput.pa.trim()) return null;
        value = QrGeneratorService.buildUpi(state.upiInput);
        type = 'upi';
        break;
    }

    set({ generatedValue: value, generatedType: type });
    return { value, type };
  },

  clearGenerated: () => set({ generatedValue: null, generatedType: null }),
}));
