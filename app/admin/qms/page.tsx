'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Volume2, CheckCircle2, Clock,
  RefreshCw, ArrowRightLeft, MessageSquare, Trash2,
  Phone, Paperclip, Download, ChevronDown, ChevronUp,
  LayoutGrid, Loader2, UserX, Sparkles, Timer, Hash,
  Building2, Briefcase, Mail, ExternalLink, LogOut, Menu, X
} from 'lucide-react';
import Link from 'next/link';

// ─── Types ───────────────────────────────────────────────────────────────────

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

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_QUEUE_NAME = 'جناب اماره';

const QUEUE_OPTIONS = [
  'جناب اماره',
  'باجه ۱ - ثبت شرکت',
  'باجه ۲ - خدمات بانکی و ایجاری',
  'باجه ۳ - پیگیری لایسنس و ویزا',
  'باجه ویژه VIP',
];

const STATUS_CONFIG = {
  waiting:     { label: 'در انتظار',         color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.20)', glow: 'none' },
  calling:     { label: 'فراخوانی',          color: '#c9a227', bg: 'rgba(201,162,39,0.15)',  border: 'rgba(201,162,39,0.50)',  glow: '0 0 16px rgba(201,162,39,0.3)' },
  in_progress: { label: 'در حال خدمت',       color: '#34d399', bg: 'rgba(52,211,153,0.10)',  border: 'rgba(52,211,153,0.35)',  glow: '0 0 14px rgba(52,211,153,0.2)' },
  completed:   { label: 'تکمیل شد',          color: '#60a5fa', bg: 'rgba(96,165,250,0.06)',  border: 'rgba(96,165,250,0.18)',  glow: 'none' },
  absent:      { label: 'غایب',               color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.25)', glow: 'none' },
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Sub-components ───────────────────────────────────────────────────────────

function WaitTimer({ createdAt, status }: { createdAt: string; status: string }) {
  const mins = useWaitMinutes(createdAt);
  if (status === 'completed' || status === 'absent') return null;
  return (
    <span className="flex items-center gap-1 text-[10px] font-bold" style={{ color: mins > 30 ? '#f87171' : mins > 15 ? '#fbbf24' : '#94a3b8' }}>
      <Timer size={11} />
      {mins} د
    </span>
  );
}

function FileRow({ file }: { file: UploadedFile }) {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
  const isPdf = ext === 'pdf';

  return (
    <div className="flex items-center justify-between gap-3 py-2 px-3 rounded-xl hover:bg-white/5 transition-all group">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="text-base shrink-0">
          {isImage ? '🖼️' : isPdf ? '📄' : '📎'}
        </span>
        <div className="min-w-0">
          <p className="text-xs font-bold text-white/80 truncate max-w-[180px]">{file.name}</p>
          <p className="text-[10px] text-white/30">{formatFileSize(file.size)}</p>
        </div>
      </div>
      {file.url && (
        <a
          href={file.url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gold/15 text-gold border border-gold/30 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-all hover:bg-gold/25"
        >
          <Download size={11} />
          دانلود
        </a>
      )}
    </div>
  );
}

// ─── Ticket Card ─────────────────────────────────────────────────────────────

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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="rounded-2xl flex flex-col relative overflow-hidden transition-all duration-300"
      style={{
        background: statusCfg.bg,
        border: `1.5px solid ${statusCfg.border}`,
        boxShadow: statusCfg.glow,
        opacity: isActive ? 1 : 0.65,
      }}
    >
      {/* Calling pulse ring */}
      {ticket.queueStatus === 'calling' && (
        <div className="absolute inset-0 rounded-2xl animate-ping opacity-10 pointer-events-none" style={{ background: 'rgba(201,162,39,0.5)' }} />
      )}

      {/* ── Card Header ── */}
      <div className="p-4 pb-2.5">
        <div className="flex items-start justify-between gap-3 mb-2.5">
          {/* Queue number badge */}
          <div
            className="flex flex-col items-center justify-center w-14 h-14 rounded-xl shrink-0 font-black"
            style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${statusCfg.border}` }}
          >
            <span className="text-[8px] font-extrabold leading-none mb-0.5" style={{ color: statusCfg.color, opacity: 0.7 }}>نوبت</span>
            <span className="text-2xl leading-none" style={{ color: statusCfg.color }}>
              {ticket.queueNumber ?? '—'}
            </span>
          </div>

          {/* Phone + times */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-white font-black text-xs tracking-wide" dir="ltr">{ticket.phone}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] text-white/35 flex items-center gap-1">
                <Clock size={10} />
                {formatTime(ticket.createdAt)}
              </span>
              <WaitTimer createdAt={ticket.createdAt} status={ticket.queueStatus} />
            </div>
          </div>

          {/* Status badge */}
          <span
            className="shrink-0 px-2.5 py-1 rounded-full text-[10px] font-black border"
            style={{ color: statusCfg.color, background: 'rgba(0,0,0,0.25)', borderColor: statusCfg.border }}
          >
            {statusCfg.label}
          </span>
        </div>

        {/* Service + Queue */}
        <div className="space-y-1 pt-2 border-t border-white/8">
          <div className="flex justify-between items-center text-xs">
            <span className="text-white/40">خدمت:</span>
            <span className="text-white/85 font-bold truncate max-w-[160px] text-left" dir="ltr">{ticket.serviceTitle}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-white/40">صف:</span>
            <span className="font-bold text-[11px]" style={{ color: statusCfg.color }}>{ticket.queueName || DEFAULT_QUEUE_NAME}</span>
          </div>
        </div>
      </div>

      {/* ── Action Buttons ── */}
      {isActive && (
        <div className="px-4 pb-2.5 grid grid-cols-3 gap-1.5">
          <button
            onClick={() => onStatusChange(ticket.id, 'calling')}
            disabled={ticket.queueStatus === 'calling'}
            className="py-1.5 rounded-xl text-[10px] font-black transition-all cursor-pointer disabled:opacity-40"
            style={{ background: 'rgba(201,162,39,0.18)', color: '#c9a227', border: '1px solid rgba(201,162,39,0.35)' }}
          >
            فراخوانی
          </button>
          <button
            onClick={() => onStatusChange(ticket.id, 'in_progress')}
            disabled={ticket.queueStatus === 'in_progress'}
            className="py-1.5 rounded-xl text-[10px] font-black transition-all cursor-pointer disabled:opacity-40"
            style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.30)' }}
          >
            شروع
          </button>
          <button
            onClick={() => onStatusChange(ticket.id, 'completed')}
            className="py-1.5 rounded-xl text-[10px] font-black transition-all cursor-pointer"
            style={{ background: 'rgba(96,165,250,0.12)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.25)' }}
          >
            تکمیل
          </button>
        </div>
      )}

      {/* ── Secondary Actions ── */}
      <div
        className="flex items-center justify-between gap-2 px-4 pb-3 pt-1 border-t border-white/8"
      >
        <div className="flex items-center gap-1.5">
          {/* WhatsApp */}
          <a
            href={`https://wa.me/${cleanPhone}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg transition-all hover:scale-105"
            style={{ background: 'rgba(37,211,102,0.12)', color: '#25D366', border: '1px solid rgba(37,211,102,0.25)' }}
            title="واتساپ"
          >
            <MessageSquare size={13} />
          </a>

          {/* Phone */}
          <a
            href={`tel:${cleanPhone}`}
            className="p-1.5 rounded-lg transition-all hover:scale-105"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.12)' }}
            title="تماس"
          >
            <Phone size={13} />
          </a>

          {/* Transfer */}
          <button
            onClick={() => onTransfer(ticket)}
            className="p-1.5 rounded-lg transition-all hover:scale-105 cursor-pointer flex items-center gap-1 text-[10px] font-bold px-2"
            style={{ background: 'rgba(129,140,248,0.12)', color: '#818cf8', border: '1px solid rgba(129,140,248,0.25)' }}
            title="انتقال صف"
          >
            <ArrowRightLeft size={12} />
            <span>انتقال</span>
          </button>

          {/* Absent */}
          {isActive && (
            <button
              onClick={() => onStatusChange(ticket.id, 'absent')}
              className="p-1.5 rounded-lg transition-all hover:scale-105 cursor-pointer"
              style={{ background: 'rgba(248,113,113,0.10)', color: '#f87171', border: '1px solid rgba(248,113,113,0.22)' }}
              title="غایب"
            >
              <UserX size={13} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Documents toggle */}
          <button
            onClick={handleExpand}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
            style={{
              background: expanded ? 'rgba(201,162,39,0.18)' : 'rgba(255,255,255,0.06)',
              color: expanded ? '#c9a227' : 'rgba(255,255,255,0.5)',
              border: `1px solid ${expanded ? 'rgba(201,162,39,0.35)' : 'rgba(255,255,255,0.10)'}`,
            }}
          >
            <Paperclip size={11} />
            <span>مدارک</span>
            {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>

          {/* Delete */}
          <button
            onClick={() => onDelete(ticket.id)}
            className="p-1.5 rounded-lg transition-all hover:scale-105 cursor-pointer"
            style={{ background: 'rgba(248,113,113,0.08)', color: '#f87171', border: '1px solid rgba(248,113,113,0.18)' }}
            title="حذف"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* ── Documents Panel ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div
              className="mx-3 mb-3 rounded-xl p-2.5"
              style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <p className="text-[10px] font-black text-white/40 mb-1.5 px-1">
                📎 مدارک آپلودی — {ticket.phone}
              </p>

              {loadingFiles ? (
                <div className="flex items-center justify-center py-3 gap-2 text-white/30 text-xs">
                  <Loader2 size={13} className="animate-spin" />
                  <span>در حال بارگذاری...</span>
                </div>
              ) : files && files.length > 0 ? (
                <div className="space-y-0.5">
                  {files.map((f, i) => <FileRow key={i} file={f} />)}
                </div>
              ) : (
                <div className="text-center py-3 text-white/25 text-xs">
                  هیچ مدرکی یافت نشد
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Transfer Modal ───────────────────────────────────────────────────────────

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
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
      />
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="relative z-10 w-full max-w-md rounded-2xl p-5 shadow-2xl"
        style={{ background: 'linear-gradient(160deg,#0d1b30,#081324)', border: '1px solid rgba(255,255,255,0.12)' }}
        dir="rtl"
      >
        <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
          <div>
            <h3 className="text-sm font-black text-white">انتقال نوبت #{ticket.queueNumber}</h3>
            <p className="text-[11px] text-white/40 mt-0.5">صف فعلی: {ticket.queueName || DEFAULT_QUEUE_NAME}</p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer">✕</button>
        </div>

        <div className="space-y-2 mb-5">
          <label className="text-xs font-black text-white/60">صف مقصد:</label>
          <div className="grid gap-2">
            {QUEUE_OPTIONS.filter(q => q !== (ticket.queueName || DEFAULT_QUEUE_NAME)).map(q => (
              <button
                key={q}
                onClick={() => setTarget(q)}
                className="flex items-center gap-2.5 w-full px-3.5 py-2.5 rounded-xl text-xs font-bold text-right transition-all cursor-pointer"
                style={{
                  background: target === q ? 'rgba(201,162,39,0.18)' : 'rgba(255,255,255,0.04)',
                  border: `1.5px solid ${target === q ? 'rgba(201,162,39,0.5)' : 'rgba(255,255,255,0.08)'}`,
                  color: target === q ? '#c9a227' : 'rgba(255,255,255,0.6)',
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
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/60 font-bold text-xs hover:bg-white/5 cursor-pointer"
          >
            انصراف
          </button>
          <button
            onClick={() => onConfirm(target)}
            className="flex-1 py-2.5 rounded-xl font-black text-xs cursor-pointer"
            style={{ background: 'linear-gradient(135deg,#c9a227,#e4bc3c)', color: '#0f1e37' }}
          >
            تأیید انتقال
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminQMSPage() {
  const [tickets, setTickets] = useState<QMSTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeQueue, setActiveQueue] = useState<string>(DEFAULT_QUEUE_NAME);
  const [showAllQueues, setShowAllQueues] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'active' | 'completed' | 'all'>('active');
  const [transferTicket, setTransferTicket] = useState<QMSTicket | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [filesMap, setFilesMap] = useState<FilesMap>({});
  const [loadingFilesMap, setLoadingFilesMap] = useState<LoadingFilesMap>({});
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // ── Toast helper ──
  const showToast = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // ── Fetch queue data ──
  const fetchQueueData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/qms/manage');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setTickets(data.requests || []);
        }
      } else if (res.status === 401) {
        window.location.href = '/admin';
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

  // ── Load files for a ticket by phone ──
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

  // ── Update status ──
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

  // ── Call next ──
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

  // ── Transfer ──
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

  // ── Delete ──
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

  // ── Filtered tickets ──
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

  // ── Stats ──
  const totalWaiting    = tickets.filter(t => (t.queueStatus || 'waiting') === 'waiting').length;
  const totalCalling    = tickets.filter(t => t.queueStatus === 'calling' || t.queueStatus === 'in_progress').length;
  const totalCompleted  = tickets.filter(t => t.queueStatus === 'completed').length;
  const totalToday      = tickets.length;

  const queueWaitCount = (q: string) =>
    tickets.filter(t => (t.queueName || DEFAULT_QUEUE_NAME) === q && (t.queueStatus || 'waiting') === 'waiting').length;

  // ── Sidebar Component ──
  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#07111f] border-l border-white/10 text-white text-right select-none" dir="rtl">
      <div className="p-5 border-b border-white/10 flex flex-col items-center">
        <h2 className="text-base font-extrabold text-gold leading-none">ابوآرسام</h2>
        <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-1.5">پنل مدیریت ادمین</span>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1.5">
        <Link
          href="/admin"
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-white/70 hover:bg-white/5 hover:text-white transition-all"
        >
          <Briefcase className="h-4 w-4 shrink-0" />
          مدیریت خدمات
        </Link>

        <Link
          href="/admin"
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-white/70 hover:bg-white/5 hover:text-white transition-all"
        >
          <span className="flex items-center gap-3">
            <Mail className="h-4 w-4 shrink-0" />
            درخواست‌های ارسالی
          </span>
        </Link>

        <Link
          href="/admin/qms"
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-gold bg-gold/15 border border-gold/30 shadow-md shadow-gold/10"
        >
          <Users className="h-4 w-4 shrink-0 text-gold" />
          <span>مدیریت صف QMS</span>
        </Link>
      </nav>

      <div className="p-3 border-t border-white/10 space-y-1.5">
        <Link
          href="/qms"
          target="_blank"
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-all"
        >
          <Sparkles className="h-4 w-4 shrink-0" />
          مشاهده کیوسک
        </Link>
        <Link
          href="/"
          target="_blank"
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-white/60 hover:bg-white/5 hover:text-white transition-all"
        >
          <ExternalLink className="h-4 w-4 shrink-0" />
          لندینگ پیج
        </Link>
        <button
          onClick={async () => {
            await fetch('/api/auth', { method: 'DELETE' });
            window.location.href = '/admin';
          }}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all cursor-pointer"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          خروج از حساب
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#07111f] text-white font-sans selection:bg-gold selection:text-navy" dir="rtl">
      <div className="flex min-h-screen relative">
        
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden md:block w-64 fixed top-0 bottom-0 right-0 z-40">
          <SidebarContent />
        </aside>

        {/* MOBILE SLIDING DRAWER */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
              />
              <motion.aside
                initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 right-0 bottom-0 z-50 w-64 shadow-2xl md:hidden"
              >
                <SidebarContent />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* MAIN AREA */}
        <div className="flex-1 md:mr-64 min-h-screen flex flex-col w-full">
          
          {/* HEADER BAR */}
          <header className="sticky top-0 z-30 border-b border-white/10 bg-[#07111f]/90 backdrop-blur-xl px-4 sm:px-6 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-2 rounded-xl border border-white/10 bg-white/5 text-white cursor-pointer"
              >
                <Menu size={18} />
              </button>
              <div>
                <h1 className="text-base font-black text-white">مدیریت صف نوبت‌دهی (QMS)</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchQueueData()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/5 border border-white/10 text-white/70 hover:text-white transition-all cursor-pointer"
              >
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                <span>به‌روزرسانی</span>
              </button>
            </div>
          </header>

          {/* MAIN CONTENT */}
          <main className="flex-1 p-4 sm:p-6 space-y-5 max-w-7xl w-full mx-auto">

            {/* ── STATS BAR ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'در انتظار', value: totalWaiting, color: '#fbbf24', icon: Clock },
                { label: 'در حال خدمت', value: totalCalling, color: '#c9a227', icon: Volume2 },
                { label: 'تکمیل‌شده امروز', value: totalCompleted, color: '#34d399', icon: CheckCircle2 },
                { label: 'کل نوبت‌ها', value: totalToday, color: '#60a5fa', icon: Hash },
              ].map(({ label, value, color, icon: Icon }) => (
                <div
                  key={label}
                  className="rounded-2xl p-3.5 flex items-center justify-between"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <div>
                    <p className="text-[10px] font-bold text-white/40 mb-0.5">{label}</p>
                    <p className="text-2xl font-black" style={{ color }}>{value}</p>
                  </div>
                  <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                    <Icon size={18} style={{ color }} />
                  </div>
                </div>
              ))}
            </div>

            {/* ── CALL NEXT BAR ── */}
            <div
              className="rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              style={{ background: 'linear-gradient(135deg, rgba(201,162,39,0.12) 0%, rgba(13,27,48,0.8) 100%)', border: '1px solid rgba(201,162,39,0.25)' }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gold/20 border border-gold/40 text-gold shrink-0">
                  <Volume2 size={20} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-white">فراخوانی نوبت بعدی</h2>
                  <p className="text-[10px] text-white/40 mt-0.5">صف انتخاب شده: <span className="text-gold font-bold">{showAllQueues ? 'همه صف‌ها' : activeQueue}</span></p>
                </div>
              </div>

              <button
                onClick={handleCallNext}
                className="px-6 py-3 rounded-xl font-black text-xs transition-all active:scale-97 cursor-pointer shrink-0 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg,#c9a227,#e4bc3c)', color: '#0f1e37', boxShadow: '0 4px 18px rgba(201,162,39,0.3)' }}
              >
                <span>📢 فراخوانی نوبت بعدی</span>
              </button>
            </div>

            {/* ── TOAST ── */}
            <AnimatePresence>
              {toast && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                  className="p-3 rounded-xl text-center text-xs font-bold"
                  style={{
                    background: toast.type === 'error' ? 'rgba(248,113,113,0.15)' : toast.type === 'info' ? 'rgba(96,165,250,0.15)' : 'rgba(201,162,39,0.18)',
                    border: `1px solid ${toast.type === 'error' ? 'rgba(248,113,113,0.35)' : toast.type === 'info' ? 'rgba(96,165,250,0.30)' : 'rgba(201,162,39,0.40)'}`,
                    color: toast.type === 'error' ? '#f87171' : toast.type === 'info' ? '#60a5fa' : '#c9a227',
                  }}
                >
                  {toast.msg}
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── QUEUE TABS & FILTERS ── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-white/8">
              {/* Queues Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={() => setShowAllQueues(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0"
                  style={{
                    background: showAllQueues ? '#c9a227' : 'rgba(255,255,255,0.04)',
                    color: showAllQueues ? '#0f1e37' : 'rgba(255,255,255,0.6)',
                    border: showAllQueues ? 'none' : '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <LayoutGrid size={12} />
                  همه صف‌ها
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black" style={{ background: showAllQueues ? 'rgba(15,30,55,0.3)' : 'rgba(201,162,39,0.18)', color: showAllQueues ? '#0f1e37' : '#c9a227' }}>
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
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0"
                      style={{
                        background: isActive ? '#c9a227' : 'rgba(255,255,255,0.04)',
                        color: isActive ? '#0f1e37' : 'rgba(255,255,255,0.6)',
                        border: isActive ? 'none' : '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      {q}
                      {count > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black" style={{ background: isActive ? 'rgba(15,30,55,0.3)' : 'rgba(201,162,39,0.18)', color: isActive ? '#0f1e37' : '#c9a227' }}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Status Filters */}
              <div className="flex items-center gap-1.5 shrink-0">
                {(['active', 'completed', 'all'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                    style={{
                      background: statusFilter === f ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
                      color: statusFilter === f ? 'white' : 'rgba(255,255,255,0.4)',
                      border: `1px solid ${statusFilter === f ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)'}`,
                    }}
                  >
                    {f === 'active' ? 'فعال' : f === 'completed' ? 'تکمیل شده' : 'همه'}
                  </button>
                ))}
              </div>
            </div>

            {/* ── TICKETS GRID ── */}
            {loading && tickets.length === 0 ? (
              <div className="flex items-center justify-center py-16 gap-2 text-white/30">
                <Loader2 size={24} className="animate-spin" />
                <span className="text-xs font-bold">درحال دریافت لیست صف...</span>
              </div>
            ) : sortedTickets.length > 0 ? (
              <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
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
              <div
                className="rounded-2xl p-12 text-center space-y-2"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <CheckCircle2 size={40} className="mx-auto text-white/20" />
                <h3 className="text-sm font-bold text-white/50">هیچ نوبتی در این بخش وجود ندارد</h3>
              </div>
            )}

          </main>
        </div>
      </div>

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
