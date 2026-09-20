'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Printer, FileText } from 'lucide-react';

export interface ContractData {
  id: string;
  contractNo?: string;
  date?: string;
  // Car Info
  carTitle: string;
  carTitleEn?: string;
  brand?: string;
  modelYear?: string;
  plateNumber: string;
  color?: string;
  dailyRate?: number;
  initialOdometer?: number;
  returnOdometer?: number;
  fuelLevel?: string;
  // Customer Info
  customerName: string;
  customerNameEn?: string;
  customerPhone: string;
  customerNationalId?: string;
  customerPassport?: string;
  customerNationality?: string;
  customerAddress?: string;
  licenceType?: string;
  licenceNo?: string;
  // Rental Dates & Price
  startDate: string;
  endDate: string;
  departureTime?: string;
  returnTime?: string;
  rentalDays?: number;
  totalPrice: number;
  depositPaid: number;
  deductionsAmount?: number;
  netRefundable?: number;
  discountAmount?: number;
  notes?: string;
  // Fields filled by hand on the paper form
  workAddress?: string;
  whatsapp?: string;
  cleanInside?: string;
  cleanOutside?: string;
  extraKm?: string;
  extraKmAmount?: number;
}

interface CarContractModalProps {
  contract: ContractData;
  onClose: () => void;
}

type FuelKey = 'full' | '3/4' | 'half' | '1/4' | 'empty';
const FUEL_ANGLES: Record<FuelKey, number> = { full: 0.2, '3/4': Math.PI * 0.25, half: Math.PI / 2, '1/4': Math.PI * 0.75, empty: Math.PI - 0.2 };

// Maps the handover labels (e.g. 'فول (Full)', '۳/۴', '۱/۲', 'خالی (Empty)') to a dial position
function fuelKeyOf(text?: string): FuelKey | null {
  const t = (text || '').toLowerCase().replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 1776));
  if (/full|فول|پر/.test(t)) return 'full';
  if (/3\/4|three/.test(t)) return '3/4';
  if (/1\/2|half|نصف/.test(t)) return 'half';
  if (/1\/4|quarter/.test(t)) return '1/4';
  if (/empty|خالی/.test(t)) return 'empty';
  return null;
}

