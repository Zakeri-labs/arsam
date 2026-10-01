'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  X, ChevronLeft, ChevronRight, UserRound, Car as CarIcon, CalendarClock, Images, CheckCircle2,
  Download, Link2, Share2, Pencil, Loader2, Trash2, Plus, Film, IdCard, BookUser, Camera, AlertTriangle, Ban,
} from 'lucide-react';
import FancySelect from '@/components/ui/fancy-select';
import CompactPicker, { type CompactPickerOption } from '@/components/compact-picker';
import NumericInput from '@/components/numeric-input';
import { confirmDialog } from '@/components/confirm-dialog';
import {
  type Car, type CarContract, type CarReservation, type ContractAttachment, type ContractAttachmentKind, type FuelLevel,
  HANDOVER_CHECKLIST_ITEMS, cleanCarTitle, cleanCarPlate, carModelName,
} from '@/lib/db-cars';
import { buildContractData } from '@/lib/contract-data';
import { MAX_VIDEO_SECONDS, MediaError, compressImage, prepareVideo, uploadContractFile } from '@/lib/contract-media';
import { contractShareUrl, revokeContractLink, REVOKE_LINK_MESSAGE, useContractPdf } from './use-contract-pdf';

// Handover record + rental agreement in steps: every field printed on the contract is asked here,
// photos/videos are optional, and the finished contract is only ever downloaded as a PDF.

type HandoverStatus = CarContract['handoverStatus'];
type DepositStatus = CarContract['depositStatus'];

interface Draft {
  id?: string;
  reservationId: string;
  // Customer
  customerName: string;
  customerNameEn: string;
  customerPhone: string;
  whatsapp: string;
  customerNationality: string;
  customerNationalId: string;
  licenceType: string;
  licenceNo: string;
  customerAddress: string;
  workAddress: string;
  // Car & handover
  carTitle: string;
  carTitleEn: string;
  plateNumber: string;
  color: string;
  initialOdometer: number;
  returnOdometer: number;
  fuelLevel: FuelLevel;
  cleanInside: string;
  cleanOutside: string;
  handoverStatus: HandoverStatus;
  depositStatus: DepositStatus;
  checklist: Record<string, boolean>;
  // Dates & amounts
  contractDate: string;
  startDate: string;
  departureTime: string;
  endDate: string;
  returnTime: string;
  rentalDays: number;
  dailyRate: number;
  totalPrice: number;
  depositAmount: number;
  extraKm: string;
  extraKmAmount: number;
  deductionsAmount: number;
  notes: string;
  attachments: ContractAttachment[];
}

const STEPS = [
  { key: 'customer', title: 'مشتری', icon: UserRound },
  { key: 'car', title: 'خودرو و تحویل', icon: CarIcon },
  { key: 'rental', title: 'زمان و مبالغ', icon: CalendarClock },
  { key: 'media', title: 'تصاویر', icon: Images },
  { key: 'done', title: 'قرارداد', icon: CheckCircle2 },
] as const;

const today = () => new Date().toISOString().split('T')[0];
const nowTime = () => new Date().toTimeString().slice(0, 5);
const allChecked = () => Object.fromEntries(HANDOVER_CHECKLIST_ITEMS.map(i => [i.key, true]));

function daysBetween(start: string, end: string) {
  if (!start || !end) return 0;
  const d = Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / 86400000);
  return Number.isFinite(d) ? Math.max(1, d) : 0;
}

function draftFromContract(c: CarContract): Draft {
  return {
    id: c.id,
    reservationId: c.reservationId || '',
    customerName: c.customerName || '',
    customerNameEn: c.customerNameEn || '',
    customerPhone: c.customerPhone || '',
    whatsapp: c.whatsapp || '',
    customerNationality: c.customerNationality || '',
    customerNationalId: c.customerNationalId || '',
    licenceType: c.licenceType || '',
    licenceNo: c.licenceNo || '',
    customerAddress: c.customerAddress || '',
    workAddress: c.workAddress || '',
    carTitle: c.carTitle || '',
    carTitleEn: c.carTitleEn || '',
    plateNumber: c.plateNumber || '',
    color: c.color || '',
    initialOdometer: c.initialOdometer || 0,
    returnOdometer: c.returnOdometer || 0,
    fuelLevel: c.fuelLevel || 'full',
    cleanInside: c.cleanInside || '',
    cleanOutside: c.cleanOutside || '',
    handoverStatus: c.handoverStatus === 'pending_delivery' ? 'delivered' : c.handoverStatus,
    depositStatus: c.depositStatus || 'held',
    checklist: c.checklist && Object.keys(c.checklist).length ? c.checklist : allChecked(),
    contractDate: c.contractDate || (c.createdAt ? c.createdAt.split('T')[0] : today()),
    startDate: c.startDate || '',
    departureTime: c.departureTime || '',
    endDate: c.endDate || '',
    returnTime: c.returnTime || '',
    rentalDays: c.rentalDays || 0,
    dailyRate: c.dailyRate || 0,
    totalPrice: c.totalPrice || 0,
    depositAmount: c.depositAmount || 0,
    extraKm: c.extraKm || '',
    extraKmAmount: c.extraKmAmount || 0,
    deductionsAmount: c.deductionsAmount || 0,
    notes: c.notes || '',
    attachments: c.attachments || [],
  };
}

