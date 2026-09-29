/* eslint-disable @next/next/no-img-element */
import ContractHeader from './contract-header-template';
import ContractFooter from './contract-footer-template';
import type { ContractData } from '@/lib/contract-data';
import type { ContractAttachment, ContractAttachmentKind } from '@/lib/db-cars';

// The rental agreement exactly as it is downloaded: page 1 is the Oman paper form,
// the following pages hold the attached photos / video stills in framed tiles.
// Every page is a fixed A4-width block marked with data-pdf-page; lib/contract-pdf turns
// each one into a PDF page. Nothing here is interactive.

export const PAGE_WIDTH = 794; // A4 at 96 dpi
export const PAGE_HEIGHT = 1123;

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

const toEng = (val: unknown) => {
  if (val === undefined || val === null) return '';
  return String(val)
    .replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 1632));
};

function ContractSheet({ contract, signatureUrl }: { contract: ContractData; signatureUrl?: string | null }) {
  const contractDate = toEng(contract.date || new Date().toISOString().split('T')[0]);
  const contractNumber = (contract.contractNo || contract.id).toUpperCase();
  const dailyRate = contract.dailyRate || (contract.rentalDays ? contract.totalPrice / contract.rentalDays : 0);
  const initialKm = contract.initialOdometer || 0;
  const returnKm = contract.returnOdometer || 0;
  const fuelKey = fuelKeyOf(contract.fuelLevel);
  // Needle angle in radians (PI = Empty, 0 = Full); null leaves the dial blank for hand marking
  const fuelAngle: number | null = fuelKey ? FUEL_ANGLES[fuelKey] : null;
  const deductions = contract.deductionsAmount || 0;
  const extraKmAmount = contract.extraKmAmount || 0;

  return (
    <div
      data-pdf-page
      dir="ltr"
      style={{ width: PAGE_WIDTH }}
      className="bg-white text-black p-6 text-[11px] space-y-1.5 font-sans leading-tight font-medium"
    >
      <ContractHeader contractNumber={contractNumber} />

      {/* CUSTOMER LINES: English (left) — value — Arabic (right) */}
      <div className="border border-gray-700 divide-y divide-gray-500 text-[10px]">
        {[
          { en: "Customer's Name:", ar: 'إسم المستأجر:', value: contract.customerNameEn || contract.customerName, upper: true },
          { en: 'Res. Add. :', ar: 'العنوان الحالي:', value: contract.customerAddress || '' },
          { en: 'Work Add. :', ar: 'عنوان العمل:', value: contract.workAddress || '' },
          { en: 'Tel. :', ar: 'هاتف:', value: toEng(contract.customerPhone), mono: true },
          { en: 'Whatsapp No. :', ar: 'رقم واتس اب:', value: toEng(contract.whatsapp || contract.customerPhone), mono: true },
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
          {/* Artwork: public/contract/contractimage.png (1585x992). Overlay uses the same coordinate space. */}
          <div className="relative w-full" style={{ aspectRatio: '1585 / 992' }}>
            <img src="/contract/contractimage.png" alt="" className="absolute inset-0 w-full h-full object-contain" />
            <svg viewBox="0 0 1585 992" className="absolute inset-0 w-full h-full" fontFamily="monospace" fontWeight="bold">
              <text x="395" y="205" fontSize="54" textAnchor="end" fill="#1e3a8a">{toEng(contract.cleanInside)}</text>
              <text x="395" y="297" fontSize="54" textAnchor="end" fill="#1e3a8a">{toEng(contract.cleanOutside)}</text>
              {fuelAngle !== null && (
                <line
                  x1={1181 + 292 * Math.cos(fuelAngle)} y1={348 - 292 * Math.sin(fuelAngle)}
                  x2={1181 + 352 * Math.cos(fuelAngle)} y2={348 - 352 * Math.sin(fuelAngle)}
                  stroke="#dc2626" strokeWidth="14" strokeLinecap="round"
                />
              )}
            </svg>
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
              { ar: 'قيمة الأجرة في اليوم', en: 'Daily Rent Amount', value: dailyRate ? toEng(Math.round(dailyRate * 1000) / 1000) : '', mono: true },
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
          <br />I agree all the conditions of contract between me and the company after reading and understanding it&apos;s derails.
        </p>
        <p dir="rtl" className="text-justify text-gray-900">
          السيارة غير مؤمنة ضد الأضرار، وفي حال وقوع حادث وكان المستأجر هو المخطئ، فإن جميع الأضرار تقع على عاتقه.
        </p>
        <p className="text-gray-900">
          The car is not covered by comprehensive insurance, and in case of an accident where the renter is at fault, all damages will be the renter&apos;s responsibility.
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
          <div className="flex justify-between"><span>Renter&apos;s Signature</span><span dir="rtl">توقيع المستأجر</span></div>
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
        <div className="col-span-5 border-2 border-gray-700 rounded-2xl h-[68px] px-2.5 py-1 flex flex-col">
          <div className="flex justify-between"><span>In charger Signature</span><span dir="rtl">توقيع المسؤول</span></div>
          {/* Company signature from Settings */}
          {signatureUrl && (
            <div className="flex-1 min-h-0 flex items-center justify-center">
              <img src={signatureUrl} crossOrigin="anonymous" alt="" className="max-h-[44px] max-w-[70%] object-contain" />
            </div>
          )}
        </div>
      </div>

      {/* NOTES + FINAL SETTLEMENT TABLE */}
      <div className="grid grid-cols-12 gap-2 text-[9px] font-bold">
        <div className="col-span-7 border-2 border-gray-700 rounded-2xl min-h-[60px] px-2.5 py-1">
          <div className="text-right" dir="rtl">ملاحظات</div>
          <div className="font-normal text-[10px] text-blue-900 whitespace-pre-wrap" dir="auto">{contract.notes || ''}</div>
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

      <ContractFooter />
    </div>
  );
}

// ── Attachment pages ─────────────────────────────────────────────────────────

const KIND_LABELS: Record<ContractAttachmentKind, { fa: string; en: string; section: 'docs' | 'photos' | 'videos' }> = {
  licence: { fa: 'گواهینامه رانندگی', en: 'Driving Licence', section: 'docs' },
  passport: { fa: 'پاسپورت', en: 'Passport', section: 'docs' },
  car_photo: { fa: 'تصویر خودرو', en: 'Vehicle Photo', section: 'photos' },
  car_video: { fa: 'ویدیوی خودرو', en: 'Vehicle Video', section: 'videos' },
};

const SECTION_TITLES = {
  docs: { fa: 'مدارک هویتی مستأجر', en: 'RENTER DOCUMENTS' },
  photos: { fa: 'وضعیت خودرو هنگام تحویل', en: 'VEHICLE CONDITION' },
  videos: { fa: 'ویدیوهای خودرو', en: 'VEHICLE VIDEOS' },
};

// Fixed block heights (px) so pages can be filled without measuring the DOM
const CONTENT_HEIGHT = PAGE_HEIGHT - 64 /* padding */ - 92 /* header */ - 44 /* footer */;
const SECTION_HEADER_H = 40;
const DOC_ROW_H = 300; // 2 per row, document shown whole (object-contain)
const PHOTO_ROW_H = 224; // 3 per row

type Block =
  | { type: 'section'; section: keyof typeof SECTION_TITLES }
  | { type: 'row'; section: keyof typeof SECTION_TITLES; items: { att: ContractAttachment; index: number }[] };

function buildAttachmentPages(attachments: ContractAttachment[]): Block[][] {
  const bySection: Record<keyof typeof SECTION_TITLES, ContractAttachment[]> = { docs: [], photos: [], videos: [] };
  for (const a of attachments) bySection[KIND_LABELS[a.kind].section].push(a);

  const blocks: Block[] = [];
  (Object.keys(bySection) as (keyof typeof SECTION_TITLES)[]).forEach(section => {
    const list = bySection[section];
    if (!list.length) return;
    blocks.push({ type: 'section', section });
    const perRow = section === 'docs' ? 2 : 3;
    for (let i = 0; i < list.length; i += perRow) {
      blocks.push({ type: 'row', section, items: list.slice(i, i + perRow).map((att, k) => ({ att, index: i + k + 1 })) });
    }
  });

  const heightOf = (b: Block) => (b.type === 'section' ? SECTION_HEADER_H : b.section === 'docs' ? DOC_ROW_H : PHOTO_ROW_H);
  const pages: Block[][] = [];
  let page: Block[] = [];
  let used = 0;
  blocks.forEach((block, i) => {
    // A section title always travels with its first row
    const need = heightOf(block) + (block.type === 'section' && blocks[i + 1] ? heightOf(blocks[i + 1]) : 0);
    if (page.length && used + need > CONTENT_HEIGHT) {
      pages.push(page);
      page = [];
      used = 0;
      // A section that continues on the next page repeats its title there
      if (block.type === 'row') {
        page.push({ type: 'section', section: block.section });
        used += SECTION_HEADER_H;
      }
    }
    page.push(block);
    used += heightOf(block);
  });
  if (page.length) pages.push(page);
  return pages;
}

function Tile({ att, index, doc }: { att: ContractAttachment; index: number; doc: boolean }) {
  const label = KIND_LABELS[att.kind];
  const isVideo = att.kind === 'car_video';
  const src = isVideo ? att.posterUrl : att.url;
  const imageH = doc ? DOC_ROW_H - 64 : PHOTO_ROW_H - 58;
  return (
    <div
      className="rounded-2xl border border-[#e6dcc4] bg-white p-2 shadow-[0_2px_10px_rgba(15,42,92,0.08)]"
      style={{ height: (doc ? DOC_ROW_H : PHOTO_ROW_H) - 12 }}
    >
      <div
        className={`relative overflow-hidden rounded-xl ${doc ? 'bg-[#f4f1ea]' : 'bg-[#0f2a5c]'}`}
        style={{ height: imageH }}
        {...(isVideo ? { 'data-pdf-link': att.url } : {})}
      >
        {src ? (
          <img src={src} crossOrigin="anonymous" alt="" className={`h-full w-full ${doc ? 'object-contain' : 'object-cover'}`} />
        ) : (
          <div className="flex h-full items-center justify-center text-[11px] font-bold text-white/70">VIDEO</div>
        )}
        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-lg">
              <div className="ml-1 h-0 w-0 border-y-[10px] border-l-[16px] border-y-transparent border-l-[#0f2a5c]" />
            </div>
          </div>
        )}
        <div className="absolute top-2 left-2 rounded-full bg-[#c9a04a] px-2 py-0.5 text-[9px] font-black text-white">{index}</div>
      </div>
      <div className="flex items-center justify-between px-1 pt-1.5 text-[10px]">
        <span className="font-semibold tracking-wide text-gray-500">{label.en}</span>
        <span dir="rtl" className="font-black text-[#0f2a5c]">
          {label.fa}
          {isVideo && <span className="font-bold text-[#c9a04a]"> · لینک ویدیو</span>}
        </span>
      </div>
    </div>
  );
}

