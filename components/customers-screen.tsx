'use client';

import BlacklistButton from '@/components/blacklist-button';
import { useState, useEffect, useMemo, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Search, Phone, MessageSquare, Clock, Calendar,
  CheckCircle2, FileText, Download, ChevronDown, ChevronUp,
  Award, Sparkles, Filter, ShieldCheck, Loader2, FolderOpen, ClipboardList
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

// onBlacklistChange lets the admin page reload its requests list after a
// number is blacklisted here, so the requests screen and its badge stay in step.
export default function CustomersScreen({ onBlacklistChange }: { onBlacklistChange?: () => void } = {}) {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'requests' | 'name'>('recent');
  const [expandedPhone, setExpandedPhone] = useState<string | null>(null);

  const loadRequests = (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    fetch('/api/requests')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setRequests(data);
      })
      .catch(err => console.error('Failed to load requests for customers:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => loadRequests(), []);

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

  const onBlacklisted = () => { loadRequests(false); onBlacklistChange?.(); };

  // Request history of one customer — shown under the table row on desktop
  // and inside the customer's card on phones.
  const renderHistory = (customer: CustomerGroup) => (
    <div className="space-y-2.5">
      <p className="text-[11px] font-black text-gold flex items-center gap-1.5">
        <ClipboardList size={12} aria-hidden="true" className="shrink-0" />
        سابقه تمامی درخواست‌های {customer.name} ({customer.requests.length} مورد):
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {customer.requests.map((req, idx) => (
          <div
            key={req.id || idx}
            className="p-3 rounded-xl border text-xs space-y-1.5"
            style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}
          >
            <div className="flex justify-between items-start gap-2">
              <span className="font-extrabold text-white min-w-0 break-words">{req.serviceTitle}</span>
              <span className="text-[11px] text-white/55 shrink-0">{formatDate(req.createdAt)}</span>
            </div>

            {req.description && (
              <p className="text-[11px] text-white/70 bg-black/30 p-2 rounded-lg border border-white/5 leading-relaxed font-medium break-words">
                {req.description}
              </p>
            )}

            {req.files && req.files.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {req.files.map((f, fIdx) => (
                  <div
                    key={fIdx}
                    className="flex items-center gap-1.5 bg-gold/10 px-2 py-1 rounded-lg text-[11px] text-gold font-bold border border-gold/25 max-w-full"
                  >
                    <FileText size={11} className="shrink-0" />
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
  );

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

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
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
              placeholder="جستجوی نام، تلفن یا خدمت"
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
        <div className="rounded-2xl border border-white/10 bg-[#0b172a] shadow-xl overflow-hidden w-full">
          {/* Phones, tablets and small laptops: one card per customer (the table needs more width than the sidebar leaves below 1280px) */}
          <ul className="xl:hidden divide-y divide-white/10" aria-label="لیست مشتریان">
            {filteredCustomers.map((customer, idx) => {
              const cleanPhone = customer.phone.replace(/[^0-9+]/g, '');
              const isExpanded = expandedPhone === customer.phone;
              const historyId = `customer-history-${idx}`;

              return (
                <li key={customer.phone} className="p-4 space-y-3 text-xs">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-gold/15 text-gold border border-gold/30 font-black text-sm flex items-center justify-center shrink-0" aria-hidden="true">
                        {customer.name.charAt(0)}
                      </div>
                      <span className="font-extrabold text-white text-sm truncate" title={customer.name} dir="auto">{customer.name}</span>
                    </div>
                    <span
                      className="shrink-0 px-2.5 py-0.5 rounded-full text-[11px] font-black border"
                      style={{ background: customer.badge.bg, color: customer.badge.text, borderColor: customer.badge.border }}
                    >
                      {customer.badge.label}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <bdo dir="ltr" className="font-mono font-black text-white/90 text-[13px] whitespace-nowrap tracking-wider" style={{ unicodeBidi: 'bidi-override', direction: 'ltr' }}>
                      {customer.phone}
                    </bdo>
                    <BlacklistButton phone={customer.phone} name={customer.name} onDone={onBlacklisted} className="h-11 rounded-xl px-3 text-[11px] sm:text-[11px]" />
                  </div>

                  <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-2 rounded-xl bg-[#07111f] p-3 text-[11px]">
                    <div>
                      <dt className="text-white/40">تاریخ ثبت‌نام</dt>
                      <dd className="font-bold text-white/80 mt-0.5">{formatDate(customer.firstSeen)}</dd>
                    </div>
                    <div>
                      <dt className="text-white/40">آخرین مراجعه</dt>
                      <dd className="font-bold text-white/80 mt-0.5">{formatDate(customer.lastSeen)}</dd>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <dt className="text-white/40">درخواست‌ها</dt>
                      <dd className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-black text-gold">{customer.totalRequests} مورد</span>
                        {customer.totalFiles > 0 && (
                          <span className="text-[11px] text-amber-300 font-bold bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/30">
                            📎 {customer.totalFiles} مدرک
                          </span>
                        )}
                      </dd>
                    </div>
                  </dl>

                  <div className="grid grid-cols-3 gap-2 sm:max-w-md sm:mr-auto">
                    <a
                      href={`https://wa.me/${cleanPhone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`واتساپ به ${customer.name} (در پنجره‌ی جدید)`}
                      className="flex h-11 items-center justify-center gap-1.5 rounded-xl text-[11px] font-extrabold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]/60"
                      style={{ background: 'rgba(37,211,102,0.15)', color: '#25D366', border: '1px solid rgba(37,211,102,0.3)' }}
                    >
                      <MessageSquare size={14} aria-hidden="true" />
                      واتساپ
                    </a>
                    <a
                      href={`tel:${cleanPhone}`}
                      aria-label={`تماس با ${customer.name}`}
                      className="flex h-11 items-center justify-center gap-1.5 rounded-xl text-[11px] font-extrabold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                      style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.12)' }}
                    >
                      <Phone size={14} aria-hidden="true" />
                      تماس
                    </a>
                    <button
                      type="button"
                      onClick={() => setExpandedPhone(isExpanded ? null : customer.phone)}
                      aria-expanded={isExpanded}
                      aria-controls={isExpanded ? historyId : undefined}
                      aria-label={`سوابق ${customer.name}`}
                      className="flex h-11 items-center justify-center gap-1.5 rounded-xl text-[11px] font-extrabold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
                      style={{ background: 'rgba(201,162,39,0.18)', color: '#e4bc3c', border: '1px solid rgba(201,162,39,0.4)' }}
                    >
                      <ClipboardList size={14} aria-hidden="true" />
                      سوابق
                      {isExpanded ? <ChevronUp size={12} aria-hidden="true" /> : <ChevronDown size={12} aria-hidden="true" />}
                    </button>
                  </div>

                  {isExpanded && (
                    <div id={historyId} className="rounded-xl bg-[#07111f]/90 p-3">
                      {renderHistory(customer)}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="hidden xl:block overflow-x-auto w-full">
            <table className="w-full min-w-[650px] text-right border-collapse text-xs">
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
                          <div className="flex items-center justify-end gap-2">
                            <bdo dir="ltr" className="inline-block whitespace-nowrap tracking-wider" style={{ unicodeBidi: 'bidi-override', direction: 'ltr' }}>
                              {customer.phone}
                            </bdo>
                            <BlacklistButton phone={customer.phone} name={customer.name} onDone={onBlacklisted} />
                          </div>
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
                              aria-label={`واتساپ به ${customer.name} (در پنجره‌ی جدید)`}
                            >
                              <MessageSquare size={13} aria-hidden="true" />
                            </a>

                            <a
                              href={`tel:${cleanPhone}`}
                              className="p-1.5 rounded-lg transition-all hover:scale-105"
                              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.12)' }}
                              title="تماس"
                              aria-label={`تماس با ${customer.name}`}
                            >
                              <Phone size={13} aria-hidden="true" />
                            </a>

                            <button
                              type="button"
                              onClick={() => setExpandedPhone(isExpanded ? null : customer.phone)}
                              aria-expanded={isExpanded}
                              aria-label={`سوابق ${customer.name}`}
                              className="flex items-center gap-1 px-2 py-1 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
                              style={{ background: 'rgba(201,162,39,0.18)', color: '#e4bc3c', border: '1px solid rgba(201,162,39,0.4)' }}
                            >
                              <ClipboardList size={12} aria-hidden="true" />
                              <span>سوابق</span>
                              {isExpanded ? <ChevronUp size={11} aria-hidden="true" /> : <ChevronDown size={11} aria-hidden="true" />}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Customer Request Drawer */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} className="p-0 border-b border-white/10 bg-[#07111f]/90">
                            <div className="p-4">
                              {renderHistory(customer)}
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
