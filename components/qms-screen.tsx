'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Volume2, CheckCircle2, Clock, RefreshCw, ArrowRightLeft,
  MessageSquare, Trash2, Phone, Paperclip, Download, ChevronDown,
  ChevronUp, LayoutGrid, Loader2, UserX, Sparkles, Timer, Hash,
  Building2, Search, Filter, AlertTriangle
} from 'lucide-react';

export interface QMSTicket {
  id: string;
  name: string;
  phone: string;
  description: string;
  serviceTitle: string;
  createdAt: string;
  queueNumber: number;
  source: string;
  queueName: string;
  queueStatus: 'waiting' | 'calling' | 'in_progress' | 'completed' | 'absent';
  calledAt?: string | null;
  servedAt?: string | null;
}

interface UploadedFile {
  name: string;
  size: number;
  url?: string;
}

interface FilesMap {
  [ticketId: string]: UploadedFile[];
}

interface LoadingFilesMap {
  [ticketId: string]: boolean;
}

const DEFAULT_QUEUE_NAME = 'جناب اماره';

const QUEUE_OPTIONS = [
  'جناب اماره',
  'باجه ۱ - ثبت شرکت',
  'باجه ۲ - خدمات بانکی و ایجاری',
  'باجه ۳ - پیگیری لایسنس و ویزا',
  'باجه ویژه VIP',
];

const STATUS_CONFIG = {
  waiting:     { label: 'در انتظار',         color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.25)', badgeBg: 'rgba(148,163,184,0.15)', badgeText: '#cbd5e1' },
  calling:     { label: 'در حال فراخوانی',   color: '#c9a227', bg: 'rgba(201,162,39,0.18)', border: 'rgba(201,162,39,0.45)', badgeBg: 'rgba(201,162,39,0.2)', badgeText: '#fef08a' },
  in_progress: { label: 'در حال خدمت',       color: '#34d399', bg: 'rgba(52,211,153,0.15)', border: 'rgba(52,211,153,0.35)', badgeBg: 'rgba(52,211,153,0.2)', badgeText: '#6ee7b7' },
  completed:   { label: 'تکمیل شد',          color: '#60a5fa', bg: 'rgba(96,165,250,0.15)', border: 'rgba(96,165,250,0.35)', badgeBg: 'rgba(96,165,250,0.2)', badgeText: '#93c5fd' },
  absent:      { label: 'غایب',               color: '#f87171', bg: 'rgba(248,113,113,0.15)', border: 'rgba(248,113,113,0.35)', badgeBg: 'rgba(248,113,113,0.2)', badgeText: '#fca5a5' },
} as const;

function formatTime(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
  } catch { return dateStr; }
}