function AttachmentPage({ contract, blocks, pageNo, pageCount }: { contract: ContractData; blocks: Block[]; pageNo: number; pageCount: number }) {
  return (
    <div data-pdf-page dir="ltr" style={{ width: PAGE_WIDTH, height: PAGE_HEIGHT }} className="relative flex flex-col bg-white px-8 py-8 font-sans text-black">
      {/* Header band */}
      <div className="flex items-center justify-between border-b-2 border-[#c9a04a] pb-3" style={{ height: 92 - 12 }}>
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="" className="h-12 w-auto object-contain" />
          <div>
            <div className="text-[13px] font-black tracking-[0.2em] text-[#0f2a5c]">CONTRACT ATTACHMENTS</div>
            <div className="font-mono text-[10px] text-gray-500">No. {(contract.contractNo || contract.id).toUpperCase()}</div>
          </div>
        </div>
        <div dir="rtl" className="text-right">
          <div className="text-[14px] font-black text-[#0f2a5c]">پیوست تصاویر قرارداد</div>
          <div className="text-[10.5px] font-semibold text-gray-600">
            {contract.customerName} · {contract.carTitle} · <span className="font-mono">{toEng(contract.plateNumber)}</span>
          </div>
        </div>
      </div>

      <div className="mt-3 flex-1">
        {blocks.map((block, i) =>
          block.type === 'section' ? (
            <div key={i} className="flex items-center gap-3" style={{ height: SECTION_HEADER_H }}>
              <span className="h-5 w-1.5 rounded-full bg-[#c9a04a]" />
              <span className="text-[11px] font-black tracking-[0.18em] text-[#0f2a5c]">{SECTION_TITLES[block.section].en}</span>
              <span className="h-px flex-1 bg-[#e6dcc4]" />
              <span dir="rtl" className="text-[12.5px] font-black text-[#0f2a5c]">{SECTION_TITLES[block.section].fa}</span>
            </div>
          ) : (
            <div
              key={i}
              className={`grid gap-3 ${block.section === 'docs' ? 'grid-cols-2' : 'grid-cols-3'}`}
              style={{ height: block.section === 'docs' ? DOC_ROW_H : PHOTO_ROW_H }}
            >
              {block.items.map(({ att, index }) => (
                <Tile key={`${index}-${att.url}`} att={att} index={index} doc={block.section === 'docs'} />
              ))}
            </div>
          )
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-[#e6dcc4] pt-2 text-[9.5px] font-semibold text-gray-500" style={{ height: 44 - 8 }}>
        <span>ARSAM RENT A CAR · Muscat, Oman</span>
        <span className="font-mono">
          {pageNo} / {pageCount}
        </span>
        <span dir="rtl">أبو أرسام لإستئجار السيارات</span>
      </div>
    </div>
  );
}

/** Page 1 (paper form) followed by the attachment pages. */
export default function ContractDocument({ contract, signatureUrl }: { contract: ContractData; signatureUrl?: string | null }) {
  const pages = buildAttachmentPages(contract.attachments || []);
  return (
    <div className="flex flex-col gap-6">
      <ContractSheet contract={contract} signatureUrl={signatureUrl} />
      {pages.map((blocks, i) => (
        <AttachmentPage key={i} contract={contract} blocks={blocks} pageNo={i + 2} pageCount={pages.length + 1} />
      ))}
    </div>
  );
}
