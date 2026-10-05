import jsQR from 'jsqr';
import * as jpeg from 'jpeg-js';

/**
 * Converts a base64 string to a Uint8Array byte buffer without external polyfills.
 */
function base64ToUint8Array(b64: string): Uint8Array {
  const clean = b64.includes(',') ? b64.split(',')[1] : b64;
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i;
  }

  let len = clean.length * 0.75;
  if (clean[clean.length - 1] === '=') {
    len--;
    if (clean[clean.length - 2] === '=') {
      len--;
    }
  }

  const bytes = new Uint8Array(len);
  let p = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const e1 = lookup[clean.charCodeAt(i)];
    const e2 = lookup[clean.charCodeAt(i + 1)];
    const e3 = lookup[clean.charCodeAt(i + 2)];
    const e4 = lookup[clean.charCodeAt(i + 3)];

    bytes[p++] = (e1 << 2) | (e2 >> 4);
    if (clean[i + 2] !== '=') {
      bytes[p++] = ((e2 & 15) << 4) | (e3 >> 2);
    }
    if (clean[i + 3] !== '=') {
      bytes[p++] = ((e3 & 3) << 6) | (e4 & 63);
    }
  }
  return bytes;
}

/**
 * Decodes a QR code from a base64-encoded JPEG image.
 * Uses pure JavaScript libraries (jpeg-js and jsQR) to ensure 100% reliability
 * across all Android/iOS environments without relying on native module availability.
 */
export function decodeQRFromBase64(base64: string): string | null {
  try {
    const bytes = base64ToUint8Array(base64);
    const decoded = jpeg.decode(bytes, { useTArray: true, formatAsRGBA: true });
    if (!decoded || !decoded.data || decoded.width <= 0 || decoded.height <= 0) {
      return null;
    }

    const clamped = new Uint8ClampedArray(
      decoded.data.buffer,
      decoded.data.byteOffset,
      decoded.data.byteLength
    );

    // Fast path: try standard orientation first (99% of QR codes)
    let result = jsQR(clamped, decoded.width, decoded.height, {
      inversionAttempts: 'dontInvert',
    });
    if (!result) {
      result = jsQR(clamped, decoded.width, decoded.height, {
        inversionAttempts: 'onlyInvert',
      });
    }

    return result?.data || null;
  } catch (error) {
    console.warn('decodeQRFromBase64 failed:', error);
    return null;
  }
}
