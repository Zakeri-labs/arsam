'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, FileText, Loader2, Phone, RefreshCw, Search } from 'lucide-react';
import BlacklistButton from '@/components/blacklist-button';

// Office WhatsApp inbox: one continuing file per customer, filled by the agent on
// the office Windows PC (windows-agent/). Read-only; replies stay in WhatsApp.

interface Conversation {
  chatKey: string;
  phone: string;
  name: string | null;
  lastAt: string;
  lastBody: string | null;
  lastKind: string;
  lastFromMe: boolean;
  count: number;
}

interface Message {
  id: string;
  fromMe: boolean;
  sentAt: string;
  kind: string;
  body: string | null;
  mediaUrl: string | null;
  mediaMime: string | null;
  mediaName: string | null;
}

const KIND_LABEL: Record<string, string> = {
  voice: 'ویس', image: 'عکس', video: 'ویدیو', document: 'فایل', sticker: 'استیکر', other: 'پیام',
};

const time = (iso: string) =>
  new Date(iso).toLocaleString('fa-IR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

const preview = (c: Conversation) =>
  `${c.lastFromMe ? 'شما: ' : ''}${c.lastBody || KIND_LABEL[c.lastKind] || 'پیام'}`;

function MessageBody({ m }: { m: Message }) {
  const media = m.mediaUrl;
  return (
    <div className="space-y-1.5">
      {media && m.kind === 'voice' && <audio controls preload="none" src={media} className="h-9 w-60 max-w-full" />}
      {media && (m.kind === 'image' || m.kind === 'sticker') && (
        // eslint-disable-next-line @next/next/no-img-element
        <a href={media} target="_blank" rel="noopener noreferrer"><img src={media} alt="" loading="lazy" className="max-h-60 rounded-xl" /></a>
      )}
      {media && m.kind === 'video' && <video controls preload="none" src={media} className="max-h-60 rounded-xl" />}
      {media && (m.kind === 'document' || m.kind === 'other') && (
        <a href={media} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[11.5px] font-bold text-gold underline">
          <FileText size={14} /> {m.mediaName || 'دانلود فایل'}
        </a>
      )}
      {!media && m.kind !== 'text' && <span className="text-[11px] text-white/40">({KIND_LABEL[m.kind] || 'پیام'} بدون فایل)</span>}
      {m.body && <p className="whitespace-pre-wrap break-words text-[12.5px] leading-6" dir="auto">{m.body}</p>}
    </div>
  );
}

export default function WhatsAppScreen() {
  const [chats, setChats] = useState<Conversation[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<Conversation | null>(null);
  const [thread, setThread] = useState<Message[] | null>(null);

  const loadChats = () => {
    setFailed(false);
    fetch('/api/whatsapp')
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(d => setChats(Array.isArray(d) ? d : []))
      .catch(() => setFailed(true));
  };

  useEffect(loadChats, []);

  useEffect(() => {
    if (!open) return;
    setThread(null);
    fetch(`/api/whatsapp?chat=${open.chatKey}`)
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(d => setThread(Array.isArray(d) ? d : []))
      .catch(() => setThread([]));
  }, [open]);

  const q = query.trim().toLowerCase();
  const shown = (chats || []).filter(c => !q || (c.name || '').toLowerCase().includes(q) || c.phone.includes(q) || c.chatKey.includes(q));

  const list = (
    <div className={`flex min-h-0 flex-col rounded-2xl border border-white/10 bg-[#0b172a] ${open ? 'hidden lg:flex' : 'flex'}`}>
      <div className="flex items-center gap-2 border-b border-white/10 p-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/35" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="جستجوی نام یا شماره..."
            className="w-full rounded-xl border border-white/10 bg-[#07111f] py-2 pr-9 pl-3 text-[12px] text-white placeholder:text-white/30 focus:border-gold/50 focus:outline-none"
          />
        </div>
        <button type="button" onClick={loadChats} title="بارگذاری دوباره" aria-label="بارگذاری دوباره" className="rounded-xl border border-white/10 p-2 text-white/60 hover:bg-white/5">
          <RefreshCw size={14} />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {failed ? (
          <p className="p-4 text-[12px] font-bold text-rose-300">
            خطا در بارگذاری پیام‌ها
            <button type="button" onClick={loadChats} className="mr-2 underline">تلاش دوباره</button>
          </p>
        ) : chats === null ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-white/40" /></div>
        ) : shown.length === 0 ? (
          <p className="px-4 py-10 text-center text-[12px] leading-6 text-white/40">
            {chats.length === 0 ? 'هنوز پیامی از واتس‌اپ دفتر نرسیده است. وضعیت اتصال در «تنظیمات» دیده می‌شود.' : 'نتیجه‌ای پیدا نشد'}
          </p>
        ) : (
          <ul className="divide-y divide-white/5">
            {shown.map(c => (
              <li key={c.chatKey}>
                <button
                  type="button"
                  onClick={() => setOpen(c)}
                  className={`flex w-full items-center gap-3 px-3 py-3 text-right transition-colors hover:bg-white/5 ${open?.chatKey === c.chatKey ? 'bg-gold/10' : ''}`}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold/30 bg-gold/10 text-sm font-black text-gold">
                    {(c.name || '#').charAt(0)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-[12.5px] font-extrabold text-white">{c.name || <bdo dir="ltr">{c.phone}</bdo>}</span>
                      <span className="shrink-0 text-[10px] text-white/40">{time(c.lastAt)}</span>
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-white/50" dir="auto">{preview(c)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  const detail = open && (
    <div className="flex min-h-0 flex-col rounded-2xl border border-white/10 bg-[#0b172a]">
      <div className="flex items-center gap-2 border-b border-white/10 p-3">
        <button type="button" onClick={() => setOpen(null)} aria-label="بازگشت" className="rounded-xl p-1.5 text-white/60 hover:bg-white/5 lg:hidden">
          <ArrowRight size={18} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-black text-white">{open.name || 'بدون نام'}</p>
          <bdo dir="ltr" className="block text-right font-mono text-[11px] text-white/50" style={{ unicodeBidi: 'bidi-override', direction: 'ltr' }}>{open.phone}</bdo>
        </div>
        <a href={`tel:${open.phone.replace(/[^0-9+]/g, '')}`} title="تماس" aria-label="تماس" className="rounded-lg border border-white/10 p-1.5 text-white/70 hover:bg-white/5"><Phone size={14} /></a>
        <BlacklistButton phone={open.phone} name={open.name || undefined} onDone={() => { setOpen(null); loadChats(); }} />
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {thread === null ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-white/40" /></div>
        ) : thread.map(m => (
          <div key={m.id} className={`flex ${m.fromMe ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[85%] rounded-2xl px-3 py-2 ${m.fromMe ? 'bg-emerald-500/15 text-white' : 'bg-white/[0.06] text-white'}`}>
              <MessageBody m={m} />
              <p className="mt-1 text-[9.5px] text-white/40">{m.fromMe ? 'دفتر · ' : ''}{time(m.sentAt)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-4 text-white" dir="rtl">
      <div className="grid h-[calc(100dvh-150px)] min-h-[420px] gap-4 lg:grid-cols-[340px_1fr]">
        {list}
        {detail || (
          <div className="hidden items-center justify-center rounded-2xl border border-dashed border-white/10 text-[12px] text-white/35 lg:flex">
            یک گفتگو را از فهرست انتخاب کنید
          </div>
        )}
      </div>
    </div>
  );
}
