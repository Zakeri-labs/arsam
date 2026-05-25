export type Language = 'en' | 'fa' | 'ar';
export type Country = 'uae' | 'oman';

export interface Service {
  id: string;
  title: string;
  description: string;
  serviceFee?: string;
  governmentFees?: string;
  workingDays?: string;
  requirements?: string[];
  category?: string;
}

export interface Content {
  header: {
    title: string;
    subtitle: string;
    tagline: string;
  };
  services: {
    title: string;
    items: Service[];
  };
  cta: {
    title: string;
    button: string;
  };
  footer: {
    copyright: string;
  };
}

export const languageNames: Record<Language, string> = {
  en: 'English',
  fa: 'فارسی',
  ar: 'العربية',
};

export const countryNames: Record<Language, Record<Country, string>> = {
  en: { uae: 'United Arab Emirates', oman: 'Sultanate of Oman' },
  fa: { uae: 'امارات متحده عربی', oman: 'سلطان‌نشین عمان' },
  ar: { uae: 'الإمارات العربية المتحدة', oman: 'سلطنة عُمان' },
};

export const modalContent: Record<Language, { selectLanguage: string; selectCountry: string; continue: string }> = {
  en: { selectLanguage: 'Select Your Language', selectCountry: 'Select Your Destination', continue: 'Continue' },
  fa: { selectLanguage: 'زبان خود را انتخاب کنید', selectCountry: 'مقصد خود را انتخاب کنید', continue: 'ادامه' },
  ar: { selectLanguage: 'اختر لغتك', selectCountry: 'اختر وجهتك', continue: 'متابعة' },
};

