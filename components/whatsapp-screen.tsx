'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, FileText, Loader2, Phone, RefreshCw, Search } from 'lucide-react';
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

const PAGE_SIZE = 30; // same as CONVERSATIONS_PAGE in lib/whatsapp.ts

const faNum = (n: number) => n.toLocaleString('fa-IR');

export default function WhatsAppScreen() {
  const reduceMotion = useReducedMotion();
  const [chats, setChats] = useState<Conversation[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [failed, setFailed] = useState<string | false>(false);
  const [listLoading, setListLoading] = useState(false);
  const listScrollRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState<Conversation | null>(null);
  const [thread, setThread] = useState<Message[] | null>(null);
  const [threadFailed, setThreadFailed] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const listReq = useRef(0);
  const threadReq = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  // scroll to apply once the new thread is on screen: 'bottom', or a distance from the bottom
  const pendingScroll = useRef<'bottom' | number | null>(null);

  // search runs on the server; wait for a short pause in typing
  useEffect(() => {
    const next = query.trim();
    if (next === search) return;
    const t = setTimeout(() => {
      setSearch(next);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [query, search]);

  const loadChats = useCallback(() => {
    const req = ++listReq.current;
    setFailed(false);
    setListLoading(true);
    fetch(`/api/whatsapp?q=${encodeURIComponent(search)}&page=${page}`)
      .then(async r => (r.ok ? r.json() : Promise.reject((await r.json().catch(() => ({})))?.error)))
      .then(d => {
        if (req !== listReq.current) return;
        setChats(Array.isArray(d?.items) ? d.items : []);
        setTotal(Number(d?.total) || 0);
        if (listScrollRef.current) listScrollRef.current.scrollTop = 0;
      })
      .catch(msg => { if (req === listReq.current) setFailed(typeof msg === 'string' && msg ? msg : 'خطا در بارگذاری پیام‌ها'); })
      .finally(() => { if (req === listReq.current) setListLoading(false); });
  }, [search, page]);

  useEffect(loadChats, [loadChats]);

  const loadThread = useCallback((chat: Conversation, before?: Message) => {
    const req = ++threadReq.current;
    setThreadFailed(false);
    if (before) setLoadingOlder(true);
    else { setThread(null); setHasMore(false); }
    const cursor = before ? `&before_at=${encodeURIComponent(before.sentAt)}&before_id=${encodeURIComponent(before.id)}` : '';
    fetch(`/api/whatsapp?chat=${chat.chatKey}${cursor}`)
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(d => {
        if (req !== threadReq.current) return;
        const msgs: Message[] = Array.isArray(d?.messages) ? d.messages : [];
        setHasMore(!!d?.hasMore);
        // newest page: jump to the latest message; older page: keep the reader where they are now
        const box = scrollRef.current;
        pendingScroll.current = before && box ? box.scrollHeight - box.scrollTop : 'bottom';
        setThread(prev => (before ? [...msgs, ...(prev || [])] : msgs));
      })
      .catch(() => { if (req === threadReq.current) setThreadFailed(true); })
      .finally(() => { if (req === threadReq.current) setLoadingOlder(false); });
  }, []);

  useEffect(() => {
    if (open) loadThread(open);
  }, [open, loadThread]);

  // runs after React has put the messages on screen, before the browser paints
  useLayoutEffect(() => {
    const box = scrollRef.current;
    const want = pendingScroll.current;
    if (!box || want === null || !thread) return;
    pendingScroll.current = null;
    box.scrollTop = want === 'bottom' ? box.scrollHeight : box.scrollHeight - want;
  }, [thread]);

  const shown = chats || [];
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // a page that emptied (e.g. its last conversation was blacklisted) falls back to the
  // last real page; the server reports the real total even past the end
  useEffect(() => {
    if (chats && page > pages) setPage(pages);
  }, [chats, page, pages]);

  const list = (
    <div className={`flex min-h-0 flex-col rounded-2xl border border-white/10 bg-[#0b172a] ${open ? 'hidden lg:flex' : 'flex'}`}>
      <div className="flex items-center gap-2 border-b border-white/10 p-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/35" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="جستجوی نام یا شماره..."
            aria-label="جستجوی نام یا شماره"
            className="min-h-11 w-full rounded-xl border border-white/10 bg-[#07111f] py-2 pr-9 pl-3 text-[12px] text-white placeholder:text-white/30 focus:border-gold/50 focus:outline-none"
          />
        </div>
        <button type="button" onClick={loadChats} title="بارگذاری دوباره" aria-label="بارگذاری دوباره" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 text-white/60 hover:bg-white/5">
          <RefreshCw size={14} className={listLoading ? 'animate-spin' : ''} />
        </button>
      </div>
      <div ref={listScrollRef} className="min-h-0 flex-1 overflow-y-auto">
        {failed ? (
          <div className="flex flex-col items-center gap-2 p-4 text-center text-[12px] font-bold leading-6 text-rose-300">
            {failed}
            <button type="button" onClick={loadChats} className="min-h-11 rounded-xl border border-rose-500/30 px-4 text-[12px] font-bold text-rose-200 hover:bg-rose-500/10">تلاش دوباره</button>
          </div>
        ) : chats === null ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-white/40" /></div>
        ) : shown.length === 0 ? (
          <p className="px-4 py-10 text-center text-[12px] leading-6 text-white/40">
            {search ? 'نتیجه‌ای پیدا نشد' : total > 0 ? 'این صفحه خالی است' : 'هنوز پیامی از واتس‌اپ دفتر نرسیده است. وضعیت اتصال در «تنظیمات» دیده می‌شود.'}
          </p>
        ) : (
          <ul aria-busy={listLoading} className={`divide-y divide-white/5 transition-opacity ${listLoading ? 'pointer-events-none opacity-50' : ''}`}>
            {shown.map((c, i) => (
              <motion.li
                key={c.chatKey}
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: Math.min(i, 12) * 0.025, ease: 'easeOut' }}
              >
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
              </motion.li>
            ))}
          </ul>
        )}
      </div>
      {pages > 1 && (
        <nav aria-label="صفحه‌های گفتگوها" className="flex items-center justify-between gap-2 border-t border-white/10 px-2 py-1.5">
          <button
            type="button"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1 || listLoading}
            className="flex min-h-11 items-center gap-1 rounded-xl px-3 text-[11.5px] font-bold text-white/70 transition-colors hover:bg-white/5 disabled:opacity-35"
          >
            <ChevronRight size={15} /> قبلی
          </button>
          <span className="text-center text-[11px] leading-5 text-white/50">صفحه‌ی {faNum(page)} از {faNum(pages)} · {faNum(total)} گفتگو</span>
          <button
            type="button"
            onClick={() => setPage(p => Math.min(pages, p + 1))}
            disabled={page >= pages || listLoading}
            className="flex min-h-11 items-center gap-1 rounded-xl px-3 text-[11.5px] font-bold text-white/70 transition-colors hover:bg-white/5 disabled:opacity-35"
          >
            بعدی <ChevronLeft size={15} />
          </button>
        </nav>
      )}
    </div>
  );

  const detail = open && (
    <div className="flex min-h-0 flex-col rounded-2xl border border-white/10 bg-[#0b172a]">
      <div className="flex items-center gap-2 border-b border-white/10 p-3">
        <button type="button" onClick={() => setOpen(null)} aria-label="بازگشت" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white/60 hover:bg-white/5 lg:hidden">
          <ArrowRight size={18} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-black text-white">{open.name || 'بدون نام'}</p>
          <bdo dir="ltr" className="block text-right font-mono text-[11px] text-white/50" style={{ unicodeBidi: 'bidi-override', direction: 'ltr' }}>{open.phone}</bdo>
        </div>
        <a href={`tel:${open.phone.replace(/[^0-9+]/g, '')}`} title="تماس" aria-label="تماس" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 text-white/70 hover:bg-white/5"><Phone size={14} /></a>
        <BlacklistButton className="min-h-11 rounded-xl px-3 text-[11px]" phone={open.phone} name={open.name || undefined} onDone={() => { setOpen(null); loadChats(); }} />
      </div>
      <div ref={scrollRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {threadFailed && !thread ? (
          <div className="flex flex-col items-center gap-2 p-4 text-[12px] font-bold text-rose-300">
            خطا در بارگذاری پیام‌ها
            <button type="button" onClick={() => loadThread(open)} className="min-h-11 rounded-xl border border-rose-500/30 px-4 text-[12px] font-bold text-rose-200 hover:bg-rose-500/10">تلاش دوباره</button>
          </div>
        ) : thread === null ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-white/40" /></div>
        ) : thread.length === 0 ? (
          <p className="py-10 text-center text-[12px] text-white/40">پیامی برای نمایش نیست</p>
        ) : hasMore || threadFailed ? (
          <div className="flex flex-col items-center gap-1 pb-1">
            {hasMore && (
              <button
                type="button"
                onClick={() => loadThread(open, thread[0])}
                disabled={loadingOlder}
                className="flex min-h-11 items-center gap-1.5 rounded-xl border border-white/10 px-3 text-[11px] font-bold text-white/65 transition-colors hover:bg-white/5 disabled:opacity-50"
              >
                {loadingOlder && <Loader2 size={13} className="animate-spin" />}
                پیام‌های قدیمی‌تر
              </button>
            )}
            {threadFailed && <p className="text-[11px] text-rose-300">پیام‌های قدیمی‌تر بارگذاری نشد</p>}
          </div>
        ) : null}
        {thread && thread.map(m => (
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
      <div className="grid h-[calc(100dvh-150px)] min-h-[420px] grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
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
