import type { Car, CarContract, CarReservation, ContractAttachment } from './db-cars';
import { FUEL_LEVEL_LABELS } from './db-cars';

// Everything printed on the rental agreement. Built from the saved contract, with the
// reservation and the car filling what the contract itself does not hold (never invented).
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
  // Handover health checklist (true = OK, false = has a problem); problems are marked on the car diagram
  checklist?: Record<string, boolean>;
  attachments?: ContractAttachment[];
  renterSignatureUrl?: string | null;
  renterSignedAt?: string | null;
}

const today = () => new Date().toISOString().split('T')[0];

export function buildContractData(cnt: CarContract, reservation?: CarReservation, car?: Car): ContractData {
  const sDate = cnt.startDate || reservation?.startDate || today();
  const eDate = cnt.endDate || reservation?.endDate || sDate;
  const diffTime = Math.abs(new Date(eDate).getTime() - new Date(sDate).getTime());
  const calculatedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

  return {
    id: cnt.id,
    contractNo: cnt.id.toUpperCase(),
    date: cnt.contractDate || (cnt.createdAt ? new Date(cnt.createdAt).toISOString().split('T')[0] : today()),
    carTitle: cnt.carTitle,
    carTitleEn: cnt.carTitleEn || car?.titleEn || cnt.carTitle,
    brand: car?.brand,
    modelYear: car?.modelYear,
    plateNumber: cnt.plateNumber,
    color: cnt.color || car?.color,
    customerName: cnt.customerName,
    customerNameEn: cnt.customerNameEn,
    customerPhone: cnt.customerPhone,
    customerNationalId: cnt.customerNationalId || reservation?.customerNationalId || '',
    customerNationality: cnt.customerNationality,
    customerAddress: cnt.customerAddress,
    workAddress: cnt.workAddress,
    whatsapp: cnt.whatsapp,
    licenceType: cnt.licenceType,
    licenceNo: cnt.licenceNo,
    cleanInside: cnt.cleanInside,
    cleanOutside: cnt.cleanOutside,
    startDate: sDate,
    endDate: eDate,
    rentalDays: cnt.rentalDays ?? calculatedDays,
    dailyRate: cnt.dailyRate,
    totalPrice: cnt.totalPrice ?? reservation?.totalPrice ?? 0,
    depositPaid: cnt.depositAmount || 0,
    initialOdometer: cnt.initialOdometer,
    fuelLevel: FUEL_LEVEL_LABELS[cnt.fuelLevel] || FUEL_LEVEL_LABELS.full,
    departureTime: cnt.departureTime || (cnt.createdAt ? new Date(cnt.createdAt).toTimeString().slice(0, 5) : undefined),
    returnTime: cnt.returnTime,
    returnOdometer: cnt.returnOdometer,
    extraKm: cnt.extraKm,
    extraKmAmount: cnt.extraKmAmount,
    deductionsAmount: cnt.deductionsAmount,
    checklist: cnt.checklist,
    notes: cnt.notes,
    attachments: cnt.attachments || [],
    renterSignatureUrl: cnt.renterSignatureUrl || undefined,
    renterSignedAt: cnt.renterSignedAt || undefined,
  };
}