// 48 Services in English
const servicesListEN: Service[] = [
  // Company Setup Services (New from PDF)
  {
    id: 'company-mainland',
    title: 'Company Registration (Mainland)',
    description: 'Establish a company in mainland UAE or Oman with 100% foreign ownership. We process trade name reservation, initial approvals, DED/MOCI registrations, and Memorandum of Association (MOA) signing.',
    serviceFee: 'AED 3,000',
    governmentFees: 'From AED 12,000',
    workingDays: '5 Working Days',
    requirements: ['Copy of Passport', 'Copy of Tourist Visa / Entry Stamp', 'Three Proposed Trade Names'],
    category: 'Company Setup Services'
  },
  {
    id: 'company-freezone',
    title: 'Company Registration (Freezone)',
    description: 'Set up your business in premium Free Zones with 100% tax exemption, full import/export exemption, and no corporate tax. Includes business license, registration certificate, and lease agreement.',
    serviceFee: 'AED 2,500',
    governmentFees: 'From AED 9,500',
    workingDays: '4 Working Days',
    requirements: ['Copy of Passport', 'Passport-size Photo with White Background', 'Proposed Business Activities'],
    category: 'Company Setup Services'
  },
  {
    id: 'trademark-registration',
    title: 'Trademark Registration',
    description: 'Protect your brand identity legally. We handle trademark search, application filing, ministry publications, and final registration certificate issuance.',
    serviceFee: 'AED 1,500',
    governmentFees: 'AED 7,500',
    workingDays: '15 Working Days',
    requirements: ['Trademark Logo / Design', 'Trade License Copy', 'Power of Attorney'],
    category: 'Company Setup Services'
  },

  // Renewal Services
  {
    id: 'establishment-card-renewal',
    title: 'Establishment Card Renewal',
    description: 'Ensure your business remains legally compliant and active by timely renewing your Establishment Card. Our team ensures quick processing and direct integration with immigration portals to prevent operations blockages or visa delays.',
    serviceFee: 'AED 150',
    governmentFees: 'AED 581',
    workingDays: '3 Working Days',
    requirements: ['Trade License Must be Valid', 'Last Card Must not be Blocked', 'Physical EID Required'],
    category: 'Renewal Services'
  },
  {
    id: 'family-residency-renewal',
    title: 'Family Residency Renewal',
    description: 'Keep your family members legally resident in the country. We manage the entire documentation, application submission, medical screening bookings, and residency stampings smoothly to give you complete peace of mind.',
    serviceFee: 'AED 450',
    governmentFees: 'AED 1,340',
    workingDays: '5 Working Days',
    requirements: ['Sponsor Bank Statement', 'Sponsor EID Must be Valid', 'Sponsor Physical ID Required'],
    category: 'Renewal Services'
  },
  {
    id: 'investor-residency-renewal',
    title: 'Investor Residency Renewal',
    description: 'Renew your investor/partner visa to continue managing your business and enjoying full residency benefits. Our legal consultants fast-track your approval process through the immigration and economic departments.',
    serviceFee: 'AED 450',
    governmentFees: 'AED 1,380',
    workingDays: '5 Working Days',
    requirements: ['Business Bank Statement', 'Trade License Must be Valid', 'Valid Establishment Card'],
    category: 'Renewal Services'
  },
  {
    id: 'trade-license-renewal',
    title: 'Trade License Renewal',
    description: 'Maintain your commercial operations without fines. We process your trade license renewal, register Ejari contracts, secure approvals from regulatory bodies, and facilitate flexible installment pay vouchers.',
    serviceFee: 'AED 300',
    governmentFees: 'From AED 4,270',
    workingDays: '3 Working Days',
    requirements: ['Ejari Must be Valid', 'Valid Establishment Card', 'Pay Voucher By Tabby'],
    category: 'Renewal Services'
  },

  // Ejari Registration Services
  {
    id: 'ejari-1-month-inspection',
    title: 'Ejari Registration - 1 Month Valid',
    description: 'Instant Ejari registration for 1 month validity, complete with an inspection option valid for up to 1 year. Essential for new company setups and prompt trade license renewals.',
    serviceFee: 'AED 1,950',
    workingDays: '1 Working Day',
    requirements: ['Mandatory For New Companies', 'Mandatory For License Renew', 'Inspection Available For 1 Year'],
    category: 'Ejari Registration Services'
  },
  {
    id: 'ejari-1-month-no-inspection',
    title: 'Ejari Registration - 1 Month Valid (Without Inspection)',
    description: 'Fast track Ejari registration for 1 month validity without physical inspection, ideal for rapid business licensing and administrative updates.',
    serviceFee: 'AED 1,650',
    workingDays: '1 Working Day',
    requirements: ['Mandatory For New Companies', 'Mandatory For License Renew', 'Without Inspection'],
    category: 'Ejari Registration Services'
  },
  {
    id: 'ejari-1-month-sep-office',
    title: 'Ejari Registration - 1 Month Valid - Sep Office',
    description: 'Official 1-month valid Ejari registration for a separate office space, complete with inspection options to meet DED regulatory standards.',
    serviceFee: 'AED 2,050',
    workingDays: '1 Working Day',
    requirements: ['Mandatory For New Companies', 'Mandatory For License Renew', 'Inspection Available For 1 Year'],
    category: 'Ejari Registration Services'
  },
  {
    id: 'ejari-1-month-shop',
    title: 'Ejari Registration - 1 Month Valid - Shop',
    description: 'Retail shop Ejari registration with a 1-month validity. Processed without physical inspection for immediate compliance and commercial approvals.',
    serviceFee: 'AED 2,150',
    workingDays: '1 Working Day',
    requirements: ['Mandatory For New Companies', 'Mandatory For License Renew', 'Without Inspection'],
    category: 'Ejari Registration Services'
  },
  {
    id: 'ejari-1-year',
    title: 'Ejari Registration - 1 Year Valid',
    description: 'Annual Ejari registration with a 1-year validity, including full inspection support. Highly recommended for standard long-term operations and standard commercial setups.',
    serviceFee: 'AED 3,150',
    workingDays: '1 Working Day',
    requirements: ['Mandatory For New Companies', 'Mandatory For License Renew', 'Inspection Available For 1 Year'],
    category: 'Ejari Registration Services'
  },
  {
    id: 'ejari-1-year-sep-office',
    title: 'Ejari Registration - 1 Year Valid - Sep Office',
    description: 'Premium annual Ejari registration for separate office units, designed for medium to large corporate setups requiring inspections and municipal compliance.',
    serviceFee: 'AED 3,250',
    workingDays: '1 Working Day',
    requirements: ['Mandatory For New Companies', 'Mandatory For License Renew', 'Inspection Available For 1 Year'],
    category: 'Ejari Registration Services'
  },

  // Banking Services
  {
    id: 'business-account-high-risk',
    title: 'Business Account Opening - High Risk Activities',
    description: 'Professional corporate bank account opening for high-risk business sectors. We manage full compliance, background checks, document structuring, and local bank coordination.',
    serviceFee: 'AED 3,950',
    workingDays: '20 Working Days',
    requirements: ['License Must Be Valid', 'All Partners Visa Must Be Valid', 'Required For Residency Renew'],
    category: 'Banking Services'
  },
  {
    id: 'business-account-low-risk',
    title: 'Business Account Opening - Low Risk Activities',
    description: 'Fast track corporate banking setup for low-risk business sectors. Swift approvals from top-tier local and international banks with dedicated support.',
    serviceFee: 'AED 2,950',
    workingDays: '5 Working Days',
    requirements: ['License Must Be Valid', 'All Partners Visa Must Be Valid', 'Required For Residency Renew'],
    category: 'Banking Services'
  },
  {
    id: 'personal-account-guidance',
    title: 'Personal Bank Account Guidance',
    description: 'Open a personal checking or savings account with top-tier local banks. We review your profile, compile required documents, and secure fast bank approval.',
    serviceFee: 'AED 950',
    workingDays: '5 Working Days',
    requirements: ['Valid Residency Visa & EID', 'Passport with Entry Stamp', 'Salary Certificate or Proof of Funds'],
    category: 'Banking Services'
  },

  // Tax Services
  {
    id: 'corporate-tax-registration',
    title: 'Corporate Tax Registration',
    description: 'Official corporate tax registration with the Federal Tax Authority (FTA). Avoid the AED 10,000 fine by registering within the required 87-day limit.',
    serviceFee: 'AED 180',
    workingDays: '3 Working Days',
    requirements: ['Within 87 Days', 'Mandatory For all Companies', 'AED 10\'000 Fine'],
    category: 'Tax Services'
  },
  {
    id: 'corporate-tax-filing',
    title: 'Corporate Tax Return Filing',
    description: 'Accurate corporate tax return preparation and submission within the 9-month legal deadline. Prevents hefty monthly penalties and ensures full compliance.',
    serviceFee: 'AED 380',
    workingDays: '2 Working Days',
    requirements: ['Within 9 Months', 'Mandatory For all Companies', 'AED 500 to 1000 Fine Monthly'],
    category: 'Tax Services'
  },
  {
    id: 'vat-registration',
    title: 'VAT Registration',
    description: 'Official Value Added Tax (VAT) registration with the tax authority. Mandatory for businesses exceeding the legal taxable threshold. Avoid penalties with timely filing.',
    serviceFee: 'AED 350',
    workingDays: '3 Working Days',
    requirements: ['Trade License Copy', 'Financial Statement (Sales exceeding AED 187,500)', 'Passport & Visa of Manager'],
    category: 'Tax Services'
  },
  {
    id: 'fta-profile-update',
    title: 'FTA Profile Update',
    description: 'Official update of your Federal Tax Authority profile following updates in trade license, managing partners, or company office location to prevent portal freezes.',
    serviceFee: 'AED 280',
    workingDays: '2 Working Days',
    requirements: ['License Must Be Updated', 'Manager Visa Must Be Updated', 'Company Location Must Be Updated'],
    category: 'Tax Services'
  },
  {
    id: 'tax-reconsideration',
    title: 'Request For Reconsideration',
    description: 'Submit professional appeals and waiver requests for tax penalties under FTA laws. We draft robust legal arguments to maximize penalty waiver success.',
    serviceFee: 'AED 380',
    workingDays: '2 Working Days',
    requirements: ['Penalty Reconsideration', 'Waiving is Not Guaranteed', 'According to FTA Laws'],
    category: 'Tax Services'
  },
  {
    id: 'industrial-tax-exemptions',
    title: 'Industrial Tax Exemptions',
    description: 'Obtain official industrial tax exemption certificates for raw materials, machinery, or industrial operations in Oman to significantly lower production costs.',
    serviceFee: 'AED 950',
    workingDays: '10 Working Days',
    requirements: ['Industrial License Copy', 'List of Raw Materials & Equipment', 'Environmental Approval'],
    category: 'Tax Services'
  },

  // Tourism Services
  {
    id: 'tourist-visa-30-days',
    title: '30 Days Tourist Visa',
    description: 'Secure a fast-processed 30-day tourist visa for leisure or business travel. Direct application processing with minimum documents and high approval rate.',
    serviceFee: 'AED 290',
    workingDays: '3 Working Days',
    requirements: ['No. of Entries: Single Entry'],
    category: 'Tourism Services'
  },
  {
    id: 'tourist-visa-60-days',
    title: '60 Days Tourist Visa',
    description: 'Enjoy a longer stay with our 60-day single-entry tourist visa. Perfect for family visits, extended holidays, or exploring local business opportunities.',
    serviceFee: 'AED 490',
    workingDays: '3 Working Days',
    requirements: ['No. of Entries: Single Entry'],
    category: 'Tourism Services'
  },
  {
    id: 'tourist-visa-multi-60-days',
    title: 'Multi 60 Days Visa',
    description: 'Multi-entry 60-day visa processed in just 1 working day. Best suited for frequent business travelers entering and leaving the country regularly.',
    serviceFee: 'AED 790',
    workingDays: '1 Working Day',
    requirements: ['No. of Entries: Multiple Entry'],
    category: 'Tourism Services'
  },
  {
    id: 'tourist-visa-renewal',
    title: 'Tourist Visa Renewal',
    description: 'Extend your stay legally without leaving the country. We handle tourist visa renewals for up to 4 months in total to ensure no overstay fines.',
    serviceFee: 'AED 1,090',
    workingDays: '3 Working Days',
    requirements: ['Max Stay: Four Month in Total'],
    category: 'Tourism Services'
  },
  {
    id: 'travel-tourism-services',
    title: 'Travel & Tourism Services',
    description: 'Comprehensive travel booking services. We assist with hotel reservations, corporate flight bookings, customized holiday tour packages, and travel insurance.',
    serviceFee: 'AED 150',
    workingDays: '2 Working Days',
    requirements: ['Passport Copy', 'Travel Dates & Preferences', 'Destination Information'],
    category: 'Tourism Services'
  },

  // License Modification Services
  {
    id: 'change-activity',
    title: 'Change Activity(ies)',
    description: 'Add, remove, or modify your trade license activities. We handle local department approvals, municipal requirements, and Memorandum of Association (MOA) amendments.',
    serviceFee: 'AED 450',
    governmentFees: 'From AED 3,000',
    workingDays: '2 Working Days',
    requirements: ['License Must Be Valid', 'All Partners Must Sign MOA', 'Change Name Required'],
    category: 'License Modification Services'
  },
  {
    id: 'change-business-name',
    title: 'Change Business Name',
    description: 'Officially change your corporate or brand name. We cover brand name reservation, MOA amendment, municipal updates, and publication of the new trade license.',
    serviceFee: 'AED 450',
    governmentFees: 'From AED 800',
    workingDays: '2 Working Days',
    requirements: ['License Must Be Valid', 'All Partners Most Sign MOA', 'Name Reservation Required'],
    category: 'License Modification Services'
  },
  {
    id: 'change-location',
    title: 'Change Location',
    description: 'Relocate your business address legally. We update your physical office location on the trade license and process municipal address modifications swiftly.',
    serviceFee: 'AED 300',
    governmentFees: 'From AED 800',
    workingDays: '2 Working Days',
    requirements: ['License Must Be Valid', 'All Partners Most Sign MOA', 'New Ejari Required'],
    category: 'License Modification Services'
  },
  {
    id: 'license-modification',
    title: 'License Modification',
    description: 'Comprehensive structural modifications to your license, such as altering partners, modifying share capital, updating management structure, or changing local sponsors.',
    serviceFee: 'From AED 450',
    governmentFees: 'From AED 3,000',
    workingDays: '3 Working Days',
    requirements: ['License Must Be Valid', 'All Partners Must Sign MOA', 'DED Approval Required'],
    category: 'License Modification Services'
  },

  // Cancellation Services
  {
    id: 'family-residency-cancellation',
    title: 'Family Residency Cancellation',
    description: 'Officially cancel family residency permits when relocating or changing sponsors. We ensure error-free paperwork to maintain clean immigration profiles.',
    serviceFee: 'AED 300',
    governmentFees: 'AED 290',
    workingDays: '3 Working Days',
    requirements: ['Sponsor Physical EID', 'Entry Permit Application', 'Refund Available'],
    category: 'Cancellation Services'
  },
  {
    id: 'investor-residency-cancellation',
    title: 'Investor Residency Cancellation',
    description: 'Proper cancellation of investor/partner residency visas. Highly critical for corporate restructuring, shifting ownership, or cancellation of company license.',
    serviceFee: 'AED 300',
    governmentFees: 'AED 330',
    workingDays: '5 Working Days',
    requirements: ['NOC Letter Required', 'Valid Establishment Card', 'Physical Emirates ID'],
    category: 'Cancellation Services'
  },
  {
    id: 'trade-license-cancellation',
    title: 'Trade License Cancellation',
    description: 'Legal company liquidation and license cancellation. We handle auditing reports, official announcements, local department approvals, and final cancellation certificates.',
    serviceFee: 'AED 300',
    governmentFees: 'From AED 6,000',
    workingDays: '5 Working Days',
    requirements: ['Partners Visa Cancellation', 'All Partners Must Sign', 'Company Audition Required'],
    category: 'Cancellation Services'
  },

  // General Government Services (New from PDF)
  {
    id: 'driving-license-guidance',
    title: 'Driving License Guidance',
    description: 'Step-by-step guidance for converting your home country driving license or starting a new file. We arrange eye tests, translation approvals, and RTA/ROP appointments.',
    serviceFee: 'AED 350',
    governmentFees: 'AED 850',
    workingDays: '5 Working Days',
    requirements: ['Valid Emirates / Oman ID', 'Original Home Country Driving License', 'Eye Test Certificate'],
    category: 'General Government Services'
  },
  {
    id: 'dubai-municipality-permits',
    title: 'Dubai Municipality Permits',
    description: 'Secure commercial, advertising, or fit-out permits from Dubai Municipality. We handle application submission, technical plan approvals, and inspection coordination.',
    serviceFee: 'AED 650',
    governmentFees: 'From AED 1,500',
    workingDays: '5 Working Days',
    requirements: ['Trade License Copy', 'Tenancy Contract / Ejari', 'Layout Plan of Office/Shop'],
    category: 'General Government Services'
  },
  {
    id: 'sports-council-permits',
    title: 'Dubai Sports Council Permits',
    description: 'Obtain official activity approvals and licenses for sports events, gyms, fitness academies, or sports academies from the Dubai Sports Council.',
    serviceFee: 'AED 850',
    governmentFees: 'From AED 2,500',
    workingDays: '7 Working Days',
    requirements: ['Trade License Copy', 'Trainer Certificates / Qualifications', 'Premises Safety Certificate'],
    category: 'General Government Services'
  },
  {
    id: 'rera-permits',
    title: 'RERA (Real Estate Permits)',
    description: 'Secure real estate commercial activity approvals, broker licenses, or property advertisement permits from the Real Estate Regulatory Agency (RERA).',
    serviceFee: 'AED 950',
    governmentFees: 'From AED 3,500',
    workingDays: '5 Working Days',
    requirements: ['Trade License Copy', 'Manager Broker Card / Certificate', 'Ejari of Commercial Office'],
    category: 'General Government Services'
  },
  {
    id: 'customs-bayan',
    title: 'Customs Clearance (Bayan)',
    description: 'Fast and professional customs cargo clearance in Oman through the official Bayan Customs System. Minimizes container demurrage and delays at ports.',
    serviceFee: 'AED 450',
    workingDays: '2 Working Days',
    requirements: ['Import/Export License', 'Commercial Invoice & Packing List', 'Certificate of Origin'],
    category: 'General Government Services'
  },
  {
    id: 'made-in-oman',
    title: 'Made in Oman Certificate',
    description: 'Secure the official "Made in Oman" quality certificate for locally manufactured products to qualify for national procurement and export advantages.',
    serviceFee: 'AED 550',
    workingDays: '5 Working Days',
    requirements: ['Industrial/Trade License Copy', 'Proof of Local Value Addition', 'Product Test Report'],
    category: 'General Government Services'
  },
  {
    id: 'riyada-card',
    title: 'Riyada Card Guidance',
    description: 'Comprehensive assistance for securing the Omani Riyada Card for small and medium enterprises (SMEs) to unlock governmental tenders, funding, and waivers.',
    serviceFee: 'AED 250',
    workingDays: '3 Working Days',
    requirements: ['Omani Ownership Proof', 'Valid Trade License', 'Active Social Insurance Registration'],
    category: 'General Government Services'
  },
  {
    id: 'pacda-permits',
    title: 'PACDA Safety Permits',
    description: 'Obtain official fire safety approvals, civil defense licenses, and municipal safety permits from the Public Authority for Civil Defense and Ambulance (PACDA).',
    serviceFee: 'AED 450',
    governmentFees: 'From AED 1,000',
    workingDays: '4 Working Days',
    requirements: ['Trade License Copy', 'Tenancy Contract', 'Fire Fighting Equipment Certificate'],
    category: 'General Government Services'
  },
  {
    id: 'product-standards',
    title: 'Product Standards Certificate',
    description: 'Secure official Omani product standards approvals and G-mark quality certifications from the Directorate General for Specifications and Measurements (DGSMM).',
    serviceFee: 'AED 550',
    workingDays: '5 Working Days',
    requirements: ['Product Specifications Sheet', 'ISO / Quality Certificates Copy', 'Importer/Exporter License'],
    category: 'General Government Services'
  },
  {
    id: 'business-setup-consulting',
    title: 'Business Setup Consulting',
    description: 'Expert advisory on structural setup, partner distributions, commercial unit selections, and machinery distribution setups for trading and industrial entities.',
    serviceFee: 'AED 500',
    workingDays: '3 Working Days',
    requirements: ['Concept Description', 'Initial Capital Planning', 'Proposed Location Ideas'],
    category: 'Company Setup Services'
  },
  {
    id: 'government-land-rental',
    title: 'Government Land Rental Guidance',
    description: 'Step-by-step assistance in securing government-leased land for industrial, warehouse, or farming projects in premium industrial estates like Madayn.',
    serviceFee: 'AED 950',
    workingDays: '10 Working Days',
    requirements: ['Valid Industrial/Commercial License', 'Project Feasibility Summary', 'Application Letter to Ministry'],
    category: 'General Government Services'
  },
  {
    id: 'feasibility-study',
    title: 'Feasibility Study & Business Plan',
    description: 'Professional feasibility studies and business plans, structured specifically for bank loan applications, ministry approvals, and investor presentations.',
    serviceFee: 'AED 1,500',
    workingDays: '8 Working Days',
    requirements: ['Market Concept Description', 'Project Financial Estimates', 'Competitors Information'],
    category: 'Company Setup Services'
  },
  {
    id: 'accounting-auditing',
    title: 'Accounting & Auditing Services',
    description: 'Keep your business compliant with local regulations. Professional bookkeeping, financial statements preparation, auditing, and accounting reviews.',
    serviceFee: 'AED 450',
    workingDays: '3 Working Days',
    requirements: ['Company Ledger / Bank Statements', 'Previous Tax Invoices List', 'Expenses Proof Documents'],
    category: 'General Government Services'
  },
  {
    id: 'omanisation-management',
    title: 'Omanisation Management',
    description: 'Ensure fully compliant recruitment in Oman. We align Omani and expat hiring distributions with the ministry standards to bypass blocks.',
    serviceFee: 'AED 650',
    workingDays: '4 Working Days',
    requirements: ['Trade License Copy', 'Active Employee Visa List', 'Desired Nationalization Target'],
    category: 'General Government Services'
  }
];

