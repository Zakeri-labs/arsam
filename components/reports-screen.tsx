'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, TrendingUp, TrendingDown, Landmark, Wallet, Clock, Scale, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import OMRIcon from '@/components/omr-icon';
import { cleanCarPlate, cleanCarTitle, type Car, type CarTransaction } from '@/lib/db-cars';
import {
  CATEGORY_LABELS, METHOD_LABELS, NO_CAR, REPORT_CATEGORIES,
  buildFinancialReport, categoryOf, type FinancialReport, type ReportCategory,
} from '@/lib/reports';
import { downloadXlsx, type Cell } from '@/lib/xlsx-lite';

// Financial reports of the cars section: filter by date, car and category, read them by car / by category /
// row by row, and download the same view as an Excel workbook.

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const fmt = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 3 });

function presetRange(key: string): { from: string; to: string } {
  const now = new Date();
  const today = iso(now);
  if (key === 'month') return { from: iso(new Date(now.getFullYear(), now.getMonth(), 1)), to: today };
  if (key === '3months') return { from: iso(new Date(now.getFullYear(), now.getMonth() - 2, 1)), to: today };
  if (key === 'year') return { from: `${now.getFullYear()}-01-01`, to: today };
  return { from: '', to: '' };
}

const PRESETS = [
  { key: 'month', label: 'این ماه' },
  { key: '3months', label: '۳ ماه اخیر' },
  { key: 'year', label: 'امسال' },
  { key: 'all', label: 'همه' },
];

const VIEWS = [
  { key: 'summary', label: 'خلاصه' },
  { key: 'cars', label: 'به تفکیک خودرو' },
  { key: 'categories', label: 'به تفکیک نوع' },
  { key: 'rows', label: 'ریز تراکنش‌ها' },
] as const;
type View = (typeof VIEWS)[number]['key'];

const carLabel = (c: Car) => [cleanCarTitle(c.title), cleanCarPlate(c.plateNumber)].filter(Boolean).join(' · ');

function Stat({ label, value, tone = 'text-white', icon, hint }: { label: string; value: number; tone?: string; icon?: React.ReactNode; hint?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center gap-1.5 text-[11px] font-bold text-white/55">{icon}{label}</div>
      <div className={`mt-1.5 flex items-center gap-1.5 text-xl font-black ${tone}`} dir="ltr"><span>{fmt(value)}</span> <OMRIcon size="sm" /></div>
      {hint && <div className="mt-1 text-[10.5px] text-white/40">{hint}</div>}
    </div>
  );
}

const th = 'px-3 py-2 text-start font-bold text-white/55 whitespace-nowrap';
const td = 'px-3 py-2 whitespace-nowrap';
const num = 'px-3 py-2 font-mono whitespace-nowrap text-left';

