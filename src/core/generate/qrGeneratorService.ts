import { buildWifiQrString, WifiConfig } from '../../shared/utils/wifiQrBuilder';
import { buildVCardString, VCardConfig } from '../../shared/utils/vcardBuilder';
import { buildUpiQrString, UpiConfig } from '../../shared/utils/upiQrBuilder';
import { QrResultType } from '../scan/resultParser';

export class QrGeneratorService {
  public static buildText(text: string): string {
    return text.trim();
  }

  public static buildUrl(url: string): string {
    const trimmed = url.trim();
    if (!trimmed.toLowerCase().startsWith('http://') && !trimmed.toLowerCase().startsWith('https://')) {
      return `https://${trimmed}`;
    }
    return trimmed;
  }

  public static buildWifi(config: WifiConfig): string {
    return buildWifiQrString(config);
  }

  public static buildVCard(config: VCardConfig): string {
    return buildVCardString(config);
  }

  public static buildUpi(config: UpiConfig): string {
    return buildUpiQrString(config);
  }
}
