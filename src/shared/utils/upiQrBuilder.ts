export interface UpiConfig {
  pa: string; // payee VPA/UPI ID
  pn?: string; // payee name
  am?: string; // amount
  cu?: string; // currency, default INR
  tn?: string; // note
}

export function buildUpiQrString(config: UpiConfig): string {
  const params = new URLSearchParams();
  params.append('pa', config.pa);
  if (config.pn) params.append('pn', config.pn);
  if (config.am) params.append('am', config.am);
  params.append('cu', config.cu || 'INR');
  if (config.tn) params.append('tn', config.tn);
  return `upi://pay?${params.toString()}`;
}
