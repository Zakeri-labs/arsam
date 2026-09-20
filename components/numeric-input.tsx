'use client';

import { useEffect, useState } from 'react';
import { normalizeDigits, parseFormattedNumber } from '@/lib/utils';

type NumericInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'type'
> & {
  value: number | null | undefined;
  onValueChange: (value: number) => void;
};

/**
 * Text input with a numeric keyboard that accepts Persian/Arabic digits.
 * Keeps the raw typed text locally so partial input ("0", "2.", "1,5") is not
 * erased by the number round-trip; the parsed number is reported to the parent.
 */
export default function NumericInput({ value, onValueChange, ...props }: NumericInputProps) {
  const [text, setText] = useState(value ? String(value) : '');

  useEffect(() => {
    if ((value || 0) !== parseFormattedNumber(text)) {
      setText(value ? String(value) : '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <input
      {...props}
      type="text"
      inputMode="decimal"
      value={text}
      onChange={e => {
        const cleaned = normalizeDigits(e.target.value)
          .replace(/[٫،]/g, '.')
          .replace(/[,\s]/g, '');
        if (!/^\d*\.?\d*$/.test(cleaned)) return;
        setText(cleaned);
        onValueChange(parseFormattedNumber(cleaned));
      }}
    />
  );
}
