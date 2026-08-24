'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Search, Phone, MessageSquare, Clock, Calendar,
  CheckCircle2, FileText, Download, ChevronDown, ChevronUp,
  Award, Sparkles, Filter, ShieldCheck, Loader2, ArrowUpRight, FolderOpen
} from 'lucide-react';

interface RequestFile {
  name: string;
  size: number;
  url?: string;
}

interface ServiceRequest {
  id: string;
  name: string;
  phone: string;
  description: string;
  serviceTitle: string;
  files: RequestFile[];
  createdAt: string;
  queueNumber?: number | null;
  source?: string;
  queueStatus?: string;
}

interface CustomerGroup {
  phone: string;
  name: string;
  firstSeen: string;
  lastSeen: string;
  totalRequests: number;
  openRequests: number;
  completedRequests: number;
  totalFiles: number;
  requests: ServiceRequest[];
  badge: { label: string; bg: string; text: string; border: string };
}

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch { return dateStr; }
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export default function CustomersScreen() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'requests' | 'name'>('recent');
  const [expandedPhone, setExpandedPhone] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch('/api/requests')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setRequests(data);
      })
      .catch(err => console.error('Failed to load requests for customers:', err))
      .finally(() => setLoading(false));
  }, []);

  // Group requests by unique phone number
  const customers = useMemo(() => {
    const map = new Map<string, ServiceRequest[]>();

    for (const req of requests) {
      const cleanPhone = req.phone.trim();
      if (!map.has(cleanPhone)) {
        map.set(cleanPhone, []);
      }
      map.get(cleanPhone)!.push(req);
    }

    const result: CustomerGroup[] = [];

    map.forEach((reqList, phone) => {
      // Sort requests by date ascending to find firstSeen and lastSeen
      const sorted = [...reqList].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      const firstSeen = sorted[0].createdAt;
      const lastSeen = sorted[sorted.length - 1].createdAt;

      // Pick best name (prefer non-phone name)
      let name = sorted.find(r => r.name && !r.name.includes('+') && r.name !== phone)?.name || sorted[0].name || phone;

      const totalRequests = sorted.length;
      const completedRequests = sorted.filter(r => r.queueStatus === 'completed').length;
      const openRequests = totalRequests - completedRequests;

      let totalFiles = 0;
      for (const r of sorted) {
        if (r.files && r.files.length > 0) totalFiles += r.files.length;
      }

      // Customer tier badge
      let badge = { label: '🆕 جدید', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
      if (totalRequests >= 3) {
        badge = { label: '👑 مشتری VIP', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300' };
      } else if (totalRequests === 2) {
        badge = { label: '⭐ فعال', bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-300' };
      }

      result.push({
        phone,
        name,
        firstSeen,
        lastSeen,
        totalRequests,
        openRequests,
        completedRequests,
        totalFiles,
        requests: sorted.reverse(), // latest first in details
        badge,
      });
    });

    return result;
  }, [requests]);

  // Filter & Sort
  const filteredCustomers = useMemo(() => {
    let list = customers.filter(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.requests.some(r => r.serviceTitle.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (sortBy === 'recent') {
      list.sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime());
    } else if (sortBy === 'requests') {
      list.sort((a, b) => b.totalRequests - a.totalRequests);
    } else if (sortBy === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name, 'fa'));
    }

    return list;
  }, [customers, searchQuery, sortBy]);

  // Stats
  const totalCustomersCount = customers.length;
  const vipCustomersCount = customers.filter(c => c.totalRequests >= 3).length;
  const totalFilesCount = customers.reduce((acc, c) => acc + c.totalFiles, 0);

  return (
    <div className="space-y-4 animate-fadeIn" dir="rtl">
      {/* ── STATS BAR ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'کل مشتریان', value: totalCustomersCount, color: '#0f1e37', bg: '#f1f5f9', icon: Users },
          { label: 'مشتریان VIP', value: vipCustomersCount, color: '#d97706', bg: '#fef3c7', icon: Award },
          { label: 'کل درخواست‌ها', value: requests.length, color: '#2563eb', bg: '#dbeafe', icon: Clock },
          { label: 'مدارک دریافت شده', value: totalFilesCount, color: '#059669', bg: '#d1fae5', icon: FolderOpen },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div
            key={label}
            className="rounded-2xl p-4 border border-border bg-white shadow-xs flex items-center justify-between"
          >
            <div>
              <p className="text-[11px] font-bold text-muted-foreground mb-0.5">{label}</p>
              <p className="text-2xl font-black text-[#0f1e37]">{value}</p>
            </div>
            <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: bg }}>
              <Icon size={20} style={{ color }} />
            </div>
          </div>
        ))}
      </div>

      {/* ── HEADER & SEARCH ── */}
      <div className="bg-white p-4 rounded-2xl border border-border/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base font-black text-[#0f1e37]">مدیریت مشتریان (CRM)</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            لیست جامع مشتریان، تاریخ ثبت‌نام، آمار درخواست‌ها و مدارک پیوست شده
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sort Selector */}
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="bg-slate-50 border border-border rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-gold cursor-pointer"
          >
            <option value="recent">آخرین مراجعه</option>
            <option value="requests">بیشترین درخواست</option>
            <option value="name">نام مشتری</option>
          </select>

          {/* Search Input */}
          <div className="relative w-full sm:w-60">
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">
              <Search className="h-3.5 w-3.5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو نام، تلفن یا خدمت..."
              className="w-full rounded-xl border border-border bg-slate-50/50 py-2 pr-8 pl-3 text-xs outline-none focus:border-gold focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* ── CUSTOMERS GRID ── */}
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
          <Loader2 size={24} className="animate-spin" />
          <span className="text-xs font-bold">درحال دریافت اطلاعات مشتریان...</span>
        </div>
      ) : filteredCustomers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredCustomers.map(customer => {
            const cleanPhone = customer.phone.replace(/[^0-9+]/g, '');
            const whatsappUrl = `https://wa.me/${cleanPhone}`;
            const isExpanded = expandedPhone === customer.phone;

            return (
              <motion.div
                key={customer.phone}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-border bg-white shadow-xs hover:shadow-md transition-all text-right flex flex-col justify-between overflow-hidden"
              >
                {/* Card Top Header */}
                <div className="p-4 pb-3">
                  <div className="flex items-start justify-between gap-2.5 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-11 w-11 rounded-xl bg-[#0f1e37] text-gold font-black text-base flex items-center justify-center shrink-0 shadow-xs">
                        {customer.name.charAt(0)}
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-black text-[#0f1e37] text-sm truncate max-w-[160px]">{customer.name}</h3>
                        <span className="font-mono font-black text-xs text-slate-700 block mt-0.5 inline-block" dir="ltr">
                          {customer.phone}
                        </span>
                      </div>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${customer.badge.bg} ${customer.badge.text} ${customer.badge.border}`}>
                      {customer.badge.label}
                    </span>
                  </div>

                  {/* Dates & Stats row */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs my-2">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block mb-0.5">تاریخ ثبت‌نام:</span>
                      <span className="font-extrabold text-slate-700 text-[11px]">{formatDate(customer.firstSeen)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block mb-0.5">آخرین مراجعه:</span>
                      <span className="font-extrabold text-slate-700 text-[11px]">{formatDate(customer.lastSeen)}</span>
                    </div>
                  </div>

                  {/* Request Stats summary */}
                  <div className="flex items-center justify-between text-xs pt-1 px-1">
                    <span className="text-slate-500 font-bold text-[11px]">
                      تعداد کل درخواست‌ها: <strong className="text-[#0f1e37] font-black">{customer.totalRequests}</strong>
                    </span>

                    {customer.totalFiles > 0 && (
                      <span className="text-amber-700 font-bold text-[10px] bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        📎 {customer.totalFiles} فایل
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-t border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-1.5">
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 bg-[#25D366] text-white hover:brightness-105 transition-all text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-xs"
                    >
                      <MessageSquare size={12} />
                      واتساپ
                    </a>

                    <a
                      href={`tel:${cleanPhone}`}
                      className="p-1 rounded-lg bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 transition-all text-[10px] font-bold px-2"
                      title="تماس"
                    >
                      <Phone size={12} />
                    </a>
                  </div>

                  <button
                    onClick={() => setExpandedPhone(isExpanded ? null : customer.phone)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                  >
                    <span>لیست سوابق</span>
                    {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                </div>

                {/* Expanded Customer History Drawer */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-slate-50 border-t border-slate-200 p-3 space-y-2"
                    >
                      <p className="text-[10px] font-black text-slate-500 mb-1">
                        📋 سابقه درخواست‌ها ({customer.requests.length} مورد):
                      </p>

                      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                        {customer.requests.map((req, idx) => (
                          <div key={req.id || idx} className="p-2 rounded-xl bg-white border border-slate-200 text-xs space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-[#0f1e37]">{req.serviceTitle}</span>
                              <span className="text-[9px] text-slate-400">{formatDate(req.createdAt)}</span>
                            </div>

                            {req.description && (
                              <p className="text-[10px] text-slate-600 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                                {req.description}
                              </p>
                            )}

                            {req.files && req.files.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-1">
                                {req.files.map((f, fIdx) => (
                                  <div key={fIdx} className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded text-[9px] text-amber-800 font-bold border border-amber-200">
                                    <FileText size={10} />
                                    <span className="truncate max-w-[120px]">{f.name}</span>
                                    {f.url && (
                                      <a href={f.url} download={f.name} target="_blank" rel="noopener noreferrer" className="text-gold-dark hover:underline font-black pr-1 border-r border-amber-300">
                                        دانلود
                                      </a>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-border bg-white shadow-xs">
          <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
            <Users size={32} className="text-slate-300" />
            <span className="font-bold text-xs">هیچ مشتری‌ای یافت نشد.</span>
          </div>
        </div>
      )}
    </div>
  );
}
