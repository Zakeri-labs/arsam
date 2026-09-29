'use client';

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';

// Styled dropdown for the dark admin panel (replaces native <select>):
// compact, readable options with an optional second line, keyboard support,
// and a list rendered in a portal so modals with scrolling never clip it.

export interface FancyOption<T extends string> {
  value: T;
  label: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
}

interface FancySelectProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: FancyOption<T>[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
}

export default function FancySelect<T extends string>({ value, onChange, options, placeholder = 'انتخاب کنید', className = '', disabled, ariaLabel }: FancySelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState<{ left: number; top?: number; bottom?: number; width: number; maxHeight: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.value === value);

  const place = () => {
    const r = buttonRef.current?.getBoundingClientRect();
    if (!r) return;
    const below = window.innerHeight - r.bottom - 8;
    const above = r.top - 8;
    const openUp = below < 220 && above > below;
    setPos({
      left: r.left,
      width: r.width,
      ...(openUp ? { bottom: window.innerHeight - r.top + 6 } : { top: r.bottom + 6 }),
      maxHeight: Math.max(160, Math.min(320, openUp ? above : below)),
    });
  };

  useLayoutEffect(() => {
    if (!open) return;
    place();
    setActive(Math.max(0, options.findIndex(o => o.value === value)));
    const onScroll = (e: Event) => {
      if (listRef.current?.contains(e.target as Node)) return;
      place();
    };
    window.addEventListener('resize', place);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', onScroll, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      const t = e.target as Node;
      if (!buttonRef.current?.contains(t) && !listRef.current?.contains(t)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
    };
  }, [open]);

  useEffect(() => {
    if (open) listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  const choose = (i: number) => {
    const opt = options[i];
    if (!opt) return;
    onChange(opt.value);
    setOpen(false);
    buttonRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive(a => Math.min(options.length - 1, a + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(a => Math.max(0, a - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      choose(active);
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen(o => !o)}
        onKeyDown={onKeyDown}
        className={`group flex w-full items-center justify-between gap-2 rounded-xl border bg-[#07111f] px-3 py-2.5 text-right text-[12.5px] leading-5 text-white outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          open ? 'border-gold/70 ring-2 ring-gold/15' : 'border-white/15 hover:border-white/30 focus-visible:border-gold/70'
        } ${className}`}
      >
        <span className="flex min-w-0 items-center gap-2">
          {selected?.icon && <span className="shrink-0">{selected.icon}</span>}
          <span className={`truncate ${selected ? 'font-semibold' : 'text-white/40'}`}>{selected ? selected.label : placeholder}</span>
        </span>
        <ChevronDown size={15} className={`shrink-0 text-white/45 transition-transform duration-200 ${open ? 'rotate-180 text-gold' : ''}`} />
      </button>

      {open && pos && typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={listRef}
            role="listbox"
            dir="rtl"
            onKeyDown={onKeyDown}
            style={{ position: 'fixed', left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom, maxHeight: pos.maxHeight, zIndex: 1000 }}
            className="overflow-y-auto overscroll-contain rounded-xl border border-white/15 bg-[#0f1e37]/98 p-1 font-sans shadow-2xl shadow-black/50 backdrop-blur-md"
          >
            {options.map((opt, i) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  data-index={i}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(i)}
                  className={`flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-right transition-colors ${
                    isSelected ? 'bg-gold/15 text-gold' : i === active ? 'bg-white/[0.07] text-white' : 'text-white/85'
                  }`}
                >
                  {opt.icon && <span className="mt-0.5 shrink-0">{opt.icon}</span>}
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12px] font-semibold leading-5">{opt.label}</span>
                    {opt.hint && <span className="mt-0.5 block text-[10.5px] leading-4 text-white/45">{opt.hint}</span>}
                  </span>
                  <Check size={14} className={`mt-0.5 shrink-0 ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </>
  );
}
