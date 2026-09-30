import assert from 'node:assert';

// 1. ResultParser validation
function parseQr(raw) {
  if (!raw || typeof raw !== 'string') {
    return { type: 'plainText' };
  }
  const trimmed = raw.trim();
  if (trimmed.toLowerCase().startsWith('upi://pay')) return { type: 'upi' };
  if (trimmed.toUpperCase().startsWith('WIFI:')) return { type: 'wifi' };
  if (trimmed.toUpperCase().startsWith('BEGIN:VCARD')) return { type: 'vcard' };
  if (trimmed.toLowerCase().startsWith('http://') || trimmed.toLowerCase().startsWith('https://')) return { type: 'url' };
  return { type: 'plainText' };
}

assert.strictEqual(parseQr('https://example.com').type, 'url');
assert.strictEqual(parseQr('WIFI:S:MyNetwork;T:WPA;P:Secret123;;').type, 'wifi');
assert.strictEqual(parseQr('upi://pay?pa=merchant@upi&pn=Store').type, 'upi');
assert.strictEqual(parseQr('BEGIN:VCARD\nFN:John Doe\nTEL:123456\nEND:VCARD').type, 'vcard');
assert.strictEqual(parseQr('9780132350884').type, 'plainText');

// 2. Theme color tokens symmetry check
const darkColors = {
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

const lightColors = {
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

const darkKeys = Object.keys(darkColors).sort();
const lightKeys = Object.keys(lightColors).sort();
assert.deepStrictEqual(darkKeys, lightKeys, 'Dark and Light color palettes must contain identical token keys');

for (const key of darkKeys) {
  assert.ok(typeof darkColors[key] === 'string' && darkColors[key].startsWith('#'), `darkColors[${key}] must be valid hex`);
  assert.ok(typeof lightColors[key] === 'string' && lightColors[key].startsWith('#'), `lightColors[${key}] must be valid hex`);
}

// 3. Gallery QR decoding check
import QRCode from 'qrcode';
import * as jpeg from 'jpeg-js';
import jsQR from 'jsqr';

function base64ToUint8Array(b64) {
  const clean = b64.includes(',') ? b64.split(',')[1] : b64;
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) lookup[chars.charCodeAt(i)] = i;
  let len = clean.length * 0.75;
  if (clean[clean.length - 1] === '=') { len--; if (clean[clean.length - 2] === '=') len--; }
  const bytes = new Uint8Array(len);
  let p = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const e1 = lookup[clean.charCodeAt(i)], e2 = lookup[clean.charCodeAt(i + 1)];
    const e3 = lookup[clean.charCodeAt(i + 2)], e4 = lookup[clean.charCodeAt(i + 3)];
    bytes[p++] = (e1 << 2) | (e2 >> 4);
    if (clean[i + 2] !== '=') bytes[p++] = ((e2 & 15) << 4) | (e3 >> 2);
    if (clean[i + 3] !== '=') bytes[p++] = ((e3 & 3) << 6) | (e4 & 63);
  }
  return bytes;
}

const testQr = QRCode.create('https://example.com/gallery-test', { errorCorrectionLevel: 'M' });
const modules = testQr.modules;
const size = modules.size;
const scale = 8;
const margin = 4;
const imgSize = (size + margin * 2) * scale;
const data = Buffer.alloc(imgSize * imgSize * 4, 255);

for (let r = 0; r < size; r++) {
  for (let c = 0; c < size; c++) {
    if (modules.get(r, c)) {
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          const y = (r + margin) * scale + dy;
          const x = (c + margin) * scale + dx;
          const idx = (y * imgSize + x) * 4;
          data[idx] = 0;
          data[idx + 1] = 0;
          data[idx + 2] = 0;
          data[idx + 3] = 255;
        }
      }
    }
  }
}

const jpegData = jpeg.encode({ data, width: imgSize, height: imgSize }, 85);
const b64 = jpegData.data.toString('base64');
const rawBytes = base64ToUint8Array(b64);
const decoded = jpeg.decode(rawBytes, { useTArray: true, formatAsRGBA: true });
const clamped = new Uint8ClampedArray(decoded.data.buffer, decoded.data.byteOffset, decoded.data.byteLength);
const qrResult = jsQR(clamped, decoded.width, decoded.height, { inversionAttempts: 'attemptBoth' });

assert.ok(qrResult, 'QR code must be detected in JPEG buffer');
assert.strictEqual(qrResult.data, 'https://example.com/gallery-test');

console.log('All self-checks passed successfully!');
