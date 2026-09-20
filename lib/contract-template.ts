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