// 48 Services in Persian
const servicesListFA: Service[] = [
  // Company Setup Services (New from PDF)
  {
    id: 'company-mainland',
    title: 'ثبت شرکت در سرزمین اصلی (Mainland)',
    description: 'ثبت شرکت در سرزمین اصلی امارات یا عمان با مالکیت ۱۰۰ درصد خارجی. انجام تمامی مراحل رزرواسیون نام تجاری، موافقت اولیه، ثبت در دپارتمان اقتصادی و امضای اساسنامه.',
    serviceFee: '۳,۰۰۰ درهم',
    governmentFees: 'از ۱۲,۰۰۰ درهم',
    workingDays: '۵ روز کاری',
    requirements: ['کپی پاسپورت سهام‌داران', 'کپی ویزای توریستی یا مهر ورود', 'سه نام پیشنهادی برای شرکت'],
    category: 'Company Setup Services'
  },
  {
    id: 'company-freezone',
    title: 'ثبت شرکت در منطقه آزاد (Freezone)',
    description: 'راه‌اندازی کسب‌وکار در مناطق آزاد با معافیت ۱۰۰٪ مالیاتی و گمرکی و مالکیت کامل بدون نیاز به کفیل محلی. شامل صدور لایسنس، گواهی ثبت و اجاره‌نامه اداری.',
    serviceFee: '۲,۵۰۰ درهم',
    governmentFees: 'از ۹,۵۰۰ درهم',
    workingDays: '۴ روز کاری',
    requirements: ['کپی پاسپورت سهام‌داران', 'عکس پرسنلی با زمینه سفید', 'لیست فعالیت‌های تجاری مورد نظر'],
    category: 'Company Setup Services'
  },
  {
    id: 'trademark-registration',
    title: 'ثبت برند و علامت تجاری',
    description: 'حفاظت قانونی از هویت برند و لوگوی شما. انجام استعلام قبلی برند، ثبت پرونده در وزارت اقتصاد، انتشار در روزنامه رسمی و صدور سند ثبت نهایی.',
    serviceFee: '۱,۵۰۰ درهم',
    governmentFees: '۷,۵۰۰ درهم',
    workingDays: '۱۵ روز کاری',
    requirements: ['طرح یا لوگوی برند', 'کپی لایسنس تجاری شرکت', 'وکالت‌نامه رسمی'],
    category: 'Company Setup Services'
  },

  // Renewal Services
  {
    id: 'establishment-card-renewal',
    title: 'تمدید استبلیشمنت کارت (کارت تاسیس)',
    description: 'حفظ وضعیت قانونی و فعال ماندن کارت تاسیس شرکت جهت ثبت درخواست‌های ویزا و امور اقامتی. تیم ما فرآیند تمدید را سریع و ایمن از طریق پرتال‌های رسمی انجام می‌دهد.',
    serviceFee: '۱۵۰ درهم',
    governmentFees: '۵۸۱ درهم',
    workingDays: '۳ روز کاری',
    requirements: ['لایسنس تجاری باید معتبر باشد', 'کارت قبلی نباید مسدود باشد', 'نیاز به کارت ملی امارات (EID) فیزیکی'],
    category: 'Renewal Services'
  },
  {
    id: 'family-residency-renewal',
    title: 'تمدید اقامت خانوادگی',
    description: 'اقامت قانونی و بدون دغدغه خانواده خود را حفظ کنید. ما کلیه فرآیندهای مدارک، تست‌های پزشکی و تایید نهایی ویزا را به صورت کامل و سریع پیگیری می‌کنیم.',
    serviceFee: '۴۵۰ درهم',
    governmentFees: '۱,۳۴۰ درهم',
    workingDays: '۵ روز کاری',
    requirements: ['پرینت حساب بانکی اسپانسر', 'کارت ملی امارات (EID) اسپانسر باید معتبر باشد', 'نیاز به کارت فیزیکی اسپانسر'],
    category: 'Renewal Services'
  },
  {
    id: 'investor-residency-renewal',
    title: 'تمدید اقامت سرمایه‌گذار',
    description: 'تمدید ویزای سرمایه‌گذاری یا شریک برای ادامه مدیریت بیزینس و برخورداری از مزایای کامل اقامت در کشور. تسریع فرآیند تایید در اداره مهاجرت.',
    serviceFee: '۴۵۰ درهم',
    governmentFees: '۱,۳۸۰ درهم',
    workingDays: '۵ روز کاری',
    requirements: ['پرینت حساب بانکی شرکت', 'لایسنس تجاری باید معتبر باشد', 'استبلیشمنت کارت معتبر شرکت'],
    category: 'Renewal Services'
  },
  {
    id: 'trade-license-renewal',
    title: 'تمدید لایسنس تجاری',
    description: 'فعالیت‌های تجاری خود را بدون نگرانی از جریمه‌های شهرداری حفظ کنید. انجام تمدید لایسنس، ثبت عقد ایجاری و صدور فیش‌های پرداختی دولتی.',
    serviceFee: '۳۰۰ درهم',
    governmentFees: 'از ۴,۲۷۰ درهم',
    workingDays: '۳ روز کاری',
    requirements: ['عقد ایجاری (Ejari) معتبر', 'استبلیشمنت کارت معتبر شرکت', 'قابلیت پرداخت فیش با تبی (Tabby)'],
    category: 'Renewal Services'
  },

  // Ejari Registration Services
  {
    id: 'ejari-1-month-inspection',
    title: 'ثبت ایجاری - اعتبار ۱ ماهه با بازرسی',
    description: 'ثبت فوری قرارداد رسمی ایجاری با اعتبار ۱ ماهه و امکان بازرسی تا سقف ۱ سال. الزامی برای ثبت و راه‌اندازی شرکت‌های جدید و تمدید لایسنس.',
    serviceFee: '۱,۹۵۰ درهم',
    workingDays: '۱ روز کاری',
    requirements: ['الزامی برای تاسیس شرکت‌های جدید', 'الزامی برای تمدید لایسنس', 'قابلیت بازرسی هماهنگ شده تا ۱ سال'],
    category: 'Ejari Registration Services'
  },
  {
    id: 'ejari-1-month-no-inspection',
    title: 'ثبت ایجاری - اعتبار ۱ ماهه بدون بازرسی',
    description: 'ثبت سریع و فوری قرارداد ایجاری با اعتبار ۱ ماهه و بدون نیاز به بازرسی فیزیکی محل کار، ایده‌آل برای صدور فوری لایسنس و تسریع امور اداری.',
    serviceFee: '۱,۶۵۰ درهم',
    workingDays: '۱ روز کاری',
    requirements: ['الزامی برای تاسیس شرکت‌های جدید', 'الزامی برای تمدید لایسنس', 'بدون نیاز به بازرسی فیزیکی'],
    category: 'Ejari Registration Services'
  },
  {
    id: 'ejari-1-month-sep-office',
    title: 'ثبت ایجاری دفتر کار مجزا - اعتبار ۱ ماهه',
    description: 'ثبت رسمی قرارداد ایجاری ۱ ماهه برای واحدهای اداری و دفاتر کار مستقل با امکان بازرسی ۱ ساله جهت انطباق با قوانین شهرداری و DED.',
    serviceFee: '۲,۰۵۰ درهم',
    workingDays: '۱ روز کاری',
    requirements: ['الزامی برای تاسیس شرکت‌های جدید', 'الزامی برای تمدید لایسنس', 'قابلیت بازرسی هماهنگ شده تا ۱ سال'],
    category: 'Ejari Registration Services'
  },
  {
    id: 'ejari-1-month-shop',
    title: 'ثبت ایجاری مغازه - اعتبار ۱ ماهه',
    description: 'ثبت قرارداد ایجاری برای واحدهای تجاری و مغازه‌ها با اعتبار ۱ ماهه و بدون نیاز به بازرسی فیزیکی جهت اخذ فوری موافقت‌های لایسنس تجاری.',
    serviceFee: '۲,۱۵۰ درهم',
    workingDays: '۱ روز کاری',
    requirements: ['الزامی برای تاسیس شرکت‌های جدید', 'الزامی برای تمدید لایسنس', 'بدون نیاز به بازرسی فیزیکی'],
    category: 'Ejari Registration Services'
  },
  {
    id: 'ejari-1-year',
    title: 'ثبت ایجاری - اعتبار ۱ ساله با بازرسی',
    description: 'ثبت رسمی قرارداد ایجاری یک‌ساله به همراه هماهنگی کامل خدمات بازرسی فیزیکی. گزینه‌ای مطمئن و پایدار برای بیزینس‌های طولانی‌مدت.',
    serviceFee: '۳,۱۵۰ درهم',
    workingDays: '۱ روز کاری',
    requirements: ['الزامی برای تاسیس شرکت‌های جدید', 'الزامی برای تمدید لایسنس', 'قابلیت بازرسی هماهنگ شده تا ۱ سال'],
    category: 'Ejari Registration Services'
  },
  {
    id: 'ejari-1-year-sep-office',
    title: 'ثبت ایجاری دفتر مجزا - اعتبار ۱ ساله',
    description: 'ثبت قرارداد رسمی ایجاری سالانه برای واحدهای اداری و دفاتر مستقل به همراه پشتیبانی بازرسی فیزیکی. مناسب برای شرکت‌های متوسط و بزرگ.',
    serviceFee: '۳,۲۵۰ درهم',
    workingDays: '۱ روز کاری',
    requirements: ['الزامی برای تاسیس شرکت‌های جدید', 'الزامی برای تمدید لایسنس', 'قابلیت بازرسی هماهنگ شده تا ۱ سال'],
    category: 'Ejari Registration Services'
  },

  // Banking Services
  {
    id: 'business-account-high-risk',
    title: 'افتتاح حساب شرکتی - فعالیت‌های با ریسک بالا',
    description: 'افتتاح حساب بانکی تجاری برای بیزینس‌هایی با فعالیت‌های پرریسک. مدیریت کامل مدارک، تهیه پورتفولیو شرکت و قوانین انطباق بانکی.',
    serviceFee: '۳,۹۵۰ درهم',
    workingDays: '۲۰ روز کاری',
    requirements: ['لایسنس شرکت باید معتبر باشد', 'ویزای کلیه شرکا باید معتبر باشد', 'الزامی جهت فرآیند تمدید اقامت'],
    category: 'Banking Services'
  },
  {
    id: 'business-account-low-risk',
    title: 'افتتاح حساب شرکتی - فعالیت‌های با ریسک معمولی',
    description: 'راه‌اندازی سریع حساب بانکی شرکتی برای بیزینس‌های کم‌ریسک. اخذ تاییدیه از معتبرترین بانک‌های امارات با کمترین دغدغه اداری.',
    serviceFee: '۲,۹۵۰ درهم',
    workingDays: '۵ روز کاری',
    requirements: ['لایسنس شرکت باید معتبر باشد', 'ویزای کلیه شرکا باید معتبر باشد', 'الزامی جهت فرآیند تمدید اقامت'],
    category: 'Banking Services'
  },
  {
    id: 'personal-account-guidance',
    title: 'راهنمایی افتتاح حساب شخصی',
    description: 'افتتاح حساب بانکی شخصی پس‌انداز یا جاری در بهترین بانک‌های داخلی. ارزیابی مدارک، هماهنگی با بانک و دریافت سریع تاییدیه افتتاح حساب.',
    serviceFee: '۹۵۰ درهم',
    workingDays: '۵ روز کاری',
    requirements: ['ویزای اقامت و کارت ملی معتبر', 'پاسپورت با مهر ورود', 'فیش حقوقی یا گواهی تمکن مالی'],
    category: 'Banking Services'
  },

  // Tax Services
  {
    id: 'corporate-tax-registration',
    title: 'ثبت‌نام مالیات شرکت‌ها (Corporate Tax)',
    description: 'ثبت‌نام رسمی شرکت در سیستم مالیاتی سازمان مالیات فدرال (FTA). جلوگیری از جریمه سنگین ۱۰,۰۰۰ درهمی با ثبت‌نام در بازه قانونی ۸۷ روزه.',
    serviceFee: '۱۸۰ درهم',
    workingDays: '۳ روز کاری',
    requirements: ['ثبت‌نام حداکثر طی ۸۷ روز از ثبت شرکت', 'الزامی برای کلیه شرکت‌های فعال و غیرفعال', 'جریمه ۱۰,۰۰۰ درهمی در صورت تاخیر'],
    category: 'Tax Services'
  },
  {
    id: 'corporate-tax-filing',
    title: 'ارسال اظهارنامه مالیاتی شرکت',
    description: 'تنظیم و ارسال اظهارنامه مالیاتی شرکت طبق استانداردهای حسابداری امارات در مهلت قانونی ۹ ماهه جهت جلوگیری از جریمه‌های ماهانه.',
    serviceFee: '۳۸۰ درهم',
    workingDays: '۲ روز کاری',
    requirements: ['ارسال در بازه حداکثر ۹ ماهه', 'الزامی برای کلیه شرکت‌های ثبت شده', 'جریمه ۵۰۰ الی ۱۰۰۰ درهمی ماهانه در صورت عدم ارسال'],
    category: 'Tax Services'
  },
  {
    id: 'vat-registration',
    title: 'ثبت‌نام مالیات بر ارزش افزوده (VAT)',
    description: 'ثبت‌نام رسمی در پرتال مالیات بر ارزش افزوده (VAT) سازمان مالیات. الزامی برای شرکت‌هایی که میزان فروش سالانه آن‌ها از حد مجاز قانونی فراتر رفته است.',
    serviceFee: '۳۵۰ درهم',
    workingDays: '۳ روز کاری',
    requirements: ['کپی لایسنس تجاری شرکت', 'تراز مالی رسمی فروش بالای ۱۸۷,۵۰۰ درهم', 'پاسپورت و ویزای مدیر شرکت'],
    category: 'Tax Services'
  },
  {
    id: 'fta-profile-update',
    title: 'به‌روزرسانی پروفایل مالیاتی (FTA)',
    description: 'اصلاح و به‌روزرسانی مشخصات و مدارک شرکت در پرتال سازمان مالیات فدرال (FTA) پس از اعمال تغییرات لایسنس، آدرس یا مدیریت.',
    serviceFee: '۲۸۰ درهم',
    workingDays: '۲ روز کاری',
    requirements: ['اطلاعات لایسنس باید به‌روز باشد', 'ویزای مدیر مسئول باید به‌روز باشد', 'محل دقیق شرکت باید ثبت و به‌روز باشد'],
    category: 'Tax Services'
  },
  {
    id: 'tax-reconsideration',
    title: 'درخواست بازنگری جرایم مالیاتی',
    description: 'ثبت رسمی درخواست تجدیدنظر و بخشش جرایم مالیاتی طبق قوانین FTA. تنظیم لوایح دفاعی قانونی جهت افزایش شانس معافیت از جریمه.',
    serviceFee: '۳۸۰ درهم',
    workingDays: '۲ روز کاری',
    requirements: ['اعتراض به جرایم صادره مالیاتی', 'عدم تضمین ۱۰۰٪ بخشش (بستگی به قوانین دارد)', 'تنظیم لایحه بر اساس قوانین رسمی FTA'],
    category: 'Tax Services'
  },
  {
    id: 'industrial-tax-exemptions',
    title: 'اخذ معافیت‌های مالیاتی صنعتی',
    description: 'اخذ گواهی رسمی معافیت‌های مالیاتی صنعتی برای تجهیزات، ماشین‌آلات تولیدی و مواد اولیه در عمان جهت کاهش حداکثری هزینه‌های تولید کارخانه‌ها.',
    serviceFee: '۹۵۰ درهم',
    workingDays: '۱۰ روز کاری',
    requirements: ['کپی لایسنس صنعتی معتبر', 'لیست دقیق تجهیزات و مواد اولیه وارداتی', 'مجوز زیست‌محیطی معتبر'],
    category: 'Tax Services'
  },

  // Tourism Services
  {
    id: 'tourist-visa-30-days',
    title: 'ویزای توریستی ۳۰ روزه',
    description: 'اخذ سریع ویزای گردشگری ۳۰ روزه یک‌بار ورود برای سفرهای توریستی یا تجاری. تایید سریع با حداقل مدارک هویتی.',
    serviceFee: '۲۹۰ درهم',
    workingDays: '۳ روز کاری',
    requirements: ['نوع ویزا: یک‌بار ورود (Single Entry)'],
    category: 'Tourism Services'
  },
  {
    id: 'tourist-visa-60-days',
    title: 'ویزای توریستی ۶۰ روزه',
    description: 'اقامت طولانی‌تر در کشور با ویزای ۶۰ روزه یک‌بار ورود. مناسب برای دیدارهای خانوادگی، تعطیت طولانی یا کار‌های اداری اولیه.',
    serviceFee: '۴۹۰ درهم',
    workingDays: '۳ روز کاری',
    requirements: ['نوع ویزا: یک‌بار ورود (Single Entry)'],
    category: 'Tourism Services'
  },
  {
    id: 'tourist-visa-multi-60-days',
    title: 'ویزای ۶۰ روزه چند بار ورود (مولتی)',
    description: 'صدور ویزای ۶۰ روزه با قابلیت چندین بار خروج و ورود در سریع‌ترین زمان ممکن (۱ روز کاری). بهترین گزینه برای سفر‌های متعدد کاری.',
    serviceFee: '۷۹۰ درهم',
    workingDays: '۱ روز کاری',
    requirements: ['نوع ویزا: چند بار ورود (Multiple Entry)'],
    category: 'Tourism Services'
  },
  {
    id: 'tourist-visa-renewal',
    title: 'تمدید ویزای توریستی',
    description: 'تمدید کاملاً قانونی اقامت ویزای توریستی بدون نیاز به خروج از کشور. امکان تمدید تا سقف حداکثر ۴ ماه مجموع اقامت.',
    serviceFee: '۱,۰۹۰ درهم',
    workingDays: '۳ روز کاری',
    requirements: ['حداکثر مدت اقامت: ۴ ماه در مجموع'],
    category: 'Tourism Services'
  },
  {
    id: 'travel-tourism-services',
    title: 'خدمات گردشگری (هتل و بلیط)',
    description: 'خدمات کامل گردشگری شامل رزرو هتل‌های ممتاز، خرید بلیط پروازهای شرکتی و توریستی، بیمه مسافرتی و تورهای مسافرتی سفارشی.',
    serviceFee: '۱۵۰ درهم',
    workingDays: '۲ روز کاری',
    requirements: ['کپی پاسپورت مسافران', 'تاریخ دقیق و ترجیحات پروازی', 'اطلاعات هتل مورد نظر'],
    category: 'Tourism Services'
  },

  // License Modification Services
  {
    id: 'change-activity',
    title: 'تغییر فعالیت‌های لایسنس (Activity)',
    description: 'اضافه، حذف یا اصلاح فعالیت‌های تجاری ثبت شده لایسنس. انجام تاییدیه‌های شهرداری، اصلاح اساسنامه (MOA) و هماهنگی شرکا.',
    serviceFee: '۴۵۰ درهم',
    governmentFees: 'از ۳,۰۰۰ درهم',
    workingDays: '۲ روز کاری',
    requirements: ['لایسنس شرکت باید معتبر باشد', 'امضای کلیه شرکا روی برگه اصلاحیه اساسنامه', 'نیاز به ثبت تغییر نام در صورت لزوم'],
    category: 'License Modification Services'
  },
  {
    id: 'change-business-name',
    title: 'تغییر نام تجاری شرکت',
    description: 'تغییر نام رسمی شرکت یا برند تجاری شما. شامل رزرواسیون نام جدید در دپارتمان اقتصادی، اصلاح اساسنامه و صدور لایسنس جدید.',
    serviceFee: '۴۵۰ درهم',
    governmentFees: 'از ۸۰۰ درهم',
    workingDays: '۲ روز کاری',
    requirements: ['لایسنس شرکت باید معتبر باشد', 'امضای کلیه شرکا روی برگه اصلاحیه اساسنامه', 'نیاز به رزرو رسمی نام جدید شرکت'],
    category: 'License Modification Services'
  },
  {
    id: 'change-location',
    title: 'تغییر آدرس قانونی شرکت',
    description: 'تغییر رسمی و قانونی آدرس ثبت شده شرکت. به‌روزرسانی محل فعالیت جدید در لایسنس تجاری و ثبت آدرس جدید در سامانه‌های شهری.',
    serviceFee: '۳۰۰ درهم',
    governmentFees: 'از ۸۰۰ درهم',
    workingDays: '۲ روز کاری',
    requirements: ['لایسنس شرکت باید معتبر باشد', 'امضای کلیه شرکا روی برگه اصلاحیه اساسنامه', 'نیاز به عقد ایجاری (Ejari) جدید برای آدرس جدید'],
    category: 'License Modification Services'
  },
  {
    id: 'license-modification',
    title: 'اصلاح و تغییرات لایسنس',
    description: 'تغییرات اساسی ساختاری در لایسنس شرکت، شامل ورود یا خروج شرکا، کاهش یا افزایش سرمایه، تغییرات مدیریتی و تایید سازمان اقتصادی.',
    serviceFee: 'از ۴۵۰ درهم',
    governmentFees: 'از ۳,۰۰۰ درهم',
    workingDays: '۳ روز کاری',
    requirements: ['لایسنس شرکت باید معتبر باشد', 'امضای کلیه شرکا روی برگه اصلاحیه اساسنامه', 'نیاز به تایید رسمی دپارتمان اقتصادی (DED)'],
    category: 'License Modification Services'
  },

  // Cancellation Services
  {
    id: 'family-residency-cancellation',
    title: 'کنسلی اقامت خانواده',
    description: 'لغو رسمی اقامت و ویزای اعضای خانواده جهت تغییر اسپانسر یا خروج از کشور. انجام سریع فرآیند اداری بدون دردسر.',
    serviceFee: '۳۰۰ درهم',
    governmentFees: '۲۹۰ درهم',
    workingDays: '۳ روز کاری',
    requirements: ['کارت ملی امارات فیزیکی اسپانسر', 'فرم درخواست لغو مجوز ورود', 'امکان عودت وجه تضمین در صورت وجود'],
    category: 'Cancellation Services'
  },
  {
    id: 'investor-residency-cancellation',
    title: 'کنسلی اقامت سرمایه‌گذار',
    description: 'ابطال و کنسلی اصولی ویزای اقامت سرمایه‌گذاری یا شریک شرکت. فرآیندی بسیار حساس جهت فروش سهم یا خروج رسمی از ساختار شرکت.',
    serviceFee: '۳۰۰ درهم',
    governmentFees: '۳۳۰ درهم',
    workingDays: '۵ روز کاری',
    requirements: ['نامه عدم اعتراض (NOC) رسمی', 'استبلیشمنت کارت معتبر شرکت', 'کارت فیزیکی ملی امارات (Emirates ID)'],
    category: 'Cancellation Services'
  },
  {
    id: 'trade-license-cancellation',
    title: 'انحلال و کنسلی لایسنس تجاری',
    description: 'تصفیه قانونی و ابطال رسمی لایسنس تجاری شرکت. شامل خدمات حسابرسی تسویه، ثبت آگهی رسمی انحلال و اخذ گواهی نهایی ابطال.',
    serviceFee: '۳۰۰ درهم',
    governmentFees: 'از ۶,۰۰۰ درهم',
    workingDays: '۵ روز کاری',
    requirements: ['ابطال قبلی ویزای اقامت کلیه شرکا', 'امضا و تایید رسمی انحلال توسط تمام شرکا', 'ارائه گزارش رسمی حسابرسی تصفیه شرکت'],
    category: 'Cancellation Services'
  },

  // General Government Services (New from PDF)
  {
    id: 'driving-license-guidance',
    title: 'راهنمایی دریافت گواهینامه رانندگی',
    description: 'کمک گام‌به‌گام برای تبدیل گواهینامه رانندگی کشور مادری به گواهینامه امارات/عمان یا باز کردن پرونده جدید. هماهنگی تست چشم، ترجمه رسمی و نوبت اداری.',
    serviceFee: '۳۵۰ درهم',
    governmentFees: '۸۵۰ درهم',
    workingDays: '۵ روز کاری',
    requirements: ['کارت ملی معتبر (EID یا عمان)', 'اصل گواهینامه رانندگی کشور مبدا', 'گواهی معاینه چشم معتبر'],
    category: 'General Government Services'
  },
  {
    id: 'dubai-municipality-permits',
    title: 'دریافت مجوزهای شهرداری دبی',
    description: 'اخذ مجوزهای تجاری، تبلیغاتی، تابلو یا اصلاحات دکوراسیون از شهرداری دبی. پیگیری درخواست، تایید نقشه‌های فنی و هماهنگی بازرسی شهرداری.',
    serviceFee: '۶۵۰ درهم',
    governmentFees: 'از ۱,۵۰۰ درهم',
    workingDays: '۵ روز کاری',
    requirements: ['کپی لایسنس تجاری شرکت', 'قرارداد اجاره رسمی (ایجاری)', 'نقشه مهندسی یا چیدمان دفتر/مغازه'],
    category: 'General Government Services'
  },
  {
    id: 'sports-council-permits',
    title: 'دریافت مجوزهای سازمان ورزش دبی',
    description: 'اخذ تاییدیه و مجوزهای لازم برای راه‌اندازی باشگاه ورزشی، برگزاری رویدادهای ورزشی یا آکادمی‌های تناسب اندام از سازمان ورزش دبی.',
    serviceFee: '۸۵۰ درهم',
    governmentFees: 'از ۲,۵۰۰ درهم',
    workingDays: '۷ روز کاری',
    requirements: ['کپی لایسنس تجاری شرکت', 'مدارک و گواهینامه‌های مربیگری معتبر', 'تاییدیه ایمنی سالن ورزشی'],
    category: 'General Government Services'
  },
  {
    id: 'rera-permits',
    title: 'مجوزهای املاک و اراضی (RERA)',
    description: 'اخذ مجوزهای رسمی معاملات ملکی، بروکری یا مجوزهای تبلیغات فروش املاک از سازمان تنظیم مقررات املاک دبی (RERA).',
    serviceFee: '۹۵۰ درهم',
    governmentFees: 'از ۳,۵۰۰ درهم',
    workingDays: '۵ روز کاری',
    requirements: ['کپی لایسنس تجاری شرکت', 'کارت بروکری یا گواهی دوره مدیریت املاک', 'عقد ایجاری دفتر کار تجاری'],
    category: 'General Government Services'
  },
  {
    id: 'customs-bayan',
    title: 'ترخیص کالا از گمرک (سامانه بیان)',
    description: 'ترخیص سریع، تخصصی و قانونی محموله‌های تجاری از بنادر و مرزهای گمرکی عمان از طریق سامانه گمرکی رسمی بیان (Bayan).',
    serviceFee: '۴۵۰ درهم',
    workingDays: '۲ روز کاری',
    requirements: ['لایسنس معتبر واردات و صادرات', 'سیاهه خرید (فاکتور) و پکینگ لیست رسمی', 'گواهی مبدا کالا'],
    category: 'General Government Services'
  },
  {
    id: 'made-in-oman',
    title: 'اخذ گواهی Made in Oman',
    description: 'اخذ گواهی رسمی نشان ملی "Made in Oman" برای محصولات تولید شده در عمان جهت بهره‌مندی از امتیازات دولتی و صادرات ترجیحی.',
    serviceFee: '۵۵۰ درهم',
    workingDays: '۵ روز کاری',
    requirements: ['کپی لایسنس صنعتی یا تجاری شرکت', 'مستندات ارزش افزوده محلی تولید', 'گزارش رسمی آزمایش استاندارد کالا'],
    category: 'General Government Services'
  },
  {
    id: 'riyada-card',
    title: 'دریافت کارت ریاده (Riyada)',
    description: 'راهنمایی و پشتیبانی اداری برای دریافت کارت ریاده (کارت حمایت از کارآفرینی عمان) جهت اخذ مناقصات دولتی، تسهیلات بانکی و معافیت‌های قانونی.',
    serviceFee: '۲۵۰ درهم',
    workingDays: '۳ روز کاری',
    requirements: ['مالکیت ۱۰۰٪ اتباع عمان یا شراکت خاص', 'لایسنس تجاری معتبر شرکت', 'ثبت‌نام فعال در بیمه تامین اجتماعی'],
    category: 'General Government Services'
  },
  {
    id: 'pacda-permits',
    title: 'مجوزهای ایمنی دفاع مدنی (PACDA)',
    description: 'اخذ تاییدیه رسمی ایمنی و آتش‌نشانی و پروانه‌های سلامت محیطی از سازمان دفاع مدنی و شهرداری عمان (PACDA) جهت انطباق با قوانین ایمنی عمومی.',
    serviceFee: '۴۵۰ درهم',
    governmentFees: 'از ۱,۰۰۰ درهم',
    workingDays: '۴ روز کاری',
    requirements: ['کپی لایسنس تجاری شرکت', 'عقد اجاره یا سند ملک تجاری', 'تاییدیه رسمی نصب کپسول و تجهیزات اطفای حریق'],
    category: 'General Government Services'
  },
  {
    id: 'product-standards',
    title: 'اخذ گواهی استاندارد کالا (G-mark)',
    description: 'اخذ تاییدیه و گواهی‌های کیفی استاندارد کالا، نشان ایمنی خلیج فارس (G-mark) و انطباق محصول از سازمان ملی استاندارد و کیفیت عمان (DGSMM).',
    serviceFee: '۵۵۰ درهم',
    workingDays: '۵ روز کاری',
    requirements: ['کاتالوگ فنی یا برگه مشخصات کالا', 'کپی گواهی کیفیت بین‌المللی مانند ISO', 'لایسنس بازرگانی شرکت'],
    category: 'General Government Services'
  },
  {
    id: 'business-setup-consulting',
    title: 'مشاوره تجهیز و راه‌اندازی واحدها',
    description: 'ارائه مشاوره‌های تخصصی در خصوص ساختار قانونی شرکت، سهم شرکا، موقعیت جغرافیایی واحدهای تجاری/صنعتی و نحوه چینش ماشین‌آلات و انبار طبق ضوابط شهرداری.',
    serviceFee: '۵۰۰ درهم',
    workingDays: '۳ روز کاری',
    requirements: ['خلاصه ایده و طرح بیزینس', 'برنامه‌ریزی سرمایه اولیه شرکت', 'محدوده جغرافیایی مورد نظر'],
    category: 'Company Setup Services'
  },
  {
    id: 'government-land-rental',
    title: 'راهنمایی اجاره زمین دولتی',
    description: 'راهنمایی و پیگیری اداری جهت دریافت و اجاره طولانی‌مدت زمین‌های ارزان‌قیمت دولتی برای پروژه‌های صنعتی، کارخانجات یا انبارداری در شهرک‌های صنعتی نظیر مدائن.',
    serviceFee: '۹۵۰ درهم',
    workingDays: '۱۰ روز کاری',
    requirements: ['لایسنس تجاری یا صنعتی معتبر', 'طرح توجیهی مختصر پروژه', 'نامه رسمی درخواست به وزارت مربوطه'],
    category: 'General Government Services'
  },
  {
    id: 'feasibility-study',
    title: 'تهیه طرح توجیهی و بیزینس پلن',
    description: 'طراحی و تدوین حرفه‌ای طرح‌های توجیهی رسمی (Feasibility Study) و بیزینس پلن‌های جامع جهت ارائه به بانک‌ها برای اخذ وام، ادارات دولتی و جذب سرمایه‌گذار.',
    serviceFee: '۱,۵۰۰ درهم',
    workingDays: '۸ روز کاری',
    requirements: ['توضیحات بازار و ایده تجاری', 'برآورد مالی و درآمدی پروژه', 'اطلاعات رقبای اصلی بازار'],
    category: 'Company Setup Services'
  },
  {
    id: 'accounting-auditing',
    title: 'خدمات حسابداری و حسابرسی',
    description: 'حفظ سلامت مالی شرکت طبق قوانین استانداردهای حسابداری خلیج فارس. خدمات حسابداری مستمر، تهیه ترازنامه، حسابرسی رسمی و مشاوره بستن دفاتر مالی سالانه.',
    serviceFee: '۴۵۰ درهم',
    workingDays: '۳ روز کاری',
    requirements: ['دفاتر مالی یا پرینت حساب بانکی شرکت', 'لیست فاکتورهای رسمی قبلی', 'مدارک و اسناد اثبات مخارج شرکت'],
    category: 'General Government Services'
  },
  {
    id: 'omanisation-management',
    title: 'مدیریت عمان‌سازی (Omanisation)',
    description: 'انطباق کامل نیروهای انسانی شرکت با قوانین عمان‌سازی مصوب وزارت کار. تنظیم توزیع استخدامی اتباع عمان و مهاجران جهت جلوگیری از مسدودی پرونده.',
    serviceFee: '۶۵۰ درهم',
    workingDays: '۴ روز کاری',
    requirements: ['کپی لایسنس تجاری شرکت', 'لیست ویزای کل پرسنل فعال شرکت', 'درصد عمان‌سازی هدف برای صنف شرکت'],
    category: 'General Government Services'
  }
];

