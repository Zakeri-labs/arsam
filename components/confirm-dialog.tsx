'use client';

import { useEffect, useState } from 'react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { AlertTriangle } from 'lucide-react';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  // When set, the confirm button stays disabled until the user types exactly this text
  requireText?: string;
}

type Pending = ConfirmOptions & { resolve: (ok: boolean) => void };

let showDialog: ((pending: Pending) => void) | null = null;

// In-app replacement for window.confirm: `if (!(await confirmDialog({ message }))) return;`
export function confirmDialog(options: ConfirmOptions | string): Promise<boolean> {
  const opts = typeof options === 'string' ? { message: options } : options;
  return new Promise(resolve => {
    if (!showDialog) {
      // Host not mounted: fall back to the browser dialog rather than silently skipping the action
      resolve(window.confirm(opts.message));
      return;
    }
    showDialog({ ...opts, resolve });
  });
}

// Mount once per page (next to <Toaster />)
export function ConfirmDialogHost() {
  const [pending, setPending] = useState<Pending | null>(null);
  const [typed, setTyped] = useState('');

  useEffect(() => {
    showDialog = next => {
      setTyped('');
      setPending(prev => {
        prev?.resolve(false);
        return next;
      });
    };
    return () => { showDialog = null; };
  }, []);

  const textMatches = !pending?.requireText || typed.trim().toUpperCase() === pending.requireText.toUpperCase();

  const close = (ok: boolean) => {
    pending?.resolve(ok && textMatches);
    setPending(null);
  };

  const destructive = pending?.destructive ?? true;

  return (
    <AlertDialog.Root open={!!pending} onOpenChange={open => { if (!open) close(false); }}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <AlertDialog.Content
          dir="rtl"
          className="fixed left-1/2 top-1/2 z-[201] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-gold/30 bg-[#0b172a] p-5 text-right font-sans text-white shadow-2xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          <div className="flex items-start gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${destructive ? 'bg-rose-500/15 text-rose-400' : 'bg-gold/15 text-gold'}`}>
              <AlertTriangle size={20} />
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              <AlertDialog.Title className="text-sm font-black">
                {pending?.title || (destructive ? 'تأیید حذف' : 'تأیید')}
              </AlertDialog.Title>
              <AlertDialog.Description className="text-xs leading-6 text-white/70 whitespace-pre-line">
                {pending?.message}
              </AlertDialog.Description>
            </div>
          </div>

          {pending?.requireText && (
            <label className="mt-4 block">
              <span className="mb-1 block text-[11px] text-white/60">
                برای تأیید، <span className="font-mono font-black text-rose-300" dir="ltr">{pending.requireText}</span> را تایپ کنید:
              </span>
              <input
                autoFocus
                dir="ltr"
                value={typed}
                onChange={e => setTyped(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && textMatches) close(true); }}
                className="w-full rounded-xl border border-white/15 bg-[#07111f] p-2.5 text-left font-mono text-xs text-white outline-none focus:border-rose-400"
              />
            </label>
          )}

          <div className="mt-5 flex gap-2">
            <AlertDialog.Action
              disabled={!textMatches}
              onClick={() => close(true)}
              className={`flex-1 cursor-pointer rounded-xl py-2.5 text-xs font-black transition-all enabled:hover:scale-[1.02] enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 ${destructive ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/30 hover:bg-rose-500' : 'bg-gradient-to-r from-gold to-amber-500 text-black'}`}
            >
              {pending?.confirmText || (destructive ? 'بله، حذف شود' : 'تأیید')}
            </AlertDialog.Action>
            <AlertDialog.Cancel
              onClick={() => close(false)}
              className="flex-1 cursor-pointer rounded-xl border border-white/15 bg-white/5 py-2.5 text-xs font-bold text-white/80 transition-colors hover:bg-white/10"
            >
              {pending?.cancelText || 'انصراف'}
            </AlertDialog.Cancel>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
