export interface WifiConfig {
  ssid: string;
  password?: string;
  authType: 'WPA' | 'WEP' | 'nopass';
  hidden?: boolean;
}

export function buildWifiQrString(config: WifiConfig): string {
  const { ssid, password = '', authType = 'WPA', hidden = false } = config;
  return `WIFI:T:${authType};S:${ssid};P:${password};H:${hidden};;`;
}
