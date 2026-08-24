'use client';

import { useState, useEffect, useMemo, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Search, Phone, MessageSquare, Clock, Calendar,
  CheckCircle2, FileText, Download, ChevronDown, ChevronUp,
  Award, Sparkles, Filter, ShieldCheck, Loader2, FolderOpen
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
      const sorted = [...reqList].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      const firstSeen = sorted[0].createdAt;
      const lastSeen = sorted[sorted.length - 1].createdAt;

      let name = sorted.find(r => r.name && !r.name.includes('+') && r.name !== phone)?.name || sorted[0].name || phone;

      const totalRequests = sorted.length;
      const completedRequests = sorted.filter(r => r.queueStatus === 'completed').length;
      const openRequests = totalRequests - completedRequests;

      let totalFiles = 0;
      for (const r of sorted) {
        if (r.files && r.files.length > 0) totalFiles += r.files.length;
      }

      let badge = { label: '🆕 جدید', bg: 'rgba(59,130,246,0.15)', text: '#60a5fa', border: 'rgba(59,130,246,0.3)' };
      if (totalRequests >= 3) {
        badge = { label: '👑 مشتری VIP', bg: 'rgba(201,162,39,0.2)', text: '#e4bc3c', border: 'rgba(201,162,39,0.45)' };
      } else if (totalRequests === 2) {
        badge = { label: '⭐ فعال', bg: 'rgba(52,211,153,0.15)', text: '#34d399', border: 'rgba(52,211,153,0.3)' };
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
        requests: sorted.reverse(),
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
    <div className="space-y-4 animate-fadeIn text-white" dir="rtl">
      {/* ── STATS BAR (Dark Navy Theme) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'کل مشتریان', value: totalCustomersCount, color: '#60a5fa', bg: 'rgba(59,130,246,0.15)', icon: Users },
          { label: 'مشتریان VIP', value: vipCustomersCount, color: '#c9a227', bg: 'rgba(201,162,39,0.2)', icon: Award },
          { label: 'کل درخواست‌ها', value: requests.length, color: '#a855f7', bg: 'rgba(168,85,247,0.15)', icon: Clock },
          { label: 'مدارک دریافت شده', value: totalFilesCount, color: '#34d399', bg: 'rgba(52,211,153,0.15)', icon: FolderOpen },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div
            key={label}
            className="rounded-2xl p-4 border bg-[#0b172a] shadow-lg flex items-center justify-between"
            style={{ borderColor: 'rgba(255,255,255,0.08)' }}
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

      {/* ── HEADER & SEARCH ── */}
      <div className="bg-[#0b172a] p-4 rounded-2xl border border-white/10 shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base font-black text-white">مدیریت مشتریان و پرونده‌ها (CRM)</h2>
          <p className="text-[11px] text-white/40 mt-0.5">
            لیست جامع مشتریان به همراه سوابق درخواست‌ها و مدارک ثبت‌شده ({filteredCustomers.length} مشتری)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sort Selector */}
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="bg-[#0f1e37] border border-white/15 rounded-xl px-3 py-2 text-xs font-bold text-white/80 outline-none focus:border-gold cursor-pointer"
          >
            <option value="recent">آخرین مراجعه</option>
            <option value="requests">بیشترین درخواست</option>
            <option value="name">نام مشتری</option>
          </select>

          {/* Search Input */}
          <div className="relative w-full sm:w-60">
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-white/30">
              <Search className="h-3.5 w-3.5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو نام، تلفن..."
              className="w-full rounded-xl border border-white/15 bg-[#0f1e37] py-2 pr-8 pl-3 text-xs text-white placeholder-white/30 outline-none focus:border-gold"
            />
          </div>
        </div>
      </div>

      {/* ── CUSTOMERS LIST TABLE VIEW (Perfect Grid Table) ── */}
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-white/40">
          <Loader2 size={24} className="animate-spin text-gold" />
          <span className="text-xs font-bold">درحال دریافت اطلاعات مشتریان...</span>
        </div>
      ) : filteredCustomers.length > 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#0b172a] shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs table-fixed">
              <thead>
                <tr className="border-b border-white/10 text-gold font-extrabold text-[11px] bg-[#0f1e37]/90">
                  <th className="py-3.5 px-4 w-[22%]">مشتری</th>
                  <th className="py-3.5 px-4 w-[18%] text-right">شماره تلفن</th>
                  <th className="py-3.5 px-4 w-[13%]">تاریخ ثبت‌نام</th>
                  <th className="py-3.5 px-4 w-[13%]">آخرین مراجعه</th>
                  <th className="py-3.5 px-4 w-[12%]">سطح</th>
                  <th className="py-3.5 px-4 w-[12%]">درخواست‌ها</th>
                  <th className="py-3.5 px-4 w-[12%] text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredCustomers.map(customer => {
                  const cleanPhone = customer.phone.replace(/[^0-9+]/g, '');
                  const whatsappUrl = `https://wa.me/${cleanPhone}`;
                  const isExpanded = expandedPhone === customer.phone;

                  return (
                    <Fragment key={customer.phone}>
                      <tr className="hover:bg-white/5 transition-colors border-b border-white/5">
                        {/* Avatar & Name */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="h-9 w-9 rounded-xl bg-gold/15 text-gold border border-gold/30 font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                              {customer.name.charAt(0)}
                            </div>
                            <span className="font-extrabold text-white text-xs truncate max-w-[150px]">
                              {customer.name}
                            </span>
                          </div>
                        </td>

                        {/* Phone with STRICT LTR BDO Overriding */}
                        <td className="py-3.5 px-4 font-mono font-black text-white/90 text-right">
                          <bdo dir="ltr" className="inline-block tracking-wider" style={{ unicodeBidi: 'bidi-override', direction: 'ltr' }}>
                            {customer.phone}
                          </bdo>
                        </td>

                        {/* First seen */}
                        <td className="py-3.5 px-4 text-white/60 font-medium">
                          {formatDate(customer.firstSeen)}
                        </td>

                        {/* Last seen */}
                        <td className="py-3.5 px-4 text-white/60 font-medium">
                          {formatDate(customer.lastSeen)}
                        </td>

                        {/* Tier badge */}
                        <td className="py-3.5 px-4">
                          <span
                            className="px-2.5 py-0.5 rounded-full text-[10px] font-black border inline-block"
                            style={{ background: customer.badge.bg, color: customer.badge.text, borderColor: customer.badge.border }}
                          >
                            {customer.badge.label}
                          </span>
                        </td>

                        {/* Request count */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-gold text-xs">{customer.totalRequests} مورد</span>
                            {customer.totalFiles > 0 && (
                              <span className="text-[10px] text-amber-300 font-bold bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/30">
                                📎 {customer.totalFiles}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Action buttons */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <a
                              href={whatsappUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg transition-all hover:scale-105"
                              style={{ background: 'rgba(37,211,102,0.15)', color: '#25D366', border: '1px solid rgba(37,211,102,0.3)' }}
                              title="واتساپ"
                            >
                              <MessageSquare size={13} />
                            </a>

                            <a
                              href={`tel:${cleanPhone}`}
                              className="p-1.5 rounded-lg transition-all hover:scale-105"
                              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.12)' }}
                              title="تماس"
                            >
                              <Phone size={13} />
                            </a>

                            <button
                              onClick={() => setExpandedPhone(isExpanded ? null : customer.phone)}
                              className="flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer"
                              style={{ background: 'rgba(201,162,39,0.18)', color: '#e4bc3c', border: '1px solid rgba(201,162,39,0.4)' }}
                            >
                              <span>📋 سوابق</span>
                              {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Customer Request Drawer */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} className="p-0 border-b border-white/10 bg-[#07111f]/90">
                            <div className="p-4 space-y-2.5">
                              <p className="text-[11px] font-black text-gold flex items-center gap-1.5">
                                📋 سابقه تمامی درخواست‌های {customer.name} ({customer.requests.length} مورد):
                              </p>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {customer.requests.map((req, idx) => (
                                  <div
                                    key={req.id || idx}
                                    className="p-3 rounded-xl border text-xs space-y-1.5"
                                    style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}
                                  >
                                    <div className="flex justify-between items-center">
                                      <span className="font-extrabold text-white">{req.serviceTitle}</span>
                                      <span className="text-[10px] text-white/40">{formatDate(req.createdAt)}</span>
                                    </div>

                                    {req.description && (
                                      <p className="text-[11px] text-white/70 bg-black/30 p-2 rounded-lg border border-white/5 leading-relaxed font-medium">
                                        {req.description}
                                      </p>
                                    )}

                                    {req.files && req.files.length > 0 && (
                                      <div className="flex flex-wrap gap-1 pt-1">
                                        {req.files.map((f, fIdx) => (
                                          <div
                                            key={fIdx}
                                            className="flex items-center gap-1.5 bg-gold/10 px-2 py-1 rounded-lg text-[10px] text-gold font-bold border border-gold/25"
                                          >
                                            <FileText size={11} />
                                            <span className="truncate max-w-[130px]">{f.name}</span>
                                            {f.url && (
                                              <a
                                                href={f.url}
                                                download={f.name}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-white hover:underline font-black pr-1 border-r border-gold/30"
                                              >
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
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-white/10 bg-[#0b172a] shadow-xl text-white/40">
          <div className="flex flex-col items-center gap-1.5">
            <Users size={32} className="text-white/20" />
            <span className="font-bold text-xs">هیچ مشتری‌ای یافت نشد.</span>
          </div>
        </div>
      )}
    </div>
  );
}
