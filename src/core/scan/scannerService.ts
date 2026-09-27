import { BarcodeScanningResult } from 'expo-camera';
import { ResultParser, ParsedScanResult } from './resultParser';

export type OnScanCallback = (result: ParsedScanResult) => void;

export class ScannerService {
  private isScanningActive: boolean = true;
  private lastScannedContent: string = '';
  private lastScanTimestamp: number = 0;
  private readonly cooldownMs: number = 1500;

  public setScanningActive(active: boolean): void {
    this.isScanningActive = active;
  }

  public getIsScanningActive(): boolean {
    return this.isScanningActive;
  }

  public handleBarcodeScan(
    scanResult: BarcodeScanningResult,
    onSuccess: OnScanCallback
  ): boolean {
    if (!this.isScanningActive) {
      return false;
    }

    const raw = scanResult.data;
    if (!raw || typeof raw !== 'string') {
      return false;
    }

    const now = Date.now();
    // Prevent immediate re-trigger on the same code within cooldown window
    if (raw === this.lastScannedContent && now - this.lastScanTimestamp < this.cooldownMs) {
      return false;
    }

    // Immediately pause scanning to prevent race conditions during navigation
    this.isScanningActive = false;
    this.lastScannedContent = raw;
    this.lastScanTimestamp = now;

    const parsed = ResultParser.parse(raw);
    onSuccess(parsed);
    return true;
  }

  public resetCooldown(): void {
    this.lastScannedContent = '';
    this.lastScanTimestamp = 0;
  }
}
