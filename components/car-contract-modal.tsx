'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Printer, Download, FileText, CheckCircle2, ShieldCheck, Car, Calendar, User, DollarSign } from 'lucide-react';
import OMRIcon from './omr-icon';

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
  fuelLevel?: string;
  // Customer Info
  customerName: string;
  customerPhone: string;
  customerNationalId?: string;
  customerPassport?: string;
  customerNationality?: string;
  // Rental Dates & Price
  startDate: string;
  endDate: string;
  rentalDays?: number;
  totalPrice: number;
  depositPaid: number;
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

  const contractDate = contract.date || new Date().toISOString().split('T')[0];
  const contractNumber = contract.contractNo || contract.id || `OM-${Date.now().toString().slice(-6)}`;
  const days = contract.rentalDays || 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto" dir="rtl">
      {/* CSS Print Styles for perfect 2-column A4 output */}
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
            color: #111827 !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 8mm;
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
        className="w-full max-w-4xl bg-[#0b172a] rounded-3xl border border-white/20 shadow-2xl overflow-hidden flex flex-col max-h-[94vh]"
      >
        {/* Modal Toolbar Header */}
        <div className="bg-[#0f1e37] px-5 py-4 border-b border-white/10 flex items-center justify-between no-print shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gold/15 border border-gold/30 text-gold flex items-center justify-center">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-white">قرارداد رسمی اجاره خودرو (دو زبانه)</h2>
              <p className="text-[11px] text-white/50">پیش‌نمایش سند، چاپ مستقیم و خروجی PDF رسمی</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-gold to-amber-500 text-black font-extrabold text-xs shadow-lg hover:brightness-110 active:scale-98 transition-all cursor-pointer"
            >
              <Printer size={16} />
              <span>چاپ و دانلود PDF</span>
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-900">
          <div
            id="printable-contract-container"
            ref={printRef}
            className="w-full bg-white text-gray-900 rounded-2xl p-6 sm:p-8 shadow-2xl text-xs space-y-5 font-sans leading-relaxed border border-gray-200"
          >
            {/* Header / Branding (Right: Persian | Center: Badge | Left: English) */}
            <div className="flex items-start justify-between border-b-2 border-gray-900 pb-4">
              {/* Persian Header (Right Side in RTL) */}
              <div className="text-right">
                <h1 className="text-lg font-black text-gray-900">خدمات بازرگانی و رنتال ابوآرسام</h1>
                <p className="text-[10px] font-bold text-gray-600">اجاره انواع خودروهای سدان و SUV در مسقط، سلطنت عُمان</p>
                <p className="text-[9.5px] text-gray-500 mt-0.5">تاریخ تنظیم: {contractDate}</p>
              </div>

              {/* Center Seal Badge */}
              <div className="text-center px-4">
                <div className="inline-block bg-gray-900 text-white px-3 py-1 rounded-md text-[11px] font-black uppercase tracking-wider mb-1">
                  VEHICLE RENTAL AGREEMENT
                </div>
                <div className="text-[11px] font-black text-gray-800">قرارداد رسمی اجاره خودرو</div>
                <div className="text-[10px] font-mono font-bold text-amber-600 mt-1">No: {contractNumber}</div>
              </div>

              {/* English Header (Left Side in LTR) */}
              <div className="text-left font-sans dir-ltr">
                <h1 className="text-lg font-black tracking-tight text-gray-900">ABU ARSAM SERVICES</h1>
                <p className="text-[10px] font-bold text-gray-600">Car Rental & Luxury Fleet Operations - Muscat, Oman</p>
                <p className="text-[9.5px] text-gray-500 mt-0.5">CR No: 1489201 | Tel: +968 91234567</p>
              </div>
            </div>

            {/* PARTIES INFORMATION (2 COLUMNS) */}
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3.5 rounded-xl border border-gray-300">
              {/* Persian Side (Right) */}
              <div className="space-y-1.5 text-right">
                <h3 className="font-extrabold text-gray-900 text-[11px] border-b border-gray-300 pb-1 mb-1.5 flex items-center gap-1">
                  <User size={13} className="text-amber-600" />
                  <span>مشخصات طرفین قرارداد:</span>
                </h3>
                <p><strong className="text-gray-700">موجر (شرکت):</strong> خدمات ابوآرسام (مسقط، عمان)</p>
                <p><strong className="text-gray-700">مستأجر (مشتری):</strong> {contract.customerName}</p>
                <p><strong className="text-gray-700">شماره تماس:</strong> <span className="font-mono dir-ltr inline-block">{contract.customerPhone}</span></p>
                {contract.customerNationalId && <p><strong className="text-gray-700">کد ملی / گذرنامه:</strong> {contract.customerNationalId}</p>}
              </div>

              {/* English Side (Left) */}
              <div className="space-y-1.5 text-left font-sans dir-ltr border-l border-gray-300 pl-3">
                <h3 className="font-extrabold text-gray-900 text-[11px] border-b border-gray-300 pb-1 mb-1.5 flex items-center justify-start gap-1 dir-ltr text-left">
                  <User size={13} className="text-amber-600" />
                  <span>Contract Parties Info:</span>
                </h3>
                <p><strong className="text-gray-700">Lessor:</strong> Abu Arsam Services (Muscat, Oman)</p>
                <p><strong className="text-gray-700">Lessee (Hirer):</strong> {contract.customerName}</p>
                <p><strong className="text-gray-700">Mobile Phone:</strong> <span className="font-mono">{contract.customerPhone}</span></p>
                {contract.customerNationalId && <p><strong className="text-gray-700">Passport / ID:</strong> {contract.customerNationalId}</p>}
              </div>
            </div>

            {/* VEHICLE & RENTAL DETAILS (2 COLUMNS) */}
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3.5 rounded-xl border border-gray-300">
              {/* Persian Vehicle & Financials (Right) */}
              <div className="space-y-1.5 text-right">
                <h3 className="font-extrabold text-gray-900 text-[11px] border-b border-gray-300 pb-1 mb-1.5 flex items-center gap-1">
                  <Car size={13} className="text-amber-600" />
                  <span>مشخصات خودرو و جزئیات اجاره:</span>
                </h3>
                <p><strong className="text-gray-700">نام و مدل خودرو:</strong> {contract.carTitle}</p>
                <p><strong className="text-gray-700">شماره پلاک:</strong> <span className="font-mono font-bold bg-gray-200 px-1.5 py-0.5 rounded text-[11px]">{contract.plateNumber}</span></p>
                <p><strong className="text-gray-700">تاریخ تحویل:</strong> {contract.startDate} | <strong className="text-gray-700">عودت:</strong> {contract.endDate} ({days} روز)</p>
                <p><strong className="text-gray-700">مبلغ کل قرارداد:</strong> <span className="font-extrabold text-emerald-700">{contract.totalPrice.toLocaleString()} OMR</span></p>
                <p><strong className="text-gray-700">ودیعه ضمانت (Deposit):</strong> <span className="font-bold text-amber-700">{contract.depositPaid.toLocaleString()} OMR</span></p>
              </div>

              {/* English Vehicle & Financials (Left) */}
              <div className="space-y-1.5 text-left font-sans dir-ltr border-l border-gray-300 pl-3">
                <h3 className="font-extrabold text-gray-900 text-[11px] border-b border-gray-300 pb-1 mb-1.5 flex items-center justify-start gap-1 dir-ltr text-left">
                  <Car size={13} className="text-amber-600" />
                  <span>Vehicle & Financial Specs:</span>
                </h3>
                <p><strong className="text-gray-700">Vehicle Model:</strong> {contract.carTitleEn || contract.carTitle}</p>
                <p><strong className="text-gray-700">Plate No:</strong> <span className="font-mono font-bold bg-gray-200 px-1.5 py-0.5 rounded text-[11px]">{contract.plateNumber}</span></p>
                <p><strong className="text-gray-700">Period:</strong> {contract.startDate} to {contract.endDate} ({days} Days)</p>
                <p><strong className="text-gray-700">Total Price:</strong> <span className="font-extrabold text-emerald-700">{contract.totalPrice.toLocaleString()} OMR</span></p>
                <p><strong className="text-gray-700">Security Deposit:</strong> <span className="font-bold text-amber-700">{contract.depositPaid.toLocaleString()} OMR</span></p>
              </div>
            </div>

            {/* BILINGUAL FORMAL TERMS AND CONDITIONS (2 EQUAL COLUMNS) */}
            <div className="border-t-2 border-gray-900 pt-3">
              <h3 className="text-center text-xs font-black text-gray-900 uppercase tracking-wide mb-3 bg-gray-100 py-1 rounded">
                شرایط و ضوابط قانونی اجاره خودرو | TERMS & CONDITIONS OF RENTAL AGREEMENT
              </h3>

              <div className="grid grid-cols-2 gap-4 text-[10.5px] leading-relaxed">
                {/* PERSIAN TERMS (RIGHT COLUMN) */}
                <div className="space-y-2.5 text-right">
                  <div>
                    <h4 className="font-extrabold text-gray-900">ماده ۱: سقف کیلومتر و سوخت</h4>
                    <p className="text-gray-700">سقف مجاز پیمایش روزانه ۲۰۰ کیلومتر می‌باشد. مازاد بر آن به ازای هر کیلومتر مبلغ ۰.۰۵۰ ریال عمان محاسبه خواهد شد. خودرو با همان میزان سوخت اولیه عودت داده می‌شود.</p>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-gray-900">ماده ۲: بیمه و تصادفات</h4>
                    <p className="text-gray-700">خودرو دارای بیمه بدنه و شخص ثالث می‌باشد. در صورت بروز هرگونه تصادف، ارائه کروکی و گزارش پلیس عمان (ROP) الزامی است. فرانشیز بیمه بر عهده مستأجر خواهد بود.</p>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-gray-900">ماده ۳: جرایم رانندگی و عوارض</h4>
                    <p className="text-gray-700">پرداخت کلیه جرایم رانندگی، عوارض جاده‌ای و ثبت تخلفات دوربین در طول مدت اجاره بر عهده مستأجر بوده و از مبلغ ودیعه کسر یا تسویه می‌گردد.</p>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-gray-900">ماده ۴: تاخیر در عودت و تحویل</h4>
                    <p className="text-gray-700">هرگونه تاخیر در تحویل خودرو بدون هماهنگی قبلی شامل جریمه تاخیر به میزان کرایه یک روز کامل به ازای هر ۳ ساعت تاخیر خواهد بود.</p>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-gray-900">ماده ۵: حل اختلاف</h4>
                    <p className="text-gray-700">این قرارداد تابع قوانین و مراجع قضایی سلطنت عُمان می‌باشد و امضاء مستأجر به منزله قبول کامل کلیه بندهاست.</p>
                  </div>
                </div>

                {/* ENGLISH TERMS (LEFT COLUMN) */}
                <div className="space-y-2.5 text-left font-sans dir-ltr border-l border-gray-300 pl-3">
                  <div>
                    <h4 className="font-extrabold text-gray-900">Article 1: Mileage & Fuel Policy</h4>
                    <p className="text-gray-700">Daily mileage limit is 200 km. Excess mileage will be charged at 0.050 OMR per km. The vehicle must be returned with the same fuel level as delivered.</p>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-gray-900">Article 2: Insurance & Accident Policy</h4>
                    <p className="text-gray-700">The vehicle is covered under comprehensive insurance. Official Royal Oman Police (ROP) report is mandatory for any claim. Deductible fee applies to hirer.</p>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-gray-900">Article 3: Fines & Toll Charges</h4>
                    <p className="text-gray-700">The hirer is fully liable for all traffic violations, speeding camera tickets, and tolls incurred during the rental period, deducted from the deposit.</p>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-gray-900">Article 4: Delayed Return</h4>
                    <p className="text-gray-700">Unapproved delay in returning the vehicle incurs a penalty fee equivalent to a full day rental rate for every 3 hours of delay.</p>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-gray-900">Article 5: Jurisdiction</h4>
                    <p className="text-gray-700">This agreement is governed by the laws of the Sultanate of Oman. The hirer's signature constitutes unconditional acceptance of all terms.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* SIGNATURES AND STAMPS BLOCK */}
            <div className="border-t-2 border-gray-900 pt-5 mt-4 grid grid-cols-2 gap-8 text-center">
              {/* Lessor Signature (Right) */}
              <div className="space-y-8">
                <div>
                  <h4 className="font-black text-gray-900 text-xs">امضاء و مهر شرکت موجر</h4>
                  <p className="text-[10px] text-gray-500 font-sans">Lessor Signature & Official Stamp</p>
                </div>
                <div className="h-16 border-b border-dashed border-gray-400 flex items-center justify-center text-gray-400 text-[10px] italic">
                  [ مهر رسمی ابوآرسام / Abu Arsam Seal ]
                </div>
              </div>

              {/* Lessee Signature (Left) */}
              <div className="space-y-8 font-sans">
                <div>
                  <h4 className="font-black text-gray-900 text-xs">امضاء و اثر انگشت مستأجر</h4>
                  <p className="text-[10px] text-gray-500 font-sans">Lessee Signature & Thumbprint</p>
                </div>
                <div className="h-16 border-b border-dashed border-gray-400 flex items-center justify-center text-gray-400 text-[10px] italic">
                  [ امضاء مستأجر / Hirer Signature ]
                </div>
              </div>
            </div>

            {/* Footer Notice */}
            <div className="text-center text-[9px] text-gray-500 pt-2 border-t border-gray-200">
              Abu Arsam Car Rental Services Muscat | Certified Official Contract Copy | {contractNumber}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
