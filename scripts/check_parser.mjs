import assert from 'node:assert';
import { ResultParser } from '../src/core/scan/resultParser.ts';
import { buildWifiQrString } from '../src/shared/utils/wifiQrBuilder.ts';
import { buildVCardString } from '../src/shared/utils/vcardBuilder.ts';
import { buildUpiQrString } from '../src/shared/utils/upiQrBuilder.ts';

console.log('Running ResultParser & Builder self-checks...');

// 1. UPI Payment Intent
const upiResult = ResultParser.parse('upi://pay?pa=merchant@upi&pn=Store&am=250.00&cu=INR&tn=Coffee');
assert.strictEqual(upiResult.type, 'upi');
assert.strictEqual(upiResult.metadata.pa, 'merchant@upi');
assert.strictEqual(upiResult.metadata.pn, 'Store');
assert.strictEqual(upiResult.metadata.am, '250.00');
assert.strictEqual(upiResult.metadata.cu, 'INR');
assert.strictEqual(upiResult.metadata.tn, 'Coffee');

// 2. Wi-Fi Config
const wifiResult = ResultParser.parse('WIFI:T:WPA;S:HomeNetwork;P:SecretPassword;H:false;;');
assert.strictEqual(wifiResult.type, 'wifi');
assert.strictEqual(wifiResult.metadata.ssid, 'HomeNetwork');
assert.strictEqual(wifiResult.metadata.password, 'SecretPassword');
assert.strictEqual(wifiResult.metadata.authType, 'WPA');
assert.strictEqual(wifiResult.metadata.hidden, false);

// 3. vCard Contact
const vcard = `BEGIN:VCARD
VERSION:3.0
FN:Jane Doe
TEL:+1234567890
EMAIL:jane@example.com
ORG:Acme Corp
TITLE:Engineer
URL:https://example.com
END:VCARD`;
const vcardResult = ResultParser.parse(vcard);
assert.strictEqual(vcardResult.type, 'vcard');
assert.strictEqual(vcardResult.metadata.name, 'Jane Doe');
assert.strictEqual(vcardResult.metadata.phone, '+1234567890');
assert.strictEqual(vcardResult.metadata.email, 'jane@example.com');
assert.strictEqual(vcardResult.metadata.organization, 'Acme Corp');

// 4. URL
const urlResult = ResultParser.parse('https://antigravity.google.com/test');
assert.strictEqual(urlResult.type, 'url');
assert.strictEqual(urlResult.metadata.url, 'https://antigravity.google.com/test');

// 5. Plain Text / Barcode
const textResult = ResultParser.parse('8901030383921');
assert.strictEqual(textResult.type, 'plainText');
assert.strictEqual(textResult.metadata.text, '8901030383921');

// === ROUND-TRIP BUILDER CHECKS ===
console.log('Running Builder Round-Trip self-checks...');

// 6. Wi-Fi Builder Round-Trip
const generatedWifi = buildWifiQrString({
  ssid: 'OfficeGuest',
  password: 'guestPassword123',
  authType: 'WPA',
  hidden: false,
});
const parsedWifi = ResultParser.parse(generatedWifi);
assert.strictEqual(parsedWifi.type, 'wifi');
assert.strictEqual(parsedWifi.metadata.ssid, 'OfficeGuest');
assert.strictEqual(parsedWifi.metadata.password, 'guestPassword123');
assert.strictEqual(parsedWifi.metadata.authType, 'WPA');

// 7. vCard Builder Round-Trip
const generatedVCard = buildVCardString({
  name: 'John Developer',
  phone: '+9876543210',
  email: 'john@dev.com',
  organization: 'Tech Lab',
});
const parsedVCard = ResultParser.parse(generatedVCard);
assert.strictEqual(parsedVCard.type, 'vcard');
assert.strictEqual(parsedVCard.metadata.name, 'John Developer');
assert.strictEqual(parsedVCard.metadata.phone, '+9876543210');
assert.strictEqual(parsedVCard.metadata.email, 'john@dev.com');
assert.strictEqual(parsedVCard.metadata.organization, 'Tech Lab');

// 8. UPI Builder Round-Trip
const generatedUpi = buildUpiQrString({
  pa: 'payee@okbank',
  pn: 'SuperStore',
  am: '1500.00',
  cu: 'INR',
  tn: 'Groceries',
});
const parsedUpi = ResultParser.parse(generatedUpi);
assert.strictEqual(parsedUpi.type, 'upi');
assert.strictEqual(parsedUpi.metadata.pa, 'payee@okbank');
assert.strictEqual(parsedUpi.metadata.pn, 'SuperStore');
assert.strictEqual(parsedUpi.metadata.am, '1500.00');

// === EDGE CASE & MALFORMED INPUT CHECKS ===
console.log('Running Edge-Case & Corrupted Input self-checks...');

// 9. Empty and whitespace
const emptyResult = ResultParser.parse('');
assert.strictEqual(emptyResult.type, 'plainText');
assert.strictEqual(emptyResult.rawContent, '');

// 10. Corrupted UPI string without params
const corruptUpi = ResultParser.parse('upi://pay');
assert.strictEqual(corruptUpi.type, 'upi');
assert.strictEqual(corruptUpi.metadata.pa, '');

// 11. Corrupted WiFi without semicolon
const corruptWifi = ResultParser.parse('WIFI:garbage_no_semicolons');
assert.strictEqual(corruptWifi.type, 'wifi');
assert.strictEqual(corruptWifi.metadata.ssid, '');

// 12. Extremely large text (stress test)
const largeText = 'A'.repeat(5000);
const largeResult = ResultParser.parse(largeText);
assert.strictEqual(largeResult.type, 'plainText');
assert.strictEqual(largeResult.rawContent.length, 5000);

console.log('✅ All 12 self-checks (parsing + builders + edge-cases) passed successfully!');