export default function ReportsScreen() {
  const [rows, setRows] = useState<CarTransaction[] | null>(null);
  const [cars, setCars] = useState<Car[]>([]);
  const [failed, setFailed] = useState(false);
  const [preset, setPreset] = useState('3months');
  const [range, setRange] = useState(() => presetRange('3months'));
  const [carId, setCarId] = useState('');
  const [categories, setCategories] = useState<ReportCategory[]>([]);
  const [view, setView] = useState<View>('summary');

  useEffect(() => {
    Promise.all([
      fetch('/api/cars/transactions').then(r => (r.ok ? r.json() : Promise.reject())),
      fetch('/api/cars').then(r => (r.ok ? r.json() : [])).catch(() => []),
    ])
      .then(([tx, carList]) => {
        setRows(tx);
        setCars(Array.isArray(carList) ? carList : []);
      })
      .catch(() => setFailed(true));
  }, []);

  const carNames = useMemo(() => {
    const m = new Map<string, string>(cars.map(c => [c.id, carLabel(c)]));
    m.set(NO_CAR, 'بدون خودرو');
    return m;
  }, [cars]);
  const nameOfCar = (id?: string) => carNames.get(id || NO_CAR) || id || 'بدون خودرو';

  const filter = useMemo(
    () => ({ from: range.from || undefined, to: range.to || undefined, carId, categories }),
    [range, carId, categories]
  );
  const report: FinancialReport | null = useMemo(() => (rows ? buildFinancialReport(rows, filter) : null), [rows, filter]);
  const maxMonth = useMemo(() => Math.max(1, ...(report?.monthly.flatMap(m => [m.income, m.expense]) ?? [])), [report]);

  const toggleCategory = (c: ReportCategory) => setCategories(prev => (prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]));

  const exportExcel = () => {
    if (!report) return;
    const num0 = (n: number) => n;
    const filterText = [
      `بازه: ${range.from || 'ابتدا'} تا ${range.to || 'امروز'}`,
      `خودرو: ${carId ? nameOfCar(carId) : 'همه'}`,
      `نوع: ${categories.length ? categories.map(c => CATEGORY_LABELS[c]).join('، ') : 'همه'}`,
    ];
    const sheets: { name: string; rows: Cell[][] }[] = [
      {
        name: 'خلاصه',
        rows: [
          ['شاخص', 'مبلغ (ریال عمان)'],
          ['کل درآمد', num0(report.totalIncome)],
          ['هزینه سرویس و تعمیرات', num0(report.maintenanceExpense)],
          ['نتیجه‌ی خالص (درآمد منهای هزینه)', num0(report.netResult)],
          ['ودیعه‌ی دریافتی', num0(report.depositsReceived)],
          ['ودیعه‌ی عودت‌شده', num0(report.depositsRefunded)],
          ['ودیعه‌ی نگهداری‌شده', num0(report.depositsHeld)],
          ['مطالبات پرداخت‌نشده', num0(report.receivables)],
          [`دریافت‌تأییدنشده (${report.unconfirmedCount} ردیف)`, num0(report.unconfirmed)],
          [],
          ...filterText.map(t => [t]),
        ],
      },
      {
        name: 'به تفکیک خودرو',
        rows: [
          ['خودرو', ...['rent', 'extraKm', 'damage', 'otherIncome'].map(k => CATEGORY_LABELS[k as ReportCategory]), 'کل درآمد', 'هزینه سرویس', 'نتیجه‌ی خالص', 'ودیعه‌ی نگهداری‌شده', 'مطالبات', 'تعداد ردیف'],
          ...report.byCar.map(c => [nameOfCar(c.carId), c.byCategory.rent, c.byCategory.extraKm, c.byCategory.damage, c.byCategory.otherIncome, c.totalIncome, c.maintenance, c.net, c.depositsHeld, c.receivables, c.count]),
        ],
      },
      {
        name: 'به تفکیک نوع',
        rows: [
          ['نوع', 'تعداد ردیف', 'پرداخت‌شده', 'در انتظار پرداخت'],
          ...report.byCategory.map(c => [CATEGORY_LABELS[c.category], c.count, c.paid, c.pending]),
        ],
      },
      { name: 'ماهانه', rows: [['ماه', 'درآمد', 'هزینه', 'خالص'], ...report.monthly.map(m => [m.month, m.income, m.expense, m.net])] },
      { name: 'حساب‌ها', rows: [['حساب', 'ورودی', 'خروجی', 'مانده'], ...report.accounts.map(a => [METHOD_LABELS[a.method], a.incoming, a.outgoing, a.balance])] },
      { name: 'مطالبات', rows: [['مشتری', 'مبلغ مانده', 'تعداد بند'], ...report.receivablesByCustomer.map(r => [r.customerName, r.owed, r.rows])] },
      {
        name: 'ریز تراکنش‌ها',
        rows: [
          ['تاریخ', 'خودرو', 'مشتری', 'نوع', 'وضعیت', 'روش پرداخت', 'مبلغ', 'توضیحات', 'ثبت‌کننده', 'تأیید دریافت'],
          ...report.rows.map(t => [
            t.transactionDate, nameOfCar(t.carId), t.customerName || '', CATEGORY_LABELS[categoryOf(t)],
            t.paymentStatus === 'pending' ? 'در انتظار پرداخت' : 'پرداخت‌شده', t.paymentMethod ? METHOD_LABELS[t.paymentMethod] : '',
            t.amount, t.description || '', t.recordedBy || '', t.receivedAt ? (t.receivedBy || 'تأیید شده') : '',
          ]),
        ],
      },
    ];
    try {
      downloadXlsx(sheets, `arsam-report-${range.from || 'all'}_${range.to || iso(new Date())}.xlsx`);
    } catch (e) {
      console.error('Excel export failed:', e);
      toast.error('ساخت فایل اکسل ناموفق بود');
    }
  };

  if (failed) return <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 text-center text-[13px] text-rose-200">دریافت اطلاعات ناموفق بود؛ صفحه را تازه کنید.</div>;
  if (!report) return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-gold" /></div>;

  return (
    <div className="space-y-5 text-right" dir="rtl">
      {/* Filters */}
      <section className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3.5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map(p => (
              <button key={p.key} type="button" onClick={() => { setPreset(p.key); setRange(presetRange(p.key)); }}
                className={`rounded-lg px-3 py-1.5 text-[12px] font-bold transition-colors ${preset === p.key ? 'bg-gold text-black' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}>
                {p.label}
              </button>
            ))}
          </div>
          <label className="text-[11px] font-bold text-white/55">
            از تاریخ
            <input type="date" dir="ltr" value={range.from} onChange={e => { setPreset(''); setRange(r => ({ ...r, from: e.target.value })); }} className="mt-1 block rounded-lg border border-white/15 bg-black/20 px-2.5 py-1.5 text-[12px] text-white [color-scheme:dark]" />
          </label>
          <label className="text-[11px] font-bold text-white/55">
            تا تاریخ
            <input type="date" dir="ltr" value={range.to} onChange={e => { setPreset(''); setRange(r => ({ ...r, to: e.target.value })); }} className="mt-1 block rounded-lg border border-white/15 bg-black/20 px-2.5 py-1.5 text-[12px] text-white [color-scheme:dark]" />
          </label>
          <label className="text-[11px] font-bold text-white/55">
            خودرو
            <select value={carId} onChange={e => setCarId(e.target.value)} className="mt-1 block max-w-[240px] rounded-lg border border-white/15 bg-[#0f1e37] px-2.5 py-1.5 text-[12px] text-white">
              <option value="">همه‌ی خودروها</option>
              {cars.map(c => <option key={c.id} value={c.id}>{carLabel(c)}</option>)}
              <option value={NO_CAR}>بدون خودرو</option>
            </select>
          </label>
          <button type="button" onClick={exportExcel} className="ms-auto inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-[12px] font-black text-black shadow-lg shadow-emerald-900/30 hover:brightness-110">
            <FileSpreadsheet size={16} /> دریافت خروجی اکسل
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold text-white/55">نوع:</span>
          <button type="button" onClick={() => setCategories([])} className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${categories.length === 0 ? 'bg-gold text-black' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}>همه</button>
          {REPORT_CATEGORIES.map(c => (
            <button key={c} type="button" onClick={() => toggleCategory(c)} className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${categories.includes(c) ? 'bg-gold text-black' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}>
              {CATEGORY_LABELS[c]}
            </button>
          ))}
          <span className="ms-auto text-[11px] text-white/40">{report.rows.length} ردیف مالی</span>
        </div>
      </section>

      <div className="flex gap-1 overflow-x-auto rounded-xl border border-white/10 bg-white/[0.03] p-1">
        {VIEWS.map(v => (
          <button key={v.key} type="button" onClick={() => setView(v.key)}
            className={`shrink-0 rounded-lg px-3.5 py-2 text-[12px] font-black transition-all ${view === v.key ? 'bg-gradient-to-r from-gold to-amber-500 text-black' : 'text-white/70 hover:bg-white/5'}`}>
            {v.label}
          </button>
        ))}
      </div>

      {view === 'summary' && (
        <>
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="کل درآمد" value={report.totalIncome} tone="text-emerald-300" icon={<TrendingUp size={13} />} hint="اجاره + کیلومتر اضافه + خسارت + سایر" />
            <Stat label="هزینه سرویس و تعمیرات" value={report.maintenanceExpense} tone="text-rose-300" icon={<TrendingDown size={13} />} />
            <Stat label="نتیجه‌ی خالص" value={report.netResult} tone={report.netResult >= 0 ? 'text-gold' : 'text-rose-300'} icon={<Scale size={13} />} hint="درآمد منهای هزینه (بدون ودیعه)" />
            <Stat label="مطالبات از مشتریان" value={report.receivables} tone="text-amber-300" icon={<Clock size={13} />} hint="هنوز پرداخت نشده" />
          </section>

          <div className="grid gap-5 lg:grid-cols-2">
            <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <h2 className="mb-3 text-[13px] font-black">ودیعه‌ها و تأیید دریافت</h2>
              <dl className="space-y-2 text-[12.5px]">
                {[['ودیعه‌ی دریافتی', report.depositsReceived], ['ودیعه‌ی عودت‌شده', report.depositsRefunded], ['ودیعه‌ی نگهداری‌شده', report.depositsHeld], [`دریافت‌تأییدنشده (${report.unconfirmedCount} ردیف)`, report.unconfirmed]].map(([k, v]) => (
                  <div key={k as string} className="flex justify-between gap-3 border-b border-white/5 pb-1.5"><dt className="text-white/65">{k}</dt><dd className="font-mono font-bold" dir="ltr">{fmt(v as number)}</dd></div>
                ))}
              </dl>
              <p className="mt-2 text-[10.5px] leading-5 text-white/40">ودیعه بدهی نزد ماست و جزو درآمد حساب نمی‌شود.</p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <h2 className="mb-3 text-[13px] font-black">گردش هر حساب / نقد</h2>
              <table className="w-full text-[12px]">
                <thead><tr><th className={th}>حساب</th><th className={th}>ورودی</th><th className={th}>خروجی</th><th className={th}>مانده</th></tr></thead>
                <tbody>
                  {report.accounts.map(a => (
                    <tr key={a.method} className="border-t border-white/5">
                      <td className={`${td} font-bold`}><span className="inline-flex items-center gap-1.5">{a.method.startsWith('bank') ? <Landmark size={13} className="text-blue-300" /> : <Wallet size={13} className="text-teal-300" />}{METHOD_LABELS[a.method]}</span></td>
                      <td className={`${num} text-emerald-300`}>{fmt(a.incoming)}</td>
                      <td className={`${num} text-rose-300`}>{fmt(a.outgoing)}</td>
                      <td className={`${num} font-bold`}>{fmt(a.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>

          <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <h2 className="mb-3 text-[13px] font-black">روند ماهانه</h2>
            {report.monthly.length === 0 ? <p className="text-[12px] text-white/45">در این بازه تراکنشی ثبت نشده است.</p> : (
              <div className="space-y-2.5">
                {report.monthly.map(m => (
                  <div key={m.month} className="grid grid-cols-[64px_1fr_auto] items-center gap-3 text-[11.5px]">
                    <span className="font-mono text-white/60" dir="ltr">{m.month}</span>
                    <div className="space-y-1">
                      <div className="h-2 rounded-full bg-white/5"><div className="h-2 rounded-full bg-emerald-400/80" style={{ width: `${(m.income / maxMonth) * 100}%` }} /></div>
                      <div className="h-2 rounded-full bg-white/5"><div className="h-2 rounded-full bg-rose-400/80" style={{ width: `${(m.expense / maxMonth) * 100}%` }} /></div>
                    </div>
                    <span className={`font-mono font-bold ${m.net >= 0 ? 'text-gold' : 'text-rose-300'}`} dir="ltr">{fmt(m.net)}</span>
                  </div>
                ))}
                <div className="flex gap-4 pt-1 text-[10.5px] text-white/45">
                  <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-emerald-400/80" /> درآمد</span>
                  <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-rose-400/80" /> هزینه</span>
                </div>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <h2 className="mb-3 text-[13px] font-black">مطالبات به تفکیک مشتری</h2>
            {report.receivablesByCustomer.length === 0 ? <p className="text-[12px] text-white/45">مطالبه‌ی پرداخت‌نشده‌ای در این بازه وجود ندارد.</p> : (
              <ul className="divide-y divide-white/5 text-[12.5px]">
                {report.receivablesByCustomer.map(c => (
                  <li key={c.customerName} className="flex items-center justify-between gap-3 py-2">
                    <span className="font-bold">{c.customerName} <span className="text-[10.5px] font-normal text-white/40">({c.rows} بند)</span></span>
                    <span className="font-mono font-bold text-amber-300" dir="ltr">{fmt(c.owed)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      {view === 'cars' && (
        <section className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.04]">
          <table className="w-full min-w-[900px] text-[12px]">
            <thead>
              <tr className="border-b border-white/10">
                <th className={th}>خودرو</th><th className={th}>اجاره</th><th className={th}>کیلومتر اضافه</th><th className={th}>خسارت</th><th className={th}>سایر درآمد</th>
                <th className={th}>کل درآمد</th><th className={th}>هزینه سرویس</th><th className={th}>خالص</th><th className={th}>ودیعه‌ی نگهداری‌شده</th><th className={th}>مطالبات</th>
              </tr>
            </thead>
            <tbody>
              {report.byCar.length === 0 && <tr><td className="px-3 py-6 text-center text-white/45" colSpan={10}>ردیفی در این بازه نیست.</td></tr>}
              {report.byCar.map(c => (
                <tr key={c.carId} className="border-t border-white/5">
                  <td className={`${td} font-bold`}>{nameOfCar(c.carId)}</td>
                  <td className={num}>{fmt(c.byCategory.rent)}</td><td className={num}>{fmt(c.byCategory.extraKm)}</td><td className={num}>{fmt(c.byCategory.damage)}</td><td className={num}>{fmt(c.byCategory.otherIncome)}</td>
                  <td className={`${num} font-bold text-emerald-300`}>{fmt(c.totalIncome)}</td>
                  <td className={`${num} text-rose-300`}>{fmt(c.maintenance)}</td>
                  <td className={`${num} font-bold ${c.net >= 0 ? 'text-gold' : 'text-rose-300'}`}>{fmt(c.net)}</td>
                  <td className={num}>{fmt(c.depositsHeld)}</td>
                  <td className={`${num} text-amber-300`}>{fmt(c.receivables)}</td>
                </tr>
              ))}
              {report.byCar.length > 0 && (
                <tr className="border-t border-white/15 bg-white/5 font-black">
                  <td className={td}>جمع</td>
                  {(['rent', 'extraKm', 'damage', 'otherIncome'] as const).map(k => <td key={k} className={num}>{fmt(report.byCar.reduce((s, c) => s + c.byCategory[k], 0))}</td>)}
                  <td className={`${num} text-emerald-300`}>{fmt(report.totalIncome)}</td>
                  <td className={`${num} text-rose-300`}>{fmt(report.maintenanceExpense)}</td>
                  <td className={`${num} ${report.netResult >= 0 ? 'text-gold' : 'text-rose-300'}`}>{fmt(report.netResult)}</td>
                  <td className={num}>{fmt(report.depositsHeld)}</td>
                  <td className={`${num} text-amber-300`}>{fmt(report.receivables)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      )}

      {view === 'categories' && (
        <section className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.04]">
          <table className="w-full min-w-[480px] text-[12px]">
            <thead><tr className="border-b border-white/10"><th className={th}>نوع</th><th className={th}>تعداد ردیف</th><th className={th}>پرداخت‌شده</th><th className={th}>در انتظار پرداخت</th></tr></thead>
            <tbody>
              {report.byCategory.map(c => (
                <tr key={c.category} className="border-t border-white/5">
                  <td className={`${td} font-bold`}>{CATEGORY_LABELS[c.category]}</td>
                  <td className={num}>{c.count}</td>
                  <td className={`${num} font-bold`}>{fmt(c.paid)}</td>
                  <td className={`${num} text-amber-300`}>{fmt(c.pending)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {view === 'rows' && (
        <section className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.04]">
          <table className="w-full min-w-[900px] text-[12px]">
            <thead><tr className="border-b border-white/10"><th className={th}>تاریخ</th><th className={th}>خودرو</th><th className={th}>مشتری</th><th className={th}>نوع</th><th className={th}>وضعیت</th><th className={th}>روش پرداخت</th><th className={th}>مبلغ</th><th className={th}>توضیحات</th></tr></thead>
            <tbody>
              {report.rows.length === 0 && <tr><td className="px-3 py-6 text-center text-white/45" colSpan={8}>ردیفی در این بازه نیست.</td></tr>}
              {report.rows.map(t => (
                <tr key={t.id} className="border-t border-white/5">
                  <td className={`${td} font-mono`} dir="ltr">{t.transactionDate}</td>
                  <td className={td}>{nameOfCar(t.carId)}</td>
                  <td className={td}>{t.customerName || '—'}</td>
                  <td className={td}>{CATEGORY_LABELS[categoryOf(t)]}</td>
                  <td className={td}>{t.paymentStatus === 'pending' ? <span className="text-amber-300">در انتظار پرداخت</span> : 'پرداخت‌شده'}</td>
                  <td className={td}>{t.paymentMethod ? METHOD_LABELS[t.paymentMethod] : '—'}</td>
                  <td className={`${num} font-bold`}>{fmt(t.amount)}</td>
                  <td className="max-w-[320px] truncate px-3 py-2 text-white/60" title={t.description}>{t.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