export default function CarContractModal({ contract: initialContract, onClose }: CarContractModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  // Editable copy: the form panel edits this and the printed sheet re-renders live
  const [contract, setContract] = useState<ContractData>(() => ({
    ...initialContract,
    customerNameEn: initialContract.customerNameEn || initialContract.customerName,
    whatsapp: initialContract.whatsapp ?? initialContract.customerPhone,
    carTitleEn: initialContract.carTitleEn || initialContract.carTitle,
  }));
  const upd = (key: keyof ContractData, value: string | number | undefined) =>
    setContract(prev => ({ ...prev, [key]: value }));
  const updNum = (key: keyof ContractData, raw: string) => {
    const n = parseFloat(raw.replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 1776)).replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 1632)));
    upd(key, Number.isNaN(n) ? undefined : n);
  };

  const handlePrint = () => {
    window.print();
  };

  const toEng = (val: any) => {
    if (val === undefined || val === null) return '';
    return String(val)
      .replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 1776))
      .replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 1632));
  };

  const contractDate = toEng(contract.date || new Date().toISOString().split('T')[0]);
  const contractNumber = (contract.contractNo || contract.id || `CNT-${Date.now().toString().slice(-4)}`).toUpperCase();
  const dailyRate = contract.dailyRate || (contract.rentalDays ? contract.totalPrice / contract.rentalDays : 0);
  const initialKm = contract.initialOdometer || 0;
  const returnKm = contract.returnOdometer || 0;
  const fuelKey = fuelKeyOf(contract.fuelLevel);
  // Needle angle in radians (PI = Empty, 0 = Full); null leaves the dial blank for hand marking
  const fuelAngle: number | null = fuelKey ? FUEL_ANGLES[fuelKey] : null;
  const deductions = contract.deductionsAmount || 0;
  const extraKmAmount = contract.extraKmAmount || 0;
  const netRefund = (contract.netRefundable !== undefined) 
    ? contract.netRefundable 
    : Math.max(0, contract.depositPaid - deductions);

  return (
    <div className="contract-print-shell fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto" dir="rtl">
      {/* CSS Print Styles for exact A4 physical contract layout matching Oman store form */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-contract-container,
          #printable-contract-container * {
            visibility: visible !important;
          }
          /* Un-clip every modal wrapper so the whole contract flows onto the printed page */
          .contract-print-shell {
            position: static !important;
            display: block !important;
            overflow: visible !important;
            max-height: none !important;
            height: auto !important;
            padding: 0 !important;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            backdrop-filter: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
          #printable-contract-container {
            position: static !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: #ffffff !important;
            color: #000000 !important;
            padding: 2mm !important;
            margin: 0 !important;
            break-inside: avoid;
            page-break-after: avoid;
            box-shadow: none !important;
            border: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 4mm;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="contract-print-shell w-full max-w-7xl bg-[#0b172a] rounded-3xl border border-white/20 shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
      >
        {/* Modal Toolbar Header */}
        <div className="bg-[#0f1e37] px-5 py-4 border-b border-white/10 flex items-center justify-between no-print shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-white">عقد إيجار سيارات رسمی (ابوآرسام رنت کار)</h2>
              <p className="text-[11px] text-white/50">پیش‌نمایش دقیق فرم فیزیکی قرارداد، چاپ A4 و خروجی PDF</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-black font-extrabold text-xs shadow-lg hover:brightness-110 active:scale-98 transition-all cursor-pointer"
            >
              <Printer size={16} />
              <span>چاپ قرارداد (Print / PDF)</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Body */}
        <div className="contract-print-shell flex-1 min-h-0 flex flex-col lg:flex-row-reverse overflow-hidden">
        {/* DATA ENTRY FORM (screen only) */}
        <aside className="no-print lg:w-[22rem] shrink-0 overflow-y-auto bg-[#0f1e37] border-b lg:border-b-0 lg:border-l border-white/10 p-4 space-y-4 max-h-[40vh] lg:max-h-none" dir="rtl">
          <p className="text-[11px] text-white/50">اطلاعات را وارد کنید؛ پیش‌نمایش هم‌زمان به‌روز می‌شود و همین نسخه چاپ/PDF می‌شود.</p>
          {[
            { title: 'مشتری', fields: [
              { label: 'نام مشتری (انگلیسی)', key: 'customerNameEn', ph: contract.customerName },
              { label: 'آدرس محل سکونت', key: 'customerAddress' },
              { label: 'آدرس محل کار', key: 'workAddress' },
              { label: 'تلفن', key: 'customerPhone', ltr: true },
              { label: 'واتس‌اپ', key: 'whatsapp', ltr: true, ph: contract.customerPhone },
              { label: 'ملیت', key: 'customerNationality' },
              { label: 'نوع گواهینامه', key: 'licenceType' },
              { label: 'شماره گواهینامه', key: 'licenceNo', ltr: true },
              { label: 'شماره کارت ملی / پاسپورت', key: 'customerNationalId', ltr: true },
            ] },
            { title: 'خودرو', fields: [
              { label: 'نوع خودرو', key: 'carTitleEn', ph: contract.carTitle },
              { label: 'پلاک', key: 'plateNumber', ltr: true },
              { label: 'رنگ', key: 'color' },
              { label: 'نظافت داخل (از ۱۰)', key: 'cleanInside', ltr: true },
              { label: 'نظافت خارج (از ۱۰)', key: 'cleanOutside', ltr: true },
            ] },
            { title: 'زمان', fields: [
              { label: 'تاریخ خروج', key: 'startDate', ltr: true },
              { label: 'ساعت خروج', key: 'departureTime', ltr: true },
              { label: 'تاریخ بازگشت', key: 'endDate', ltr: true },
              { label: 'ساعت بازگشت', key: 'returnTime', ltr: true },
              { label: 'تاریخ قرارداد', key: 'date', ltr: true },
            ] },
            { title: 'ملاحظات', fields: [{ label: 'ملاحظات', key: 'notes', area: true }] },
          ].map(group => (
            <fieldset key={group.title} className="space-y-2">
              <legend className="text-xs font-black text-amber-400 mb-1">{group.title}</legend>
              {group.fields.map((f: { label: string; key: string; ltr?: boolean; ph?: string; area?: boolean }) => {
                const cls = `w-full rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-amber-400 ${f.ltr ? 'text-left' : ''}`;
                const val = String((contract as any)[f.key] ?? '');
                return (
                  <label key={f.key} className="block">
                    <span className="block text-[10.5px] text-white/60 mb-0.5">{f.label}</span>
                    {f.area ? (
                      <textarea rows={3} className={cls} value={val} onChange={e => upd(f.key as keyof ContractData, e.target.value)} />
                    ) : (
                      <input className={cls} dir={f.ltr ? 'ltr' : 'auto'} value={val} placeholder={f.ph} onChange={e => upd(f.key as keyof ContractData, e.target.value)} />
                    )}
                  </label>
                );
              })}
            </fieldset>
          ))}

          <fieldset className="space-y-2">
            <legend className="text-xs font-black text-amber-400 mb-1">کیلومتر، سوخت و مبالغ (ر.ع)</legend>
            {[
              { label: 'مدت اجاره (روز)', key: 'rentalDays' },
              { label: 'کیلومتر هنگام خروج', key: 'initialOdometer' },
              { label: 'کیلومتر هنگام بازگشت', key: 'returnOdometer' },
              { label: 'کیلومتر اضافه', key: 'extraKm', text: true },
              { label: 'اجاره روزانه', key: 'dailyRate' },
              { label: 'مبلغ پرداخت‌شده', key: 'depositPaid' },
              { label: 'مبلغ اجاره کل', key: 'totalPrice' },
              { label: 'مبلغ کیلومتر اضافه', key: 'extraKmAmount' },
              { label: 'مبلغ حادثه', key: 'deductionsAmount' },
            ].map(f => (
              <label key={f.key} className="block">
                <span className="block text-[10.5px] text-white/60 mb-0.5">{f.label}</span>
                <input
                  inputMode="decimal"
                  dir="ltr"
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-xs text-white text-left focus:outline-none focus:border-amber-400"
                  value={String((contract as any)[f.key] ?? '')}
                  onChange={e => (f.text ? upd(f.key as keyof ContractData, e.target.value) : updNum(f.key as keyof ContractData, e.target.value))}
                />
              </label>
            ))}
            <label className="block">
              <span className="block text-[10.5px] text-white/60 mb-0.5">سطح سوخت</span>
              <select
                className="w-full rounded-lg bg-[#0b172a] border border-white/10 px-2.5 py-1.5 text-xs text-white"
                value={fuelKey || ''}
                onChange={e => upd('fuelLevel', e.target.value)}
              >
                <option value="">— خالی (با دست علامت زده شود) —</option>
                <option value="full">پر (Full)</option>
                <option value="3/4">۳/۴</option>
                <option value="half">نصف (۱/۲)</option>
                <option value="1/4">۱/۴</option>
                <option value="empty">خالی (Empty)</option>
              </select>
            </label>
          </fieldset>
        </aside>

        <div className="contract-print-shell flex-1 min-w-0 overflow-y-auto p-3 sm:p-6 bg-slate-900">
          {/* Physical paper form is laid out LTR: English labels left, Arabic labels right */}
          <div
            id="printable-contract-container"
            ref={printRef}
            dir="ltr"
            className="w-full bg-white text-black p-4 sm:p-6 shadow-2xl text-[11px] space-y-1.5 font-sans leading-tight border border-gray-400 font-medium"
          >
            {/* HEADER: CAR RENTAL AGREEMENT | ARSAM RENT logo | Call & C.R */}
            <div className="grid grid-cols-3 items-end">
              <div className="text-left">
                <div className="text-[11px] font-bold tracking-[0.25em] text-gray-800">CAR RENTAL AGREEMENT</div>
                <div className="font-mono text-[10px] text-gray-700">No. {contractNumber}</div>
              </div>
              <div className="flex flex-col items-center leading-none">
                {/* Company logo (public/logo.png) */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="Arsam" className="h-14 w-auto object-contain" />
                <div className="mt-0.5 text-[10px] font-black text-[#0f2a5c]" dir="rtl">أبو أرسام لإستئجار السيارات</div>
                <div className="text-[8.5px] font-bold tracking-wide text-red-600">ARSAM RENT A CAR</div>
              </div>
              <div className="text-right text-[10px] font-black text-gray-900">
                <span>Call &amp; WhatsApp: 94521746</span>
                <span className="ml-3">C.R: 1426046</span>
              </div>
            </div>

            {/* CUSTOMER LINES: English (left) — value — Arabic (right) */}
            <div className="border border-gray-700 divide-y divide-gray-500 text-[10px]">
              {[
                { en: "Customer's Name:", ar: 'إسم المستأجر:', value: contract.customerNameEn || contract.customerName, upper: true },
                { en: 'Res. Add. :', ar: 'العنوان الحالي:', value: contract.customerAddress || '' },
                { en: 'Work Add. :', ar: 'عنوان العمل:', value: contract.workAddress || '' },
                { en: 'Tel. :', ar: 'هاتف:', value: toEng(contract.customerPhone), mono: true },
                { en: 'Whatsapp No. :', ar: 'رقم واتس اب:', value: toEng(contract.whatsapp ?? contract.customerPhone), mono: true },
              ].map(row => (
                <div key={row.en} className="flex items-center gap-2 px-1.5 py-1 min-h-[22px]">
                  <span className="w-28 shrink-0 text-gray-700 font-semibold">{row.en}</span>
                  <span className={`flex-1 font-bold text-[12px] text-blue-900 ${row.upper ? 'uppercase' : ''} ${row.mono ? 'font-mono' : ''}`}>{row.value}</span>
                  <span className="w-24 shrink-0 text-right text-gray-700 font-semibold" dir="rtl">{row.ar}</span>
                </div>
              ))}
            </div>

            {/* NATIONALITY / LICENCE / ID ROW */}
            <div className="grid grid-cols-4 gap-1.5 text-center">
              {[
                { ar: 'الجنسية', en: 'Nationality', value: contract.customerNationality || '' },
                { ar: 'نوع الرخصة', en: 'Type of Licence', value: contract.licenceType || '' },
                { ar: 'رخصة قيادة رقم', en: 'Driving Licence No.', value: toEng(contract.licenceNo || ''), mono: true },
                { ar: 'بطاقة شخصية / جواز السفر رقم', en: 'ID Card / Passport No.', value: toEng(contract.customerNationalId || contract.customerPassport || ''), mono: true },
              ].map(f => (
                <div key={f.en} className="border border-gray-700 rounded-lg overflow-hidden">
                  <div className="text-[8.5px] leading-tight text-gray-700 border-b border-gray-400 py-0.5 px-2">
                    <div dir="rtl">{f.ar}</div>
                    <div>{f.en}</div>
                  </div>
                  <div className={`h-6 flex items-center justify-center font-bold text-[12px] text-blue-900 uppercase ${f.mono ? 'font-mono' : ''}`}>{f.value}</div>
                </div>
              ))}
            </div>

            {/* VEHICLE SECTION: left = cleanliness / fuel / body diagrams, right = 3-col grid */}
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-5 space-y-1.5">
                <div className="grid grid-cols-2 gap-1.5 items-center">
                  <div className="border border-gray-700 text-[9px]">
                    <div className="text-center bg-gray-100 border-b border-gray-500 font-bold leading-tight">Cleanliness level <span dir="rtl">مستوى النظافة</span></div>
                    <div className="flex justify-between px-1 py-0.5"><span>inside</span><span className="font-mono text-blue-900 font-bold">{toEng(contract.cleanInside) || '__'} /10</span><span dir="rtl">داخل السيارة</span></div>
                    <div className="flex justify-between px-1 py-0.5 border-t border-gray-400"><span>outside</span><span className="font-mono text-blue-900 font-bold">{toEng(contract.cleanOutside) || '__'} /10</span><span dir="rtl">خارج السيارة</span></div>
                  </div>
                  {/* Fuel gauge */}
                  <div className="text-center">
                    <div className="text-[8.5px] leading-tight text-gray-700"><span dir="rtl">مستوى الوقود</span> Fuel level</div>
                    <svg viewBox="0 0 100 60" className="w-full h-12">
                      <path d="M8 55 A 42 42 0 0 1 92 55" stroke="#1e3a8a" strokeWidth="4" fill="none" />
                      <path d="M8 55 A 42 42 0 0 1 20 25" stroke="#dc2626" strokeWidth="4" fill="none" />
                      {[0, 1, 2, 3, 4].map(i => {
                        const a = Math.PI - (i * Math.PI) / 4;
                        return <line key={i} x1={50 + 34 * Math.cos(a)} y1={55 - 34 * Math.sin(a)} x2={50 + 42 * Math.cos(a)} y2={55 - 42 * Math.sin(a)} stroke="#111827" strokeWidth="1.5" />;
                      })}
                      <rect x="42" y="38" width="16" height="14" rx="2" fill="#1e3a8a" />
                      {fuelAngle !== null && (
                        <line x1="50" y1="55" x2={50 + 30 * Math.cos(fuelAngle)} y2={55 - 30 * Math.sin(fuelAngle)} stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
                      )}
                      <text x="4" y="59" fontSize="8" fontWeight="bold">E</text>
                      <text x="90" y="59" fontSize="8" fontWeight="bold">F</text>
                    </svg>
                  </div>
                </div>

                {/* Car body diagrams (borderless like the paper): top view + side view, then front / rear / side */}
                <div className="space-y-1">
                  <div className="grid grid-cols-5 gap-2 items-center">
                    <svg viewBox="0 0 130 60" className="col-span-3 w-full h-14 stroke-gray-800 fill-none" strokeWidth="1.5">
                      <path d="M8 30 Q8 12 24 10 L100 10 Q124 14 124 30 Q124 46 100 50 L24 50 Q8 48 8 30 Z" />
                      <path d="M40 15 L84 15 L92 24 L92 36 L84 45 L40 45 L34 36 L34 24 Z" />
                      <line x1="62" y1="15" x2="62" y2="45" />
                      <rect x="24" y="4" width="14" height="6" rx="2" /><rect x="88" y="4" width="14" height="6" rx="2" />
                      <rect x="24" y="50" width="14" height="6" rx="2" /><rect x="88" y="50" width="14" height="6" rx="2" />
                    </svg>
                    <svg viewBox="0 0 110 60" className="col-span-2 w-full h-14 stroke-gray-800 fill-none" strokeWidth="1.5">
                      <path d="M4 42 L8 32 Q14 28 30 26 L44 12 H74 L90 26 Q104 28 106 38 L106 44 H4 Z" />
                      <path d="M46 15 H72 L84 26 H40 Z" /><line x1="58" y1="15" x2="58" y2="26" />
                      <circle cx="28" cy="46" r="8" /><circle cx="84" cy="46" r="8" />
                    </svg>
                  </div>
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <svg viewBox="0 0 80 60" className="w-full h-12 stroke-gray-800 fill-none" strokeWidth="1.5">
                      <path d="M12 46 L14 26 Q16 10 40 10 Q64 10 66 26 L68 46 Z" /><rect x="22" y="16" width="36" height="14" rx="3" />
                      <circle cx="22" cy="46" r="6" /><circle cx="58" cy="46" r="6" /><line x1="30" y1="38" x2="50" y2="38" />
                    </svg>
                    <svg viewBox="0 0 80 60" className="w-full h-12 stroke-gray-800 fill-none" strokeWidth="1.5">
                      <path d="M12 46 L14 26 Q16 10 40 10 Q64 10 66 26 L68 46 Z" /><rect x="24" y="16" width="32" height="12" rx="3" />
                      <circle cx="22" cy="46" r="6" /><circle cx="58" cy="46" r="6" /><rect x="30" y="34" width="20" height="6" rx="2" />
                    </svg>
                    <svg viewBox="0 0 110 60" className="w-full h-12 stroke-gray-800 fill-none" strokeWidth="1.5">
                      <path d="M4 42 L8 32 Q14 28 30 26 L44 12 H74 L90 26 Q104 28 106 38 L106 44 H4 Z" />
                      <path d="M46 15 H72 L84 26 H40 Z" /><line x1="58" y1="15" x2="58" y2="26" />
                      <circle cx="28" cy="46" r="8" /><circle cx="84" cy="46" r="8" />
                    </svg>
                  </div>
                </div>

                <div className="text-[8px] leading-tight text-gray-800 font-semibold text-center">
                  <div dir="rtl">خاص بالإيجار قصير الأجل فقط ما يزيد عن ٢٠٠ كم يحسب بواقع ٥٠ بيسة لكل كم</div>
                  <div>EXCESS OF 200 KM 0.050 BZS PER KM WILL BE CHARGED APPLICABLE FOR SHORT TERM LEASE ONLY</div>
                </div>
              </div>

              <div className="col-span-7 space-y-1.5">
                <div className="grid grid-cols-3 gap-1.5 text-center">
                  {[
                    { ar: 'رقم اللوحة', en: 'Plate No.', value: toEng(contract.plateNumber), mono: true },
                    { ar: 'اللون', en: 'Colour', value: contract.color || '' },
                    { ar: 'نوع السيارة', en: 'Type of Car', value: contract.carTitleEn || contract.carTitle },
                    { ar: 'المبلغ المدفوع', en: 'Paid Amount', value: contract.depositPaid ? toEng(contract.depositPaid) : '', mono: true },
                    { ar: 'قيمة الأجرة في اليوم', en: 'Daily Rent Amount', value: dailyRate ? toEng(dailyRate) : '', mono: true },
                    { ar: 'تاريخ يوم المغادرة', en: 'Departure Date', value: toEng(contract.startDate), mono: true },
                    { ar: 'الكيلومتر عند الخروج', en: 'KM at exit', value: initialKm ? toEng(initialKm) : '', mono: true },
                    { ar: 'وقت الخروج', en: 'Departure Time', value: toEng(contract.departureTime || ''), mono: true },
                    { ar: 'مدة الإيجار', en: 'Rent Duration', value: contract.rentalDays ? `${toEng(contract.rentalDays)} DAYS` : '', mono: true },
                    { ar: 'الكيلومتر عند العودة', en: 'KM on Return', value: returnKm ? toEng(returnKm) : '', mono: true },
                    { ar: 'وقت العودة', en: 'Return Time', value: toEng(contract.returnTime || ''), mono: true },
                    { ar: 'تاريخ يوم العودة', en: 'Return Date', value: toEng(contract.endDate), mono: true },
                  ].map(f => (
                    <div key={f.en} className="border border-gray-700 rounded-lg overflow-hidden">
                      <div className="text-[8px] leading-tight text-gray-700 border-b border-gray-400 py-0.5 px-2">
                        <div dir="rtl">{f.ar}</div>
                        <div>{f.en}</div>
                      </div>
                      <div className={`h-6 flex items-center justify-center font-bold text-[12px] text-blue-900 uppercase ${f.mono ? 'font-mono' : ''}`}>{f.value}</div>
                    </div>
                  ))}
                </div>
                <div className="ml-auto w-1/3 border border-gray-700 rounded-lg overflow-hidden text-center">
                  <div className="text-[8px] leading-tight text-gray-700 border-b border-gray-400 py-0.5 px-2">
                    <div dir="rtl">الكيلومترات زائدة</div>
                    <div>Extra KM</div>
                  </div>
                  <div className="h-6 flex items-center justify-center font-bold text-[12px] text-blue-900 font-mono">{toEng(contract.extraKm)}</div>
                </div>
              </div>
            </div>

            {/* IMPORTANT NOTICE */}
            <div className="border-2 border-red-500 rounded-2xl overflow-hidden">
              <div className="bg-red-500 text-white text-center font-black text-[12px] tracking-wide py-0.5">
                IMPORTANT NOTICE <span dir="rtl">تنبيه هام</span>
              </div>
              <div className="text-center text-[8.5px] leading-tight py-1 px-2 font-semibold text-gray-900">
                <div dir="rtl">يجب على المستأجر أن يقرأ بعناية ويفهم جيدا جميع الشروط الواردة أعلاه وعلى ظهر عقد الإيجار هذا قبل التوقيع عليه</div>
                <div>THE RENTER SHOULD READ AND UNDERSTAND OUR TERMS &amp; CONDITIONS WHICH ARE PRINTED AT</div>
                <div>ABOVE AND ON THE REVERSE SIDE OF RENTAL AGREEMENT BEFORE SIGNING THE RENT AGREEMENT</div>
              </div>
            </div>

            {/* UNDERTAKING: bilingual, with 50 OMR smoking fine clause */}
            <div className="text-[9px] leading-snug space-y-1">
              <div className="grid grid-cols-3 items-center font-black text-[10px]">
                <div className="text-left"><span dir="rtl">ممنوع التدخين في السيارة</span><br />NO SMOKING IN CAR</div>
                <div className="text-center text-[13px]" dir="rtl">إقرار وتعهد من المستأجر</div>
                <div className="text-right"><span dir="rtl">أربط حزام الأمان</span><br />FASTEN YOUR SEAT BELT</div>
              </div>
              <p dir="rtl" className="text-justify text-gray-900">
                إقرار وأتعهد بأنني قرأت الشروط والبنود الواردة خلف هذا العقد كاملاً وأنني موافق عليها وأتعهد بدفع جميع المخالفات المرورية وأتحمل مسؤولية السيارة التي استأجرتها حسب عقد الإيجار كاملاً، وإذا لا سمح الله وقع على السيارة حادث أو أصيبت بعطل فني من جراء الاستخدام سأقوم بدفع قيمة التصليح + فترة وقوف السيارة في الكراج وعلى شرط أن يتم التصليح في وكالة السيارة ودفع مسامهة شركة التأمين التي تقرها الشركة وعليه أوقع.
              </p>
              <p className="text-gray-900 font-semibold text-[10px]">
                I have read and agree to the terms and conditions on the back side of this agreement and I agree to pay all charges for traffic violation
              </p>
              <p dir="rtl" className="text-justify text-gray-900">
                إقرار أنا مستأجر هذه السيارة بأنني تركت (بطاقتي الشخصية / جواز سفري) بمحض إرادتي وليس رغما عني لدى المؤجر، وأنني أوافق على جميع شروط هذا العقد بعدما قرأت وفهمت ما ورد به.
              </p>
              <p className="text-gray-900">
                I am taking delivery of this car in good condition and depositing my identity car / passport with you my self according to my wish.
                <br />I agree all the conditions of contract between me and the company after reading and understanding it's derails.
              </p>
              <p dir="rtl" className="text-justify text-gray-900">
                السيارة غير مؤمنة ضد الأضرار، وفي حال وقوع حادث وكان المستأجر هو المخطئ، فإن جميع الأضرار تقع على عاتقه.
              </p>
              <p className="text-gray-900">
                The car is not covered by comprehensive insurance, and in case of an accident where the renter is at fault, all damages will be the renter's responsibility.
              </p>
              <div className="flex items-center justify-between gap-3 font-black text-[10px]">
                <span>Smoking in the car is prohibited and, if proven, carries a 50 OMR fine.</span>
                <span dir="rtl">يمنع التدخين داخل السيارة ويُفرض غرامة قدرها ٥٠ ريالاً عند إثبات ذلك.</span>
              </div>
              <p dir="rtl" className="text-red-700 font-bold text-[9px]">
                خودرو فاقد بیمه بدنه است و در صورت تصادف، کلیه خسارات بر عهده مقصر حادثه خواهد بود. سیگار کشیدن درون خودرو ممنوع می‌باشد و در صورت اثبات ۵۰ ریال جریمه در پی دارد.
              </p>
            </div>

            {/* SIGNATURES + DAY / DATE */}
            <div className="grid grid-cols-12 gap-2 text-[9px] font-bold">
              <div className="col-span-5 border-2 border-gray-700 rounded-2xl h-[68px] px-2.5 py-1">
                <div className="flex justify-between"><span>Renter's Signature</span><span dir="rtl">توقيع المستأجر</span></div>
              </div>
              <div className="col-span-2 flex flex-col gap-2">
                <div className="border border-gray-700 rounded-lg overflow-hidden flex-1 p-0.5">
                  <div className="flex justify-between"><span>Day</span><span dir="rtl">اليوم</span></div>
                </div>
                <div className="border border-gray-700 rounded-lg overflow-hidden flex-1 p-0.5">
                  <div className="flex justify-between"><span>Date</span><span dir="rtl">التاريخ</span></div>
                  <div className="text-center font-mono text-[11px] text-blue-900">{contractDate}</div>
                </div>
              </div>
              <div className="col-span-5 border-2 border-gray-700 rounded-2xl h-[68px] px-2.5 py-1">
                <div className="flex justify-between"><span>In charger Signature</span><span dir="rtl">توقيع المسؤول</span></div>
              </div>
            </div>

            {/* NOTES + FINAL SETTLEMENT TABLE */}
            <div className="grid grid-cols-12 gap-2 text-[9px] font-bold">
              <div className="col-span-7 border-2 border-gray-700 rounded-2xl min-h-[60px] px-2.5 py-1">
                <div className="text-right" dir="rtl">ملاحظات</div>
                <div className="font-normal text-[10px] text-blue-900 whitespace-pre-wrap">{contract.notes || ''}</div>
              </div>
              <div className="col-span-5 space-y-1">
                {[
                  { ar: 'المبلغ المستحق لمدة الإيجار', v: contract.totalPrice },
                  { ar: 'المبلغ المستحق للكيلومترات الزائدة', v: extraKmAmount || null },
                  { ar: 'المبلغ المستحق لأي حادث', v: deductions || null },
                  { ar: 'المبلغ الإجمالي', v: contract.totalPrice + deductions + extraKmAmount },
                ].map(r => (
                  <div key={r.ar} className="flex items-center justify-between border border-gray-700 rounded-lg overflow-hidden px-1.5 py-1">
                    <span dir="rtl">ر.ع</span>
                    <span className="flex-1 mx-2 text-center font-mono text-[11px] text-blue-900">{r.v !== null ? toEng(r.v) : ''}</span>
                    <span dir="rtl" className="text-right">{r.ar}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* FOOTER */}
            <div className="border-t border-gray-500 pt-1 flex items-center justify-between gap-2 text-[8.5px] text-gray-800">
              <div className="leading-tight text-left" dir="rtl">
                <div>مسقط، سلطنة عُمان — مرتفعات مطار، داخل محطة شل بترول، مكتب سند مسقط للاعمال</div>
              </div>
              <div className="leading-tight text-right font-bold text-[9.5px]" dir="rtl">
                أبو أرسام للتجارة ش.ش.و س.ت: ١٤٢٦٠٤٦ &nbsp; 94521746
              </div>
              <div className="w-9 h-9 border border-black p-0.5 bg-white shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full fill-black">
                  <rect x="0" y="0" width="30" height="30" /><rect x="5" y="5" width="20" height="20" fill="white" /><rect x="10" y="10" width="10" height="10" />
                  <rect x="70" y="0" width="30" height="30" /><rect x="75" y="5" width="20" height="20" fill="white" /><rect x="80" y="10" width="10" height="10" />
                  <rect x="0" y="70" width="30" height="30" /><rect x="5" y="75" width="20" height="20" fill="white" /><rect x="10" y="80" width="10" height="10" />
                  <rect x="40" y="40" width="20" height="20" /><rect x="70" y="70" width="15" height="15" /><rect x="50" y="70" width="10" height="20" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        </div>
      </motion.div>
    </div>
  );
}
