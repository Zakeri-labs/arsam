// Normalises a phone number so the same person matches however it was typed:
// Persian/Arabic digits, spaces, "+", "00" prefix and the Oman (968) or Iran
// (98 / leading 0) country codes are all folded away.
// ponytail: only Oman and Iran prefixes are stripped; other countries keep their code,
// so "+971..." and "00971..." still match each other but not a local-format number.
export function phoneKey(phone: string): string {
  let d = String(phone || '')
    .replace(/[۰-۹]/g, c => String(c.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, c => String(c.charCodeAt(0) - 0x0660))
    .replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.length === 11 && d.startsWith('968')) d = d.slice(3);
  if (d.length === 13 && d.startsWith('980')) d = d.slice(3);
  if (d.length === 12 && d.startsWith('98')) d = d.slice(2);
  if (d.length === 11 && d.startsWith('09')) d = d.slice(1);
  return d;
}