// Reservation / car / earlier contracts prefill everything they know
function fillFromReservation(d: Draft, res: CarReservation | undefined, cars: Car[], contracts: CarContract[]): Draft {
  if (!res) return d;
  const car = cars.find(c => c.id === res.carId);
  const plate = car?.plateNumber || d.plateNumber;
  const lastCnt = contracts.find(c => plate && c.plateNumber === plate && c.id !== d.id);
  const days = daysBetween(res.startDate, res.endDate);
  return {
    ...d,
    reservationId: res.id,
    customerName: res.customerName || d.customerName,
    customerPhone: res.customerPhone || d.customerPhone,
    customerNationalId: res.customerNationalId || d.customerNationalId,
    carTitle: res.carTitle || car?.title || d.carTitle,
    carTitleEn: car?.titleEn || d.carTitleEn,
    plateNumber: plate,
    color: car?.color || d.color,
    initialOdometer: d.initialOdometer || (lastCnt ? lastCnt.returnOdometer || lastCnt.initialOdometer : 0),
    startDate: res.startDate,
    endDate: res.endDate,
    rentalDays: days,
    totalPrice: res.totalPrice || d.totalPrice,
    dailyRate: days && res.totalPrice ? Math.round((res.totalPrice / days) * 1000) / 1000 : car?.dailyRate || d.dailyRate,
    depositAmount: res.depositPaid || car?.depositAmount || d.depositAmount,
  };
}

// Auto-issued contracts only hold the basics: fill what is still empty from the reservation and the car
function fillGaps(d: Draft, res: CarReservation | undefined, cars: Car[], contracts: CarContract[]): Draft {
  if (!res) return d;
  const filled = fillFromReservation(d, res, cars, contracts);
  const out = { ...d };
  (Object.keys(filled) as (keyof Draft)[]).forEach(k => {
    const cur = out[k];
    if (cur === '' || cur === 0 || cur === undefined) (out as any)[k] = filled[k];
  });
  return out;
}

function emptyDraft(): Draft {
  return {
    reservationId: '', customerName: '', customerNameEn: '', customerPhone: '', whatsapp: '', customerNationality: '',
    customerNationalId: '', licenceType: '', licenceNo: '', customerAddress: '', workAddress: '', carTitle: '', carTitleEn: '',
    plateNumber: '', color: '', initialOdometer: 0, returnOdometer: 0, fuelLevel: 'full', cleanInside: '', cleanOutside: '',
    handoverStatus: 'delivered', depositStatus: 'held', checklist: allChecked(), contractDate: today(), startDate: today(),
    departureTime: nowTime(), endDate: today(), returnTime: '', rentalDays: 1, dailyRate: 0, totalPrice: 0, depositAmount: 0,
    extraKm: '', extraKmAmount: 0, deductionsAmount: 0, notes: '', attachments: [],
  };
}

// ── Small form pieces ────────────────────────────────────────────────────────

const inputCls =
  'w-full rounded-xl border border-white/15 bg-[#07111f] px-3 py-2.5 text-[12.5px] leading-5 text-white placeholder:text-white/25 outline-none transition-colors focus:border-gold/70 focus:ring-2 focus:ring-gold/15';

