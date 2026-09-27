export type QrResultType = 'url' | 'wifi' | 'vcard' | 'upi' | 'plainText';

export interface ParsedScanResult {
  rawContent: string;
  type: QrResultType;
  metadata: Record<string, any>;
  displayTitle: string;
}

export class ResultParser {
  public static parse(raw: string): ParsedScanResult {
    if (!raw || typeof raw !== 'string') {
      return {
        rawContent: '',
        type: 'plainText',
        metadata: { text: '' },
        displayTitle: 'Empty Content',
      };
    }

    try {
      const trimmed = raw.trim();

      // 1. UPI Payment Intent
      if (trimmed.toLowerCase().startsWith('upi://pay')) {
        return {
          rawContent: trimmed,
          type: 'upi',
          metadata: ResultParser.parseUpi(trimmed),
          displayTitle: 'UPI Payment',
        };
      }

      // 2. Wi-Fi Configuration
      if (trimmed.toUpperCase().startsWith('WIFI:')) {
        return {
          rawContent: trimmed,
          type: 'wifi',
          metadata: ResultParser.parseWifi(trimmed),
          displayTitle: 'Wi-Fi Network',
        };
      }

      // 3. vCard Contact
      if (trimmed.toUpperCase().startsWith('BEGIN:VCARD')) {
        return {
          rawContent: trimmed,
          type: 'vcard',
          metadata: ResultParser.parseVCard(trimmed),
          displayTitle: 'Contact (vCard)',
        };
      }

      // 4. Web URL
      if (trimmed.toLowerCase().startsWith('http://') || trimmed.toLowerCase().startsWith('https://')) {
        return {
          rawContent: trimmed,
          type: 'url',
          metadata: { url: trimmed },
          displayTitle: 'Web Link',
        };
      }

      // 5. Default: Plain Text / Barcode
      return {
        rawContent: trimmed,
        type: 'plainText',
        metadata: { text: trimmed },
        displayTitle: 'Text / Barcode',
      };
    } catch {
      return {
        rawContent: raw,
        type: 'plainText',
        metadata: { text: raw },
        displayTitle: 'Text / Barcode',
      };
    }
  }

  private static parseUpi(raw: string): Record<string, string> {
    const qIndex = raw.indexOf('?');
    if (qIndex === -1) return { pa: '', pn: '', am: '', cu: 'INR', tn: '' };
    
    const queryString = raw.substring(qIndex + 1);
    const params = new URLSearchParams(queryString);

    return {
      pa: params.get('pa') || '',
      pn: params.get('pn') || '',
      am: params.get('am') || '',
      cu: params.get('cu') || 'INR',
      tn: params.get('tn') || '',
    };
  }

  private static parseWifi(raw: string): Record<string, any> {
    // Format: WIFI:T:WPA;S:SSID;P:PASSWORD;H:false;;
    const content = raw.substring(5);
    const parts = content.split(';');

    let ssid = '';
    let password = '';
    let authType = 'WPA';
    let hidden = false;

    for (const part of parts) {
      if (part.startsWith('S:')) {
        ssid = part.substring(2);
      } else if (part.startsWith('P:')) {
        password = part.substring(2);
      } else if (part.startsWith('T:')) {
        authType = part.substring(2);
      } else if (part.startsWith('H:')) {
        hidden = part.substring(2).toLowerCase() === 'true';
      }
    }

    return { ssid, password, authType, hidden };
  }

  private static parseVCard(raw: string): Record<string, string> {
    const lines = raw.split(/\r?\n/);
    let name = '';
    let phone = '';
    let email = '';
    let org = '';
    let title = '';
    let url = '';

    for (const line of lines) {
      if (line.startsWith('FN:')) {
        name = line.substring(3).trim();
      } else if (line.startsWith('TEL') && line.includes(':')) {
        phone = line.substring(line.indexOf(':') + 1).trim();
      } else if (line.startsWith('EMAIL') && line.includes(':')) {
        email = line.substring(line.indexOf(':') + 1).trim();
      } else if (line.startsWith('ORG:')) {
        org = line.substring(4).trim();
      } else if (line.startsWith('TITLE:')) {
        title = line.substring(6).trim();
      } else if (line.startsWith('URL:')) {
        url = line.substring(4).trim();
      }
    }

    return { name, phone, email, organization: org, title, url };
  }
}
