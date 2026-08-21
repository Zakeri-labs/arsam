'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Volume2, PhoneCall, CheckCircle2, Clock, XCircle, AlertCircle,
  RefreshCw, ArrowRightLeft, MessageSquare, Trash2, ArrowRight, UserCheck,
  Building2, Sparkles, Filter, ChevronLeft, ShieldCheck, Phone
} from 'lucide-react';
import Link from 'next/link';

export interface QMSTicket {
  id: string;
  name: string;
  phone: string;
  description: string;
  serviceTitle: string;
  createdAt: string;
  queueNumber: number;
  source: string;
  queueName: string; // Defaults to 'جناب اماره'
  queueStatus: 'waiting' | 'calling' | 'in_progress' | 'completed' | 'absent';
}

const DEFAULT_QUEUE_NAME = 'جناب اماره';

const QUEUE_OPTIONS = [
  'جناب اماره',
  'باجه ۱ - ثبت شرکت',
  'باجه ۲ - خدمات بانکی و ایجاری',
  'باجه ۳ - پیگیری لایسنس و ویزا',
  'باجه ویژه VIP',
];

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  waiting:     { label: 'در انتظار',       bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/30' },
  calling:     { label: 'در حال فراخوانی', bg: 'bg-gold/20 animate-pulse', text: 'text-gold', border: 'border-gold/50' },
  in_progress: { label: 'در حال ارائه خدمت', bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  completed:   { label: 'تکمیل شد',       bg: 'bg-slate-500/15',   text: 'text-slate-400',   border: 'border-slate-500/30' },
  absent:      { label: 'غایب / انصراف',  bg: 'bg-red-500/15',     text: 'text-red-400',     border: 'border-red-500/30' },
};

export default function AdminQMSPage() {
  const [tickets, setTickets] = useState<QMSTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeQueue, setActiveQueue] = useState<string>(DEFAULT_QUEUE_NAME);
  const [statusFilter, setStatusFilter] = useState<string>('active'); // 'active' (waiting/calling/in_progress) | 'all' | 'completed'
  const [callingTicket, setCallingTicket] = useState<QMSTicket | null>(null);
  const [announcementMsg, setAnnouncementMsg] = useState<string | null>(null);
  const [selectedTicketForTransfer, setSelectedTicketForTransfer] = useState<QMSTicket | null>(null);
  const [targetTransferQueue, setTargetTransferQueue] = useState<string>('باجه ۱ - ثبت شرکت');

  // Fetch tickets
  const fetchQueueData = useCallback(async () => {
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
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueueData();
    // Auto-refresh queue every 5 seconds for real-time kiosk updates
    const interval = setInterval(fetchQueueData, 5000);
    return () => clearInterval(interval);
  }, [fetchQueueData]);

  // Filter tickets by selected Queue & Status
  const queueTickets = tickets.filter(t => (t.queueName || DEFAULT_QUEUE_NAME) === activeQueue);

  const displayedTickets = queueTickets.filter(t => {
    const status = t.queueStatus || 'waiting';
    if (statusFilter === 'active') return status === 'waiting' || status === 'calling' || status === 'in_progress';
    if (statusFilter === 'completed') return status === 'completed' || status === 'absent';
    return true; // 'all'
  });

  // Call Next Ticket in Queue
  const handleCallNext = async () => {
    const waitingTickets = queueTickets.filter(t => (t.queueStatus || 'waiting') === 'waiting');
    if (waitingTickets.length === 0) {
      setAnnouncementMsg('هیچ نوبت جدیدی در این صف منتظر نیست.');
      setTimeout(() => setAnnouncementMsg(null), 3000);
      return;
    }

    // Sort by created_at ascending (FIFO)
    const nextTicket = [...waitingTickets].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];
    
    await updateStatus(nextTicket.id, 'calling');
    setCallingTicket(nextTicket);
    setAnnouncementMsg(`📢 شماره نوبت ${nextTicket.queueNumber} به صف ${activeQueue} فراخوانده شد.`);
    setTimeout(() => setAnnouncementMsg(null), 5000);
  };

  // Update Status of a Ticket
  const updateStatus = async (id: string, newStatus: 'waiting' | 'calling' | 'in_progress' | 'completed' | 'absent') => {
    try {
      const res = await fetch('/api/qms/manage', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, queueStatus: newStatus }),
      });
      if (res.ok) {
        setTickets(prev => prev.map(t => t.id === id ? { ...t, queueStatus: newStatus } : t));
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  // Transfer Ticket to another Queue
  const handleTransfer = async () => {
    if (!selectedTicketForTransfer) return;
    try {
      const res = await fetch('/api/qms/manage', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedTicketForTransfer.id, queueName: targetTransferQueue, queueStatus: 'waiting' }),
      });
      if (res.ok) {
        setTickets(prev => prev.map(t => t.id === selectedTicketForTransfer.id ? { ...t, queueName: targetTransferQueue, queueStatus: 'waiting' } : t));
        setSelectedTicketForTransfer(null);
        setAnnouncementMsg(`نوبت #${selectedTicketForTransfer.queueNumber} به صف "${targetTransferQueue}" منتقل شد.`);
        setTimeout(() => setAnnouncementMsg(null), 4000);
      }
    } catch (err) {
      console.error('Error transferring ticket:', err);
    }
  };

  // Delete Request
  const handleDelete = async (id: string) => {
    if (!confirm('آیا از حذف این نوبت اطمینان دارید؟')) return;
    try {
      const res = await fetch(`/api/requests?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTickets(prev => prev.filter(t => t.id !== id));
      }
    } catch (err) {
      console.error('Error deleting ticket:', err);
    }
  };

  // Stats calculation
  const totalToday = tickets.length;
  const waitingInAmarah = tickets.filter(t => (t.queueName || DEFAULT_QUEUE_NAME) === DEFAULT_QUEUE_NAME && (t.queueStatus || 'waiting') === 'waiting').length;
  const currentlyAttending = tickets.filter(t => t.queueStatus === 'in_progress' || t.queueStatus === 'calling').length;
  const completedToday = tickets.filter(t => t.queueStatus === 'completed').length;

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-[#07111f] via-[#0f1e37] to-[#091526] text-white font-sans selection:bg-gold selection:text-navy"
      dir="rtl"
    >
      {/* Top Header */}
      <header className="border-b border-white/10 bg-navy/60 backdrop-blur-xl sticky top-0 z-30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="flex items-center justify-center h-10 w-10 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 hover:text-white transition-all cursor-pointer"
              title="بازگشت به پنل مدیریت"
            >
              <ChevronLeft size={20} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-white tracking-wide">مدیریت صف نوبت‌دهی (QMS)</h1>
                <span className="bg-gold/20 text-gold border border-gold/40 px-2.5 py-0.5 rounded-full text-[10px] font-black">
                  صف اصلی: {DEFAULT_QUEUE_NAME}
                </span>
              </div>
              <p className="text-xs text-white/50 mt-0.5">مدیریت پویای نوبت‌های ورودی، فراخوانی باجه و جابه‌جایی صف‌ها</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchQueueData}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/80 hover:text-white text-xs font-bold transition-all cursor-pointer"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>به‌روزرسانی صف</span>
            </button>
            <Link
              href="/qms"
              target="_blank"
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gold/15 border border-gold/30 text-gold hover:bg-gold/25 text-xs font-bold transition-all"
            >
              <span>مشاهده کیوسک</span>
              <Sparkles size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-3xl p-5 border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent backdrop-blur-md relative overflow-hidden">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-amber-300/80">صف اصلی (جناب اماره)</span>
                <h3 className="text-3xl font-black text-amber-400 mt-2">{waitingInAmarah} نفر</h3>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-black">
                <Users size={24} />
              </div>
            </div>
            <p className="text-[10px] text-white/40 mt-3">همه نوبت‌های کیوسک ابتدا وارد این صف می‌شوند</p>
          </div>

          <div className="rounded-3xl p-5 border border-gold/20 bg-gradient-to-br from-gold/10 to-transparent backdrop-blur-md relative overflow-hidden">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-gold/80">در حال فراخوانی / خدمت</span>
                <h3 className="text-3xl font-black text-gold mt-2">{currentlyAttending} نفر</h3>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-gold/20 text-gold border border-gold/30 flex items-center justify-center font-black">
                <Volume2 size={24} />
              </div>
            </div>
            <p className="text-[10px] text-white/40 mt-3">نوبت‌های در حال مراجعه به باجه‌ها</p>
          </div>

          <div className="rounded-3xl p-5 border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-transparent backdrop-blur-md relative overflow-hidden">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-emerald-400/80">تکمیل‌شده‌های امروز</span>
                <h3 className="text-3xl font-black text-emerald-400 mt-2">{completedToday} نفر</h3>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black">
                <CheckCircle2 size={24} />
              </div>
            </div>
            <p className="text-[10px] text-white/40 mt-3">مراجعینی که خدمت خود را دریافت کرده‌اند</p>
          </div>

          <div className="rounded-3xl p-5 border border-white/10 bg-white/5 backdrop-blur-md relative overflow-hidden">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-white/60">کل نوبت‌های امروز</span>
                <h3 className="text-3xl font-black text-white mt-2">{totalToday} نوبت</h3>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-white/10 text-white/80 border border-white/15 flex items-center justify-center font-black">
                <Clock size={24} />
              </div>
            </div>
            <p className="text-[10px] text-white/40 mt-3">آمار عمومی کلیه نوبت‌های صادر شده</p>
          </div>
        </div>

        {/* Call Next Banner (Main Action Hero) */}
        <div className="rounded-3xl p-6 border border-gold/30 bg-gradient-to-r from-gold/15 via-[#132747] to-[#0d1c33] shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/20 text-gold text-xs font-bold border border-gold/30">
              <ShieldCheck size={14} />
              <span>مدیریت صف اصلی: {DEFAULT_QUEUE_NAME}</span>
            </div>
            <h2 className="text-2xl font-black text-white">فراخوانی نوبت بعدی صف اصلی</h2>
            <p className="text-xs text-white/60">با کلیک روی دکمه زیر، اولین نوبت منتظر در صف «جناب اماره» فراخوانده می‌شود.</p>
          </div>

          <button
            onClick={handleCallNext}
            className="px-8 py-5 rounded-2xl font-black text-lg bg-gradient-to-r from-gold via-[#e4bc3c] to-gold text-[#0f1e37] shadow-xl shadow-gold/20 hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-3 cursor-pointer shrink-0"
          >
            <Volume2 size={24} />
            <span>📢 فراخوانی نوبت بعدی ({DEFAULT_QUEUE_NAME})</span>
          </button>
        </div>

        {/* Toast / Announcement alert */}
        <AnimatePresence>
          {announcementMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 rounded-2xl bg-gold/20 border border-gold/40 text-gold text-center text-sm font-bold shadow-lg"
            >
              {announcementMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Queue Selector Tabs & Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
          {/* Queues List */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            {QUEUE_OPTIONS.map(q => {
              const isSelected = activeQueue === q;
              const count = tickets.filter(t => (t.queueName || DEFAULT_QUEUE_NAME) === q && (t.queueStatus || 'waiting') === 'waiting').length;
              return (
                <button
                  key={q}
                  onClick={() => setActiveQueue(q)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-gold text-[#0f1e37] shadow-lg shadow-gold/15 font-black'
                      : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
                  }`}
                >
                  <span>{q}</span>
                  {count > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      isSelected ? 'bg-[#0f1e37] text-gold' : 'bg-gold/20 text-gold'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-white/40 font-bold flex items-center gap-1">
              <Filter size={14} /> فیلتر:
            </span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-navy border border-white/15 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-gold cursor-pointer"
            >
              <option value="active">در انتظار و فعال</option>
              <option value="completed">تکمیل شده و غایب</option>
              <option value="all">همه نوبت‌ها</option>
            </select>
          </div>
        </div>

        {/* Tickets Grid / List */}
        {displayedTickets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayedTickets.map(t => {
              const statusCfg = STATUS_CONFIG[t.queueStatus || 'waiting'] || STATUS_CONFIG.waiting;
              const cleanPhone = t.phone.replace(/[^0-9+]/g, '');
              const whatsappUrl = `https://wa.me/${cleanPhone}`;

              return (
                <motion.div
                  key={t.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`rounded-3xl p-6 border bg-white/5 backdrop-blur-xl relative overflow-hidden flex flex-col justify-between transition-all hover:bg-white/8 ${
                    t.queueStatus === 'calling'
                      ? 'border-gold shadow-xl shadow-gold/10'
                      : t.queueStatus === 'in_progress'
                      ? 'border-emerald-500/50'
                      : 'border-white/10'
                  }`}
                >
                  {/* Top Bar inside Card */}
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      {/* Ticket Number Badge */}
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center justify-center h-14 w-14 rounded-2xl bg-gold/15 border border-gold/40 text-gold">
                          <span className="text-[9px] font-extrabold leading-none text-gold/70">نوبت</span>
                          <span className="text-2xl font-black leading-none">{t.queueNumber}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-base">{t.phone}</span>
                          </div>
                          <span className="text-[10px] text-white/40 block mt-1">زمان ورود: {formatDate(t.createdAt)}</span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
                        {statusCfg.label}
                      </span>
                    </div>

                    {/* Service & Queue info */}
                    <div className="space-y-2 py-3 border-y border-white/8 my-3">
                      <div className="flex justify-between text-xs">
                        <span className="text-white/40">خدمت درخواستی:</span>
                        <span className="text-gold font-bold">{t.serviceTitle}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-white/40">صف مربوطه:</span>
                        <span className="text-white/80 font-bold">{t.queueName || DEFAULT_QUEUE_NAME}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="space-y-3 pt-2">
                    {/* Status change actions */}
                    <div className="grid grid-cols-3 gap-1.5 text-[10px] font-bold">
                      <button
                        onClick={() => updateStatus(t.id, 'calling')}
                        className="py-2 rounded-xl bg-gold/15 text-gold border border-gold/30 hover:bg-gold/25 transition-all cursor-pointer"
                      >
                        فراخوانی
                      </button>
                      <button
                        onClick={() => updateStatus(t.id, 'in_progress')}
                        className="py-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all cursor-pointer"
                      >
                        شروع خدمت
                      </button>
                      <button
                        onClick={() => updateStatus(t.id, 'completed')}
                        className="py-2 rounded-xl bg-slate-500/15 text-slate-300 border border-slate-500/30 hover:bg-slate-500/25 transition-all cursor-pointer"
                      >
                        پایان خدمت
                      </button>
                    </div>

                    {/* Secondary Actions: Transfer, Whatsapp, Call, Delete */}
                    <div className="flex items-center justify-between border-t border-white/8 pt-3">
                      <div className="flex items-center gap-2">
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl bg-[#25D366]/15 text-[#25D366] border border-[#25D366]/30 hover:bg-[#25D366]/25 transition-all"
                          title="ارسال پیام در واتساپ"
                        >
                          <MessageSquare size={14} />
                        </a>
                        <a
                          href={`tel:${cleanPhone}`}
                          className="p-2 rounded-xl bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:text-white transition-all"
                          title="تماس تلفنی"
                        >
                          <Phone size={14} />
                        </a>
                        <button
                          onClick={() => setSelectedTicketForTransfer(t)}
                          className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/25 transition-all cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                          title="انتقال به صف دیگر"
                        >
                          <ArrowRightLeft size={14} />
                          <span>انتقال صف</span>
                        </button>
                      </div>

                      <button
                        onClick={() => handleDelete(t.id)}
                        className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all cursor-pointer"
                        title="حذف نوبت"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl p-16 border border-white/10 bg-white/5 backdrop-blur-xl text-center space-y-3">
            <UserCheck size={48} className="mx-auto text-white/30" />
            <h3 className="text-lg font-bold text-white">هیچ نوبتی در این بخش وجود ندارد</h3>
            <p className="text-xs text-white/40">در حال حاضر مراجعی در این صف ثبت نشده است.</p>
          </div>
        )}
      </main>

      {/* Transfer Queue Modal */}
      <AnimatePresence>
        {selectedTicketForTransfer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTicketForTransfer(null)}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative z-10 w-full max-w-md bg-[#0d1b30] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-5"
            >
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-base font-black text-white">انتقال نوبت #{selectedTicketForTransfer.queueNumber}</h3>
                  <p className="text-xs text-white/50 mt-0.5">صف کنونی: {selectedTicketForTransfer.queueName || DEFAULT_QUEUE_NAME}</p>
                </div>
                <button
                  onClick={() => setSelectedTicketForTransfer(null)}
                  className="text-white/40 hover:text-white p-1 rounded-lg"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-white/80">انتخاب صف یا باجه مقصد:</label>
                <select
                  value={targetTransferQueue}
                  onChange={e => setTargetTransferQueue(e.target.value)}
                  className="w-full bg-navy border border-white/20 rounded-2xl p-3.5 text-xs text-white outline-none focus:border-gold cursor-pointer"
                >
                  {QUEUE_OPTIONS.map(q => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setSelectedTicketForTransfer(null)}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-white/70 hover:bg-white/10 text-xs font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  onClick={handleTransfer}
                  className="px-6 py-2.5 rounded-xl bg-gold text-navy font-black text-xs hover:brightness-105 shadow-md shadow-gold/20 cursor-pointer"
                >
                  تأیید انتقال نوبت
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