function Field({ label, required, hint, children, className = '' }: { label: string; required?: boolean; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-[11.5px] font-bold text-white/75">
          {label}
          {required && <span className="text-rose-400"> *</span>}
        </span>
        {hint && <span className="text-[10px] text-white/35">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h4 className="flex items-center gap-2 text-[11px] font-black tracking-wide text-gold">
        <span className="h-3.5 w-1 rounded-full bg-gold" />
        {title}
      </h4>
      {children}
    </section>
  );
}

const FUEL_OPTIONS: { value: FuelLevel; label: string }[] = [
  { value: 'empty', label: 'خالی' },
  { value: 'quarter', label: '۱/۴' },
  { value: 'half', label: '۱/۲' },
  { value: 'three_quarters', label: '۳/۴' },
  { value: 'full', label: 'پر' },
];

function FuelPicker({ value, onChange }: { value: FuelLevel; onChange: (v: FuelLevel) => void }) {
  const idx = FUEL_OPTIONS.findIndex(o => o.value === value);
  return (
    <div className="grid grid-cols-5 gap-1 rounded-xl border border-white/15 bg-[#07111f] p-1" dir="ltr">
      {FUEL_OPTIONS.map((o, i) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`rounded-lg py-2 text-[11.5px] font-black transition-all ${
            i <= idx ? (i === idx ? 'bg-gradient-to-t from-amber-500 to-gold text-black shadow' : 'bg-gold/20 text-gold') : 'text-white/40 hover:text-white/70'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ── Media slots ──────────────────────────────────────────────────────────────

const MEDIA_SLOTS: { kind: ContractAttachmentKind; title: string; hint: string; max: number; video?: boolean; icon: typeof IdCard }[] = [
  { kind: 'licence', title: 'تصویر گواهینامه', hint: 'پشت و روی گواهینامه', max: 2, icon: IdCard },
  { kind: 'passport', title: 'تصویر پاسپورت', hint: 'صفحه مشخصات پاسپورت', max: 2, icon: BookUser },
  { kind: 'car_photo', title: 'تصاویر خودرو', hint: 'جلو، عقب، دو طرف، داخل و هر آسیب', max: 16, icon: Camera },
  { kind: 'car_video', title: 'ویدیوی خودرو', hint: `حداکثر ${MAX_VIDEO_SECONDS} ثانیه — خودکار فشرده می‌شود`, max: 3, video: true, icon: Film },
];

interface UploadJob {
  id: string;
  kind: ContractAttachmentKind;
  name: string;
  stage: 'compress' | 'upload';
  progress: number;
}

function MediaSlot({
  slot, items, jobs, onAdd, onRemove,
}: {
  slot: (typeof MEDIA_SLOTS)[number];
  items: ContractAttachment[];
  jobs: UploadJob[];
  onAdd: (files: FileList) => void;
  onRemove: (att: ContractAttachment) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const Icon = slot.icon;
  const full = items.length + jobs.length >= slot.max;
  return (
    <div className="rounded-2xl border border-white/10 bg-[#07111f]/70 p-3">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-gold/30 bg-gold/10 text-gold">
            <Icon size={16} />
          </span>
          <div className="min-w-0">
            <div className="text-[12.5px] font-black text-white">{slot.title}</div>
            <div className="truncate text-[10.5px] text-white/40">{slot.hint}</div>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-bold text-white/45">
          {items.length}/{slot.max}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {items.map((att, i) => (
          <div key={`${i}-${att.url}`} className="group relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-black/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {(slot.video ? att.posterUrl : att.url) ? <img src={slot.video ? att.posterUrl : att.url} alt="" className="h-full w-full object-cover" /> : (
              <div className="flex h-full items-center justify-center text-white/40"><Film size={22} /></div>
            )}
            {slot.video && (
              <span className="absolute bottom-1 left-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[9px] font-bold text-white">ویدیو</span>
            )}
            <button
              type="button"
              onClick={() => onRemove(att)}
              className="absolute top-1 right-1 flex h-7 w-7 items-center justify-center rounded-lg bg-black/70 text-rose-300 backdrop-blur hover:bg-rose-600 hover:text-white"
              title="حذف"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
        {jobs.map(job => (
          <div key={job.id} className="relative flex aspect-square flex-col items-center justify-center gap-1.5 overflow-hidden rounded-xl border border-gold/30 bg-gold/5 p-2 text-center">
            <Loader2 size={18} className="animate-spin text-gold" />
            <span className="text-[9.5px] font-bold leading-tight text-gold">
              {job.stage === 'compress' ? 'فشرده‌سازی' : 'آپلود'} {Math.round(job.progress * 100)}٪
            </span>
            <div className="absolute inset-x-2 bottom-2 h-1 overflow-hidden rounded-full bg-white/10">
              <div className="h-full bg-gold transition-all" style={{ width: `${Math.round(job.progress * 100)}%` }} />
            </div>
          </div>
        ))}
        {!full && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-white/20 text-white/45 transition-colors hover:border-gold/50 hover:bg-gold/5 hover:text-gold"
          >
            <Plus size={18} />
            <span className="text-[10px] font-bold">افزودن</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        hidden
        accept={slot.video ? 'video/mp4,video/webm,video/quicktime,video/*' : 'image/*'}
        multiple={slot.max > 1}
        onChange={e => {
          if (e.target.files?.length) onAdd(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
}

// ── Wizard ───────────────────────────────────────────────────────────────────

interface HandoverWizardProps {
  contract: CarContract | null; // null = new handover
  startAtDone?: boolean;
  defaultReservationId?: string;
  reservations: CarReservation[]; // all (cancelled ones are filtered out of the picker)
  cars: Car[];
  contracts: CarContract[];
  onSaved: (contract: CarContract) => void;
  onClose: () => void;
}

export default function HandoverWizard({ contract, startAtDone, defaultReservationId, reservations, cars, contracts, onSaved, onClose }: HandoverWizardProps) {
  const pickable = useMemo(
    () => reservations.filter(r => r.status !== 'cancelled' || r.id === contract?.reservationId),
    [reservations, contract?.reservationId]
  );

  // A reservation has at most one contract: choosing a reservation that already has one continues that contract
  const draftFor = (res: CarReservation | undefined, existing: CarContract | undefined): Draft =>
    existing ? fillGaps(draftFromContract(existing), res, cars, contracts) : fillFromReservation(emptyDraft(), res, cars, contracts);
  const initialRes = contract
    ? reservations.find(r => r.id === contract.reservationId)
    : pickable.find(r => r.id === defaultReservationId) || pickable[0];
  const initialContract = contract || (initialRes ? contracts.find(c => c.reservationId === initialRes.id) : undefined);

  const [draft, setDraft] = useState<Draft>(() => draftFor(initialRes, initialContract));
  const [saved, setSaved] = useState<CarContract | null>(initialContract || null);
  const [step, setStep] = useState(contract && startAtDone ? 4 : 0);
  // Furthest step reached: the stepper can jump back and forth up to it
  const [maxStep, setMaxStep] = useState(contract ? 4 : 0);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [jobs, setJobs] = useState<UploadJob[]>([]);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const pdf = useContractPdf();
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/settings/signature')
      .then(r => (r.ok ? r.json() : null))
      .then(d => setSignatureUrl(d?.url || null))
      .catch(() => {});
  }, []);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
    setMaxStep(m => Math.max(m, step));
  }, [step]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft(prev => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  // Days follow the dates; the total follows days × daily rate (it stays editable)
  const setDates = (patch: Partial<Pick<Draft, 'startDate' | 'endDate'>>) => {
    setDraft(prev => {
      const next = { ...prev, ...patch };
      const days = daysBetween(next.startDate, next.endDate);
      return { ...next, rentalDays: days, totalPrice: next.dailyRate ? Math.round(days * next.dailyRate * 1000) / 1000 : next.totalPrice };
    });
    setDirty(true);
  };
  const setRate = (key: 'rentalDays' | 'dailyRate', value: number) => {
    setDraft(prev => {
      const next = { ...prev, [key]: value };
      return { ...next, totalPrice: next.rentalDays && next.dailyRate ? Math.round(next.rentalDays * next.dailyRate * 1000) / 1000 : next.totalPrice };
    });
    setDirty(true);
  };

  const validate = (s: number): string | null => {
    if (s === 0) {
      if (!draft.customerName.trim()) return 'نام مشتری را وارد کنید';
      if (!draft.customerPhone.trim()) return 'شماره تماس مشتری را وارد کنید';
    }
    if (s === 1) {
      if (!draft.carTitle.trim()) return 'خودرو مشخص نیست؛ یک رزرو انتخاب کنید';
      if (!draft.initialOdometer || draft.initialOdometer < 0) return 'کیلومتر هنگام خروج را وارد کنید';
      if (draft.returnOdometer && draft.returnOdometer < draft.initialOdometer) return 'کیلومتر بازگشت نمی‌تواند کمتر از کیلومتر خروج باشد';
    }
    if (s === 2) {
      if (!draft.startDate || !draft.endDate) return 'تاریخ خروج و بازگشت را وارد کنید';
      if (draft.endDate < draft.startDate) return 'تاریخ بازگشت نمی‌تواند قبل از تاریخ خروج باشد';
    }
    return null;
  };

  const save = async (withAttachments: boolean): Promise<CarContract | null> => {
    setSaving(true);
    try {
      const { attachments, ...fields } = draft;
      const res = await fetch('/api/cars/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...fields,
          id: saved?.id || draft.id,
          customerName: fields.customerName.trim(),
          returnOdometer: fields.returnOdometer || undefined,
          // Attachments are only sent when there is something to store (the column may not exist yet)
          ...(withAttachments && (attachments.length || (saved?.attachments?.length ?? 0)) ? { attachments } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        toast.error(data.error || 'خطا در ذخیره قرارداد');
        return null;
      }
      if (data.chargesError) toast.error('قرارداد ذخیره شد اما ثبت مبالغ اضافه در حسابداری ناموفق بود');
      const c: CarContract = data.contract;
      setSaved(c);
      setDraft(prev => ({ ...prev, id: c.id }));
      setDirty(false);
      onSaved(c);
      return c;
    } catch {
      toast.error('خطای ارتباط با سرور');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const next = async () => {
    // Saving (steps 3 and 4) needs every text step to be valid, not only the current one
    for (let s = 0; s <= Math.min(step, 2); s++) {
      const err = validate(s);
      if (err) {
        toast.error(err);
        if (s !== step) setStep(s);
        return;
      }
    }
    if (step === 2) {
      if (await save(false)) setStep(3);
      return;
    }
    if (step === 3) {
      if (jobs.length) {
        toast.error('صبر کنید تا آپلود فایل‌ها تمام شود');
        return;
      }
      if (dirty && !(await save(true))) return;
      setStep(4);
      return;
    }
    setStep(s => Math.min(4, s + 1));
  };

  const close = async () => {
    if (jobs.length && !(await confirmDialog({ title: 'آپلود در حال انجام', message: 'فایل‌هایی در حال آپلود هستند. بسته شود؟', confirmText: 'بستن' }))) return;
    if (dirty && step < 4 && !(await confirmDialog({
      title: 'اطلاعات ذخیره نشده',
      message: 'تغییراتی که وارد کرده‌اید هنوز ذخیره نشده است. بدون ذخیره بسته شود؟',
      confirmText: 'بستن بدون ذخیره',
    }))) return;
    onClose();
  };

  // ── uploads ──
  const addFiles = async (kind: ContractAttachmentKind, files: FileList) => {
    const slot = MEDIA_SLOTS.find(s => s.kind === kind)!;
    const room = slot.max - draft.attachments.filter(a => a.kind === kind).length - jobs.filter(j => j.kind === kind).length;
    const list = Array.from(files).slice(0, Math.max(0, room));
    if (files.length > list.length) toast.error(`برای «${slot.title}» حداکثر ${slot.max} فایل مجاز است`);

    for (const file of list) {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const update = (patch: Partial<UploadJob>) => setJobs(prev => prev.map(j => (j.id === id ? { ...j, ...patch } : j)));
      setJobs(prev => [...prev, { id, kind, name: file.name, stage: 'compress', progress: 0 }]);
      try {
        let attachment: ContractAttachment;
        if (slot.video) {
          if (!file.type.startsWith('video/') && !/\.(mp4|webm|mov)$/i.test(file.name)) throw new MediaError('فقط فایل ویدیو قابل انتخاب است');
          const { video, poster } = await prepareVideo(file, p => update({ progress: p }));
          update({ stage: 'upload', progress: 0 });
          const posterPath = poster ? await uploadContractFile(poster, false).catch(() => undefined) : undefined;
          const path = await uploadContractFile(video, true, p => update({ progress: p }));
          // Files are private: the local copy is shown until the saved contract brings back signed URLs
          attachment = { kind, path, name: video.name, size: video.size, posterPath, posterUrl: posterPath && poster ? URL.createObjectURL(poster) : undefined };
        } else {
          if (!file.type.startsWith('image/') && !/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)) throw new MediaError('فقط فایل تصویری قابل انتخاب است');
          const image = await compressImage(file);
          update({ stage: 'upload', progress: 0 });
          const path = await uploadContractFile(image, false, p => update({ progress: p }));
          attachment = { kind, path, url: URL.createObjectURL(image), name: image.name, size: image.size };
        }
        setDraft(prev => ({ ...prev, attachments: [...prev.attachments, attachment] }));
        setDirty(true);
      } catch (err) {
        toast.error(err instanceof MediaError ? err.message : `آپلود «${file.name}» ناموفق بود`);
      } finally {
        setJobs(prev => prev.filter(j => j.id !== id));
      }
    }
  };

  const removeAttachment = (att: ContractAttachment) => {
    setDraft(prev => ({ ...prev, attachments: prev.attachments.filter(a => a !== att) }));
    setDirty(true);
  };

  // ── final step actions ──
  const contractData = () => {
    const c = saved!;
    const res = reservations.find(r => r.id === c.reservationId);
    const car = cars.find(x => x.id === (c.carId || res?.carId));
    return buildContractData(c, res, car);
  };

  const downloadPdf = async () => {
    if (!saved) return;
    try {
      await pdf.download(contractData(), signatureUrl);
    } catch {
      toast.error('ساخت فایل PDF ناموفق بود؛ دوباره تلاش کنید');
    }
  };

  const shareLink = saved?.shareToken ? contractShareUrl(saved.shareToken) : null;

  const copyLink = async () => {
    if (!shareLink) return toast.error('لینک قرارداد در دسترس نیست');
    try {
      await navigator.clipboard.writeText(shareLink);
      toast.success('لینک دانلود قرارداد کپی شد');
    } catch {
      window.prompt('لینک قرارداد:', shareLink);
    }
  };

  const revokeLink = async () => {
    if (!saved || !(await confirmDialog({ title: 'باطل کردن لینک قرارداد', message: REVOKE_LINK_MESSAGE, confirmText: 'باطل کن و لینک جدید بساز' }))) return;
    const result = await revokeContractLink(saved.id);
    if ('error' in result) return toast.error(result.error);
    const updated: CarContract = { ...saved, shareToken: result.shareToken, shareVersion: result.shareVersion };
    setSaved(updated);
    onSaved(updated);
    toast.success('لینک‌های قبلی باطل شد؛ لینک جدید ساخته شد');
  };

  const shareContract = async () => {
    if (!shareLink) return toast.error('لینک قرارداد در دسترس نیست');
    if (navigator.share) {
      try {
        await navigator.share({ title: `قرارداد ${saved!.id}`, text: `قرارداد اجاره خودرو ${saved!.customerName}`, url: shareLink });
      } catch {
        /* user closed the share sheet */
      }
    } else {
      copyLink();
    }
  };

  // Model + year + plate, so several units of the same model stay distinguishable
  const carLine = (car: Car | undefined, fallbackTitle?: string) => {
    const plate = car ? cleanCarPlate(car.plateNumber) : '';
    return (
      <span className="flex min-w-0 items-center gap-1.5">
        <span className="truncate text-xs font-bold text-white">{car ? carModelName(car) : cleanCarTitle(fallbackTitle || 'خودرو')}</span>
        {car?.modelYear && <span className="shrink-0 font-mono text-[10px] text-white/45">{car.modelYear}</span>}
        {plate && (
          <span className="ms-auto shrink-0 rounded-md border border-gold/30 bg-black/40 px-1.5 py-px font-mono text-[10.5px] font-bold text-gold dir-ltr">
            {plate}
          </span>
        )}
      </span>
    );
  };
  const shortDate = (d: string) => (d || '').slice(5).replace('-', '/');

  const reservationOptions: CompactPickerOption[] = pickable.map(r => {
    const car = cars.find(c => c.id === r.carId);
    const handedOver = contracts.some(c => c.reservationId === r.id && c.handoverStatus !== 'pending_delivery');
    return {
      value: r.id,
      content: (
        <span className="block min-w-0 space-y-0.5">
          {carLine(car, r.carTitle)}
          <span className="flex min-w-0 items-center gap-1.5 text-[10.5px] text-white/50">
            <span className="truncate">{r.customerName}</span>
            {handedOver && <span className="shrink-0 text-emerald-400/80">· تحویل ثبت شده</span>}
            <span className="ms-auto shrink-0 font-mono">{shortDate(r.startDate)} تا {shortDate(r.endDate)}</span>
          </span>
        </span>
      ),
      selectedContent: (
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="min-w-0 flex-1">{carLine(car, r.carTitle)}</span>
          <span className="max-w-[40%] shrink-0 truncate text-[10.5px] text-white/55">{r.customerName}</span>
        </span>
      ),
      searchText: `${r.carTitle || ''} ${car?.plateNumber || ''} ${r.customerName} ${r.customerPhone || ''}`,
    };
  });

  const StepIcon = STEPS[step].icon;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-md sm:items-center sm:p-4" dir="rtl">
      {pdf.element}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        className="flex h-[100dvh] w-full max-w-2xl flex-col overflow-hidden border-gold/25 bg-[#0b172a] shadow-2xl sm:h-auto sm:max-h-[92vh] sm:rounded-3xl sm:border"
      >
        {/* Header + stepper */}
        <div className="shrink-0 border-b border-white/10 bg-[#0f1e37] px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gold/30 bg-gold/10 text-gold">
                <StepIcon size={17} />
              </span>
              <div className="min-w-0">
                <h3 className="truncate text-[13.5px] font-black text-white">
                  {saved ? `صورتجلسه و قرارداد ${saved.id}` : 'ثبت صورتجلسه تحویل و قرارداد'}
                </h3>
                <p className="text-[10.5px] text-white/45">
                  مرحله {step + 1} از {STEPS.length} · {STEPS[step].title}
                </p>
              </div>
            </div>
            <button onClick={close} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white/50 hover:bg-white/10 hover:text-white">
              <X size={18} />
            </button>
          </div>

          <div className="mt-3 flex items-center gap-1.5">
            {STEPS.map((s, i) => {
              const reachable = i <= maxStep && (i !== 4 || (!!saved && !dirty));
              return (
                <button
                  key={s.key}
                  type="button"
                  disabled={!reachable || !!jobs.length}
                  onClick={() => setStep(i)}
                  className="group flex flex-1 flex-col items-center gap-1 disabled:cursor-default"
                >
                  <span className={`h-1.5 w-full rounded-full transition-colors ${i < step ? 'bg-gold' : i === step ? 'bg-gradient-to-l from-gold to-amber-500' : 'bg-white/10'}`} />
                  <span className={`hidden text-[10px] font-bold sm:block ${i === step ? 'text-gold' : i < step ? 'text-white/60' : 'text-white/30'}`}>{s.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div ref={bodyRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
          {step === 0 && (
            <div className="space-y-5">
              <Section title="رزرو">
                <Field label="رزرو / خودرو مربوطه" required>
                  <CompactPicker
                    value={draft.reservationId}
                    placeholder="انتخاب رزرو"
                    searchPlaceholder="مدل، پلاک یا نام مشتری..."
                    emptyText="رزروی یافت نشد"
                    options={reservationOptions}
                    disabled={!!contract}
                    onChange={id => {
                      const existing = contracts.find(c => c.reservationId === id);
                      setDraft(draftFor(pickable.find(r => r.id === id), existing));
                      setSaved(existing || null);
                      setMaxStep(existing ? 4 : 0);
                      setDirty(!existing);
                    }}
                  />
                </Field>
              </Section>
              <Section title="مشخصات مستأجر">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="نام مشتری (فارسی)" required>
                    <input className={inputCls} value={draft.customerName} onChange={e => set('customerName', e.target.value)} />
                  </Field>
                  <Field label="نام مشتری (انگلیسی)" hint="روی قرارداد چاپ می‌شود">
                    <input className={`${inputCls} text-left`} dir="ltr" value={draft.customerNameEn} placeholder="e.g. AHMED AL BALUSHI" onChange={e => set('customerNameEn', e.target.value)} />
                  </Field>
                  <Field label="شماره تماس" required>
                    <input className={`${inputCls} text-left font-mono`} dir="ltr" inputMode="tel" value={draft.customerPhone} onChange={e => set('customerPhone', e.target.value)} />
                  </Field>
                  <Field label="شماره واتس‌اپ" hint="خالی = همان شماره تماس">
                    <input className={`${inputCls} text-left font-mono`} dir="ltr" inputMode="tel" value={draft.whatsapp} placeholder={draft.customerPhone} onChange={e => set('whatsapp', e.target.value)} />
                  </Field>
                  <Field label="ملیت">
                    <input className={inputCls} value={draft.customerNationality} onChange={e => set('customerNationality', e.target.value)} />
                  </Field>
                  <Field label="شماره کارت ملی / پاسپورت">
                    <input className={`${inputCls} text-left font-mono`} dir="ltr" value={draft.customerNationalId} onChange={e => set('customerNationalId', e.target.value)} />
                  </Field>
                  <Field label="نوع گواهینامه">
                    <input className={inputCls} value={draft.licenceType} placeholder="مثلاً Light / سبک" onChange={e => set('licenceType', e.target.value)} />
                  </Field>
                  <Field label="شماره گواهینامه">
                    <input className={`${inputCls} text-left font-mono`} dir="ltr" value={draft.licenceNo} onChange={e => set('licenceNo', e.target.value)} />
                  </Field>
                  <Field label="آدرس محل سکونت" className="sm:col-span-2">
                    <input className={inputCls} value={draft.customerAddress} onChange={e => set('customerAddress', e.target.value)} />
                  </Field>
                  <Field label="آدرس محل کار" className="sm:col-span-2">
                    <input className={inputCls} value={draft.workAddress} onChange={e => set('workAddress', e.target.value)} />
                  </Field>
                </div>
              </Section>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <Section title="مشخصات خودرو">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Field label="نوع خودرو (انگلیسی)" hint={draft.carTitle} className="sm:col-span-3">
                    <input className={`${inputCls} text-left`} dir="ltr" value={draft.carTitleEn} placeholder={draft.carTitle} onChange={e => set('carTitleEn', e.target.value)} />
                  </Field>
                  <Field label="پلاک">
                    <input className={`${inputCls} text-left font-mono`} dir="ltr" value={draft.plateNumber} onChange={e => set('plateNumber', e.target.value)} />
                  </Field>
                  <Field label="رنگ">
                    <input className={inputCls} value={draft.color} onChange={e => set('color', e.target.value)} />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="نظافت داخل" hint="از ۱۰">
                      <NumericInput className={`${inputCls} text-center font-mono`} value={Number(draft.cleanInside) || 0} onValueChange={v => set('cleanInside', v ? String(Math.min(10, v)) : '')} />
                    </Field>
                    <Field label="نظافت بیرون" hint="از ۱۰">
                      <NumericInput className={`${inputCls} text-center font-mono`} value={Number(draft.cleanOutside) || 0} onValueChange={v => set('cleanOutside', v ? String(Math.min(10, v)) : '')} />
                    </Field>
                  </div>
                </div>
              </Section>

              <Section title="کیلومتر و سوخت">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="کیلومتر هنگام خروج" required>
                    <NumericInput className={`${inputCls} text-left font-mono`} dir="ltr" value={draft.initialOdometer} onValueChange={v => set('initialOdometer', v)} />
                  </Field>
                  <Field label="کیلومتر هنگام بازگشت">
                    <NumericInput className={`${inputCls} text-left font-mono`} dir="ltr" value={draft.returnOdometer} onValueChange={v => set('returnOdometer', v)} />
                  </Field>
                </div>
                <Field label="سطح سوخت هنگام تحویل">
                  <FuelPicker value={draft.fuelLevel} onChange={v => set('fuelLevel', v)} />
                </Field>
              </Section>

              <Section title="وضعیت تحویل و ودیعه">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="وضعیت تحویل خودرو">
                    <FancySelect<HandoverStatus>
                      value={draft.handoverStatus}
                      onChange={v => set('handoverStatus', v)}
                      options={[
                        { value: 'delivered', label: 'تحویل داده شد', hint: 'خودرو به مشتری تحویل شده است' },
                        { value: 'returned', label: 'عودت داده شد', hint: 'خودرو به شرکت برگشته است' },
                        { value: 'inspection_required', label: 'نیازمند بررسی بدنه', hint: 'پس از عودت، آسیب مشاهده شده' },
                      ]}
                    />
                  </Field>
                  <Field label="وضعیت ودیعه ضمانت">
                    <FancySelect<DepositStatus>
                      value={draft.depositStatus}
                      onChange={v => set('depositStatus', v)}
                      options={[
                        { value: 'held', label: 'نزد شرکت (امانی)' },
                        { value: 'refunded', label: 'به مشتری مسترد شد' },
                        { value: 'partially_refunded', label: 'کسر جریمه و استرداد مانده' },
                      ]}
                    />
                  </Field>
                </div>
              </Section>

              <Section title="چک‌لیست سلامت خودرو">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {HANDOVER_CHECKLIST_ITEMS.map(item => {
                    const ok = !!draft.checklist[item.key];
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => set('checklist', { ...draft.checklist, [item.key]: !ok })}
                        className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-right transition-colors ${
                          ok ? 'border-emerald-500/30 bg-emerald-500/[0.08]' : 'border-rose-500/40 bg-rose-500/10'
                        }`}
                      >
                        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[11px] font-black ${ok ? 'bg-emerald-500 text-black' : 'bg-rose-500 text-white'}`}>
                          {ok ? '✓' : '!'}
                        </span>
                        <span className="flex-1 text-[11.5px] font-bold text-white/85">{item.label}</span>
                        <span className={`text-[10px] font-black ${ok ? 'text-emerald-300' : 'text-rose-300'}`}>{ok ? 'سالم' : 'مشکل دارد'}</span>
                      </button>
                    );
                  })}
                </div>
              </Section>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <Section title="تاریخ و ساعت">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="تاریخ خروج" required>
                    <input type="date" className={`${inputCls} [color-scheme:dark]`} value={draft.startDate} onChange={e => setDates({ startDate: e.target.value })} />
                  </Field>
                  <Field label="ساعت خروج">
                    <input type="time" className={`${inputCls} [color-scheme:dark]`} value={draft.departureTime} onChange={e => set('departureTime', e.target.value)} />
                  </Field>
                  <Field label="تاریخ بازگشت" required>
                    <input type="date" className={`${inputCls} [color-scheme:dark]`} value={draft.endDate} onChange={e => setDates({ endDate: e.target.value })} />
                  </Field>
                  <Field label="ساعت بازگشت">
                    <input type="time" className={`${inputCls} [color-scheme:dark]`} value={draft.returnTime} onChange={e => set('returnTime', e.target.value)} />
                  </Field>
                  <Field label="تاریخ قرارداد">
                    <input type="date" className={`${inputCls} [color-scheme:dark]`} value={draft.contractDate} onChange={e => set('contractDate', e.target.value)} />
                  </Field>
                  <Field label="مدت اجاره" hint="روز">
                    <NumericInput className={`${inputCls} text-left font-mono`} dir="ltr" value={draft.rentalDays} onValueChange={v => setRate('rentalDays', v)} />
                  </Field>
                </div>
              </Section>

              <Section title="مبالغ (ریال عمان)">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="اجاره روزانه">
                    <NumericInput className={`${inputCls} text-left font-mono`} dir="ltr" value={draft.dailyRate} onValueChange={v => setRate('dailyRate', v)} />
                  </Field>
                  <Field label="مبلغ اجاره کل" hint="روز × نرخ">
                    <NumericInput className={`${inputCls} text-left font-mono`} dir="ltr" value={draft.totalPrice} onValueChange={v => set('totalPrice', v)} />
                  </Field>
                  <Field label="مبلغ پرداخت‌شده / ودیعه">
                    <NumericInput className={`${inputCls} text-left font-mono`} dir="ltr" value={draft.depositAmount} onValueChange={v => set('depositAmount', v)} />
                  </Field>
                  <Field label="کیلومتر اضافه">
                    <input className={`${inputCls} text-left font-mono`} dir="ltr" value={draft.extraKm} onChange={e => set('extraKm', e.target.value)} />
                  </Field>
                  <Field label="مبلغ کیلومتر اضافه">
                    <NumericInput className={`${inputCls} text-left font-mono`} dir="ltr" value={draft.extraKmAmount} onValueChange={v => set('extraKmAmount', v)} />
                  </Field>
                  <Field label="مبلغ حادثه / خسارت">
                    <NumericInput className={`${inputCls} text-left font-mono`} dir="ltr" value={draft.deductionsAmount} onValueChange={v => set('deductionsAmount', v)} />
                  </Field>
                </div>
              </Section>

              <Section title="ملاحظات">
                <textarea
                  rows={3}
                  className={`${inputCls} resize-none`}
                  value={draft.notes}
                  placeholder="خط‌وخش بدنه، توافقات خاص، جریمه‌ها..."
                  onChange={e => set('notes', e.target.value)}
                />
              </Section>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <div className="flex items-start gap-2.5 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-[11px] leading-5 text-white/60">
                <Images size={16} className="mt-0.5 shrink-0 text-gold" />
                <span>
                  همه‌ی موارد اختیاری هستند. عکس‌ها قبل از ارسال کوچک می‌شوند و ویدیوهای بزرگ روی همین دستگاه به کیفیت ۷۲۰p فشرده می‌شوند؛
                  تا پایان فشرده‌سازی صفحه را باز نگه دارید. تصاویر در صفحات پیوست PDF قرارداد قرار می‌گیرند.
                </span>
              </div>
              {MEDIA_SLOTS.map(slot => (
                <MediaSlot
                  key={slot.kind}
                  slot={slot}
                  items={draft.attachments.filter(a => a.kind === slot.kind)}
                  jobs={jobs.filter(j => j.kind === slot.kind)}
                  onAdd={files => addFiles(slot.kind, files)}
                  onRemove={removeAttachment}
                />
              ))}
            </div>
          )}

          {step === 4 && saved && (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.07] px-4 py-5 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                  <CheckCircle2 size={26} />
                </span>
                <div className="text-[14px] font-black text-white">قرارداد {saved.id} آماده است</div>
                <div className="text-[11.5px] text-white/55">
                  {saved.customerName} · {cleanCarTitle(saved.carTitle)} · <bdi dir="ltr">{saved.startDate || draft.startDate}</bdi> تا{' '}
                  <bdi dir="ltr">{saved.endDate || draft.endDate}</bdi>
                </div>
                <div className="text-[10.5px] text-white/40">
                  {(saved.attachments?.length || 0) > 0 ? `${saved.attachments!.length} فایل پیوست` : 'بدون پیوست تصویری'}
                  {signatureUrl ? ' · با امضای شرکت' : ' · امضای شرکت در تنظیمات ثبت نشده'}
                </div>
              </div>

              <button
                type="button"
                onClick={downloadPdf}
                disabled={pdf.busy}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-gold to-amber-500 py-3.5 text-[13px] font-black text-black shadow-lg shadow-gold/20 transition-all hover:brightness-110 active:scale-[0.99] disabled:opacity-70"
              >
                {pdf.busy ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                <span>
                  {pdf.busy
                    ? `در حال ساخت PDF${pdf.progress ? ` (صفحه ${pdf.progress.done} از ${pdf.progress.total})` : '...'}`
                    : 'دانلود قرارداد (PDF)'}
                </span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={copyLink} className="flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.04] py-3 text-[12px] font-bold text-white hover:bg-white/10">
                  <Link2 size={16} className="text-gold" />
                  کپی لینک قرارداد
                </button>
                <button type="button" onClick={shareContract} className="flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.04] py-3 text-[12px] font-bold text-white hover:bg-white/10">
                  <Share2 size={16} className="text-gold" />
                  اشتراک‌گذاری
                </button>
              </div>
              <p className="text-center text-[10.5px] leading-5 text-white/40">
                هر کسی لینک را داشته باشد، بدون ورود فقط می‌تواند همین قرارداد را دانلود کند. لینک ۳۰ روز اعتبار دارد.
              </p>
              <button type="button" onClick={revokeLink} className="mx-auto flex items-center gap-1.5 text-[11px] font-bold text-rose-300/80 hover:text-rose-300">
                <Ban size={13} />
                باطل کردن لینک و ساخت لینک جدید
              </button>

              {!signatureUrl && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-500/[0.07] p-3 text-[11px] text-amber-200/90">
                  <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                  <span>برای درج امضا زیر قراردادها، مدیر کل می‌تواند در «تنظیمات» فایل امضا را بارگذاری کند.</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer navigation */}
        <div className="shrink-0 border-t border-white/10 bg-[#0f1e37] px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5">
          {step < 4 ? (
            <div className="flex items-center gap-2">
              {step > 0 && (
                <button
                  type="button"
                  onClick={() => setStep(s => s - 1)}
                  disabled={saving || !!jobs.length}
                  className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[12px] font-bold text-white/75 hover:bg-white/10 disabled:opacity-50"
                >
                  <ChevronRight size={16} />
                  قبلی
                </button>
              )}
              <button
                type="button"
                onClick={next}
                disabled={saving || (step === 3 && !!jobs.length)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-l from-gold to-amber-500 py-3 text-[12.5px] font-black text-black shadow-lg shadow-gold/15 transition-all hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                <span>
                  {saving ? 'در حال ذخیره...' : step === 2 ? 'ذخیره و ادامه' : step === 3 ? (jobs.length ? 'در حال آپلود...' : 'ذخیره و پایان') : 'بعدی'}
                </span>
                {!saving && <ChevronLeft size={16} />}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep(0)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-3 text-[12px] font-bold text-white/75 hover:bg-white/10"
              >
                <Pencil size={15} />
                ویرایش اطلاعات
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex flex-1 items-center justify-center rounded-xl bg-white/10 py-3 text-[12px] font-black text-white hover:bg-white/15"
              >
                بستن
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