// 48 Services in Arabic
const servicesListAR: Service[] = [
  // Company Setup Services (New from PDF)
  {
    id: 'company-mainland',
    title: 'تأسيس شركة في البر الرئيسي (Mainland)',
    description: 'تأسيس شركة في البر الرئيسي لدولة الإمارات أو سلطنة عمان بملكية أجنبية 100%. ننجز حجز الاسم التجاري، والموافقة المبدئية، والتسجيل الاقتصادي وعقد التأسيس.',
    serviceFee: '3,000 درهم',
    governmentFees: 'من 12,000 درهم',
    workingDays: '5 أيام عمل',
    requirements: ['نسخة من جواز السفر للشركاء', 'نسخة من تأشيرة السياحة أو ختم الدخول', 'ثلاثة أسماء تجارية مقترحة'],
    category: 'Company Setup Services'
  },
  {
    id: 'company-freezone',
    title: 'تأسيس شركة في المنطقة الحرة (Freezone)',
    description: 'تأسيس شركتك في المناطق الحرة المتميزة مع إعفاء ضريبي وجمركي بنسبة 100% وملكية كاملة. يشمل إصدار الرخصة التجارية وعقد إيجار المكتب.',
    serviceFee: '2,500 درهم',
    governmentFees: 'من 9,500 درهم',
    workingDays: '4 أيام عمل',
    requirements: ['نسخة من جواز السفر للشركاء', 'صورة شخصية بخلفية بيضاء', 'الأنشطة التجارية المقترحة'],
    category: 'Company Setup Services'
  },
  {
    id: 'trademark-registration',
    title: 'تسجيل العلامة التجارية',
    description: 'حماية الهوية القانونية لعلامتكم التجارية. ننجز البحث المسبق، وتقديم الطلب لدى وزارة الاقتصاد، والنشر الرسمي وإصدار شهادة الملكية.',
    serviceFee: '1,500 درهم',
    governmentFees: '7,500 درهم',
    workingDays: '15 يوم عمل',
    requirements: ['شعار أو تصميم العلامة التجارية', 'نسخة من الرخصة التجارية', 'وكالة رسمية موثقة'],
    category: 'Company Setup Services'
  },

  // Renewal Services
  {
    id: 'establishment-card-renewal',
    title: 'تجديد بطاقة المنشأة',
    description: 'تجديد بطاقة المنشأة لشركتكم لضمان استمرارية العمليات القانونية وسهولة تقديم طلبات الإقامة والتوظيف دون تأخير أو غرامات.',
    serviceFee: '150 درهم',
    governmentFees: '581 درهم',
    workingDays: '3 أيام عمل',
    requirements: ['يجب أن تكون الرخصة التجارية سارية', 'يجب ألا تكون البطاقة السابقة محظورة', 'الهوية الإماراتية الأصلية مطلوبة'],
    category: 'Renewal Services'
  },
  {
    id: 'family-residency-renewal',
    title: 'تجديد الإقامة العائلية',
    description: 'حافظ على الوضع القانوني لإقامة أفراد عائلتك المكفولين داخل الدولة. ننجز كافة الإجراءات والخطوات والفحوصات الطبية بالنيابة عنك.',
    serviceFee: '450 درهم',
    governmentFees: '1,340 درهم',
    workingDays: '5 أيام عمل',
    requirements: ['كشف حساب بنكي للكفيل', 'يجب أن تكون هوية الكفيل سارية', 'الهوية الإماراتية الأصلية للكفيل مطلوبة'],
    category: 'Renewal Services'
  },
  {
    id: 'investor-residency-renewal',
    title: 'تجديد إقامة مستثمر',
    description: 'تجديد تأشيرة المستثمر أو الشريك لمواصلة إدارة أعمالكم والاستمتاع بمزايا الإقامة الكاملة بأعلى درجات السرعة والمهنية.',
    serviceFee: '450 درهم',
    governmentFees: '1,380 درهم',
    workingDays: '5 أيام عمل',
    requirements: ['كشف حساب بنكي للشركة', 'يجب أن تكون الرخصة التجارية سارية', 'بطاقة منشأة سارية المفعول'],
    category: 'Renewal Services'
  },
  {
    id: 'trade-license-renewal',
    title: 'تجديد الرخصة التجارية',
    description: 'تجديد رخصتكم التجارية لتفادي الغرامات وضمان استمرارية نشاطكم التجاري بشكل متوافق تماماً، مع تسهيل خيارات الدفع والتقسيط.',
    serviceFee: '300 درهم',
    governmentFees: 'من 4,270 درهم',
    workingDays: '3 أيام عمل',
    requirements: ['يجب أن يكون عقد إيجاري سارياً', 'بطاقة منشأة سارية المفعول', 'دفع الرسوم عبر منصة تابي (Tabby)'],
    category: 'Renewal Services'
  },

  // Ejari Registration Services
  {
    id: 'ejari-1-month-inspection',
    title: 'تسجيل إيجاري - صلاحية شهر واحد',
    description: 'تسجيل إيجاري فوري بصلاحية شهر واحد مع خيار التفتيش المتاح لمدة عام كامل. أساسي للشركات الجديدة وتجديد الرخص.',
    serviceFee: '1,950 درهم',
    workingDays: 'يوم عمل واحد',
    requirements: ['إلزامي للشركات الجديدة', 'إلزامي لتجديد الرخصة التجارية', 'التفتيش متاح لمدة عام كامل'],
    category: 'Ejari Registration Services'
  },
  {
    id: 'ejari-1-month-no-inspection',
    title: 'تسجيل إيجاري - صلاحية شهر (بدون تفتيش)',
    description: 'تسجيل إيجاري سريع وصلاحية شهر واحد بدون تفتيش فزيائي، مثالي لإنجاز الرخص التجارية والمعاملات الإدارية بسرعة وسهولة.',
    serviceFee: '1,650 درهم',
    workingDays: 'يوم عمل واحد',
    requirements: ['إلزامي للشركات الجديدة', 'إلزامي لتجديد الرخصة التجارية', 'إجراء بدون تفتيش ميداني'],
    category: 'Ejari Registration Services'
  },
  {
    id: 'ejari-1-month-sep-office',
    title: 'تسجيل إيجاري مكتب مستقل - شهر واحد',
    description: 'تسجيل عقد إيجاري رسمي لمكتب مستقل بصلاحية شهر واحد مع خيار التفتيش للوفاء بالاشتراطات التنظيمية والبلدية ودائرة التنمية الاقتصادية.',
    serviceFee: '2,050 درهم',
    workingDays: 'يوم عمل واحد',
    requirements: ['إلزامي للشركات الجديدة', 'إلزامي لتجديد الرخصة التجارية', 'التفتيش متاح لمدة عام كامل'],
    category: 'Ejari Registration Services'
  },
  {
    id: 'ejari-1-month-shop',
    title: 'تسجيل إيجاري محل تجاري - شهر واحد',
    description: 'تسجيل إيجاري للمحلات التجارية بصلاحية شهر واحد وبدون تفتيش للحصول الفوري على الموافقات المطلوبة من الجهات الرسمية.',
    serviceFee: '2,150 درهم',
    workingDays: 'يوم عمل واحد',
    requirements: ['إلزامي للشركات الجديدة', 'إلزامي لتجديد الرخصة التجارية', 'إجراء بدون تفتيش ميداني'],
    category: 'Ejari Registration Services'
  },
  {
    id: 'ejari-1-year',
    title: 'تسجيل إيجاري - صلاحية سنة كاملة',
    description: 'تسجيل عقد إيجاري رسمي لمدة سنة كاملة شاملة خدمات التفتيش. خيار مستقر وموصى به للأعمال والشركات المستدامة.',
    serviceFee: '3,150 درهم',
    workingDays: 'يوم عمل واحد',
    requirements: ['إلزامي للشركات الجديدة', 'إلزامي لتجديد الرخصة التجارية', 'التفتيش متاح لمدة عام كامل'],
    category: 'Ejari Registration Services'
  },
  {
    id: 'ejari-1-year-sep-office',
    title: 'تسجيل إيجاري مكتب مستقل - سنة كاملة',
    description: 'تسجيل إيجاري سنوي متميز للمكاتب المستقلة، مصمم للشركات والمؤسسات التي تتطلب تفتيشاً وموافقات بلدية متكاملة.',
    serviceFee: '3,250 درهم',
    workingDays: 'يوم عمل واحد',
    requirements: ['إلزامي للشركات الجديدة', 'إلزامي لتجديد الرخصة التجارية', 'التفتيش متاح لمدة عام كامل'],
    category: 'Ejari Registration Services'
  },

  // Banking Services
  {
    id: 'business-account-high-risk',
    title: 'فتح حساب بنكي للشركات - الأنشطة عالية المخاطر',
    description: 'تسهيل فتح حسابات بنكية للأنشطة التجارية ذات التصنيف عالي المخاطر مع إعداد ملف الامتثال والوثائق والتنسيق مع أفضل المصارف المحلية.',
    serviceFee: '3,950 درهم',
    workingDays: '20 يوم عمل',
    requirements: ['يجب أن تكون الرخصة سارية', 'يجب أن تكون إقامات الشركاء سارية', 'مطلوب لتجديد الإقامة'],
    category: 'Banking Services'
  },
  {
    id: 'business-account-low-risk',
    title: 'فتح حساب بنكي للشركات - الأنشطة منخفضة المخاطر',
    description: 'فتح حساب بنكي تجاري سريع وسلس للقطاعات منخفضة المخاطر بالتعاون مع أفضل البنوك المحلية والدولية في دولة الإمارات.',
    serviceFee: '2,950 درهم',
    workingDays: '5 أيام عمل',
    requirements: ['يجب أن تكون الرخصة سارية', 'يجب أن تكون إقامات الشركاء سارية', 'مطلوب لتجديد الإقامة'],
    category: 'Banking Services'
  },
  {
    id: 'personal-account-guidance',
    title: 'فتح حساب بنكي شخصي',
    description: 'تسهيل فتح حساب بنكي شخصي (جاري أو توفير) في أفضل البنوك المحلية. نراجع ملفك، ونعد المستندات المطلوبة للحصول على موافقة سريعة.',
    serviceFee: '950 درهم',
    workingDays: '5 أيام عمل',
    requirements: ['الإقامة والهوية سارية المفعول', 'جواز السفر مع ختم الدخول', 'شهادة راتب أو إثبات مصدر دخل'],
    category: 'Banking Services'
  },

  // Tax Services
  {
    id: 'corporate-tax-registration',
    title: 'التسجيل في ضريبة الشركات',
    description: 'التسجيل الرسمي في ضريبة الشركات لدى الهيئة الاتحادية للضرائب لتفادي الغرامات الضخمة البالغة 10,000 درهم بالتسجيل خلال الفترة المحددة.',
    serviceFee: '180 درهم',
    workingDays: '3 أيام عمل',
    requirements: ['خلال فترة 87 يوماً كحد أقصى', 'إلزامي لجميع الشركات والمؤسسات', 'غرامة عدم التسجيل 10,000 درهم'],
    category: 'Tax Services'
  },
  {
    id: 'corporate-tax-filing',
    title: 'تقديم الإقرارات الضريبية للشركات',
    description: 'إعداد وتقديم الإقرارات الضريبية لشركتكم بدقة متناهية وفي المواعيد الرسمية لتجنب الغرامات الشهرية والامتثال التام لقوانين الدولة.',
    serviceFee: '380 درهم',
    workingDays: '2 يوم عمل',
    requirements: ['خلال 9 أشهر كحد أقصى', 'إلزامي لجميع الشركات المسجلة', 'غرامة شهرية من 500 إلى 1000 درهم عند التأخير'],
    category: 'Tax Services'
  },
  {
    id: 'vat-registration',
    title: 'التسجيل في ضريبة القيمة المضافة (VAT)',
    description: 'التسجيل الرسمي في ضريبة القيمة المضافة لدى هيئة الضرائب. إلزامي للشركات التي تتجاوز مبيعاتها الحد القانوني المفروض.',
    serviceFee: '350 درهم',
    workingDays: '3 أيام عمل',
    requirements: ['نسخة من الرخصة التجارية', 'بيان مالي يوضح مبيعات تفوق 187,500 درهم', 'جواز السفر وتأشيرة المدير'],
    category: 'Tax Services'
  },
  {
    id: 'fta-profile-update',
    title: 'تحديث ملف الهيئة الاتحادية للضرائب',
    description: 'تعديل وتحديث بيانات شركتكم الرسمية على بوابة الهيئة الاتحادية للضرائب بعد تعديل الرخصة أو الإدارة أو المقر لتجنب تعليق الملف.',
    serviceFee: '280 درهم',
    workingDays: '2 يوم عمل',
    requirements: ['يجب تحديث بيانات الرخصة أولاً', 'يجب تحديث تأشيرة المدير المسؤول', 'يجب تحديث موقع وعنوان مقر الشركة'],
    category: 'Tax Services'
  },
  {
    id: 'tax-reconsideration',
    title: 'طلب إعادة النظر في الغرامات',
    description: 'تقديم طلب إعادة نظر رسمي في الغرامات الضريبية المفروضة من الهيئة، وصياغة الدفوع القانونية المناسبة لزيادة فرص الإعفاء أو التخفيض.',
    serviceFee: '380 درهم',
    workingDays: '2 يوم عمل',
    requirements: ['تقديم طلب تظلم من الغرامات', 'الموافقة على الإعفاء غير مضمونة (حسب الحالة)', 'الصياغة وفق قوانين الهيئة الاتحادية للضرائب'],
    category: 'Tax Services'
  },
  {
    id: 'industrial-tax-exemptions',
    title: 'الإعفاءات الضريبية الصناعية',
    description: 'الحصول على شهادات الإعفاء الضريبي والجمركي الصناعي للمواد الخام والآلات الصناعية في سلطنة عمان لتقليل تكاليف الإنتاج.',
    serviceFee: '950 درهم',
    workingDays: '10 أيام عمل',
    requirements: ['نسخة من الرخصة الصناعية', 'قائمة المواد الخام والمعدات', 'الموافقة البيئية المعتمدة'],
    category: 'Tax Services'
  },

  // Tourism Services
  {
    id: 'tourist-visa-30-days',
    title: 'تأشيرة سياحية لمدة 30 يوماً',
    description: 'إصدار تأشيرة سياحية سريعة وصالحة لمدة 30 يوماً لدخول واحد، مثالية للزيارات السياحية القصيرة أو استكشاف الفرص التجارية.',
    serviceFee: '290 درهم',
    workingDays: '3 أيام عمل',
    requirements: ['عدد مرات الدخول: دخول واحد فقط'],
    category: 'Tourism Services'
  },
  {
    id: 'tourist-visa-60-days',
    title: 'تأشيرة سياحية لمدة 60 يوماً',
    description: 'تمتع بإقامة أطول مع تأشيرة دخول واحد لمدة 60 يوماً، ممتازة للزيارات العائلية الطويلة أو دراسة الفرص الاستثمارية براحة تامة.',
    serviceFee: '490 درهم',
    workingDays: '3 أيام عمل',
    requirements: ['عدد مرات الدخول: دخول واحد فقط'],
    category: 'Tourism Services'
  },
  {
    id: 'tourist-visa-multi-60-days',
    title: 'تأشيرة متعددة الدخول لمدة 60 يوماً',
    description: 'إصدار تأشيرة متعددة الدخول لمدة 60 يوماً خلال يوم عمل واحد فقط، مناسبة جداً لرجال الأعمال والمسافرين بشكل متكرر.',
    serviceFee: '790 درهم',
    workingDays: 'يوم عمل واحد',
    requirements: ['عدد مرات الدخول: دخول متعدد'],
    category: 'Tourism Services'
  },
  {
    id: 'tourist-visa-renewal',
    title: 'تجديد التأشيرة السياحية',
    description: 'تجديد إقامتك السياحية بشكل قانوني داخل الدولة وبدون الحاجة للمغادرة، لتجنب غرامات مخالفة شروط الإقامة.',
    serviceFee: '1,090 درهم',
    workingDays: '3 أيام عمل',
    requirements: ['أقصى مدة إقامة: 4 أشهر في المجمل'],
    category: 'Tourism Services'
  },
  {
    id: 'travel-tourism-services',
    title: 'خدمات السفر والسياحة',
    description: 'خدمات السفر والحجوزات المتكاملة. نساعد في حجز الفنادق، تذاكر الطيران للشركات، برامج الرحلات السياحية وتأمين السفر.',
    serviceFee: '150 درهم',
    workingDays: '2 يوم عمل',
    requirements: ['نسخة من جواز السفر', 'تواريخ السفر المفضل', 'تفاصيل الفندق والوجهة'],
    category: 'Tourism Services'
  },

  // License Modification Services
  {
    id: 'change-activity',
    title: 'تعديل الأنشطة التجارية',
    description: 'إضافة أو تعديل الأنشطة في رخصتكم التجارية بما يتناسب مع تطور أعمالكم، وإنجاز الموافقات وتعديل عقد التأسيس (MOA) رسمياً.',
    serviceFee: '450 درهم',
    governmentFees: 'من 3,000 درهم',
    workingDays: '2 يوم عمل',
    requirements: ['يجب أن تكون الرخصة سارية', 'توقيع جميع الشركاء على ملحق عقد التأسيس', 'مطلوب تعديل الاسم عند الاقتضاء'],
    category: 'License Modification Services'
  },
  {
    id: 'change-business-name',
    title: 'تغيير الاسم التجاري',
    description: 'تغيير الاسم الرسمي للشركة أو العلامة التجارية، بما يشمل حجز الاسم الجديد وتعديل عقد التأسيس وإصدار الرخصة المحدثة والموافقات البلدية.',
    serviceFee: '450 درهم',
    governmentFees: 'من 800 درهم',
    workingDays: '2 يوم عمل',
    requirements: ['يجب أن تكون الرخصة سارية', 'توقيع جميع الشركاء على ملحق عقد التأسيس', 'حجز الاسم التجاري الجديد مطلوب أولاً'],
    category: 'License Modification Services'
  },
  {
    id: 'change-location',
    title: 'تغيير عنوان وموقع الشركة',
    description: 'تعديل العنوان الرسمي للشركة في الرخصة التجارية، وإنجاز المعاملات البلدية والإيجارية لإثبات المقر الجديد وتثبيته في السجلات.',
    serviceFee: '300 درهم',
    governmentFees: 'من 800 درهم',
    workingDays: '2 يوم عمل',
    requirements: ['يجب أن تكون الرخصة سارية', 'توقيع جميع الشركاء على ملحق عقد التأسيس', 'عقد إيجاري (Ejari) جديد وموثق مطلوب'],
    category: 'License Modification Services'
  },
  {
    id: 'license-modification',
    title: 'تعديل وتحديث الرخصة',
    description: 'إجراء تعديلات هيكلية شاملة على الرخصة، مثل إدخال أو إخراج الشركاء وتعديل رأس المال أو تحديث الهيكل الإداري أو الكفيل المحلي.',
    serviceFee: 'من 450 درهم',
    governmentFees: 'من 3,000 درهم',
    workingDays: '3 أيام عمل',
    requirements: ['يجب أن تكون الرخصة سارية', 'توقيع جميع الشركاء على ملحق عقد التأسيس', 'موافقة دائرة التنمية الاقتصادية (DED) مطلوبة'],
    category: 'License Modification Services'
  },

  // Cancellation Services
  {
    id: 'family-residency-cancellation',
    title: 'إلغاء الإقامة العائلية',
    description: 'إلغاء تصاريح الإقامة العائلية بشكل رسمي عند تغيير الكفيل أو مغادرة الدولة، مع ضمان إنجاز المعاملة في إيضاحات الهجرة بلا غرامات.',
    serviceFee: '300 درهم',
    governmentFees: '290 درهم',
    workingDays: '3 أيام عمل',
    requirements: ['الهوية الإماراتية الأصلية للكفيل', 'طلب تصريح إلغاء إذن الدخول', 'استرداد مبلغ الضمان متاح عند الإلغاء'],
    category: 'Cancellation Services'
  },
  {
    id: 'investor-residency-cancellation',
    title: 'إلغاء إقامة مستثمر',
    description: 'إلغاء تصريح إقامة الشريك أو المستثمر بشكل قانوني سليم، وهو أمر أساسي لإعادة هيكلة الشركة أو نقل الملكية أو إغلاق الرخصة.',
    serviceFee: '300 درهم',
    governmentFees: '330 درهم',
    workingDays: '5 أيام عمل',
    requirements: ['رسالة عدم ممانعة (NOC) رسمية وموقعة', 'بطاقة منشأة سارية المفعول', 'الهوية الإماراتية الأصلية مطلوبة'],
    category: 'Cancellation Services'
  },
  {
    id: 'trade-license-cancellation',
    title: 'إلغاء وإغلاق الرخصة التجارية',
    description: 'تصفية الشركة وإلغاء رخصتها التجارية بشكل رسمي وقانوني متكامل، يشمل تقديم التقرير المالي النهائي ونشر إعلان التصفية وإصدار الشهادة.',
    serviceFee: '300 درهم',
    governmentFees: 'من 6,000 درهم',
    workingDays: '5 أيام عمل',
    requirements: ['إلغاء تأشيرات إقامة جميع الشركاء أولاً', 'توقيع جميع الشركاء على قرار التصفية', 'إعداد تقرير مالي معتمد لتصفية الشركة'],
    category: 'Cancellation Services'
  },

  // General Government Services (New from PDF)
  {
    id: 'driving-license-guidance',
    title: 'إرشادات الحصول على رخصة القيادة',
    description: 'مساعدة خطوة بخطوة لتحويل رخصة قيادتكم الدولية أو فتح ملف جديد. تشمل فحص النظر، ترجمة المستندات وجدولة المواعيد الرسمية.',
    serviceFee: '350 درهم',
    governmentFees: '850 درهم',
    workingDays: '5 أيام عمل',
    requirements: ['الهوية الوطنية سارية المفعول', 'رخصة القيادة الأصلية من البلد الأم', 'شهادة فحص نظر معتمدة'],
    category: 'General Government Services'
  },
  {
    id: 'dubai-municipality-permits',
    title: 'تصاريح بلدية دبي',
    description: 'الحصول على التصاريح التجارية أو الإعلانية أو التجهيزات من بلدية دبي. تشمل مراجعة المخططات الهندسية وتنسيق التفتيش الميداني.',
    serviceFee: '650 درهم',
    governmentFees: 'من 1,500 درهم',
    workingDays: '5 أيام عمل',
    requirements: ['نسخة من الرخصة التجارية', 'عقد الإيجار الموثق (إيجاري)', 'مخطط هندسي للمكتب أو المحل'],
    category: 'General Government Services'
  },
  {
    id: 'sports-council-permits',
    title: 'تصاريح مجلس دبي الرياضي',
    description: 'الحصول على التصاريح والموافقات الرسمية للفعاليات الرياضية، الصالات الرياضية، أو أكاديميات اللياقة البدنية من مجلس دبي الرياضي.',
    serviceFee: '850 درهم',
    governmentFees: 'من 2,500 درهم',
    workingDays: '7 أيام عمل',
    requirements: ['نسخة من الرخصة التجارية', 'شهادات ومؤهلات المدربين معتمدة', 'شهادة السلامة للمرفق الرياضي'],
    category: 'General Government Services'
  },
  {
    id: 'rera-permits',
    title: 'تصاريح مؤسسة التنظيم العقاري (RERA)',
    description: 'الحصول على تصاريح الأنشطة العقارية، رخص الوساطة، أو تصاريح الإعلانات العقارية من مؤسسة التنظيم العقاري بدبي (RERA).',
    serviceFee: '950 درهم',
    governmentFees: 'من 3,500 درهم',
    workingDays: '5 أيام عمل',
    requirements: ['نسخة من الرخصة التجارية', 'شهادة أو بطاقة وسيط عقاري معتمد', 'إيجاري للمكتب التجاري'],
    category: 'General Government Services'
  },
  {
    id: 'customs-bayan',
    title: 'التخليص الجمركي (نظام بيان)',
    description: 'تخليص البضائع الجمركي السريع والمهني في سلطنة عمان عبر نظام "بيان" الجمركي الرسمي لتفادي غرامات التأخير في الموانئ.',
    serviceFee: '450 درهم',
    workingDays: '2 يوم عمل',
    requirements: ['رخصة الاستيراد والتصدير', 'الفاتورة التجارية وقائمة التعبئة', 'شهادة منشأ البضاعة'],
    category: 'General Government Services'
  },
  {
    id: 'made-in-oman',
    title: 'شهادة صنع في عمان',
    description: 'الحصول على شهادة الجودة الرسمية "صنع في عمان" للمنتجات المصنعة محلياً للتأهل للمشتريات الحكومية وتسهيل التصدير.',
    serviceFee: '550 درهم',
    workingDays: '5 أيام عمل',
    requirements: ['نسخة من الرخصة الصناعية أو التجارية', 'إثبات القيمة المحلية المضافة للتصنيع', 'تقرير فحص جودة المنتج'],
    category: 'General Government Services'
  },
  {
    id: 'riyada-card',
    title: 'بطاقة ريادة للمؤسسات',
    description: 'مساعدة متكاملة للحصول على بطاقة ريادة للمؤسسات الصغيرة والمتوسطة للاستفادة من المناقصات الحكومية والتسهيلات والتمويل والاعفاءات.',
    serviceFee: '250 درهم',
    workingDays: '3 أيام عمل',
    requirements: ['إثبات الملكية العمانية الكاملة للمؤسسة', 'رخصة تجارية سارية المفعول', 'التسجيل الفعال في التأمينات الاجتماعية'],
    category: 'General Government Services'
  },
  {
    id: 'pacda-permits',
    title: 'تصاريح الدفاع المدني (PACDA)',
    description: 'الحصول على موافقات السلامة والوقاية من الحرائق ورخص الدفاع المدني والبلدية (PACDA) لضمان متطلبات السلامة العامة.',
    serviceFee: '450 درهم',
    governmentFees: 'من 1,000 درهم',
    workingDays: '4 أيام عمل',
    requirements: ['نسخة من الرخصة التجارية', 'عقد إيجار المقر التجاري', 'شهادة تركيب وصيانة معدات الإطفاء'],
    category: 'General Government Services'
  },
  {
    id: 'product-standards',
    title: 'شهادة مطابقة معايير المنتج',
    description: 'إصدار موافقات مطابقة المقاييس العمانية وشهادات الجودة الخليجية (G-mark) من المديرية العامة للمواصفات والمقاييس بوزارة التجارة.',
    serviceFee: '550 درهم',
    workingDays: '5 أيام عمل',
    requirements: ['ورقة المواصفات الفنية للمنتج', 'نسخة من شهادات الجودة العالمية (ISO)', 'رخصة تجارية أو صناعية للشركة'],
    category: 'General Government Services'
  },
  {
    id: 'business-setup-consulting',
    title: 'استشارات تأسيس وتجهيز المشاريع',
    description: 'استشارات متخصصة حول الهيكل القانوني الأنسب، توزيع حصص الشركاء، اختيار المقر التجاري أو الصناعي وتجهيز الوحدات وفقاً للوائح التنظيمية.',
    serviceFee: '500 درهم',
    workingDays: '3 أيام عمل',
    requirements: ['وصف فكرة ونشاط المشروع', 'تخطيط رأس المال الأولي', 'الموقع الجغرافي المقترح'],
    category: 'Company Setup Services'
  },
  {
    id: 'government-land-rental',
    title: 'إرشادات استئجار الأراضي الحكومية',
    description: 'مساعدة شاملة للحصول على الأراضي الحكومية المستأجرة بأسعار مدعومة لإقامة المصانع، المستودعات، أو المشاريع الكبرى في المدن الصناعية (مدائن).',
    serviceFee: '950 درهم',
    workingDays: '10 أيام عمل',
    requirements: ['رخصة صناعية أو تجارية سارية', 'ملخص دراسة الجدوى للمشروع', 'خطاب رسمي موجه للوزارة المعنية'],
    category: 'General Government Services'
  },
  {
    id: 'feasibility-study',
    title: 'دراسة الجدوى وخطة العمل',
    description: 'إعداد دراسات جدوى وخطط عمل احترافية متكاملة، مصممة خصيصاً للتقديم للمصارف للحصول على تمويل، والجهات الحكومية وجذب المستثمرين.',
    serviceFee: '1,500 درهم',
    workingDays: '8 أيام عمل',
    requirements: ['فكرة المشروع والمنتجات المقترحة', 'التقديرات المالية وتكلفة التشغيل', 'معلومات السوق والمنافسين'],
    category: 'Company Setup Services'
  },
  {
    id: 'accounting-auditing',
    title: 'خدمات المحاسبة وتدقيق الحسابات',
    description: 'تنظيم وإدارة السجلات المالية لشركتكم وفقاً للقوانين المعتمدة. يشمل إمساك الدفاتر، إعداد الميزانيات، وتدقيق القوائم المالية السنوية.',
    serviceFee: '450 درهم',
    workingDays: '3 أيام عمل',
    requirements: ['دفاتر الحسابات أو كشوف البنك', 'قائمة الفواتير الضريبية السابقة', 'مستندات إثبات المصروفات'],
    category: 'General Government Services'
  },
  {
    id: 'omanisation-management',
    title: 'إدارة نسب التعمين (Omanisation)',
    description: 'ضمان توافق نسب التوظيف لشركتكم مع متطلبات وزارة العمل العمانية لتوظيف الكفاءات الوطنية وتفادي حظر المعاملات الحكومية.',
    serviceFee: '650 درهم',
    workingDays: '4 أيام عمل',
    requirements: ['نسخة من الرخصة التجارية', 'قائمة تأشيرات موظفي الشركة', 'النسبة المستهدفة لنشاط المؤسسة'],
    category: 'General Government Services'
  }
];

