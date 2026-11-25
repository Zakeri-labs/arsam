// Self-check for lib/phone-key.ts. Run: node --experimental-strip-types scripts/check-phone-key.mjs
import assert from 'node:assert';
import { phoneKey } from '../lib/phone-key.ts';

for (const p of ['+968 9123 4567', '0096891234567', '91234567', '۹۱۲۳۴۵۶۷', '٩١٢٣٤٥٦٧']) assert.equal(phoneKey(p), '91234567', p);
for (const p of ['+98 912 345 6789', '00989123456789', '09123456789', '+98 0912 345 6789']) assert.equal(phoneKey(p), '9123456789', p);
assert.equal(phoneKey('+971 50 123 4567'), phoneKey('00971501234567'));
for (const p of ['', '+', 'abc']) assert.equal(phoneKey(p), '', p);
console.log('phone-key ok');
