// Single place to change the contract header (logo, titles, contact line).
// Rendered by components/contract-header-template.tsx.
export interface ContractHeaderTemplate {
  logoSrc: string;
  titleEn: string;
  companyAr: string;
  companyEn: string;
  phone: string;
  commercialRegister: string;
}

export const DEFAULT_CONTRACT_HEADER: ContractHeaderTemplate = {
  logoSrc: '/logo.png',
  titleEn: 'CAR RENTAL AGREEMENT',
  companyAr: 'أبو أرسام لإستئجار السيارات',
  companyEn: 'ARSAM RENT A CAR',
  phone: '94521746',
  commercialRegister: '1426046',
};

// Footer strip printed at the bottom of the agreement (no QR code on the paper form).
export interface ContractFooterTemplate {
  companyAr: string;
  commercialRegisterAr: string;
  phoneAr: string;
  addressAr: string;
  taglineAr: string;
}

export const DEFAULT_CONTRACT_FOOTER: ContractFooterTemplate = {
  companyAr: 'أبو أرسام للتجارة ش.ش.و',
  commercialRegisterAr: '١٤٢٦٠٤٦',
  phoneAr: '٩٤٥٢١٧٤٦',
  addressAr: 'مرتفعات مطار، داخل محطه شل بترول، مكتب سند مسقط للاعمال',
  taglineAr: 'مسقط، سلطنة عُمان',
};
