import { create } from 'zustand';

interface ScannerStoreState {
  isScanning: boolean;
  torchEnabled: boolean;
  shouldShowExplainer: boolean;
  setIsScanning: (isScanning: boolean) => void;
  setTorchEnabled: (torchEnabled: boolean) => void;
  toggleTorch: () => void;
  setShouldShowExplainer: (show: boolean) => void;
  resumeScanning: () => void;
}

export const useScannerStore = create<ScannerStoreState>((set) => ({
  isScanning: true,
  torchEnabled: false,
  shouldShowExplainer: false,

  setIsScanning: (isScanning) => set({ isScanning }),
  setTorchEnabled: (torchEnabled) => set({ torchEnabled }),
  toggleTorch: () => set((state) => ({ torchEnabled: !state.torchEnabled })),
  setShouldShowExplainer: (shouldShowExplainer) => set({ shouldShowExplainer }),
  resumeScanning: () => set({ isScanning: true, torchEnabled: false }),
}));