function useWaitMinutes(createdAt: string) {
  const [mins, setMins] = useState(0);
  useEffect(() => {
    const calc = () => {
      const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
      setMins(diff > 0 ? diff : 0);
    };
    calc();
    const t = setInterval(calc, 30000);
    return () => clearInterval(t);
  }, [createdAt]);
  return mins;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function WaitTimer({ createdAt, status }: { createdAt: string; status: string }) {
  const mins = useWaitMinutes(createdAt);
  if (status === 'completed' || status === 'absent') return null;
  return (
    <span className="flex items-center gap-1 text-[10px] font-bold" style={{ color: mins > 30 ? '#f87171' : mins > 15 ? '#fbbf24' : '#94a3b8' }}>
      <Timer size={11} />
      {mins} د انتظار
    </span>
  );
}

function FileRow({ file }: { file: UploadedFile }) {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
  const isPdf = ext === 'pdf';

  return (
    <div className="flex items-center justify-between gap-2 py-1.5 px-2.5 rounded-lg bg-[#07111f] border border-white/10 text-xs">
      <div className="flex items-center gap-2 min-w-0">
        <span className="shrink-0 text-sm">{isImage ? '🖼️' : isPdf ? '📄' : '📎'}</span>
        <div className="min-w-0">
          <p className="font-bold text-white truncate max-w-[170px]">{file.name}</p>
          <p className="text-[9px] text-white/40">{formatFileSize(file.size)}</p>
        </div>
      </div>
      {file.url && (
        <a
          href={file.url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-md bg-gold/20 text-gold font-bold text-[10px] hover:bg-gold/30"
        >
          <Download size={11} />
          دانلود
        </a>
      )}
    </div>
  );
}

function TicketCard({
  ticket,
  onStatusChange,
  onTransfer,
  onDelete,
  filesMap,
  loadingFilesMap,
  onLoadFiles,
}: {
  ticket: QMSTicket;
  onStatusChange: (id: string, status: QMSTicket['queueStatus']) => void;
  onTransfer: (ticket: QMSTicket) => void;
  onDelete: (id: string) => void;
  filesMap: FilesMap;
  loadingFilesMap: LoadingFilesMap;
  onLoadFiles: (ticket: QMSTicket) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const statusCfg = STATUS_CONFIG[ticket.queueStatus || 'waiting'];
  const cleanPhone = ticket.phone.replace(/[^0-9+]/g, '');
  const isActive = ticket.queueStatus === 'waiting' || ticket.queueStatus === 'calling' || ticket.queueStatus === 'in_progress';
  const files = filesMap[ticket.id];
  const loadingFiles = loadingFilesMap[ticket.id];

  const handleExpand = () => {
    const next = !expanded;
    setExpanded(next);
    if (next && files === undefined) {
      onLoadFiles(ticket);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="rounded-2xl border bg-[#0b172a] shadow-xl transition-all relative overflow-hidden text-right flex flex-col justify-between"
      style={{
        borderColor: statusCfg.border,
        opacity: isActive ? 1 : 0.75,
      }}
    >
      {/* Side status bar */}
      <div className="absolute top-0 right-0 bottom-0 w-1.5" style={{ background: statusCfg.color }} />

      <div className="pr-4 pl-3.5 pt-3.5 pb-2.5">
        {/* Row 1: Queue number, Phone, Status badge */}
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2.5">
            <div
              className="flex flex-col items-center justify-center w-12 h-12 rounded-xl shrink-0 font-black border shadow-xs"
              style={{ background: statusCfg.badgeBg, borderColor: statusCfg.border, color: statusCfg.badgeText }}
            >
              <span className="text-[8px] leading-none mb-0.5 opacity-80">نوبت</span>
              <span className="text-xl leading-none font-black">{ticket.queueNumber ?? '—'}</span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <bdo dir="ltr" className="font-mono font-black text-white text-xs tracking-wide inline-block" style={{ unicodeBidi: 'bidi-override', direction: 'ltr' }}>
                  {ticket.phone}
                </bdo>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-white/40 flex items-center gap-1">
                  <Clock size={10} />
                  {formatTime(ticket.createdAt)}
                </span>
                <WaitTimer createdAt={ticket.createdAt} status={ticket.queueStatus} />
              </div>
            </div>
          </div>

          <span
            className="shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border"
            style={{ background: statusCfg.badgeBg, color: statusCfg.badgeText, borderColor: statusCfg.border }}
          >
            {statusCfg.label}
          </span>
        </div>

        {/* Service & Queue info */}
        <div className="flex justify-between items-center text-xs py-2 border-t border-white/10">
          <span className="text-white/80 font-bold truncate max-w-[170px]">{ticket.serviceTitle}</span>
          <span className="text-[10px] font-bold text-gold bg-gold/10 px-2 py-0.5 rounded-md border border-gold/20">
            {ticket.queueName || DEFAULT_QUEUE_NAME}
          </span>
        </div>

        {/* Status Actions */}
        {isActive && (
          <div className="grid grid-cols-3 gap-1.5 mt-2">
            <button
              onClick={() => onStatusChange(ticket.id, 'calling')}
              disabled={ticket.queueStatus === 'calling'}
              className="py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer disabled:opacity-40 bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25"
            >
              فراخوانی
            </button>
            <button
              onClick={() => onStatusChange(ticket.id, 'in_progress')}
              disabled={ticket.queueStatus === 'in_progress'}
              className="py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer disabled:opacity-40 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25"
            >
              شروع خدمت
            </button>
            <button
              onClick={() => onStatusChange(ticket.id, 'completed')}
              className="py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer bg-blue-500/15 text-blue-300 border border-blue-500/30 hover:bg-blue-500/25"
            >
              تکمیل
            </button>
          </div>
        )}
      </div>

      {/* Secondary Actions Footer */}
      <div className="flex items-center justify-between gap-1.5 px-3.5 py-2 border-t border-white/10 bg-[#07111f]/60">
        <div className="flex items-center gap-1.5">
          <a
            href={`https://wa.me/${cleanPhone}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all"
            title="واتساپ"
          >
            <MessageSquare size={13} />
          </a>
          <a
            href={`tel:${cleanPhone}`}
            className="p-1.5 rounded-lg bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 transition-all"
            title="تماس"
          >
            <Phone size={13} />
          </a>
          <button
            onClick={() => onTransfer(ticket)}
            className="p-1 px-2 rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/25 transition-all cursor-pointer flex items-center gap-1 text-[10px] font-bold"
            title="انتقال صف"
          >
            <ArrowRightLeft size={11} />
            <span>انتقال</span>
          </button>
          {isActive && (
            <button
              onClick={() => onStatusChange(ticket.id, 'absent')}
              className="p-1.5 rounded-lg bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 transition-all cursor-pointer"
              title="غایب"
            >
              <UserX size={13} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleExpand}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer bg-white/5 text-white/80 border-white/10 hover:bg-white/10"
          >
            <Paperclip size={11} />
            <span>مدارک</span>
            {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>

          <button
            onClick={() => onDelete(ticket.id)}
            className="p-1 rounded-lg text-red-400 hover:bg-red-500/15 transition-all cursor-pointer"
            title="حذف"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Expanded Documents Panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-[#07111f] border-t border-white/10 p-2.5 space-y-1.5"
          >
            <p className="text-[10px] font-extrabold text-white/50 mb-1">
              📎 مدارک آپلودی ({ticket.phone}):
            </p>
            {loadingFiles ? (
              <div className="flex items-center justify-center py-2 gap-2 text-white/40 text-xs">
                <Loader2 size={12} className="animate-spin text-gold" />
                <span>در حال بارگذاری...</span>
              </div>
            ) : files && files.length > 0 ? (
              <div className="space-y-1">
                {files.map((f, i) => <FileRow key={i} file={f} />)}
              </div>
            ) : (
              <p className="text-center py-2 text-white/40 text-[11px]">
                هیچ مدرکی برای این شماره یافت نشد
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function TransferModal({
  ticket,
  onClose,
  onConfirm,
}: {
  ticket: QMSTicket;
  onClose: () => void;
  onConfirm: (targetQueue: string) => void;
}) {
  const [target, setTarget] = useState(QUEUE_OPTIONS.find(q => q !== (ticket.queueName || DEFAULT_QUEUE_NAME)) || QUEUE_OPTIONS[1]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs"
      />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="relative z-10 w-full max-w-md bg-[#0b172a] rounded-2xl p-5 shadow-2xl border border-white/10 text-white"
        dir="rtl"
      >
        <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
          <div>
            <h3 className="text-sm font-black text-white">انتقال نوبت #{ticket.queueNumber}</h3>
            <p className="text-[11px] text-white/40 mt-0.5">صف کنونی: {ticket.queueName || DEFAULT_QUEUE_NAME}</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white p-1 rounded-lg hover:bg-white/10">✕</button>
        </div>

        <div className="space-y-2 mb-5">
          <label className="text-xs font-bold text-white/70">انتخاب صف مقصد:</label>
          <div className="grid gap-1.5">
            {QUEUE_OPTIONS.filter(q => q !== (ticket.queueName || DEFAULT_QUEUE_NAME)).map(q => (
              <button
                key={q}
                onClick={() => setTarget(q)}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-bold text-right transition-all cursor-pointer border"
                style={{
                  background: target === q ? 'rgba(201,162,39,0.2)' : 'rgba(255,255,255,0.03)',
                  borderColor: target === q ? 'rgba(201,162,39,0.45)' : 'rgba(255,255,255,0.08)',
                  color: target === q ? '#fef08a' : 'rgba(255,255,255,0.7)',
                }}
              >
                <Building2 size={14} />
                {q}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl border border-white/10 text-white/70 font-bold text-xs hover:bg-white/5 cursor-pointer"
          >
            انصراف
          </button>
          <button
            onClick={() => onConfirm(target)}
            className="flex-1 py-2 rounded-xl bg-gold text-[#0f1e37] font-black text-xs hover:brightness-110 cursor-pointer"
          >
            تأیید انتقال
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function QMSScreen() {
  const [tickets, setTickets] = useState<QMSTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeQueue, setActiveQueue] = useState<string>(DEFAULT_QUEUE_NAME);
  const [showAllQueues, setShowAllQueues] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'active' | 'completed' | 'all'>('active');
  const [transferTicket, setTransferTicket] = useState<QMSTicket | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [filesMap, setFilesMap] = useState<FilesMap>({});
  const [loadingFilesMap, setLoadingFilesMap] = useState<LoadingFilesMap>({});
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchQueueData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/qms/manage');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setTickets(data.requests || []);
        }
      }
    } catch (err) {
      console.error('Failed to load QMS queue:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueueData();
    intervalRef.current = setInterval(() => fetchQueueData(true), 10000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchQueueData]);

  const handleLoadFiles = useCallback(async (ticket: QMSTicket) => {
    if (filesMap[ticket.id] !== undefined) return;
    setLoadingFilesMap(prev => ({ ...prev, [ticket.id]: true }));
    try {
      const encoded = encodeURIComponent(ticket.phone);
      const res = await fetch(`/api/qms/manage?phone=${encoded}`);
      if (res.ok) {
        const data = await res.json();
        const allFiles: UploadedFile[] = [];
        for (const req of (data.requests || [])) {
          if (req.files && req.files.length > 0) {
            allFiles.push(...req.files);
          }
        }
        setFilesMap(prev => ({ ...prev, [ticket.id]: allFiles }));
      }
    } catch (err) {
      console.error('Error loading files:', err);
      setFilesMap(prev => ({ ...prev, [ticket.id]: [] }));
    } finally {
      setLoadingFilesMap(prev => ({ ...prev, [ticket.id]: false }));
    }
  }, [filesMap]);

  const handleStatusChange = useCallback(async (id: string, status: QMSTicket['queueStatus']) => {
    try {
      const res = await fetch('/api/qms/manage', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, queueStatus: status }),
      });
      if (res.ok) {
        setTickets(prev => prev.map(t => t.id === id ? { ...t, queueStatus: status } : t));
      } else {
        showToast('خطا در تغییر وضعیت', 'error');
      }
    } catch {
      showToast('خطا در اتصال به سرور', 'error');
    }
  }, [showToast]);

  const handleCallNext = useCallback(async () => {
    const pool = showAllQueues
      ? tickets
      : tickets.filter(t => (t.queueName || DEFAULT_QUEUE_NAME) === activeQueue);

    const waiting = pool.filter(t => (t.queueStatus || 'waiting') === 'waiting')
      .sort((a, b) => (a.queueNumber ?? 999) - (b.queueNumber ?? 999));

    if (waiting.length === 0) {
      showToast('هیچ نوبت منتظری در این صف وجود ندارد', 'info');
      return;
    }
    const next = waiting[0];
    await handleStatusChange(next.id, 'calling');
    showToast(`📢 نوبت #${next.queueNumber} فراخوانده شد`, 'success');
  }, [tickets, activeQueue, showAllQueues, handleStatusChange, showToast]);

  const handleTransferConfirm = useCallback(async (targetQueue: string) => {
    if (!transferTicket) return;
    try {
      const res = await fetch('/api/qms/manage', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: transferTicket.id, queueName: targetQueue, queueStatus: 'waiting' }),
      });
      if (res.ok) {
        setTickets(prev => prev.map(t =>
          t.id === transferTicket.id ? { ...t, queueName: targetQueue, queueStatus: 'waiting' } : t
        ));
        showToast(`نوبت #${transferTicket.queueNumber} به «${targetQueue}» منتقل شد`, 'success');
      } else {
        showToast('خطا در انتقال', 'error');
      }
    } catch {
      showToast('خطا در اتصال', 'error');
    } finally {
      setTransferTicket(null);
    }
  }, [transferTicket, showToast]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('آیا از حذف این نوبت اطمینان دارید؟')) return;
    try {
      const res = await fetch(`/api/requests?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTickets(prev => prev.filter(t => t.id !== id));
        showToast('نوبت حذف شد', 'info');
      } else {
        showToast('خطا در حذف', 'error');
      }
    } catch {
      showToast('خطا در اتصال', 'error');
    }
  }, [showToast]);

  const baseTickets = showAllQueues
    ? tickets
    : tickets.filter(t => (t.queueName || DEFAULT_QUEUE_NAME) === activeQueue);

  const displayedTickets = baseTickets.filter(t => {
    const s = t.queueStatus || 'waiting';
    if (statusFilter === 'active') return s === 'waiting' || s === 'calling' || s === 'in_progress';
    if (statusFilter === 'completed') return s === 'completed' || s === 'absent';
    return true;
  });

  const sortedTickets = [...displayedTickets].sort((a, b) => {
    const order = { calling: 0, in_progress: 1, waiting: 2, completed: 3, absent: 4 };
    const ao = order[a.queueStatus || 'waiting'] ?? 5;
    const bo = order[b.queueStatus || 'waiting'] ?? 5;
    if (ao !== bo) return ao - bo;
    return (a.queueNumber ?? 999) - (b.queueNumber ?? 999);
  });

  const totalWaiting    = tickets.filter(t => (t.queueStatus || 'waiting') === 'waiting').length;
  const totalCalling    = tickets.filter(t => t.queueStatus === 'calling' || t.queueStatus === 'in_progress').length;
  const totalCompleted  = tickets.filter(t => t.queueStatus === 'completed').length;
  const totalToday      = tickets.length;

  const queueWaitCount = (q: string) =>
    tickets.filter(t => (t.queueName || DEFAULT_QUEUE_NAME) === q && (t.queueStatus || 'waiting') === 'waiting').length;

  return (
    <div className="space-y-4 animate-fadeIn text-white" dir="rtl">
      {/* ── STATS BAR (Dark Navy Theme) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'در انتظار', value: totalWaiting, color: '#fbbf24', bg: 'rgba(251,191,36,0.15)', icon: Clock },
          { label: 'در حال خدمت', value: totalCalling, color: '#34d399', bg: 'rgba(52,211,153,0.15)', icon: Volume2 },
          { label: 'تکمیل‌شده امروز', value: totalCompleted, color: '#60a5fa', bg: 'rgba(96,165,250,0.15)', icon: CheckCircle2 },
          { label: 'کل نوبت‌ها', value: totalToday, color: '#cbd5e1', bg: 'rgba(255,255,255,0.08)', icon: Hash },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div
            key={label}
            className="rounded-2xl p-4 border border-white/10 bg-[#0b172a] shadow-lg flex items-center justify-between"
          >
            <div>
              <p className="text-[11px] font-bold text-white/50 mb-0.5">{label}</p>
              <p className="text-2xl font-black text-white">{value}</p>
            </div>
            <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: bg }}>
              <Icon size={20} style={{ color }} />
            </div>
          </div>
        ))}
      </div>

      {/* ── CALL NEXT BANNER (Dark Navy) ── */}
      <div className="bg-[#0b172a] p-4 rounded-2xl border border-white/10 shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base font-black text-white">فراخوانی نوبت بعدی</h2>
          <p className="text-[11px] text-white/50 mt-0.5">
            صف انتخاب‌شده: <span className="font-bold text-gold">{showAllQueues ? 'همه صف‌ها' : activeQueue}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchQueueData()}
            className="p-2.5 rounded-xl border border-white/10 bg-[#0f1e37] text-white/70 hover:text-white transition-all cursor-pointer"
            title="به‌روزرسانی"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={handleCallNext}
            className="px-5 py-2.5 rounded-xl font-black text-xs bg-gold text-[#0f1e37] hover:brightness-110 transition-all active:scale-97 cursor-pointer flex items-center justify-center gap-2 shadow-md"
          >
            <Volume2 size={16} />
            <span>فراخوانی نوبت بعدی</span>
          </button>
        </div>
      </div>

      {/* ── TOAST ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            className="p-3 rounded-xl text-center text-xs font-bold shadow-md"
            style={{
              background: toast.type === 'error' ? 'rgba(239,68,68,0.2)' : toast.type === 'info' ? 'rgba(59,130,246,0.2)' : 'rgba(201,162,39,0.2)',
              color: toast.type === 'error' ? '#fca5a5' : toast.type === 'info' ? '#93c5fd' : '#fef08a',
              border: `1px solid ${toast.type === 'error' ? 'rgba(239,68,68,0.4)' : toast.type === 'info' ? 'rgba(59,130,246,0.4)' : 'rgba(201,162,39,0.4)'}`,
            }}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── QUEUE TABS & FILTERS ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-white/10">
        {/* Queue selector tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setShowAllQueues(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 border"
            style={{
              background: showAllQueues ? '#c9a227' : 'rgba(255,255,255,0.03)',
              color: showAllQueues ? '#0f1e37' : 'rgba(255,255,255,0.6)',
              borderColor: showAllQueues ? '#c9a227' : 'rgba(255,255,255,0.1)',
            }}
          >
            <LayoutGrid size={12} />
            همه صف‌ها
            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-black/30 text-white">
              {totalWaiting}
            </span>
          </button>

          <div className="h-4 w-px shrink-0 bg-white/10" />

          {QUEUE_OPTIONS.map(q => {
            const isActive = !showAllQueues && activeQueue === q;
            const count = queueWaitCount(q);
            return (
              <button
                key={q}
                onClick={() => { setActiveQueue(q); setShowAllQueues(false); }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 border"
                style={{
                  background: isActive ? '#c9a227' : 'rgba(255,255,255,0.03)',
                  color: isActive ? '#0f1e37' : 'rgba(255,255,255,0.6)',
                  borderColor: isActive ? '#c9a227' : 'rgba(255,255,255,0.1)',
                }}
              >
                {q}
                {count > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Status filters */}
        <div className="flex items-center gap-1 shrink-0">
          {(['active', 'completed', 'all'] as const).map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border"
              style={{
                background: statusFilter === f ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: statusFilter === f ? 'white' : 'rgba(255,255,255,0.4)',
                borderColor: statusFilter === f ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)',
              }}
            >
              {f === 'active' ? 'فعال' : f === 'completed' ? 'تکمیل شده' : 'همه'}
            </button>
          ))}
        </div>
      </div>

      {/* ── TICKETS GRID ── */}
      {loading && tickets.length === 0 ? (
        <div className="flex items-center justify-center py-16 gap-2 text-white/40">
          <Loader2 size={24} className="animate-spin text-gold" />
          <span className="text-xs font-bold">درحال دریافت لیست نوبت‌ها...</span>
        </div>
      ) : sortedTickets.length > 0 ? (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <AnimatePresence mode="popLayout">
            {sortedTickets.map(ticket => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onStatusChange={handleStatusChange}
                onTransfer={setTransferTicket}
                onDelete={handleDelete}
                filesMap={filesMap}
                loadingFilesMap={loadingFilesMap}
                onLoadFiles={handleLoadFiles}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-white/10 bg-[#0b172a] shadow-xl">
          <div className="flex flex-col items-center gap-1.5 text-white/40">
            <CheckCircle2 size={32} className="text-white/20" />
            <span className="font-bold text-xs">هیچ نوبتی در این بخش وجود ندارد.</span>
          </div>
        </div>
      )}

      {/* ── TRANSFER MODAL ── */}
      <AnimatePresence>
        {transferTicket && (
          <TransferModal
            ticket={transferTicket}
            onClose={() => setTransferTicket(null)}
            onConfirm={handleTransferConfirm}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