export const content: Record<Language, Record<Country, Content>> = {
  en: {
    uae: {
      header: {
        title: 'AL UFUQ AL DAHABI',
        subtitle: 'Your Trusted Partner for Starting, Managing, and Growing Your Business in UAE',
        tagline: 'Turn the Engine of Your Business On in Dubai',
      },
      services: {
        title: 'Our Services in UAE',
        items: servicesListEN,
      },
      cta: {
        title: 'Ready to Start Your Business Journey?',
        button: 'Contact Us Today',
      },
      footer: {
        copyright: '© 2024 AL UFUQ AL DAHABI. All rights reserved.',
      },
    },
    oman: {
      header: {
        title: 'AL UFUQ AL DAHABI',
        subtitle: 'Your Trusted Partner for Starting, Managing, and Growing Your Business in Oman',
        tagline: 'Build Your Success in the Sultanate of Oman',
      },
      services: {
        title: 'Our Services in Oman',
        items: servicesListEN,
      },
      cta: {
        title: 'Ready to Start Your Business Journey?',
        button: 'Contact Us Today',
      },
      footer: {
        copyright: '© 2024 AL UFUQ AL DAHABI. All rights reserved.',
      },
    },
  },
  fa: {
    uae: {
      header: {
        title: 'الافق الذهبی',
        subtitle: 'همراه مطمئن شما برای شروع، مدیریت و توسعه کسب‌وکار در امارات',
        tagline: 'موتور کسب‌وکار خود را در دبی روشن کنید',
      },
      services: {
        title: 'خدمات ما در امارات',
        items: servicesListFA,
      },
      cta: {
        title: 'آماده شروع سفر کسب‌وکار خود هستید؟',
        button: 'همین امروز تماس بگیرید',
      },
      footer: {
        copyright: '© ۲۰۲۴ الافق الذهبی. تمامی حقوق محفوظ است.',
      },
    },
    oman: {
      header: {
        title: 'الافق الذهبی',
        subtitle: 'همراه مطمئن شما برای شروع، مدیریت و توسعه کسب‌وکار در عمان',
        tagline: 'موفقیت خود را در سلطان‌نشین عمان بسازید',
      },
      services: {
        title: 'خدمات ما در عمان',
        items: servicesListFA,
      },
      cta: {
        title: 'آماده شروع سفر کسب‌وکار خود هستید؟',
        button: 'همین امروز تماس بگیرید',
      },
      footer: {
        copyright: '© ۲۰۲۴ الافق الذهبی. تمامی حقوق محفوظ است.',
      },
    },
  },
  ar: {
    uae: {
      header: {
        title: 'الأفق الذهبي',
        subtitle: 'شريكك الموثوق لبدء وإدارة وتنمية أعمالك في الإمارات',
        tagline: 'أطلق محرك أعمالك في دبي',
      },
      services: {
        title: 'خدماتنا في الإمارات',
        items: servicesListAR,
      },
      cta: {
        title: 'هل أنت مستعد لبدء رحلة أعمالك؟',
        button: 'تواصل معنا اليوم',
      },
      footer: {
        copyright: '© 2024 الأفق الذهبي. جميع الحقوق محفوظة.',
      },
    },
    oman: {
      header: {
        title: 'الأفق الذهبي',
        subtitle: 'شريكك الموثوق لبدء وإدارة وتنمية أعمالك في عمان',
        tagline: 'ابنِ نجاحك في سلطنة عمان',
      },
      services: {
        title: 'خدماتنا في عمان',
        items: servicesListAR,
      },
      cta: {
        title: 'هل أنت مستعد لبدء رحلة أعمالك؟',
        button: 'تواصل معنا اليوم',
      },
      footer: {
        copyright: '© 2024 الأفق الذهبي. جميع الحقوق محفوظة.',
      },
    },
  },
};
