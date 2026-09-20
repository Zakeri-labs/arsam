import { DEFAULT_CONTRACT_HEADER, type ContractHeaderTemplate } from '@/lib/contract-template';

interface ContractHeaderProps {
  contractNumber: string;
  template?: ContractHeaderTemplate;
}

// Header of the printed rental agreement: title + number (left), logo and company name (center), contact (right).
export default function ContractHeader({ contractNumber, template = DEFAULT_CONTRACT_HEADER }: ContractHeaderProps) {
  return (
    <div className="grid grid-cols-3 items-end">
      <div className="text-left">
        <div className="text-[11px] font-bold tracking-[0.25em] text-gray-800">{template.titleEn}</div>
        <div className="font-mono text-[10px] text-gray-700">No. {contractNumber}</div>
      </div>

      <div className="flex flex-col items-center leading-none">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={template.logoSrc} alt="Logo" className="h-14 w-auto object-contain" />
        <div className="mt-0.5 text-[10px] font-black text-[#0f2a5c]" dir="rtl">{template.companyAr}</div>
        <div className="text-[8.5px] font-bold tracking-wide text-red-600">{template.companyEn}</div>
      </div>

      <div className="text-right text-[10px] font-black text-gray-900">
        <span>Call &amp; WhatsApp: {template.phone}</span>
        <span className="ml-3">C.R: {template.commercialRegister}</span>
      </div>
    </div>
  );
}
