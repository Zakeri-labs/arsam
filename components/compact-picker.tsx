'use client';

import { useRef, useState, type ReactNode } from 'react';
import { Command as CommandPrimitive } from 'cmdk';
import { Check, ChevronDown, Search } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn, toEnglishDigits } from '@/lib/utils';

export interface CompactPickerOption {
  value: string;
  /** Row content inside the open list */
  content: ReactNode;
  /** Condensed content shown on the closed trigger; falls back to `content` */
  selectedContent?: ReactNode;
  /** Plain text the search box matches against (model, plate, customer...) */
  searchText: string;
}

interface CompactPickerProps {
  value: string;
  onChange: (value: string) => void;
  options: CompactPickerOption[];
  placeholder: string;
  searchPlaceholder?: string;
  emptyText?: string;
  /** Show the search box only when the list is long enough to need it */
  searchThreshold?: number;
  disabled?: boolean;
  className?: string;
}

const normalize = (s: string) => toEnglishDigits(s).toLowerCase().replace(/\s+/g, ' ').trim();

/** Small RTL dropdown: one-line trigger, searchable list, rows rendered by the caller. */
export default function CompactPicker({
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder = 'جستجو...',
  emptyText = 'موردی یافت نشد',
  searchThreshold = 6,
  disabled,
  className,
}: CompactPickerProps) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const selected = options.find(o => o.value === value);
  const showSearch = options.length > searchThreshold;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'flex w-full items-center gap-2 rounded-xl border border-white/15 bg-[#07111f] px-3 h-11 sm:h-9 text-right text-white outline-none transition-colors hover:border-white/30 focus-visible:border-gold data-[state=open]:border-gold cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-white/15',
            className,
          )}
        >
          <span className="min-w-0 flex-1">
            {selected
              ? (selected.selectedContent ?? selected.content)
              : <span className="text-white/40 text-xs">{placeholder}</span>}
          </span>
          <ChevronDown size={15} className={cn('shrink-0 text-white/40 transition-transform', open && 'rotate-180')} />
        </button>
      </PopoverTrigger>

      <PopoverContent
        dir="rtl"
        align="start"
        sideOffset={4}
        collisionPadding={12}
        // Focus the search box only with a mouse/keyboard, so phones don't pop the keyboard over the list
        onOpenAutoFocus={e => {
          e.preventDefault();
          if (showSearch && window.matchMedia('(pointer: fine)').matches) inputRef.current?.focus();
        }}
        className="z-[70] w-[var(--radix-popover-trigger-width)] min-w-[240px] rounded-xl border border-white/15 bg-[#0f1e37] p-0 text-white shadow-2xl"
      >
        <CommandPrimitive
          loop
          defaultValue={value || undefined}
          // Match on the row's search text only (not its id), with Persian/Arabic digits folded to English
          filter={(_value, search, keywords) => (keywords?.[0]?.includes(normalize(search)) ? 1 : 0)}
        >
          {showSearch && (
            <div className="flex items-center gap-2 border-b border-white/10 px-3">
              <Search size={13} className="shrink-0 text-white/40" />
              <CommandPrimitive.Input
                ref={inputRef}
                placeholder={searchPlaceholder}
                className="h-9 w-full bg-transparent text-sm sm:text-xs text-white placeholder-white/30 outline-none"
              />
            </div>
          )}
          <CommandPrimitive.List className="max-h-[min(18rem,45vh)] overflow-y-auto overscroll-contain p-1 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.15)_transparent]">
            <CommandPrimitive.Empty className="py-4 text-center text-[11px] text-white/40">
              {emptyText}
            </CommandPrimitive.Empty>
            {options.map(o => {
              const isSelected = o.value === value;
              return (
                <CommandPrimitive.Item
                  key={o.value}
                  value={o.value}
                  keywords={[normalize(o.searchText)]}
                  onSelect={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className="flex items-center gap-2 rounded-lg px-2 py-2 sm:py-1.5 cursor-pointer outline-none data-[selected=true]:bg-white/[0.07]"
                >
                  <span className="min-w-0 flex-1">{o.content}</span>
                  <Check size={13} className={cn('shrink-0 text-gold', isSelected ? 'opacity-100' : 'opacity-0')} />
                </CommandPrimitive.Item>
              );
            })}
          </CommandPrimitive.List>
        </CommandPrimitive>
      </PopoverContent>
    </Popover>
  );
}
