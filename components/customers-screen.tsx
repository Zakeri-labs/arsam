'use client';

import { useState, useEffect, useMemo } from 'react';
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
    <div className="space-y-4 animate-fadeIn text-[#0f1e37]" dir="rtl">
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
            className="rounded-2xl p-4 border border-slate-200/80 bg-white shadow-xs flex items-center justify-between"
          >
            <div>
              <p className="text-[11px] font-bold text-slate-500 mb-0.5">{label}</p>
              <p className="text-2xl font-black text-[#0f1e37]">{value}</p>
            </div>
            <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: bg }}>
              <Icon size={20} style={{ color }} />
            </div>
          </div>
        ))}
      </div>

      {/* ── HEADER & SEARCH ── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base font-black text-[#0f1e37]">مدیریت مشتریان و پرونده‌ها (CRM)</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            لیست جامع مشتریان به همراه سوابق درخواست‌ها و مدارک ثبت‌شده ({filteredCustomers.length} مشتری)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sort Selector */}
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-gold cursor-pointer"
          >
            <option value="recent">آخرین مراجعه</option>
            <option value="requests">بیشترین درخواست</option>
            <option value="name">نام مشتری</option>
          </select>

          {/* Search Input */}
          <div className="relative w-full sm:w-60">
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
              <Search className="h-3.5 w-3.5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو نام، تلفن..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pr-8 pl-3 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-gold focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* ── CUSTOMERS LIST TABLE VIEW (Clean Light Theme) ── */}
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-slate-500">
          <Loader2 size={24} className="animate-spin text-[#0f1e37]" />
          <span className="text-xs font-bold">درحال دریافت اطلاعات مشتریان...</span>
        </div>
      ) : filteredCustomers.length > 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 font-extrabold text-[11px] bg-slate-50/80">
                  <th className="py-3 px-4">مشتری</th>
                  <th className="py-3 px-4">شماره تلفن</th>
                  <th className="py-3 px-4">تاریخ ثبت‌نام</th>
                  <th className="py-3 px-4">آخرین مراجعه</th>
                  <th className="py-3 px-4">سطح</th>
                  <th className="py-3 px-4">کل درخواست‌ها</th>
                  <th className="py-3 px-4 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map(customer => {
                  const cleanPhone = customer.phone.replace(/[^0-9+]/g, '');
                  const whatsappUrl = `https://wa.me/${cleanPhone}`;
                  const isExpanded = expandedPhone === customer.phone;

                  return (
                    <tbody key={customer.phone} className="group">
                      <tr className="hover:bg-slate-50/60 transition-colors">
                        {/* Avatar & Name */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="h-9 w-9 rounded-xl bg-[#0f1e37] text-gold font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                              {customer.name.charAt(0)}
                            </div>
                            <span className="font-extrabold text-[#0f1e37] text-xs truncate max-w-[150px]">
                              {customer.name}
                            </span>
                          </div>
                        </td>

                        {/* Phone with STRICT LTR BDO Overriding */}
                        <td className="py-3.5 px-4 font-mono font-black text-[#0f1e37]">
                          <bdo dir="ltr" className="inline-block tracking-wider" style={{ unicodeBidi: 'bidi-override', direction: 'ltr' }}>
                            {customer.phone}
                          </bdo>
                        </td>

                        {/* First seen */}
                        <td className="py-3.5 px-4 text-slate-600 font-medium">
                          {formatDate(customer.firstSeen)}
                        </td>

                        {/* Last seen */}
                        <td className="py-3.5 px-4 text-slate-600 font-medium">
                          {formatDate(customer.lastSeen)}
                        </td>

                        {/* Tier badge */}
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${customer.badge.bg} ${customer.badge.text} ${customer.badge.border}`}>
                            {customer.badge.label}
                          </span>
                        </td>

                        {/* Request count */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-[#0f1e37] text-xs">{customer.totalRequests} درخواست</span>
                            {customer.totalFiles > 0 && (
                              <span className="text-[10px] text-amber-800 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                📎 {customer.totalFiles} فایل
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

                            <button
                              onClick={() => setExpandedPhone(isExpanded ? null : customer.phone)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
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
                          <td colSpan={7} className="p-0 border-b border-slate-200 bg-slate-50/70">
                            <div className="p-4 space-y-2.5">
                              <p className="text-[11px] font-black text-slate-600 flex items-center gap-1.5">
                                📋 سابقه تمامی درخواست‌های {customer.name} ({customer.requests.length} مورد):
                              </p>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {customer.requests.map((req, idx) => (
                                  <div
                                    key={req.id || idx}
                                    className="p-3 rounded-xl bg-white border border-slate-200 text-xs space-y-1.5 shadow-2xs"
                                  >
                                    <div className="flex justify-between items-center">
                                      <span className="font-extrabold text-[#0f1e37]">{req.serviceTitle}</span>
                                      <span className="text-[10px] text-slate-400">{formatDate(req.createdAt)}</span>
                                    </div>

                                    {req.description && (
                                      <p className="text-[11px] text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100 leading-relaxed font-medium">
                                        {req.description}
                                      </p>
                                    )}

                                    {req.files && req.files.length > 0 && (
                                      <div className="flex flex-wrap gap-1 pt-1">
                                        {req.files.map((f, fIdx) => (
                                          <div
                                            key={fIdx}
                                            className="flex items-center gap-1.5 bg-amber-50 px-2 py-1 rounded-lg text-[10px] text-amber-800 font-bold border border-amber-200"
                                          >
                                            <FileText size={11} />
                                            <span className="truncate max-w-[130px]">{f.name}</span>
                                            {f.url && (
                                              <a
                                                href={f.url}
                                                download={f.name}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-gold-dark hover:underline font-black pr-1 border-r border-amber-300"
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
                    </tbody>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="flex flex-col items-center gap-1.5 text-slate-400">
            <Users size={32} className="text-slate-300" />
            <span className="font-bold text-xs">هیچ مشتری‌ای یافت نشد.</span>
          </div>
        </div>
      )}
    </div>
  );
}
