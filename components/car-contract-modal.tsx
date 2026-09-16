'use client';

import { useRef } from 'react';
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
}

interface CarContractModalProps {
  contract: ContractData;
  onClose: () => void;
}

export default function CarContractModal({ contract, onClose }: CarContractModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

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
  const days = contract.rentalDays || 1;
  const initialKm = contract.initialOdometer || 135597;
  const returnKm = contract.returnOdometer || '';
  const fuelStatus = contract.fuelLevel || 'فول (Full)';
  const deductions = contract.deductionsAmount || 0;
  const netRefund = (contract.netRefundable !== undefined) 
    ? contract.netRefundable 
    : Math.max(0, contract.depositPaid - deductions);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto" dir="rtl">
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
          #printable-contract-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: #ffffff !important;
            color: #000000 !important;
            padding: 4mm !important;
            margin: 0 !important;
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
        className="w-full max-w-4xl bg-[#0b172a] rounded-3xl border border-white/20 shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
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
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-900">
          <div
            id="printable-contract-container"
            ref={printRef}
            className="w-full bg-white text-black p-4 sm:p-6 shadow-2xl text-[11px] space-y-2.5 font-sans leading-tight border border-gray-400 font-medium"
          >
            {/* HEADER BRANDING BANNER MATCHING OMAN CONTRACT */}
            <div className="border-b-2 border-red-700 pb-2 flex items-center justify-between">
              <div className="text-right w-1/3">
                <span className="text-[10px] text-gray-600 block">CAR RENTAL AGREEMENT</span>
                <span className="font-mono font-bold text-xs text-gray-800">No: {contractNumber}</span>
              </div>

              <div className="text-center w-1/3 space-y-0.5">
                <div className="bg-red-700 text-white py-1 px-3 rounded font-black text-sm uppercase tracking-wider inline-block">
                  ARSAM RENT CAR
                </div>
                <div className="text-xs font-black text-red-700 dir-rtl">أبو أرسام لإستئجار السيارات</div>
                <div className="text-[9.5px] font-bold text-gray-700 dir-ltr font-mono">
                  Call & WhatsApp: 94521746 | C.R: 1426046
                </div>
              </div>

              <div className="text-left w-1/3 font-black text-sm text-gray-900 dir-rtl">
                عقــد إيجــار سيارات
                <div className="text-[9.5px] font-normal text-gray-600 mt-0.5">التاريخ / Date: {contractDate}</div>
              </div>
            </div>

            {/* SECTION 1: HIRER / CUSTOMER INFORMATION GRID */}
            <div className="border border-black rounded overflow-hidden divide-y divide-black text-[10.5px]">
              <div className="grid grid-cols-2 divide-x divide-x-reverse divide-black bg-gray-50">
                <div className="p-1.5 flex justify-between items-center">
                  <span className="font-bold text-gray-700">إسم المستأجر:</span>
                  <span className="font-black text-black uppercase font-mono">{contract.customerNameEn || contract.customerName}</span>
                  <span className="text-[9px] text-gray-500 font-sans">Customer's Name:</span>
                </div>
                <div className="p-1.5 flex justify-between items-center">
                  <span className="font-bold text-gray-700">العنوان الحالي:</span>
                  <span className="font-bold text-black">{contract.customerAddress || 'Muscat, Oman'}</span>
                  <span className="text-[9px] text-gray-500 font-sans">Res. Add. :</span>
                </div>
              </div>

              <div className="grid grid-cols-2 divide-x divide-x-reverse divide-black bg-gray-50">
                <div className="p-1.5 flex justify-between items-center">
                  <span className="font-bold text-gray-700">عنوان العمل:</span>
                  <span className="font-bold text-black">-</span>
                  <span className="text-[9px] text-gray-500 font-sans">Work Add. :</span>
                </div>
                <div className="p-1.5 flex justify-between items-center">
                  <span className="font-bold text-gray-700">هاتف / واتس اب:</span>
                  <span className="font-mono font-bold text-black dir-ltr">{toEng(contract.customerPhone)}</span>
                  <span className="text-[9px] text-gray-500 font-sans">Tel & Whatsapp:</span>
                </div>
              </div>

              <div className="grid grid-cols-4 divide-x divide-x-reverse divide-black text-center text-[10px] bg-white">
                <div className="p-1">
                  <div className="text-gray-600 text-[9px]">الجنسية / Nationality</div>
                  <div className="font-bold uppercase mt-0.5">{contract.customerNationality || 'IRANI'}</div>
                </div>
                <div className="p-1">
                  <div className="text-gray-600 text-[9px]">نوع الرخصة / Type of Licence</div>
                  <div className="font-bold uppercase mt-0.5">{contract.licenceType || 'INTER'}</div>
                </div>
                <div className="p-1">
                  <div className="text-gray-600 text-[9px]">رخصة قيادة رقم / Licence No.</div>
                  <div className="font-mono font-bold mt-0.5">{toEng(contract.licenceNo || '68246175')}</div>
                </div>
                <div className="p-1">
                  <div className="text-gray-600 text-[9px]">بطاقة / جواز السفر / Passport ID</div>
                  <div className="font-mono font-bold mt-0.5">{toEng(contract.customerNationalId || contract.customerPassport || 'H64229853')}</div>
                </div>
              </div>
            </div>

            {/* SECTION 2: VEHICLE SPECS, HANDOVER & DIAGRAM MATRIX */}
            <div className="grid grid-cols-12 gap-2 text-[10px]">
              {/* Left Column: Cleanliness, Fuel Dial & Car Body Diagram */}
              <div className="col-span-5 border border-black rounded p-1.5 space-y-1.5 bg-gray-50 flex flex-col justify-between">
                <div className="flex justify-between items-center text-[9.5px] border-b border-gray-300 pb-1">
                  <div>
                    <span className="font-bold">مستوى النظافة / Cleanliness</span>
                  </div>
                  <div className="space-x-1 space-x-reverse font-mono">
                    <span>داخل 10/<strong className="text-black">9</strong></span>
                    <span>خارج 10/<strong className="text-black">9</strong></span>
                  </div>
                </div>

                {/* Fuel dial gauge graphic */}
                <div className="flex items-center justify-around py-1 bg-white rounded border border-gray-200">
                  <span className="text-[9px] font-bold text-gray-500">E</span>
                  <div className="w-24 h-5 relative flex items-center justify-center">
                    <svg viewBox="0 0 100 30" className="w-full h-full">
                      <path d="M10 25 A 40 40 0 0 1 90 25" stroke="#94a3b8" strokeWidth="3" fill="none" />
                      <line x1="10" y1="25" x2="10" y2="18" stroke="#ef4444" strokeWidth="2" />
                      <line x1="50" y1="10" x2="50" y2="17" stroke="#64748b" strokeWidth="2" />
                      <line x1="90" y1="25" x2="90" y2="18" stroke="#22c55e" strokeWidth="2" />
                      {/* Needle pointing to Full */}
                      <line x1="50" y1="25" x2="82" y2="14" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" />
                      <circle cx="50" cy="25" r="3" fill="#000000" />
                    </svg>
                  </div>
                  <span className="text-[9px] font-bold text-gray-500">F</span>
                  <span className="text-[9.5px] font-bold text-blue-800">{fuelStatus}</span>
                </div>

                {/* Vehicle sedan outline graphic */}
                <div className="p-1 bg-white rounded border border-gray-200 flex items-center justify-center">
                  <svg viewBox="0 0 200 60" className="w-full h-12 stroke-black fill-none stroke-[1.5]">
                    {/* Top view & side view sedan outline */}
                    <rect x="10" y="15" width="180" height="30" rx="8" stroke="#334155" strokeWidth="1.5" />
                    <line x1="50" y1="15" x2="65" y2="25" stroke="#475569" />
                    <line x1="150" y1="15" x2="135" y2="25" stroke="#475569" />
                    <line x1="50" y1="45" x2="65" y2="35" stroke="#475569" />
                    <line x1="150" y1="45" x2="135" y2="35" stroke="#475569" />
                    <circle cx="35" cy="15" r="4" fill="#94a3b8" />
                    <circle cx="165" cy="15" r="4" fill="#94a3b8" />
                    <circle cx="35" cy="45" r="4" fill="#94a3b8" />
                    <circle cx="165" cy="45" r="4" fill="#94a3b8" />
                  </svg>
                </div>

                <div className="text-[8.5px] text-gray-700 text-center leading-tight bg-yellow-50 p-1 rounded border border-yellow-200 font-bold">
                  خاص بالإيجار قصير الأجل فقط ما يزيد عن ۲۰۰ كم يحسب بواقع ۵۰ بيسة لكل كم
                  <div className="text-[8px] font-sans font-normal">EXCESS OF 200 KM 0.050 BZS PER KM WILL BE CHARGED APPLICABLE FOR SHORT TERM LEASE ONLY</div>
                </div>
              </div>

              {/* Right Column: 3-column Grid for Vehicle & Handover Details */}
              <div className="col-span-7 border border-black rounded overflow-hidden divide-y divide-black bg-white">
                <div className="grid grid-cols-3 divide-x divide-x-reverse divide-black p-1 text-center bg-gray-100 font-bold text-[9.5px]">
                  <div>
                    <span className="text-gray-600 block text-[8.5px]">نوع السيارة / Type of Car</span>
                    <span className="uppercase font-extrabold text-black text-xs">{contract.carTitle}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 block text-[8.5px]">اللون / Colour</span>
                    <span className="uppercase font-bold text-black">{contract.color || 'WHITE'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 block text-[8.5px]">رقم اللوحة / Plate No.</span>
                    <span className="font-mono font-extrabold text-black text-xs">{toEng(contract.plateNumber)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 divide-x divide-x-reverse divide-black p-1 text-center text-[9.5px]">
                  <div>
                    <span className="text-gray-600 block text-[8.5px]">تاريخ المغادرة / Departure Date</span>
                    <span className="font-mono font-bold">{toEng(contract.startDate)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 block text-[8.5px]">الأجرة اليومية / Daily Rent</span>
                    <span className="font-mono font-bold text-black">{toEng(contract.dailyRate || contract.totalPrice / days)} OMR</span>
                  </div>
                  <div>
                    <span className="text-gray-600 block text-[8.5px]">المبلغ المدفوع / Paid Amount</span>
                    <span className="font-mono font-bold text-black">{toEng(contract.depositPaid || contract.totalPrice)} OMR</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 divide-x divide-x-reverse divide-black p-1 text-center text-[9.5px]">
                  <div>
                    <span className="text-gray-600 block text-[8.5px]">وقت الخروج / Departure Time</span>
                    <span className="font-mono font-bold">{toEng(contract.departureTime || '12:00')}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 block text-[8.5px]">الكيلومتر عند الخروج / KM Exit</span>
                    <span className="font-mono font-bold text-black">{toEng(initialKm.toLocaleString())} KM</span>
                  </div>
                  <div>
                    <span className="text-gray-600 block text-[8.5px]">مدة الإيجار / Rent Duration</span>
                    <span className="font-mono font-bold text-black">{toEng(days)} DAYS</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 divide-x divide-x-reverse divide-black p-1 text-center text-[9.5px]">
                  <div>
                    <span className="text-gray-600 block text-[8.5px]">تاريخ العودة / Return Date</span>
                    <span className="font-mono font-bold">{toEng(contract.endDate)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 block text-[8.5px]">وقت العودة / Return Time</span>
                    <span className="font-mono font-bold">{toEng(contract.returnTime || '12:00')}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 block text-[8.5px]">الكيلومتر عند العودة / KM Return</span>
                    <span className="font-mono font-bold text-black">{returnKm ? `${toEng(returnKm.toLocaleString())} KM` : '-'}</span>
                  </div>
                </div>

                <div className="p-1 text-center bg-gray-50">
                  <span className="text-gray-600 text-[8.5px] inline-block ml-2">الكيلومترات الزائدة / Extra KM:</span>
                  <span className="font-mono font-bold text-black">0 KM</span>
                </div>
              </div>
            </div>

            {/* SECTION 3: IMPORTANT NOTICE RED BANNER */}
            <div className="bg-red-600 text-white rounded p-1.5 text-center space-y-0.5 shadow-sm">
              <div className="font-black text-[11px] tracking-wide uppercase">
                IMPORTANT NOTICE تنبيه هام
              </div>
              <div className="text-[9px] leading-tight font-medium dir-rtl">
                يجب على المستأجر أن يقرأ بعناية ويفهم جيدا جميع الشروط الواردة أعلاه وعلى ظهر عقد الإيجار هذا قبل التوقيع عليه.
              </div>
              <div className="text-[8.5px] leading-tight font-sans dir-ltr opacity-95">
                THE RENTER SHOULD READ AND UNDERSTAND OUR TERMS & CONDITIONS WHICH ARE PRINTED ABOVE AND ON THE REVERSE SIDE OF RENTAL AGREEMENT BEFORE SIGNING THE AGREEMENT.
              </div>
            </div>

            {/* SECTION 4: UNDERTAKING & REGULATIONS (TRILINGUAL) */}
            <div className="border border-black rounded p-2 bg-gray-50 text-[9.5px] leading-tight space-y-1">
              <div className="flex justify-between items-center border-b border-gray-300 pb-1 font-bold text-[10px]">
                <span className="text-red-700">NO SMOKING IN CAR / ممنوع التدخين في السيارة</span>
                <span className="text-black">إقرار وتعهد من المستأجر</span>
                <span className="text-blue-800">FASTEN YOUR SEAT BELT / أربط حزام الأمان</span>
              </div>

              <div className="text-justify text-gray-900 dir-rtl space-y-0.5">
                <p>
                  إقرار وتعهد بأنني قرأت الشروط والبنود الواردة خلف هذا العقد وأني موافق عليها وأتعهد بدفع جميع المخالفات المرورية وأتحمل مسؤولية السيارة التي استأجرتها حسب عقد الإيجار كاملاً، وإذا لاسمح الله ووقع حادث أو أصيبت عطل فني من جراء الاستخدام سأقوم بدفع قيمة التصليح + فترة وقوف السيارة في الجراج.
                </p>
                <p dir="ltr" className="text-left font-sans text-[8.5px] text-gray-700">
                  I have read and agree to the terms and conditions on the back side of this agreement and I agree to pay all traffic violation fees. I am taking delivery of this car in good condition and depositing my ID / passport with my self according to my wish.
                </p>
                <p className="text-red-800 font-bold text-[9px] bg-red-100 p-0.5 rounded border border-red-200">
                  سیگار کشیدن درون خودرو ممنوع می‌باشد و در صورت تصادف، کلیه خسارات بر عهده مقصر حادثه خواهد بود. سیگار کشیدن درون خودرو ممنوع بوده و ۵۰ ریال عمان جریمه دارد.
                </p>
              </div>
            </div>

            {/* SECTION 5: SIGNATURES BLOCK & PAYMENT SUMMARY TABLE */}
            <div className="grid grid-cols-12 gap-2 text-[10px]">
              {/* Left Side: Signatures & Dates */}
              <div className="col-span-7 border border-black rounded p-2 flex flex-col justify-between space-y-3 bg-white">
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="border border-dashed border-gray-400 p-2 rounded">
                    <div className="font-bold text-gray-800 text-[10px]">توقيع المستأجر</div>
                    <div className="text-[8.5px] text-gray-500 font-sans">Renter's Signature</div>
                    <div className="h-10 flex items-center justify-center font-serif text-gray-400 text-xs italic">
                      [ Ali Noei ]
                    </div>
                  </div>

                  <div className="border border-dashed border-gray-400 p-2 rounded">
                    <div className="font-bold text-gray-800 text-[10px]">توقيع المسؤول</div>
                    <div className="text-[8.5px] text-gray-500 font-sans">In Charge Signature</div>
                    <div className="h-10 flex items-center justify-center font-serif text-gray-400 text-xs italic">
                      [ Arsam Admin ]
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[9.5px] border-t border-gray-300 pt-1 font-mono">
                  <span>اليوم / Day: <strong>{new Date().toLocaleDateString('ar-OM', { weekday: 'long' })}</strong></span>
                  <span>التاريخ / Date: <strong>{contractDate}</strong></span>
                </div>
              </div>

              {/* Right Side: Financial Payment Summary Table */}
              <div className="col-span-5 border border-black rounded overflow-hidden divide-y divide-black bg-gray-50 text-[9.5px]">
                <div className="p-1 flex justify-between items-center bg-gray-100 font-bold">
                  <span>المبلغ المستحق لمدة الإيجار</span>
                  <span className="font-mono">{toEng(contract.totalPrice)} OMR</span>
                </div>
                <div className="p-1 flex justify-between items-center">
                  <span>المبلغ المستحق لكيلومترات الزائدة</span>
                  <span className="font-mono">0.000 OMR</span>
                </div>
                <div className="p-1 flex justify-between items-center">
                  <span>المبلغ المستحق لأي حادث</span>
                  <span className="font-mono">{toEng(deductions)} OMR</span>
                </div>
                <div className="p-1 flex justify-between items-center bg-yellow-100 font-black text-black text-[10.5px]">
                  <span>المبلغ الإجمالي / Total</span>
                  <span className="font-mono text-red-700">{toEng(contract.totalPrice + deductions)} OMR</span>
                </div>
                <div className="p-1 text-[8.5px] text-gray-600">
                  <span className="font-bold text-gray-800 block">ملاحظات / Remarks:</span>
                  {contract.notes || 'تسویه‌شده با موفقیت'}
                </div>
              </div>
            </div>

            {/* SECTION 6: FOOTER WITH STAMP ADDRESS & QR CODE */}
            <div className="border-t border-black pt-1.5 flex items-center justify-between text-[8.5px] text-gray-800">
              <div className="flex items-center gap-2">
                {/* SVG QR Code */}
                <div className="w-9 h-9 border border-black p-0.5 bg-white">
                  <svg viewBox="0 0 100 100" className="w-full h-full fill-black">
                    <rect x="0" y="0" width="30" height="30" />
                    <rect x="5" y="5" width="20" height="20" fill="white" />
                    <rect x="10" y="10" width="10" height="10" />
                    
                    <rect x="70" y="0" width="30" height="30" />
                    <rect x="75" y="5" width="20" height="20" fill="white" />
                    <rect x="80" y="10" width="10" height="10" />

                    <rect x="0" y="70" width="30" height="30" />
                    <rect x="5" y="75" width="20" height="20" fill="white" />
                    <rect x="10" y="80" width="10" height="10" />

                    <rect x="40" y="40" width="20" height="20" />
                    <rect x="70" y="70" width="15" height="15" />
                    <rect x="50" y="70" width="10" height="20" />
                  </svg>
                </div>

                <div className="leading-tight dir-rtl">
                  <div className="font-bold text-black text-[9.5px]">أبو أرسام للتجارة ش ش و | س.ت: ١٤٢٦٠٤٦ | 📞 ٩٤٥٢١٧٤٦</div>
                  <div className="text-gray-600">📍 مسقط، سلطنة عُمان - مرتفعات المطار، داخل محطة شل بترول، مكتب سند مسقط للاعمال</div>
                </div>
              </div>

              <div className="text-left font-mono text-[8px] text-gray-500 dir-ltr">
                Abu Arsam Services - Oman
                <br />
                Official Printed Copy - {contractNumber}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
